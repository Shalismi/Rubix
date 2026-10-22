import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  EmailDeliveryUnavailableError,
  EmailVerificationCooldownError,
  requestEmailVerification,
  verifyEmailToken,
} from "./emailVerificationService.js";

export const emailVerificationRouter = Router();

const requestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification requests. Try again later." },
});

const verifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Try again later." },
});

emailVerificationRouter.use((request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});

emailVerificationRouter.post(
  "/verification",
  requestRateLimit,
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = request.auth!.user;

    if (!user.email) {
      response.status(400).json({ message: "Add an email address first." });
      return;
    }

    if (user.emailVerifiedAt) {
      response.status(409).json({ message: "Email is already verified." });
      return;
    }

    try {
      const result = await requestEmailVerification({
        id: user.id,
        email: user.email,
      });

      response.json({
        message: environmentMessage(result.developmentVerificationUrl),
        ...(result.developmentVerificationUrl
          ? { developmentVerificationUrl: result.developmentVerificationUrl }
          : {}),
      });
    } catch (error) {
      if (error instanceof EmailVerificationCooldownError) {
        response.setHeader("Retry-After", error.retryAfterSeconds);
        response.status(429).json({ message: error.message });
        return;
      }

      if (error instanceof EmailDeliveryUnavailableError) {
        response.status(503).json({
          message: "Email delivery is not configured yet.",
        });
        return;
      }

      throw error;
    }
  }),
);

emailVerificationRouter.post(
  "/verify",
  verifyRateLimit,
  asyncHandler(async (request, response) => {
    const result = await verifyEmailToken(
      (request.body as { token?: unknown }).token,
    );

    if (result === "expired") {
      response.status(400).json({
        message: "This verification link has expired. Request a new one.",
      });
      return;
    }

    if (result === "invalid") {
      response.status(400).json({
        message: "This verification link is invalid or has already been used.",
      });
      return;
    }

    response.json({ message: "Email verified successfully." });
  }),
);

function environmentMessage(developmentVerificationUrl: string | null) {
  return developmentVerificationUrl
    ? "Development verification link created."
    : "Verification email sent.";
}
