import type { NewTaskInput, Task } from "../types";

const API_BASE_URL = "http://localhost:5000";

type TasksResponse = {
  tasks: Task[];
};

type TaskResponse = {
  task: Task;
};

async function request<T>(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getTasks() {
  const data = await request<TasksResponse>("/api/tasks");

  return data.tasks;
}

export async function createTask(task: NewTaskInput) {
  const data = await request<TaskResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });

  return data.task;
}

export async function updateTask(taskId: number, task: Partial<Task>) {
  const data = await request<TaskResponse>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(task),
  });

  return data.task;
}

export async function deleteTask(taskId: number) {
  await request<void>(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}
