import { TaskCard } from "./TaskCard";
import type { Tag, TagInput } from "../../tags/types";
import type { NewTaskInput, Task } from "../types";

type TaskSectionVariant =
  | "default"
  | "today"
  | "upcoming"
  | "overdue"
  | "completed";

type TaskSectionProps = {
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  tasks: Task[];
  availableTags: Tag[];
  onAddTag: (tag: TagInput) => Promise<Tag | null>;
  variant?: TaskSectionVariant;
  isCollapsed?: boolean;
  hideHeader?: boolean;
  editingTaskId: number | null;
  selectedTaskId: number | null;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number) => void;
  onStartEditTask: (taskId: number) => void;
  onToggleCollapsed?: () => void;
  onToggleTaskCompleted: (taskId: number) => void;
  onUpdateTask: (taskId: number, task: NewTaskInput) => void;
};

export function TaskSection({
  title,
  subtitle,
  emptyMessage = "No tasks here yet.",
  tasks,
  availableTags,
  onAddTag,
  variant = "default",
  isCollapsed = false,
  hideHeader = false,
  editingTaskId,
  selectedTaskId,
  onCancelEditTask,
  onDeleteTask,
  onStartEditTask,
  onToggleCollapsed,
  onToggleTaskCompleted,
  onUpdateTask,
}: TaskSectionProps) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-heading`;
  const listId = `${headingId}-list`;
  const sectionClassName = [
    "task-section",
    `task-section-${variant}`,
    isCollapsed ? "is-collapsed" : "",
    hideHeader ? "is-search-result" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={sectionClassName}
      aria-label={hideHeader ? `${title} search results` : undefined}
      aria-labelledby={hideHeader ? undefined : headingId}
    >
      {!hideHeader && (
        <div className="task-section-header">
          <div>
            <div className="task-section-heading">
              <h2 id={headingId}>{title}</h2>
              <span
                className="task-section-count"
                aria-label={`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
              >
                {tasks.length}
              </span>
            </div>
            {subtitle && <p>{subtitle}</p>}
          </div>

          {onToggleCollapsed && (
            <button
              className="task-section-toggle"
              type="button"
              onClick={onToggleCollapsed}
              aria-controls={listId}
              aria-expanded={!isCollapsed}
              aria-label={`${isCollapsed ? "Show" : "Hide"} ${title}`}
            >
              {isCollapsed ? "v" : "^"}
            </button>
          )}
        </div>
      )}

      <div className="task-list" id={listId} hidden={isCollapsed}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              availableTags={availableTags}
              onAddTag={onAddTag}
              isEditing={editingTaskId === task.id}
              isSelected={selectedTaskId === task.id}
              onCancelEditTask={onCancelEditTask}
              onDeleteTask={onDeleteTask}
              onStartEditTask={onStartEditTask}
              onToggleTaskCompleted={onToggleTaskCompleted}
              onUpdateTask={onUpdateTask}
            />
          ))
        ) : (
          <p className="empty-state">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}
