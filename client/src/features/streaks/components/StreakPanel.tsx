const STREAK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakPanel() {
  return (
    <section className="streak-panel" aria-labelledby="streak-heading">
      <header className="streak-header">
        <div>
          <p>Streaks</p>
          <h2 id="streak-heading">Daily progress</h2>
        </div>
        <span>Preview</span>
      </header>

      <div className="streak-value">
        <strong>0</strong>
        <span>days</span>
      </div>

      <div className="streak-week" aria-hidden="true">
        {STREAK_DAYS.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
    </section>
  );
}
