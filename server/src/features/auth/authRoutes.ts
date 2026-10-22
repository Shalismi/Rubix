import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { hashPassword, verifyPassword } from "./passwordService.js";
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionToken,
  setSessionCookie,
} from "./sessionService.js";
import type {
  AuthUser,
  EmailChangeInput,
  LoginInput,
  PasswordChangeInput,
  PasswordRecoveryInput,
  RecoveryCodeChangeInput,
  RegistrationInput,
} from "./authTypes.js";
import {
  validateEmailChangeInput,
  validateLoginInput,
  validatePasswordChangeInput,
  validatePasswordRecoveryInput,
  validateRecoveryCodeChangeInput,
  validateRegistrationInput,
} from "./authValidation.js";
import {
  createRecoveryCode,
  isRecoveryCodeValid,
} from "./recoveryCodeService.js";

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." },
});

const recoveryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many recovery attempts. Try again later." },
});

function serializeUser(user: AuthUser) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    hasRecoveryCode: user.recoveryCodeHash !== null,
  };
}

authRouter.use((request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});

authRouter.post(
  "/register",
  authRateLimit,
  asyncHandler(async (request, response) => {
    const credentials = validateRegistrationInput(
      request.body as RegistrationInput,
    );

    if ("error" in credentials) {
      response.status(400).json({ message: credentials.error });
      return;
    }

    const passwordHash = await hashPassword(credentials.data.password);
    const recoveryCode = createRecoveryCode();

    try {
      const user = await prisma.user.create({
        data: {
          username: credentials.data.username,
          email: credentials.data.email,
          passwordHash,
          recoveryCodeHash: recoveryCode.hash,
        },
        select: {
          id: true,
          username: true,
          email: true,
          emailVerifiedAt: true,
          recoveryCodeHash: true,
        },
      });
      const session = await createSession(user.id);

      setSessionCookie(response, session.token, session.expiresAt);
      response.status(201).json({
        user: serializeUser(user),
        recoveryCode: recoveryCode.code,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const emailTaken = credentials.data.email
          ? await prisma.user.findUnique({
              where: { email: credentials.data.email },
              select: { id: true },
            })
          : null;

        response.status(409).json({
          message: emailTaken
            ? "Email is already in use."
            : "Username is already taken.",
        });
        return;
      }

      throw error;
    }
  }),
);

authRouter.post(
  "/login",
  authRateLimit,
  asyncHandler(async (request, response) => {
    const credentials = validateLoginInput(request.body as LoginInput);

    if ("error" in credentials) {
      response
        .status(401)
        .json({ message: "Invalid username/email or password." });
      return;
    }

    const user =
      credentials.data.identifierType === "email"
        ? await prisma.user.findUnique({
            where: { email: credentials.data.identifier },
          })
        : await prisma.user.findUnique({
            where: { username: credentials.data.identifier },
          });

    if (!user) {
      await hashPassword(credentials.data.password);
      response
        .status(401)
        .json({ message: "Invalid username/email or password." });
      return;
    }

    const isPasswordValid = await verifyPassword(
      user.passwordHash,
      credentials.data.password,
    );

    if (!isPasswordValid) {
      response
        .status(401)
        .json({ message: "Invalid username/email or password." });
      return;
    }

    const session = await createSession(user.id);

    setSessionCookie(response, session.token, session.expiresAt);
    response.json({ user: serializeUser(user) });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (request, response) => {
    const token = getSessionToken(request);

    if (token) {
      await deleteSession(token);
    }

    clearSessionCookie(response);
    response.status(204).send();
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json({ user: serializeUser(request.auth!.user) });
  }),
);

authRouter.patch(
  "/email",
  authRateLimit,
  requireAuth,
  asyncHandler(async (request, response) => {
    const emailChange = validateEmailChangeInput(
      request.body as EmailChangeInput,
    );

    if ("error" in emailChange) {
      response.status(400).json({ message: emailChange.error });
      return;
    }

    const account = await prisma.user.findUnique({
      where: { id: request.auth!.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerifiedAt: true,
        passwordHash: true,
        recoveryCodeHash: true,
      },
    });

    if (!account) {
      clearSessionCookie(response);
      response.status(401).json({ message: "Authentication required." });
      return;
    }

    const isCurrentPasswordValid = await verifyPassword(
      account.passwordHash,
      emailChange.data.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      response.status(400).json({ message: "Current password is incorrect." });
      return;
    }

    if (account.email === emailChange.data.email) {
      response.json({ user: serializeUser(account) });
      return;
    }

    try {
      const [user] = await prisma.$transaction([
        prisma.user.update({
          where: { id: account.id },
          data: {
            email: emailChange.data.email,
            emailVerifiedAt: null,
          },
          select: {
            id: true,
            username: true,
            email: true,
            emailVerifiedAt: true,
            recoveryCodeHash: true,
          },
        }),
        prisma.session.deleteMany({
          where: {
            userId: account.id,
            id: { not: request.auth!.sessionId },
          },
        }),
        prisma.emailVerificationToken.deleteMany({
          where: { userId: account.id },
        }),
      ]);

      response.json({ user: serializeUser(user) });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        response.status(409).json({ message: "Email is already in use." });
        return;
      }

      throw error;
    }
  }),
);

authRouter.patch(
  "/password",
  authRateLimit,
  requireAuth,
  asyncHandler(async (request, response) => {
    const passwords = validatePasswordChangeInput(
      request.body as PasswordChangeInput,
    );

    if ("error" in passwords) {
      response.status(400).json({ message: passwords.error });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: request.auth!.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      clearSessionCookie(response);
      response.status(401).json({ message: "Authentication required." });
      return;
    }

    const isCurrentPasswordValid = await verifyPassword(
      user.passwordHash,
      passwords.data.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      response.status(400).json({ message: "Current password is incorrect." });
      return;
    }

    if (passwords.data.currentPassword === passwords.data.newPassword) {
      response
        .status(400)
        .json({ message: "New password must be different from the current password." });
      return;
    }

    const passwordHash = await hashPassword(passwords.data.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: request.auth!.user.id },
        data: { passwordHash },
      }),
      prisma.session.deleteMany({
        where: {
          userId: request.auth!.user.id,
          id: { not: request.auth!.sessionId },
        },
      }),
    ]);

    response.status(204).send();
  }),
);

