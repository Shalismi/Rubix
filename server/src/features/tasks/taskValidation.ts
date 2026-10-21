import type {
  TaskCreateData,
  TaskInput,
  TaskUpdateData,
  ValidationResult,
} from "./taskTypes.js";

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isDateValue(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getDueDateFromInput(value: unknown): ValidationResult<string> {
  if (value === undefined || value === null || value === "") {
    return { data: getTodayDateValue() };
  }

  if (!isDateValue(value)) {
    return { error: "Due date must use YYYY-MM-DD." };
  }

  return { data: value };
}

function getTagIdsFromInput(value: unknown): ValidationResult<number[]> {
  if (value === undefined) {
    return { data: [] };
  }

  if (
    !Array.isArray(value) ||
    value.some((tagId) => !Number.isInteger(tagId) || tagId <= 0)
  ) {
    return { error: "Tag ids must be an array of positive numbers." };
  }

  const uniqueTagIds = [...new Set(value as number[])];

  if (uniqueTagIds.length > 10) {
    return { error: "A task can have up to 10 tags." };
  }

  return { data: uniqueTagIds };
}

export function parseTaskId(idParam: unknown) {
  if (typeof idParam !== "string") {
    return null;
  }

  const taskId = Number(idParam);

  if (!Number.isInteger(taskId)) {
    return null;
  }

  return taskId;
}

export function buildTaskCreateData(
  input: TaskInput,
): ValidationResult<TaskCreateData> {
  if (typeof input.title !== "string" || !input.title.trim()) {
    return { error: "Task title is required." };
  }

  const dueDateResult = getDueDateFromInput(input.dueDate);

  if ("error" in dueDateResult) {
    return dueDateResult;
  }

  const tagIdsResult = getTagIdsFromInput(input.tagIds);

  if ("error" in tagIdsResult) {
    return tagIdsResult;
  }

  const task: TaskCreateData = {
    title: input.title.trim(),
    dueDate: dueDateResult.data,
    completed: false,
    tagIds: tagIdsResult.data,
  };

  if (typeof input.description === "string" && input.description.trim()) {
    task.description = input.description.trim();
  }

  return { data: task };
}

export function buildTaskUpdateData(
  input: TaskInput,
): ValidationResult<TaskUpdateData> {
  const updates: TaskUpdateData = {};

  if (typeof input.title === "string") {
    const trimmedTitle = input.title.trim();

    if (!trimmedTitle) {
      return { error: "Task title cannot be empty." };
    }

    updates.title = trimmedTitle;
  }

  if (typeof input.description === "string") {
    const trimmedDescription = input.description.trim();

    updates.description = trimmedDescription || null;
  }

  if (input.dueDate !== undefined) {
    const dueDateResult = getDueDateFromInput(input.dueDate);

    if ("error" in dueDateResult) {
      return dueDateResult;
    }

    updates.dueDate = dueDateResult.data;
  }

  if (typeof input.completed === "boolean") {
    updates.completed = input.completed;
  }

  if (input.tagIds !== undefined) {
    const tagIdsResult = getTagIdsFromInput(input.tagIds);

    if ("error" in tagIdsResult) {
      return tagIdsResult;
    }

    updates.tagIds = tagIdsResult.data;
  }

  return { data: updates };
}
