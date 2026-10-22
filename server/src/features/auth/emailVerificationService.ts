import { createHash, randomBytes } from "node:crypto";
import { environment } from "../../config/environment.js";
import { prisma } from "../../db/prisma.js";

const VERIFICATION_DURATION_MS = 24 * 60 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type VerificationUser = {
  id: number;
  email: string;
};

export class EmailVerificationCooldownError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Please wait before requesting another verification email.");
    this.name = "EmailVerificationCooldownError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class EmailDeliveryUnavailableError extends Error {
  constructor() {
    super("Email delivery is not configured.");
    this.name = "EmailDeliveryUnavailableError";
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestEmailVerification(user: VerificationUser) {
  if (environment.isProduction) {
    throw new EmailDeliveryUnavailableError();
  }

  const existingToken = await prisma.emailVerificationToken.findUnique({
    where: { userId: user.id },
    select: { createdAt: true },
  });

  if (existingToken) {
    const retryAt = existingToken.createdAt.getTime() + REQUEST_COOLDOWN_MS;
    const remainingMs = retryAt - Date.now();

    if (remainingMs > 0) {
      throw new EmailVerificationCooldownError(
        Math.ceil(remainingMs / 1000),
      );
    }
  }

  const token = randomBytes(32).toString("base64url");
  const tokenId = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_DURATION_MS);
  const verificationUrl = new URL("/verify-email", environment.clientOrigin);

  verificationUrl.searchParams.set("token", token);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    }),
    prisma.emailVerificationToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        email: user.email,
        expiresAt,
      },
    }),
  ]);

  return {
    developmentVerificationUrl: verificationUrl.toString(),
  };
}

export async function verifyEmailToken(tokenInput: unknown) {
  if (typeof tokenInput !== "string" || !TOKEN_PATTERN.test(tokenInput)) {
    return "invalid" as const;
  }

  const tokenId = hashToken(tokenInput);
  const token = await prisma.emailVerificationToken.findUnique({
    where: { id: tokenId },
    select: {
      email: true,
      expiresAt: true,
      userId: true,
    },
  });

  if (!token) {
    return "invalid" as const;
  }

  if (token.expiresAt <= new Date()) {
    await prisma.emailVerificationToken.deleteMany({
      where: { id: tokenId },
    });
    return "expired" as const;
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.updateMany({
      where: {
        id: token.userId,
        email: token.email,
      },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: token.userId },
    }),
  ]);

  return updatedUser.count === 1 ? ("verified" as const) : ("invalid" as const);
}
