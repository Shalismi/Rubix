import { API_BASE_URL } from "../../../config/api";
import type { Tag, TagInput } from "../types";

type TagsResponse = {
  tags: Tag[];
};

type TagResponse = {
  tag: Tag;
};

async function request<T>(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(errorBody?.message ?? "Tag request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getTags() {
  const data = await request<TagsResponse>("/api/tags");
  return data.tags;
}

export async function createTag(tag: TagInput) {
  const data = await request<TagResponse>("/api/tags", {
    method: "POST",
    body: JSON.stringify(tag),
  });
  return data.tag;
}

export async function updateTag(tagId: number, tag: TagInput) {
  const data = await request<TagResponse>(`/api/tags/${tagId}`, {
    method: "PATCH",
    body: JSON.stringify(tag),
  });
  return data.tag;
}

export async function deleteTag(tagId: number) {
  await request<void>(`/api/tags/${tagId}`, { method: "DELETE" });
}
