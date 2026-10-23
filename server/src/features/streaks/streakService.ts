import { prisma } from "../../db/prisma.js";
import type { StreakSummary } from "./streakTypes.js";

const DEFAULT_TIME_ZONE = "UTC";
const MAX_TIME_ZONE_LENGTH = 100;
const WEEK_DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function getRequestTimeZone(value: string | undefined) {
  if (!value || value.length > MAX_TIME_ZONE_LENGTH) {
    return DEFAULT_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function getActivityDate(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const dateParts = new Map(parts.map((part) => [part.type, part.value]));

  return `${dateParts.get("year")}-${dateParts.get("month")}-${dateParts.get("day")}`;
}

function shiftDate(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day! + days));

  return date.toISOString().slice(0, 10);
}

function getWeekStart(dateValue: string) {
  const dayOfWeek = new Date(`${dateValue}T00:00:00Z`).getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  return shiftDate(dateValue, -daysSinceMonday);
}

export async function getStreakSummary(
  userId: number,
  timeZone: string,
  now = new Date(),
): Promise<StreakSummary> {
  const streakDays = await prisma.streakDay.findMany({
    where: { userId },
    orderBy: { activityDate: "desc" },
    select: { activityDate: true },
  });
  const activeDates = new Set(
    streakDays.map((streakDay) => streakDay.activityDate),
  );
  const today = getActivityDate(timeZone, now);
  let currentDate = activeDates.has(today) ? today : shiftDate(today, -1);
  let currentStreak = 0;

  while (activeDates.has(currentDate)) {
    currentStreak += 1;
    currentDate = shiftDate(currentDate, -1);
  }

  const weekStart = getWeekStart(today);
  const week = WEEK_DAY_LABELS.map((label, index) => {
    const date = shiftDate(weekStart, index);

    return {
      date,
      label,
      completed: activeDates.has(date),
      isToday: date === today,
    };
  });

  return { currentStreak, today, week };
}
