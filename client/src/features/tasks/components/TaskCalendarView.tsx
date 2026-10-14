import { useMemo, useState } from "react";
import type { Task } from "../types";
import {
  compareDateValues,
  formatCalendarDay,
  getTodayDateValue,
  toDateValue,
} from "../utils/date";

type TaskCalendarViewProps = {
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

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function addMonths(date: Date, monthOffset: number) {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

function getMonthCalendarDates(monthDate: Date) {
  const monthStart = getMonthStart(monthDate);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      dateValue: toDateValue(date),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
    };
  });
}

export function TaskCalendarView({
  selectedTaskId,
  tasks,
  onSelectTask,
}: TaskCalendarViewProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const todayDateValue = getTodayDateValue();
  const calendarDates = getMonthCalendarDates(visibleMonth);
  const tasksByDate = useMemo(() => {
    const nextTasksByDate = new Map<string, DatedTask[]>();

    tasks
      .filter(hasDueDate)
      .sort((firstTask, secondTask) => {
        if (firstTask.completed !== secondTask.completed) {
          return firstTask.completed ? 1 : -1;
        }

        return compareDateValues(firstTask.dueDate, secondTask.dueDate);
      })
      .forEach((task) => {
        const tasksForDate = nextTasksByDate.get(task.dueDate) ?? [];
        tasksForDate.push(task);
        nextTasksByDate.set(task.dueDate, tasksForDate);
      });

    return nextTasksByDate;
  }, [tasks]);

  function showPreviousMonth() {
    setVisibleMonth((currentMonth) => addMonths(currentMonth, -1));
  }

  function showNextMonth() {
    setVisibleMonth((currentMonth) => addMonths(currentMonth, 1));
  }

  function showToday() {
    setVisibleMonth(getMonthStart(new Date()));
  }

  return (
    <main className="calendar-view" aria-labelledby="calendar-view-heading">
      <div className="calendar-view-header">
        <div>
          <p>Calendar</p>
          <h2 id="calendar-view-heading">{getMonthTitle(visibleMonth)}</h2>
        </div>

        <div className="calendar-view-controls" aria-label="Calendar controls">
          <button
            className="calendar-view-control"
            type="button"
            onClick={showPreviousMonth}
            aria-label="Previous month"
          >
            {"<"}
          </button>
          <button className="calendar-view-today" type="button" onClick={showToday}>
            Today
          </button>
          <button
            className="calendar-view-control"
            type="button"
            onClick={showNextMonth}
            aria-label="Next month"
          >
            {">"}
          </button>
        </div>
      </div>

      <div className="calendar-view-weekdays" aria-hidden="true">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="calendar-view-grid" aria-label="Monthly task calendar">
        {calendarDates.map(({ dateValue, isCurrentMonth }) => {
          const dayTasks = tasksByDate.get(dateValue) ?? [];
          const isToday = dateValue === todayDateValue;

          return (
            <div
              className={`calendar-view-date${
                isCurrentMonth ? "" : " is-muted"
              }${isToday ? " is-today" : ""}`}
              key={dateValue}
            >
              <time dateTime={dateValue}>{formatCalendarDay(dateValue)}</time>

              <div className="calendar-view-date-tasks">
                {dayTasks.map((task) => (
                  <button
                    className={`calendar-view-task${
                      task.completed ? " is-complete" : ""
                    }${selectedTaskId === task.id ? " is-selected" : ""}`}
                    key={task.id}
                    type="button"
                    onClick={() => onSelectTask(task.id)}
                    title={task.title}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {tasksByDate.size === 0 && (
        <p className="calendar-empty">No dated tasks yet.</p>
      )}
    </main>
  );
}
