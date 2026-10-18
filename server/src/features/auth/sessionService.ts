import { createHash, randomBytes } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { environment } from "../../config/environment.js";
import { prisma } from "../../db/prisma.js";
import type { AuthSession } from "./authTypes.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = environment.isProduction
  ? "__Host-rubix_session"
  : "rubix_session";

const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: environment.isProduction,
  path: "/",
};

function getSessionId(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isSessionToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });

  await prisma.session.create({
    data: {
      id: getSessionId(token),
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export function setSessionCookie(
  response: Response,
  token: string,
  expiresAt: Date,
) {
  response.cookie(SESSION_COOKIE_NAME, token, {
    ...sessionCookieOptions,
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
}

export function getSessionToken(request: Request) {
  const token = request.cookies?.[SESSION_COOKIE_NAME] as unknown;

  return isSessionToken(token) ? token : null;
}

export async function getAuthSession(
  token: string,
): Promise<AuthSession | null> {
  const sessionId = getSessionId(token);
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return {
    sessionId: session.id,
    user: session.user,
  };
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({
    where: { id: getSessionId(token) },
  });
}
