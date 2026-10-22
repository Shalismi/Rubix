import type {
  TagData,
  TagInput,
  TagOrderInput,
  TagPriorityInput,
  ValidationResult,
} from "./tagTypes.js";

const TAG_NAME_MAX_LENGTH = 24;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function buildTagData(input: TagInput): ValidationResult<TagData> {
  if (typeof input.name !== "string" || !input.name.trim()) {
    return { error: "Tag name is required." };
  }

  const name = input.name.trim();

  if (name.length > TAG_NAME_MAX_LENGTH) {
    return { error: `Tag name cannot exceed ${TAG_NAME_MAX_LENGTH} characters.` };
  }

  if (typeof input.color !== "string" || !HEX_COLOR_PATTERN.test(input.color)) {
    return { error: "Tag color must be a six-digit hex color." };
  }

  return {
    data: {
      name,
      normalizedName: name.toLocaleLowerCase("en-US"),
      color: input.color.toUpperCase(),
    },
  };
}

export function parseTagId(idParam: unknown) {
  if (typeof idParam !== "string") {
    return null;
  }

  const tagId = Number(idParam);

  return Number.isInteger(tagId) && tagId > 0 ? tagId : null;
}

export function buildTagOrderData(
  input: TagOrderInput,
): ValidationResult<number[]> {
  if (
    !Array.isArray(input.tagIds) ||
    input.tagIds.some(
      (tagId) => !Number.isInteger(tagId) || Number(tagId) <= 0,
    )
  ) {
    return { error: "Tag order must contain valid tag ids." };
  }

  const tagIds = input.tagIds as number[];

  if (new Set(tagIds).size !== tagIds.length) {
    return { error: "Tag order cannot contain duplicate tags." };
  }

  return { data: tagIds };
}

export function buildTagPriorityData(
  input: TagPriorityInput,
): ValidationResult<boolean> {
  if (typeof input.enabled !== "boolean") {
    return { error: "Tag priority setting must be true or false." };
  }

  return { data: input.enabled };
}
