import type { Tag } from "../../tags/types";
import type { Task } from "../types";

export function sortTasksByTagPriority(
  tasks: Task[],
  orderedTags: Tag[],
  isPriorityEnabled: boolean,
) {
  if (!isPriorityEnabled || orderedTags.length === 0) {
    return tasks;
  }

  const tagRanks = new Map(orderedTags.map((tag, index) => [tag.id, index]));
  const unranked = orderedTags.length;
  const getTaskRank = (task: Task) =>
    task.tags.reduce(
      (rank, tag) => Math.min(rank, tagRanks.get(tag.id) ?? unranked),
      unranked,
    );

  return [...tasks].sort((firstTask, secondTask) => {
    if (firstTask.completed !== secondTask.completed) {
      return Number(firstTask.completed) - Number(secondTask.completed);
    }

    const firstDate = firstTask.dueDate || null;
    const secondDate = secondTask.dueDate || null;
    if (firstDate !== secondDate) {
      if (!firstDate) return 1;
      if (!secondDate) return -1;
      return firstDate < secondDate ? -1 : 1;
    }

    // A task's highest tag wins; equal ranks keep the existing task order.
    return getTaskRank(firstTask) - getTaskRank(secondTask);
  });
}
