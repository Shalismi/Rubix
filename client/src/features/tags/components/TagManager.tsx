import { useState, type FormEvent } from "react";
import { TagColorPicker } from "./TagColorPicker";
import { TagPill } from "./TagPill";
import { DEFAULT_TAG_COLOR } from "../constants";
import { useDismissibleDetails } from "../hooks/useDismissibleDetails";
import type { Tag, TagInput, TagMoveDirection } from "../types";

type TagManagerProps = {
  tags: Tag[];
  isLoading: boolean;
  isPriorityEnabled: boolean;
  isSavingOrder: boolean;
  error: string | null;
  onAddTag: (tag: TagInput) => Promise<Tag | null>;
  onEditTag: (tagId: number, tag: TagInput) => Promise<Tag | null>;
  onMoveTag: (tagId: number, direction: TagMoveDirection) => Promise<boolean>;
  onPriorityEnabledChange: (enabled: boolean) => Promise<boolean>;
  onRemoveTag: (tagId: number) => Promise<boolean>;
};

export function TagManager({
  tags,
  isLoading,
  isPriorityEnabled,
  isSavingOrder,
  error,
  onAddTag,
  onEditTag,
  onMoveTag,
  onPriorityEnabledChange,
  onRemoveTag,
}: TagManagerProps) {
  const detailsRef = useDismissibleDetails();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_TAG_COLOR);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_TAG_COLOR);
  const [isSaving, setIsSaving] = useState(false);

  async function handleAddTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newName.trim()) {
      return;
    }

    setIsSaving(true);
    const createdTag = await onAddTag({ name: newName.trim(), color: newColor });
    setIsSaving(false);

    if (createdTag) {
      setNewName("");
    }
  }

  function beginEditing(tag: Tag) {
    setEditingTagId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  async function saveEditedTag(tagId: number) {
    if (!editName.trim()) {
      return;
    }

    setIsSaving(true);
    const updatedTag = await onEditTag(tagId, {
      name: editName.trim(),
      color: editColor,
    });
    setIsSaving(false);

    if (updatedTag) {
      setEditingTagId(null);
    }
  }

  async function confirmRemoveTag(tag: Tag) {
    const shouldDelete = window.confirm(
      `Delete the tag "${tag.name}"? Tasks using it will not be deleted.`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsSaving(true);
    await onRemoveTag(tag.id);
    setIsSaving(false);
  }

  return (
    <details className="tag-manager" ref={detailsRef}>
      <summary>Manage tags</summary>
      <div className="tag-manager-panel">
        <form className="tag-create-form" onSubmit={handleAddTag}>
          <label>
            <span>New tag</span>
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Tag name"
              maxLength={24}
            />
          </label>
          <TagColorPicker
            color={newColor}
            label="New tag color"
            onChange={setNewColor}
          />
          <button type="submit" disabled={isSaving || !newName.trim()}>
            Add
          </button>
        </form>

        {error && (
          <p className="tag-manager-error" role="alert">
            {error}
          </p>
        )}
        {isLoading && <p className="tag-manager-status">Loading tags...</p>}

        <label className="tag-priority-toggle">
          <input
            type="checkbox"
            checked={isPriorityEnabled}
            disabled={isLoading || isSavingOrder}
            onChange={(event) =>
              void onPriorityEnabledChange(event.target.checked)
            }
          />
          <span>Sort tags by priority</span>
        </label>

        {!isLoading && tags.length > 0 && (
          <div className="tag-manager-list">
            {tags.map((tag, tagIndex) =>
              editingTagId === tag.id ? (
                <div className="tag-edit-row" key={tag.id}>
                  <label>
                    <span className="visually-hidden">Name for {tag.name}</span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      maxLength={24}
                    />
                  </label>
                  <TagColorPicker
                    color={editColor}
                    label={`Color for ${tag.name}`}
                    onChange={setEditColor}
                  />
                  <button
                    type="button"
                    disabled={isSaving || !editName.trim()}
                    onClick={() => void saveEditedTag(tag.id)}
                  >
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingTagId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="tag-manager-row" key={tag.id}>
                  <div className="tag-manager-row-main">
                    {isPriorityEnabled && (
                      <div className="tag-priority-buttons">
                        <button
                          type="button"
                          title={`Move ${tag.name} up`}
                          aria-label={`Move ${tag.name} up`}
                          disabled={isSavingOrder || tagIndex === 0}
                          onClick={() => void onMoveTag(tag.id, "up")}
                        >
                          {"\u2191"}
                        </button>
                        <button
                          type="button"
                          title={`Move ${tag.name} down`}
                          aria-label={`Move ${tag.name} down`}
                          disabled={
                            isSavingOrder || tagIndex === tags.length - 1
                          }
                          onClick={() => void onMoveTag(tag.id, "down")}
                        >
                          {"\u2193"}
                        </button>
                      </div>
                    )}
                    <TagPill tag={tag} />
                  </div>
                  <div>
                    <button type="button" onClick={() => beginEditing(tag)}>
                      Edit
                    </button>
                    <button
                      className="tag-remove-button"
                      type="button"
                      disabled={isSaving}
                      onClick={() => void confirmRemoveTag(tag)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </details>
  );
}
