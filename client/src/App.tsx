import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/tasks.css";
import "./styles/calendar.css";
import { AppHeader } from "./app/components/AppHeader";
import { AppSidebar } from "./app/components/AppSidebar";
import { useBackendStatus } from "./app/hooks/useBackendStatus";
import { TaskDashboard } from "./features/tasks/components/TaskDashboard";
import { useTasks } from "./features/tasks/hooks/useTasks";

function App() {
  const { isBackendConnected } = useBackendStatus();
  const tasks = useTasks();

  return (
    <div
      className="app-shell"
      data-api-status={isBackendConnected ? "connected" : "unavailable"}
    >
      <AppSidebar />

      <div className="app-main">
        <AppHeader isBackendConnected={isBackendConnected} />

        <TaskDashboard
          activeTasks={tasks.activeTasks}
          completedTasks={tasks.completedTasks}
          editingTaskId={tasks.editingTaskId}
          isAddingTask={tasks.isAddingTask}
          isLoadingTasks={tasks.isLoadingTasks}
          selectedTaskId={tasks.selectedTaskId}
          taskError={tasks.taskError}
          onAddTask={tasks.addTask}
          onCancelAddTask={tasks.cancelAddTask}
          onCancelEditTask={tasks.cancelEditingTask}
          onClearSelectedTask={tasks.clearSelectedTask}
          onDeleteTask={tasks.deleteTask}
          onSelectTask={tasks.selectTask}
          onStartEditTask={tasks.startEditingTask}
          onToggleAddTask={tasks.toggleAddTask}
          onToggleTaskCompleted={tasks.toggleTaskCompleted}
          onUpdateTask={tasks.updateTask}
        />
      </div>
    </div>
  );
}

export default App;
