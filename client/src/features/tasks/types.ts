export type Task = {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
};

export type NewTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
};
