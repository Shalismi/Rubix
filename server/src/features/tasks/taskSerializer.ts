import type { Task } from "../../generated/prisma/client.js";
import type { ApiTask } from "./taskTypes.js";

export function serializeTask(task: Task): ApiTask {
  const apiTask: ApiTask = {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    completed: task.completed,
  };

  if (task.description) {
    apiTask.description = task.description;
  }

  return apiTask;
}
