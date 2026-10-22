import { useEffect, useState } from "react";
import {
  createTag as createTagRequest,
  deleteTag as deleteTagRequest,
  getTags,
  reorderTags,
  updateTagPriority,
  updateTag as updateTagRequest,
} from "../api/tagsApi";
import type { Tag, TagInput, TagMoveDirection } from "../types";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isPriorityEnabled, setIsPriorityEnabled] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isSavingTagOrder, setIsSavingTagOrder] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  useEffect(() => {
    getTags()
      .then((response) => {
        setTags(response.tags);
        setIsPriorityEnabled(response.priorityEnabled);
        setTagError(null);
      })
      .catch(() => setTagError("Could not load tags."))
      .finally(() => setIsLoadingTags(false));
  }, []);

  async function addTag(input: TagInput) {
    try {
      const createdTag = await createTagRequest(input);
      setTags((currentTags) => [...currentTags, createdTag]);
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
        currentTags.map((tag) => (tag.id === tagId ? updatedTag : tag)),
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

  async function moveTag(tagId: number, direction: TagMoveDirection) {
    const currentIndex = tags.findIndex((tag) => tag.id === tagId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      !isPriorityEnabled ||
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= tags.length
    ) {
      return false;
    }

    const nextTags = [...tags];
    [nextTags[currentIndex], nextTags[targetIndex]] = [
      nextTags[targetIndex],
      nextTags[currentIndex],
    ];

    setIsSavingTagOrder(true);

    try {
      const reorderedTags = await reorderTags(nextTags.map((tag) => tag.id));
      setTags(reorderedTags);
      setTagError(null);
      return true;
    } catch (error) {
      setTagError(
        error instanceof Error ? error.message : "Could not reorder tags.",
      );
      return false;
    } finally {
      setIsSavingTagOrder(false);
    }
  }

  async function changePriorityEnabled(enabled: boolean) {
    setIsSavingTagOrder(true);

    try {
      const response = await updateTagPriority(enabled);
      setTags(response.tags);
      setIsPriorityEnabled(response.priorityEnabled);
      setTagError(null);
      return true;
    } catch (error) {
      setTagError(
        error instanceof Error
          ? error.message
          : "Could not update tag sorting.",
      );
      return false;
    } finally {
      setIsSavingTagOrder(false);
    }
  }

  return {
    tags,
    isPriorityEnabled,
    isLoadingTags,
    isSavingTagOrder,
    tagError,
    addTag,
    changePriorityEnabled,
    editTag,
    moveTag,
    removeTag,
  };
}