authRouter.post(
  "/recovery-code",
  recoveryRateLimit,
  requireAuth,
  asyncHandler(async (request, response) => {
    const recoveryCodeChange = validateRecoveryCodeChangeInput(
      request.body as RecoveryCodeChangeInput,
    );

    if ("error" in recoveryCodeChange) {
      response.status(400).json({ message: recoveryCodeChange.error });
      return;
    }

    const account = await prisma.user.findUnique({
      where: { id: request.auth!.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerifiedAt: true,
        passwordHash: true,
        recoveryCodeHash: true,
      },
    });

    if (!account) {
      clearSessionCookie(response);
      response.status(401).json({ message: "Authentication required." });
      return;
    }

    const isCurrentPasswordValid = await verifyPassword(
      account.passwordHash,
      recoveryCodeChange.data.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      response.status(400).json({ message: "Current password is incorrect." });
      return;
    }

    const recoveryCode = createRecoveryCode();
    const user = await prisma.user.update({
      where: { id: account.id },
      data: { recoveryCodeHash: recoveryCode.hash },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerifiedAt: true,
        recoveryCodeHash: true,
      },
    });

    response.json({
      user: serializeUser(user),
      recoveryCode: recoveryCode.code,
    });
  }),
);

authRouter.post(
  "/password/recover",
  recoveryRateLimit,
  asyncHandler(async (request, response) => {
    const recovery = validatePasswordRecoveryInput(
      request.body as PasswordRecoveryInput,
    );

    if ("error" in recovery) {
      response.status(400).json({ message: recovery.error });
      return;
    }

    const account =
      recovery.data.identifierType === "email"
        ? await prisma.user.findUnique({
            where: { email: recovery.data.identifier },
            select: { id: true, recoveryCodeHash: true },
          })
        : await prisma.user.findUnique({
            where: { username: recovery.data.identifier },
            select: { id: true, recoveryCodeHash: true },
          });
    const passwordHash = await hashPassword(recovery.data.newPassword);
    const isCodeValid = isRecoveryCodeValid(
      recovery.data.recoveryCode,
      account?.recoveryCodeHash,
    );

    if (!account || !isCodeValid) {
      response.status(400).json({ message: "Recovery details are invalid." });
      return;
    }

    const replacementCode = createRecoveryCode();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: account.id },
        data: {
          passwordHash,
          recoveryCodeHash: replacementCode.hash,
        },
      }),
      prisma.session.deleteMany({ where: { userId: account.id } }),
    ]);

    clearSessionCookie(response);
    response.json({
      message: "Password reset successfully.",
      recoveryCode: replacementCode.code,
    });
  }),
);
