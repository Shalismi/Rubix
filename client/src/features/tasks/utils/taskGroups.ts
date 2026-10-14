import type { Task } from "../types";
import {
  compareDateValues,
  formatSectionDate,
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
  const pastDueTasks: Task[] = [];
  const todayTasks: Task[] = [];
  const upcomingTasks: Task[] = [];
  const tasksWithoutDueDate: Task[] = [];

  tasks.forEach((task) => {
    if (!task.dueDate) {
      tasksWithoutDueDate.push(task);
      return;
    }

    if (compareDateValues(task.dueDate, todayDateValue) < 0) {
      pastDueTasks.push(task);
      return;
    }

    if (task.dueDate === todayDateValue) {
      todayTasks.push(task);
      return;
    }

    upcomingTasks.push(task);
  });

  const groups: TaskGroup[] = [];

  if (pastDueTasks.length > 0) {
    groups.push({
      id: "past-due",
      title: "Past Due",
      tasks: pastDueTasks.sort((firstTask, secondTask) =>
        compareDateValues(firstTask.dueDate ?? "", secondTask.dueDate ?? ""),
      ),
    });
  }

  groups.push({
    id: "today",
    title: "Today",
    subtitle: formatSectionDate(todayDateValue),
    emptyMessage: "No tasks due today.",
    tasks: todayTasks,
  });

  if (upcomingTasks.length > 0) {
    groups.push({
      id: "upcoming",
      title: "Upcoming",
      tasks: upcomingTasks.sort((firstTask, secondTask) =>
        compareDateValues(firstTask.dueDate ?? "", secondTask.dueDate ?? ""),
      ),
    });
  }

  if (tasksWithoutDueDate.length > 0) {
    groups.push({
      id: "no-due-date",
      title: "No Due Date",
      tasks: tasksWithoutDueDate,
    });
  }

  return groups;
}
