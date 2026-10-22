import { apiRequest } from "../../../shared/api/apiRequest";
import type { Tag, TagInput } from "../types";

type TagsResponse = {
  tags: Tag[];
  priorityEnabled: boolean;
};

type TagResponse = {
  tag: Tag;
};

export async function getTags() {
  return apiRequest<TagsResponse>("/api/tags", {
    defaultErrorMessage: "Tag request failed.",
  });
}

export async function createTag(tag: TagInput) {
  const data = await apiRequest<TagResponse>("/api/tags", {
    method: "POST",
    body: JSON.stringify(tag),
    defaultErrorMessage: "Tag request failed.",
  });
  return data.tag;
}

export async function updateTag(tagId: number, tag: TagInput) {
  const data = await apiRequest<TagResponse>(`/api/tags/${tagId}`, {
    method: "PATCH",
    body: JSON.stringify(tag),
    defaultErrorMessage: "Tag request failed.",
  });
  return data.tag;
}

export async function deleteTag(tagId: number) {
  await apiRequest<void>(`/api/tags/${tagId}`, {
    method: "DELETE",
    defaultErrorMessage: "Tag request failed.",
  });
}

export async function reorderTags(tagIds: number[]) {
  const data = await apiRequest<Pick<TagsResponse, "tags">>(
    "/api/tags/order",
    {
      method: "PATCH",
      body: JSON.stringify({ tagIds }),
      defaultErrorMessage: "Tag request failed.",
    },
  );

  return data.tags;
}

export async function updateTagPriority(enabled: boolean) {
  return apiRequest<TagsResponse>("/api/tags/priority", {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
    defaultErrorMessage: "Tag request failed.",
  });
}
