import { useState, type FormEvent } from "react";
import type { NewTaskInput } from "../types";
import { getDefaultDueDate } from "../utils/date";

type TaskFormProps = {
  idPrefix: string;
  submitLabel: string;
  initialValues?: NewTaskInput;
  onSubmitTask: (task: NewTaskInput) => void;
  onCancel: () => void;
};

export function TaskForm({
  idPrefix,
  submitLabel,
  initialValues,
  onSubmitTask,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [dueDate, setDueDate] = useState(
    getDefaultDueDate(initialValues?.dueDate),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const nextTask: NewTaskInput = {
      title: trimmedTitle,
    };
    const trimmedDescription = description.trim();

    if (trimmedDescription) {
      nextTask.description = trimmedDescription;
    }

    nextTask.dueDate = getDefaultDueDate(dueDate);

    onSubmitTask(nextTask);
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor={`${idPrefix}-title`}>Task title</label>
        <input
          id={`${idPrefix}-title`}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What do you need to do?"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label htmlFor={`${idPrefix}-description`}>Description</label>
        <textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional notes"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor={`${idPrefix}-due-date`}>Due date</label>
          <input
            id={`${idPrefix}-due-date`}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={!title.trim()}>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
