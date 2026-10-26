import { useMemo, useState } from "react";
import { TagFilter } from "../../tags/components/TagFilter";
import { CalendarIcon } from "./CalendarIcon";
import { CalendarMonthPicker } from "./CalendarMonthPicker";
import type { Tag } from "../../tags/types";
import type { Task } from "../types";
import {
  compareDateValues,
  formatCalendarDay,
  getTodayDateValue,
  toDateValue,
} from "../utils/date";
import { filterTasksByTags } from "../utils/taskFilters";

type TaskCalendarViewProps = {
  selectedTaskId: number | null;
  tasks: Task[];
  tags: Tag[];
  selectedTagIds: number[];
  onSelectTask: (taskId: number) => void;
  onSelectedTagIdsChange: (tagIds: number[]) => void;
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

function addMonths(date: Date, monthOffset: number) {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

function getMonthCalendarDates(monthDate: Date) {
  const monthStart = getMonthStart(monthDate);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();
  const calendarDayCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;

  return Array.from({ length: calendarDayCount }, (_, index) => {
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
  tags,
  selectedTagIds,
  onSelectTask,
  onSelectedTagIdsChange,
}: TaskCalendarViewProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const todayDateValue = getTodayDateValue();
  const calendarDates = getMonthCalendarDates(visibleMonth);
  const tasksByDate = useMemo(() => {
    const nextTasksByDate = new Map<string, DatedTask[]>();

    filterTasksByTags(tasks, selectedTagIds)
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
  }, [selectedTagIds, tasks]);
  const calendarRows = Array.from(
    { length: calendarDates.length / 7 },
    (_, weekIndex) => {
      const busiestDayCount = Math.max(
        0,
        ...calendarDates
          .slice(weekIndex * 7, weekIndex * 7 + 7)
          .map(({ dateValue }) => tasksByDate.get(dateValue)?.length ?? 0),
      );

      return `minmax(0, ${1 + Math.min(busiestDayCount, 4) * 0.5}fr)`;
    },
  ).join(" ");

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
    <main className="calendar-view" aria-labelledby="calendar-page-heading">
      <h1 className="calendar-view-title" id="calendar-page-heading">
        Calendar
      </h1>
      <section className="calendar-view-panel" aria-labelledby="calendar-view-heading">
      <div className="calendar-view-header">
        <div className="calendar-view-heading">
          <CalendarIcon />
          <CalendarMonthPicker month={visibleMonth} onChange={setVisibleMonth} />
        </div>

        <div className="calendar-view-header-actions">
          <TagFilter
            tags={tags}
            selectedTagIds={selectedTagIds}
            onChange={onSelectedTagIdsChange}
          />
          <div className="calendar-view-controls" aria-label="Calendar controls">
            <button
              className="calendar-view-control"
              type="button"
              onClick={showPreviousMonth}
              aria-label="Previous month"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m14 6-6 6 6 6" />
              </svg>
            </button>
            <button
              className="calendar-view-today"
              type="button"
              onClick={showToday}
            >
              Today
            </button>
            <button
              className="calendar-view-control"
              type="button"
              onClick={showNextMonth}
              aria-label="Next month"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m10 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className="calendar-view-month"
        role="region"
        aria-label="Monthly task calendar"
        tabIndex={0}
      >
        <div className="calendar-view-weekdays" aria-hidden="true">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div
          className="calendar-view-grid"
          style={{ gridTemplateRows: calendarRows }}
        >
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
                <time
                  dateTime={dateValue}
                  aria-current={isToday ? "date" : undefined}
                >
                  {formatCalendarDay(dateValue)}
                </time>

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
                      aria-pressed={selectedTaskId === task.id}
                    >
                      <span className="calendar-view-task-title">{task.title}</span>
                      {task.tags.length > 0 && (
                        <span
                          className="calendar-view-task-tags"
                          role="img"
                          aria-label={`Tags: ${task.tags.map((tag) => tag.name).join(", ")}`}
                        >
                          {task.tags.map((tag) => (
                            <span
                              className="calendar-view-tag-dot"
                              key={tag.id}
                              style={{ backgroundColor: tag.color }}
                              title={tag.name}
                              aria-hidden="true"
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tasksByDate.size === 0 && (
        <p className="calendar-empty">
          {selectedTagIds.length > 0
            ? "No tasks match the selected tags."
            : "No dated tasks yet."}
        </p>
      )}
      </section>
    </main>
  );
}
