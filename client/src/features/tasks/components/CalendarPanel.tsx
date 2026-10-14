import type { Task } from "../types";
import {
  compareDateValues,
  formatCalendarDay,
  formatCalendarMonth,
  formatCalendarWeekday,
  formatDueDate,
  getTodayDateValue,
  toDateValue,
} from "../utils/date";

type CalendarPanelProps = {
  selectedTaskId: number | null;
  tasks: Task[];
  onSelectTask: (taskId: number) => void;
};

type DatedTask = Task & {
  dueDate: string;
};

function hasDueDate(task: Task): task is DatedTask {
  return Boolean(task.dueDate);
}

function getCalendarDays(anchorDateValue?: string) {
  const anchorDate = anchorDateValue
    ? new Date(`${anchorDateValue}T00:00:00`)
    : new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchorDate);
    date.setDate(anchorDate.getDate() + index);

    return toDateValue(date);
  });
}

export function CalendarPanel({
  selectedTaskId,
  tasks,
  onSelectTask,
}: CalendarPanelProps) {
  const upcomingTasks = tasks
    .filter(hasDueDate)
    .sort((firstTask, secondTask) =>
      compareDateValues(firstTask.dueDate, secondTask.dueDate),
    );
  const nextTask = upcomingTasks[0];
  const calendarDays = getCalendarDays(nextTask?.dueDate);
  const todayDateValue = getTodayDateValue();
  const weekEndDateValue = calendarDays[calendarDays.length - 1] ?? todayDateValue;
  const dueTodayCount = upcomingTasks.filter(
    (task) => task.dueDate === todayDateValue,
  ).length;
  const dueThisWeekCount = upcomingTasks.filter(
    (task) =>
      compareDateValues(task.dueDate, todayDateValue) >= 0 &&
      compareDateValues(task.dueDate, weekEndDateValue) <= 0,
  ).length;

  function selectFirstTaskForDate(dateValue: string) {
    const taskForDate = upcomingTasks.find((task) => task.dueDate === dateValue);

    if (taskForDate) {
      onSelectTask(taskForDate.id);
    }
  }

  return (
    <aside className="calendar-panel" aria-labelledby="calendar-heading">
      <div className="calendar-header">
        <div>
          <p>Calendar</p>
          <h2 id="calendar-heading">Upcoming dates</h2>
        </div>
      </div>

      {nextTask ? (
        <button
          className="next-task"
          type="button"
          onClick={() => onSelectTask(nextTask.id)}
        >
          <span>Next task</span>
          <strong>{nextTask.title}</strong>
          <p>{formatDueDate(nextTask.dueDate)}</p>
        </button>
      ) : (
        <p className="calendar-empty">No upcoming due dates yet.</p>
      )}

      <div className="calendar-days" aria-label="Upcoming calendar days">
        {calendarDays.map((dateValue) => {
          const hasTask = upcomingTasks.some((task) => task.dueDate === dateValue);

          return (
            <button
              className={`calendar-day${hasTask ? " has-task" : ""}`}
              key={dateValue}
              type="button"
              onClick={() => selectFirstTaskForDate(dateValue)}
              disabled={!hasTask}
            >
              <span>{formatCalendarWeekday(dateValue)}</span>
              <strong>{formatCalendarDay(dateValue)}</strong>
              <small>{formatCalendarMonth(dateValue)}</small>
            </button>
          );
        })}
      </div>

      {upcomingTasks.length > 0 && (
        <div className="upcoming-list">
          {upcomingTasks.slice(0, 4).map((task) => (
            <button
              className={`upcoming-item${
                selectedTaskId === task.id ? " is-selected" : ""
              }`}
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task.id)}
            >
              <time dateTime={task.dueDate}>
                {formatCalendarMonth(task.dueDate)}{" "}
                {formatCalendarDay(task.dueDate)}
              </time>
              <span>{task.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="calendar-summary" aria-label="Calendar task summary">
        <div className="calendar-stat">
          <span>Due Today</span>
          <strong>{dueTodayCount}</strong>
        </div>
        <div className="calendar-stat">
          <span>Due This Week</span>
          <strong>{dueThisWeekCount}</strong>
        </div>
      </div>
    </aside>
  );
}
