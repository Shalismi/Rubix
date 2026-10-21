import { useState, type FormEvent } from "react";
import { TagColorPicker } from "./TagColorPicker";
import { TagPill } from "./TagPill";
import { useDismissibleDetails } from "../hooks/useDismissibleDetails";
import type { Tag, TagInput } from "../types";

const DEFAULT_TAG_COLOR = "#2563EB";

type TagManagerProps = {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  onAddTag: (tag: TagInput) => Promise<Tag | null>;
  onEditTag: (tagId: number, tag: TagInput) => Promise<Tag | null>;
  onRemoveTag: (tagId: number) => Promise<boolean>;
};

export function TagManager({
  tags,
  isLoading,
  error,
  onAddTag,
  onEditTag,
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

        {!isLoading && tags.length > 0 && (
          <div className="tag-manager-list">
            {tags.map((tag) =>
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
                  <TagPill tag={tag} />
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
