import type { Tag } from "../tags/types";

export type Task = {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  deletedAt: string | null;
  tags: Tag[];
};

export type NewTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  tagIds?: number[];
};

export type TaskUpdateInput = Partial<
  Pick<Task, "title" | "description" | "dueDate" | "completed">
> & {
  tagIds?: number[];
};
