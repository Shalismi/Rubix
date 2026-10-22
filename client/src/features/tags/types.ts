export type Tag = {
  id: number;
  name: string;
  color: string;
};

export type TagInput = {
  name: string;
  color: string;
};

export type TagMoveDirection = "up" | "down";
