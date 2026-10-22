import type { Tag, Task, TaskTag } from "../../generated/prisma/client.js";
import type { ApiTask } from "./taskTypes.js";

type TaskWithTags = Task & {
  taskTags: Array<TaskTag & { tag: Tag }>;
};

export function serializeTask(task: TaskWithTags): ApiTask {
  const apiTask: ApiTask = {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    completed: task.completed,
    deletedAt: task.deletedAt?.toISOString() ?? null,
    tags: task.taskTags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
  };

  if (task.description) {
    apiTask.description = task.description;
  }

  return apiTask;
}
