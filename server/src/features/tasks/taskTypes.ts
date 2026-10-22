import type { ApiTag } from "../tags/tagTypes.js";

export type ApiTask = {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  deletedAt: string | null;
  tags: ApiTag[];
};

export type TaskInput = {
  title?: unknown;
  description?: unknown;
  dueDate?: unknown;
  completed?: unknown;
  tagIds?: unknown;
};

export type ValidationResult<T> = { data: T } | { error: string };

export type TaskCreateData = {
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  tagIds: number[];
};

export type TaskUpdateData = {
  title?: string;
  description?: string | null;
  dueDate?: string;
  completed?: boolean;
  tagIds?: number[];
};
