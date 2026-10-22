import type { Task } from "../types";

export function filterTasksByTags(tasks: Task[], selectedTagIds: number[]) {
  if (selectedTagIds.length === 0) {
    return tasks;
  }

  return tasks.filter((task) =>
    task.tags.some((tag) => selectedTagIds.includes(tag.id)),
  );
}

export function filterTasksBySearchAndTags(
  tasks: Task[],
  searchQuery: string,
  selectedTagIds: number[],
) {
  const tagFilteredTasks = filterTasksByTags(tasks, selectedTagIds);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  if (!normalizedSearchQuery) {
    return tagFilteredTasks;
  }

  return tagFilteredTasks.filter((task) =>
    [
      task.title,
      task.description,
      task.dueDate,
      ...task.tags.map((tag) => tag.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchQuery),
  );
}
