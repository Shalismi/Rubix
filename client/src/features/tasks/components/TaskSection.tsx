import { TaskCard } from "./TaskCard";
import type { NewTaskInput, Task } from "../types";

type TaskSectionProps = {
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  tasks: Task[];
  editingTaskId: number | null;
  selectedTaskId: number | null;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number) => void;
  onStartEditTask: (taskId: number) => void;
  onToggleTaskCompleted: (taskId: number) => void;
  onUpdateTask: (taskId: number, task: NewTaskInput) => void;
};

export function TaskSection({
  title,
  subtitle,
  emptyMessage = "No tasks here yet.",
  tasks,
  editingTaskId,
  selectedTaskId,
  onCancelEditTask,
  onDeleteTask,
  onStartEditTask,
  onToggleTaskCompleted,
  onUpdateTask,
}: TaskSectionProps) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-heading`;

  return (
    <section className="task-section" aria-labelledby={headingId}>
      <div className="task-section-header">
        <div>
          <h2 id={headingId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="task-list">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
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
