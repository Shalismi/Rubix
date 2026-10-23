import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  getRequestTimeZone,
  getStreakSummary,
} from "./streakService.js";

export const streakRouter = Router();

streakRouter.use(requireAuth);

streakRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const timeZone = getRequestTimeZone(req.get("X-Rubix-Time-Zone"));
    const streak = await getStreakSummary(req.auth!.user.id, timeZone);

    res.json({ streak });
  }),
);
