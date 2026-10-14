import { useState } from "react";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/tasks.css";
import "./styles/calendar.css";
import { AppHeader } from "./app/components/AppHeader";
import { AppSidebar, type AppView } from "./app/components/AppSidebar";
import { useBackendStatus } from "./app/hooks/useBackendStatus";
import { TaskCalendarView } from "./features/tasks/components/TaskCalendarView";
import { TaskDashboard } from "./features/tasks/components/TaskDashboard";
import { useTasks } from "./features/tasks/hooks/useTasks";

function App() {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const { isBackendConnected } = useBackendStatus();
  const tasks = useTasks();
  const allTasks = [...tasks.activeTasks, ...tasks.completedTasks];

  return (
    <div
      className="app-shell"
      data-api-status={isBackendConnected ? "connected" : "unavailable"}
    >
      <AppSidebar activeView={activeView} onSelectView={setActiveView} />

      <div className="app-main">
        <AppHeader isBackendConnected={isBackendConnected} />

        {activeView === "dashboard" ? (
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
        ) : (
          <TaskCalendarView
            selectedTaskId={tasks.selectedTaskId}
            tasks={allTasks}
            onSelectTask={tasks.selectTask}
          />
        )}
      </div>
    </div>
  );
}

export default App;
