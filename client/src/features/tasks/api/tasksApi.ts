import { apiRequest } from "../../../shared/api/apiRequest";
import type { NewTaskInput, Task, TaskUpdateInput } from "../types";

type TasksResponse = {
  tasks: Task[];
};

type TaskResponse = {
  task: Task;
};

export async function getTasks() {
  const data = await apiRequest<TasksResponse>("/api/tasks");

  return data.tasks;
}

export async function getTrashedTasks() {
  const data = await apiRequest<TasksResponse>("/api/tasks/trash");

  return data.tasks;
}

export async function createTask(task: NewTaskInput) {
  const data = await apiRequest<TaskResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });

  return data.task;
}

export async function updateTask(taskId: number, task: TaskUpdateInput) {
  const data = await apiRequest<TaskResponse>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(task),
  });

  return data.task;
}

export async function moveTaskToTrash(taskId: number) {
  const data = await apiRequest<TaskResponse>(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });

  return data.task;
}

export async function restoreTask(taskId: number) {
  const data = await apiRequest<TaskResponse>(`/api/tasks/${taskId}/restore`, {
    method: "PATCH",
  });

  return data.task;
}

export async function permanentlyDeleteTask(taskId: number) {
  await apiRequest<void>(`/api/tasks/${taskId}/permanent`, {
    method: "DELETE",
  });
}
