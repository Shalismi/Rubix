import { useId } from "react";
import type { StreakSummary, StreakWeekDay } from "../types";

const EMPTY_WEEK: StreakWeekDay[] = ["M", "T", "W", "T", "F", "S", "S"].map(
  (label) => ({ date: "", label, completed: false, isToday: false }),
);

type StreakPanelProps = {
  streak: StreakSummary | null;
  isLoading: boolean;
  error: string | null;
};

export function StreakPanel({
  streak,
  isLoading,
  error,
}: StreakPanelProps) {
  const flameGradientId = useId();
  const currentStreak = streak?.currentStreak ?? 0;
  const week = streak?.week ?? EMPTY_WEEK;

  return (
    <section className="streak-panel" aria-labelledby="streak-heading">
      <header className="streak-header">
        <span className="streak-fire" aria-hidden="true">
          <svg viewBox="0 0 32 40">
            <defs>
              <linearGradient id={flameGradientId} x1="0" y1="0" x2="0.7" y2="1">
                <stop offset="0%" stopColor="#ffc36a" />
                <stop offset="55%" stopColor="#ff8a47" />
                <stop offset="100%" stopColor="#ee5c62" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${flameGradientId})`}
              d="M17 2c2 9-5 11-3 17 3-1 5-4 5-7 7 6 10 11 9 16-1 7-6 11-13 11S3 34 3 27c0-6 4-11 8-15-1 6 0 8 2 9C9 12 17 10 17 2Z"
            />
            <path
              fill="#ffdf96"
              d="M17 22c0 5-5 6-5 10a5 5 0 0 0 10 0c0-3-2-7-5-10Z"
            />
          </svg>
        </span>
        <h2 id="streak-heading">Daily Streak</h2>
      </header>

      <div className="streak-value">
        <strong>{isLoading ? "--" : currentStreak}</strong>
        <span>{currentStreak === 1 ? "day" : "days"}</span>
      </div>

      <div className="streak-week" aria-label="Activity this week">
        {week.map((day, index) => (
          <span
            key={day.date || `${day.label}-${index}`}
            className={[
              day.completed ? "is-complete" : "",
              day.isToday ? "is-today" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={
              day.date
                ? `${day.date}: ${day.completed ? "complete" : "not complete"}`
                : day.label
            }
            title={day.date || undefined}
          >
            {day.label}
          </span>
        ))}
      </div>

      {error && <p className="streak-error">{error}</p>}
    </section>
  );
}
