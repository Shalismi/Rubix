import { Link } from "react-router";
import { APP_PATHS } from "../../../app/config/routes";
import { TagPill } from "../../tags/components/TagPill";
import { CalendarIcon } from "./CalendarIcon";
import type { Task } from "../types";
import {
  compareDateValues,
  formatCalendarDay,
  formatCalendarMonth,
  formatCalendarWeekday,
  formatNextTaskTiming,
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

function getCalendarDays(anchorDateValue: string) {
  const anchorDate = new Date(`${anchorDateValue}T00:00:00`);

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
  const todayDateValue = getTodayDateValue();
  const upcomingTasks = tasks
    .filter(hasDueDate)
    .filter(
      (task) =>
        !task.completed &&
        !task.deletedAt &&
        compareDateValues(task.dueDate, todayDateValue) >= 0,
    )
    .sort((firstTask, secondTask) =>
      compareDateValues(firstTask.dueDate, secondTask.dueDate),
    );
  const nextTask = upcomingTasks[0];
  const calendarDays = getCalendarDays(todayDateValue);
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
        <CalendarIcon />
        <h2 id="calendar-heading">Calendar</h2>
        <Link
          className="calendar-open-button"
          to={APP_PATHS.calendar}
        >
          View calendar
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </Link>
      </div>

      {nextTask ? (
        <div className="next-task">
          <span id="next-task-timing">
            Next Task:{" "}
            <time dateTime={nextTask.dueDate}>
              {formatNextTaskTiming(nextTask.dueDate, todayDateValue)}
            </time>
          </span>
          <div className="next-task-main">
            <button
              className="next-task-button"
              type="button"
              onClick={() => onSelectTask(nextTask.id)}
              aria-describedby="next-task-timing"
              aria-pressed={selectedTaskId === nextTask.id}
            >
              {nextTask.title}
            </button>
            {nextTask.tags.length > 0 && (
              <div className="task-tags next-task-tags" aria-label="Next task tags">
                {nextTask.tags.map((tag) => (
                  <TagPill tag={tag} key={tag.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="calendar-empty">No upcoming due dates yet.</p>
      )}

      <div className="calendar-days" aria-label="Upcoming calendar days">
        {calendarDays.map((dateValue) => {
          const hasTask = upcomingTasks.some((task) => task.dueDate === dateValue);
          const isToday = dateValue === todayDateValue;

          return (
            <button
              className={`calendar-day${hasTask ? " has-task" : ""}${isToday ? " is-today" : ""}`}
              key={dateValue}
              type="button"
              onClick={() => selectFirstTaskForDate(dateValue)}
              disabled={!hasTask}
              aria-current={isToday ? "date" : undefined}
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
            <div className="upcoming-item" key={task.id}>
              <time id={`calendar-task-date-${task.id}`} dateTime={task.dueDate}>
                {formatCalendarMonth(task.dueDate)}{" "}
                {formatCalendarDay(task.dueDate)}
              </time>
              <button
                className={`upcoming-task${selectedTaskId === task.id ? " is-selected" : ""}`}
                type="button"
                onClick={() => onSelectTask(task.id)}
                aria-describedby={`calendar-task-date-${task.id}`}
                aria-pressed={selectedTaskId === task.id}
              >
                {task.title}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="calendar-summary" aria-label="Calendar task summary">
        <div className="calendar-stat calendar-stat-today">
          <span>Due Today</span>
          <strong>{dueTodayCount}</strong>
        </div>
        <div className="calendar-stat calendar-stat-week">
          <span>Due This Week</span>
          <strong>{dueThisWeekCount}</strong>
        </div>
      </div>
    </aside>
  );
}
