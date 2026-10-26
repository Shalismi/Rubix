import { useState, type FormEvent } from "react";
import { TagPicker } from "../../tags/components/TagPicker";
import type { Tag, TagInput } from "../../tags/types";
import type { NewTaskInput, Task } from "../types";
import { getDefaultDueDate } from "../utils/date";

type TaskInlineEditorProps = {
  task: Task;
  tags: Tag[];
  onAddTag: (tag: TagInput) => Promise<Tag | null>;
  onSave: (task: NewTaskInput) => void | Promise<void>;
  onCancel: () => void;
  onDelete: () => void | Promise<void>;
};

function openDatePicker(input: HTMLInputElement) {
  try {
    input.showPicker?.();
  } catch {
    // The native date field remains usable when showPicker is unavailable.
  }
}

export function TaskInlineEditor({
  task,
  tags,
  onAddTag,
  onSave,
  onCancel,
  onDelete,
}: TaskInlineEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(getDefaultDueDate(task.dueDate));
  const [selectedTagIds, setSelectedTagIds] = useState(task.tags.map((tag) => tag.id));
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const idPrefix = `edit-task-${task.id}`;

  function focusEditButton() {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`#task-${task.id} .task-edit-button`)?.focus();
    });
  }

  function cancelEditing() {
    onCancel();
    focusEditButton();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || pending) return;

    setPending("save");
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        dueDate: getDefaultDueDate(dueDate),
        tagIds: selectedTagIds,
      });
      focusEditButton();
    } finally {
      setPending(null);
    }
  }

  async function deleteTask() {
    if (pending) return;
    setPending("delete");
    try {
      await onDelete();
    } finally {
      setPending(null);
    }
  }

  return (
    <form className="task-inline-editor" onSubmit={handleSubmit} aria-label={`Edit ${task.title}`}>
      <button
        className="task-checkbox"
        type="button"
        disabled
        aria-label={task.completed ? "Completed task" : "Incomplete task"}
      >
        {task.completed && (
          <svg className="task-checkbox-icon" aria-hidden="true" viewBox="0 0 20 20">
            <path d="m5 10 3 3 7-7" />
          </svg>
        )}
      </button>

      <div className="task-inline-fields">
        <label className="visually-hidden" htmlFor={`${idPrefix}-title`}>Task title</label>
        <input
          className="task-inline-title"
          id={`${idPrefix}-title`}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="Task title"
          disabled={pending !== null}
          autoFocus
          required
        />
        <label className="visually-hidden" htmlFor={`${idPrefix}-description`}>Description</label>
        <textarea
          className="task-inline-description"
          id={`${idPrefix}-description`}
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          placeholder="Add a description..."
          rows={1}
          disabled={pending !== null}
        />
        <div className="task-inline-date-row">
          <label className="visually-hidden" htmlFor={`${idPrefix}-due-date`}>Date</label>
          <input
            className="task-inline-date"
            id={`${idPrefix}-due-date`}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.currentTarget.value)}
            onClick={(event) => openDatePicker(event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openDatePicker(event.currentTarget);
              }
            }}
            disabled={pending !== null}
          />
        </div>
      </div>

      <div className="task-inline-toolbar">
        <TagPicker
          tags={tags}
          selectedTagIds={selectedTagIds}
          onAddTag={onAddTag}
          onChange={setSelectedTagIds}
          compact
          disabled={pending !== null}
        />
        <div className="task-inline-actions">
          <button
            className="task-delete-button"
            type="button"
            onClick={() => void deleteTask()}
            disabled={pending !== null}
            aria-label={`Delete ${task.title}`}
          >
            <svg className="task-action-icon" aria-hidden="true" viewBox="0 0 20 20">
              <path d="M3.5 5.5h13M7.5 5.5V3h5v2.5M5.5 5.5l.8 11h7.4l.8-11M8.5 8.5v5M11.5 8.5v5" />
            </svg>
            {pending === "delete" ? "Deleting..." : "Delete"}
          </button>
          <button
            className="secondary-button task-cancel-button"
            type="button"
            onClick={cancelEditing}
            disabled={pending !== null}
          >
            Cancel
          </button>
          <button
            className="primary-button task-primary-button"
            type="submit"
            disabled={!title.trim() || pending !== null}
          >
            {pending === "save" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
