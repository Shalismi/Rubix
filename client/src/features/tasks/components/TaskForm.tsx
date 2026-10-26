import { useState, type FormEvent } from "react";
import { TagPicker } from "../../tags/components/TagPicker";
import type { Tag, TagInput } from "../../tags/types";
import type { NewTaskInput } from "../types";
import { getDefaultDueDate } from "../utils/date";

type TaskFormProps = {
  tags: Tag[];
  onAddTag: (tag: TagInput) => Promise<Tag | null>;
  onSubmitTask: (task: NewTaskInput) => void;
  onCancel: () => void;
};

export function TaskForm({
  tags,
  onAddTag,
  onSubmitTask,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(getDefaultDueDate);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const nextTask: NewTaskInput = {
      title: trimmedTitle,
      description: description.trim(),
    };

    nextTask.dueDate = getDefaultDueDate(dueDate);
    nextTask.tagIds = selectedTagIds;

    onSubmitTask(nextTask);
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="new-task-title">Task title</label>
        <input
          id="new-task-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What do you need to do?"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label htmlFor="new-task-description">Description</label>
        <textarea
          id="new-task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional notes"
          rows={3}
        />
      </div>

      <TagPicker
        tags={tags}
        selectedTagIds={selectedTagIds}
        onAddTag={onAddTag}
        onChange={setSelectedTagIds}
      />

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="new-task-due-date">Date</label>
          <input
            id="new-task-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <div className="form-actions">
          <button
            className="secondary-button task-cancel-button"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="primary-button task-primary-button"
            type="submit"
            disabled={!title.trim()}
          >
            Add Task
          </button>
        </div>
      </div>

    </form>
  );
}
