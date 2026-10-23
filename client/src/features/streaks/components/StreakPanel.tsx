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
  const currentStreak = streak?.currentStreak ?? 0;
  const week = streak?.week ?? EMPTY_WEEK;

  return (
    <section className="streak-panel" aria-labelledby="streak-heading">
      <header className="streak-header">
        <div>
          <p>Streaks</p>
          <h2 id="streak-heading">Daily progress</h2>
        </div>
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
