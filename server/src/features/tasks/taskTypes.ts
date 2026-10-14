export type ApiTask = {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
};

export type TaskInput = {
  title?: unknown;
  description?: unknown;
  dueDate?: unknown;
  completed?: unknown;
};

export type ValidationResult<T> = { data: T } | { error: string };

export type TaskCreateData = {
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
};

export type TaskUpdateData = {
  title?: string;
  description?: string | null;
  dueDate?: string;
  completed?: boolean;
};
