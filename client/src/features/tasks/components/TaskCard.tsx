import { TaskInlineEditor } from "./TaskInlineEditor";
import { TagPill } from "../../tags/components/TagPill";
import type { Tag, TagInput } from "../../tags/types";
import type { NewTaskInput, Task } from "../types";
import {
  compareDateValues,
  formatSectionDate,
  getTodayDateValue,
} from "../utils/date";

type TaskCardProps = {
  task: Task;
  availableTags: Tag[];
  onAddTag: (tag: TagInput) => Promise<Tag | null>;
  isEditing: boolean;
  isSelected: boolean;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number) => void;
  onStartEditTask: (taskId: number) => void;
  onToggleTaskCompleted: (taskId: number) => void;
  onUpdateTask: (taskId: number, task: NewTaskInput) => void;
};

export function TaskCard({
  task,
  availableTags,
  onAddTag,
  isEditing,
  isSelected,
  onCancelEditTask,
  onDeleteTask,
  onStartEditTask,
  onToggleTaskCompleted,
  onUpdateTask,
}: TaskCardProps) {
  const isPastDue = Boolean(
    !task.completed &&
      task.dueDate &&
      compareDateValues(task.dueDate, getTodayDateValue()) < 0,
  );

  if (isEditing) {
    return (
      <article
        className={`task-card task-card-inline${task.completed ? " is-complete" : ""}${isSelected ? " is-selected" : ""}`}
        id={`task-${task.id}`}
        aria-label={`Editing ${task.title}`}
      >
        <TaskInlineEditor
          task={task}
          tags={availableTags}
          onAddTag={onAddTag}
          onSave={(nextTask) => onUpdateTask(task.id, nextTask)}
          onCancel={onCancelEditTask}
          onDelete={() => onDeleteTask(task.id)}
        />
      </article>
    );
  }

  return (
    <article
      className={`task-card${task.completed ? " is-complete" : ""}${
        isPastDue ? " is-overdue" : ""
      }${isSelected ? " is-selected" : ""}`}
      id={`task-${task.id}`}
    >
      <button
        className="task-checkbox"
        type="button"
        onClick={() => onToggleTaskCompleted(task.id)}
        aria-label={`${task.completed ? "Move back to Today" : "Complete"} ${task.title}`}
      >
        {task.completed && (
          <svg
            className="task-checkbox-icon"
            aria-hidden="true"
            viewBox="0 0 20 20"
          >
            <path d="m5 10 3 3 7-7" />
          </svg>
        )}
      </button>

      <div className="task-content">
        <div className="task-title-row">
          <h3>{task.title}</h3>
        </div>
        {task.description && <p className="task-description">{task.description}</p>}
        {task.dueDate && (
          <div className="task-meta">
            <p className={`task-due-date${isPastDue ? " is-overdue" : ""}`}>
              <time dateTime={task.dueDate}>
                {formatSectionDate(task.dueDate)}
              </time>
            </p>
          </div>
        )}
      </div>

      <div className="task-actions">
        {task.tags.length > 0 && (
          <div className="task-tags" aria-label="Task tags">
            {task.tags.map((tag) => (
              <TagPill tag={tag} key={tag.id} />
            ))}
          </div>
        )}
        <button
          className="task-edit-button"
          type="button"
          onClick={() => onStartEditTask(task.id)}
          aria-label={`Edit ${task.title}`}
        >
          <svg className="task-action-icon" aria-hidden="true" viewBox="0 0 20 20">
            <path d="m12.5 4.5 3 3M4 16l1-4L13.5 3.5a2.1 2.1 0 0 1 3 3L8 15l-4 1Z" />
          </svg>
          Edit
        </button>
      </div>
    </article>
  );
}
