import { useEffect, useState } from "react";
import {
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  getTags,
  updateTag as updateTagRequest,
} from "../api/tagsApi";
import type { Tag, TagInput } from "../types";

function sortTags(tags: Tag[]) {
  return [...tags].sort((firstTag, secondTag) =>
    firstTag.name.localeCompare(secondTag.name),
  );
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [tagError, setTagError] = useState<string | null>(null);

  useEffect(() => {
    getTags()
      .then((serverTags) => {
        setTags(sortTags(serverTags));
        setTagError(null);
      })
      .catch(() => setTagError("Could not load tags."))
      .finally(() => setIsLoadingTags(false));
  }, []);

  async function addTag(input: TagInput) {
    try {
      const createdTag = await createTagRequest(input);
      setTags((currentTags) => sortTags([...currentTags, createdTag]));
      setTagError(null);
      return createdTag;
    } catch (error) {
      setTagError(error instanceof Error ? error.message : "Could not add tag.");
      return null;
    }
  }

  async function editTag(tagId: number, input: TagInput) {
    try {
      const updatedTag = await updateTagRequest(tagId, input);
      setTags((currentTags) =>
        sortTags(
          currentTags.map((tag) => (tag.id === tagId ? updatedTag : tag)),
        ),
      );
      setTagError(null);
      return updatedTag;
    } catch (error) {
      setTagError(error instanceof Error ? error.message : "Could not update tag.");
      return null;
    }
  }

  async function removeTag(tagId: number) {
    try {
      await deleteTagRequest(tagId);
      setTags((currentTags) => currentTags.filter((tag) => tag.id !== tagId));
      setTagError(null);
      return true;
    } catch (error) {
      setTagError(error instanceof Error ? error.message : "Could not delete tag.");
      return false;
    }
  }

  return {
    tags,
    isLoadingTags,
    tagError,
    addTag,
    editTag,
    removeTag,
  };
}
