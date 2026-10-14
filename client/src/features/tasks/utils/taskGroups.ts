import type { Task } from "../types";
import {
  compareDateValues,
  formatSectionDate,
  formatSectionWeekday,
  getTodayDateValue,
} from "./date";

export type TaskGroup = {
  id: string;
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  tasks: Task[];
};

export function getActiveTaskGroups(tasks: Task[]) {
  const todayDateValue = getTodayDateValue();
  const tasksByDate = new Map<string, Task[]>();
  const tasksWithoutDueDate: Task[] = [];

  tasks.forEach((task) => {
    if (!task.dueDate) {
      tasksWithoutDueDate.push(task);
      return;
    }

    const tasksForDate = tasksByDate.get(task.dueDate) ?? [];
    tasksForDate.push(task);
    tasksByDate.set(task.dueDate, tasksForDate);
  });

  const groups: TaskGroup[] = [
    {
      id: `date-${todayDateValue}`,
      title: "Today",
      subtitle: formatSectionDate(todayDateValue),
      emptyMessage: "No tasks due today.",
      tasks: tasksByDate.get(todayDateValue) ?? [],
    },
  ];

  Array.from(tasksByDate.keys())
    .filter((dateValue) => dateValue !== todayDateValue)
    .sort(compareDateValues)
    .forEach((dateValue) => {
      groups.push({
        id: `date-${dateValue}`,
        title: formatSectionDate(dateValue),
        subtitle: formatSectionWeekday(dateValue),
        tasks: tasksByDate.get(dateValue) ?? [],
      });
    });

  if (tasksWithoutDueDate.length > 0) {
    groups.push({
      id: "no-due-date",
      title: "No Due Date",
      tasks: tasksWithoutDueDate,
    });
  }

  return groups;
}
