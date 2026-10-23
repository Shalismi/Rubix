import { apiRequest } from "../../../shared/api/apiRequest";
import type { StreakSummary } from "../types";

type StreakResponse = {
  streak: StreakSummary;
};

export async function getStreak() {
  const data = await apiRequest<StreakResponse>("/api/streaks");

  return data.streak;
}
