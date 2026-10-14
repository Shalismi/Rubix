import type { MouseEvent } from "react";
import { CalendarPanel } from "./CalendarPanel";
import { TaskForm } from "./TaskForm";
import { TaskSection } from "./TaskSection";
import type { NewTaskInput, Task } from "../types";
import { getActiveTaskGroups } from "../utils/taskGroups";

type TaskDashboardProps = {
  activeTasks: Task[];
  completedTasks: Task[];
  editingTaskId: number | null;
  isAddingTask: boolean;
  isLoadingTasks: boolean;
  selectedTaskId: number | null;
  taskError: string | null;
  onAddTask: (task: NewTaskInput) => void;
  onCancelAddTask: () => void;
  onCancelEditTask: () => void;
  onClearSelectedTask: () => void;
  onDeleteTask: (taskId: number) => void;
  onSelectTask: (taskId: number) => void;
  onStartEditTask: (taskId: number) => void;
  onToggleAddTask: () => void;
  onToggleTaskCompleted: (taskId: number) => void;
  onUpdateTask: (taskId: number, task: NewTaskInput) => void;
};

export function TaskDashboard({
  activeTasks,
  completedTasks,
  editingTaskId,
  isAddingTask,
  isLoadingTasks,
  selectedTaskId,
  taskError,
  onAddTask,
  onCancelAddTask,
  onCancelEditTask,
  onClearSelectedTask,
  onDeleteTask,
  onSelectTask,
  onStartEditTask,
  onToggleAddTask,
  onToggleTaskCompleted,
  onUpdateTask,
}: TaskDashboardProps) {
  const activeTaskGroups = getActiveTaskGroups(activeTasks);

  function handleDashboardClick(event: MouseEvent<HTMLElement>) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const shouldKeepSelection = event.target.closest(
      "button, input, textarea, form, .task-card, .calendar-panel",
    );

    if (!shouldKeepSelection) {
      onClearSelectedTask();
    }
  }

  return (
    <main className="dashboard" onClick={handleDashboardClick}>
      <div className="dashboard-layout">
        <section className="dashboard-card" aria-labelledby="tasks-heading">
          <div className="dashboard-card-header">
            <div>
              <h2 id="tasks-heading">My Tasks</h2>
              <p>Plan the next few things that need your attention.</p>
              {isLoadingTasks && <p>Loading tasks...</p>}
              {taskError && <p className="dashboard-error">{taskError}</p>}
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={onToggleAddTask}
              aria-expanded={isAddingTask}
            >
              {isAddingTask ? "Close Form" : "+ Add Task"}
            </button>
          </div>

          {isAddingTask && (
            <TaskForm
              idPrefix="new-task"
              submitLabel="Add Task"
              onSubmitTask={onAddTask}
              onCancel={onCancelAddTask}
            />
          )}

          {activeTaskGroups.map((taskGroup) => (
            <TaskSection
              key={taskGroup.id}
              title={taskGroup.title}
              subtitle={taskGroup.subtitle}
              emptyMessage={taskGroup.emptyMessage}
              tasks={taskGroup.tasks}
              editingTaskId={editingTaskId}
              selectedTaskId={selectedTaskId}
              onCancelEditTask={onCancelEditTask}
              onDeleteTask={onDeleteTask}
              onStartEditTask={onStartEditTask}
              onToggleTaskCompleted={onToggleTaskCompleted}
              onUpdateTask={onUpdateTask}
            />
          ))}

          <TaskSection
            title="Recently Completed"
            emptyMessage="No completed tasks yet."
            tasks={completedTasks}
            editingTaskId={editingTaskId}
            selectedTaskId={selectedTaskId}
            onCancelEditTask={onCancelEditTask}
            onDeleteTask={onDeleteTask}
            onStartEditTask={onStartEditTask}
            onToggleTaskCompleted={onToggleTaskCompleted}
            onUpdateTask={onUpdateTask}
          />
        </section>

        <CalendarPanel
          selectedTaskId={selectedTaskId}
          tasks={activeTasks}
          onSelectTask={onSelectTask}
        />
      </div>
    </main>
  );
}
