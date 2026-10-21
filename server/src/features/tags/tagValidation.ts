import type { TagData, TagInput, ValidationResult } from "./tagTypes.js";

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
