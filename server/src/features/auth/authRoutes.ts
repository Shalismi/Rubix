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
  AuthInput,
  AuthUser,
  PasswordChangeInput,
} from "./authTypes.js";
import {
  validateLoginInput,
  validatePasswordChangeInput,
  validateRegistrationInput,
} from "./authValidation.js";

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." },
});

function serializeUser(user: AuthUser) {
  return {
    id: user.id,
    username: user.username,
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
    const credentials = validateRegistrationInput(request.body as AuthInput);

    if ("error" in credentials) {
      response.status(400).json({ message: credentials.error });
      return;
    }

    const passwordHash = await hashPassword(credentials.data.password);

    try {
      const user = await prisma.user.create({
        data: {
          username: credentials.data.username,
          passwordHash,
        },
        select: {
          id: true,
          username: true,
        },
      });
      const session = await createSession(user.id);

      setSessionCookie(response, session.token, session.expiresAt);
      response.status(201).json({ user: serializeUser(user) });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        response.status(409).json({ message: "Username is already taken." });
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
    const credentials = validateLoginInput(request.body as AuthInput);

    if ("error" in credentials) {
      response.status(401).json({ message: "Invalid username or password." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { username: credentials.data.username },
    });

    if (!user) {
      await hashPassword(credentials.data.password);
      response.status(401).json({ message: "Invalid username or password." });
      return;
    }

    const isPasswordValid = await verifyPassword(
      user.passwordHash,
      credentials.data.password,
    );

    if (!isPasswordValid) {
      response.status(401).json({ message: "Invalid username or password." });
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
