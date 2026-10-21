export type ApiTag = {
  id: number;
  name: string;
  color: string;
};

export type TagInput = {
  name?: unknown;
  color?: unknown;
};

export type TagData = {
  name: string;
  normalizedName: string;
  color: string;
};

export type ValidationResult<T> = { data: T } | { error: string };
