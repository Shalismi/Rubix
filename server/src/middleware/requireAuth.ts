import type { NextFunction, Request, Response } from "express";
import {
  clearSessionCookie,
  getAuthSession,
  getSessionToken,
} from "../features/auth/sessionService.js";

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = getSessionToken(request);

  if (!token) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  const authSession = await getAuthSession(token);

  if (!authSession) {
    clearSessionCookie(response);
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  request.auth = authSession;
  next();
}
