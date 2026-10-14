import { TaskForm } from "./TaskForm";
import type { NewTaskInput, Task } from "../types";
import {
  compareDateValues,
  formatDueDate,
  getTodayDateValue,
} from "../utils/date";

type TaskCardProps = {
  task: Task;
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
        className="task-card task-card-form"
        id={`task-${task.id}`}
        aria-label={`Editing ${task.title}`}
      >
        <TaskForm
          idPrefix={`edit-task-${task.id}`}
          initialValues={task}
          submitLabel="Save Task"
          onSubmitTask={(nextTask) => onUpdateTask(task.id, nextTask)}
          onCancel={onCancelEditTask}
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
        {task.completed ? "x" : ""}
      </button>

      <div className="task-content">
        <div className="task-title-row">
          {isPastDue && (
            <span
              className="task-overdue-indicator"
              role="img"
              aria-label="Past due"
              title="Past due"
            >
              !
            </span>
          )}
          <h3>{task.title}</h3>
        </div>
        {task.description && <p className="task-description">{task.description}</p>}
        {task.dueDate && (
          <p className={`task-due-date${isPastDue ? " is-overdue" : ""}`}>
            {formatDueDate(task.dueDate)}
          </p>
        )}
      </div>

      <div className="task-actions">
        <button
          className="task-edit-button"
          type="button"
          onClick={() => onStartEditTask(task.id)}
          aria-label={`Edit ${task.title}`}
        >
          Edit
        </button>
        <button
          className="task-delete-button"
          type="button"
          onClick={() => onDeleteTask(task.id)}
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
