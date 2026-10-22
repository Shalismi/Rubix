export type ApiTag = {
  id: number;
  name: string;
  color: string;
};

export type TagInput = {
  name?: unknown;
  color?: unknown;
};

export type TagOrderInput = {
  tagIds?: unknown;
};

export type TagPriorityInput = {
  enabled?: unknown;
};

export type TagData = {
  name: string;
  normalizedName: string;
  color: string;
};

export type ValidationResult<T> = { data: T } | { error: string };
