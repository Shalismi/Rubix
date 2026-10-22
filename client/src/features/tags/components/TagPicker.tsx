import { useState, type KeyboardEvent } from "react";
import { TagColorPicker } from "./TagColorPicker";
import { TagPill } from "./TagPill";
import { DEFAULT_TAG_COLOR } from "../constants";
import { useDismissibleDetails } from "../hooks/useDismissibleDetails";
import type { Tag, TagInput } from "../types";

const MAX_TASK_TAGS = 10;

type TagPickerProps = {
  tags: Tag[];
  selectedTagIds: number[];
  onAddTag: (tag: TagInput) => Promise<Tag | null>;
  onChange: (tagIds: number[]) => void;
};

export function TagPicker({
  tags,
  selectedTagIds,
  onAddTag,
  onChange,
}: TagPickerProps) {
  const detailsRef = useDismissibleDetails();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_TAG_COLOR);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

  function toggleTag(tagId: number) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((selectedId) => selectedId !== tagId));
      return;
    }

    if (selectedTagIds.length < MAX_TASK_TAGS) {
      onChange([...selectedTagIds, tagId]);
    }
  }

  async function createAndSelectTag() {
    const name = newName.trim();

    if (!name || isCreating) {
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    const createdTag = await onAddTag({ name, color: newColor });
    setIsCreating(false);

    if (!createdTag) {
      setCreateError("Could not create this tag. The name may already be in use.");
      return;
    }

    if (selectedTagIds.length < MAX_TASK_TAGS) {
      onChange([...selectedTagIds, createdTag.id]);
    }

    setNewName("");
    detailsRef.current?.removeAttribute("open");
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void createAndSelectTag();
    }
  }

  return (
    <fieldset className="tag-picker">
      <legend>Tags</legend>

      <div className="tag-picker-control">
        {selectedTags.length > 0 && (
          <div className="tag-picker-selected" aria-label="Selected tags">
            {selectedTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                aria-label={`Remove ${tag.name}`}
                title={`Remove ${tag.name}`}
              >
                <TagPill tag={tag} />
                <span aria-hidden="true">x</span>
              </button>
            ))}
          </div>
        )}

        <details className="tag-picker-details" ref={detailsRef}>
          <summary>
            <span aria-hidden="true">+</span>
            Add a tag
          </summary>

          <div className="tag-picker-menu">
            <div className="tag-picker-menu-heading">
              <strong>Choose tags</strong>
              {selectedTagIds.length > 0 && (
                <button type="button" onClick={() => onChange([])}>
                  Clear
                </button>
              )}
            </div>

            {tags.length > 0 ? (
              <div className="tag-picker-options">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);

                  return (
                    <label
                      className={`tag-picker-option${
                        isSelected ? " is-selected" : ""
                      }`}
                      key={tag.id}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={
                          !isSelected && selectedTagIds.length >= MAX_TASK_TAGS
                        }
                        onChange={() => toggleTag(tag.id)}
                      />
                      <TagPill tag={tag} />
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="tag-picker-empty">No tags yet.</p>
            )}

            <div className="tag-quick-create">
              <label>
                <span>Create a tag</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Tag name"
                  maxLength={24}
                />
              </label>
              <TagColorPicker
                color={newColor}
                label="New tag color"
                onChange={setNewColor}
              />
              {createError && (
                <p className="tag-manager-error" role="alert">
                  {createError}
                </p>
              )}
              <button
                className="tag-quick-create-button"
                type="button"
                disabled={isCreating || !newName.trim()}
                onClick={() => void createAndSelectTag()}
              >
                {isCreating ? "Creating..." : "Create tag"}
              </button>
            </div>
          </div>
        </details>
      </div>
    </fieldset>
  );
}
