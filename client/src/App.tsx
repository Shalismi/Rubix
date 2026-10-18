import { useState } from "react";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/tasks.css";
import "./styles/calendar.css";
import "./styles/auth.css";
import "./styles/settings.css";
import { AppHeader } from "./app/components/AppHeader";
import { AppSidebar, type AppView } from "./app/components/AppSidebar";
import {
  AuthLoadingScreen,
  AuthScreen,
} from "./features/auth/components/AuthScreen";
import { useAuth } from "./features/auth/hooks/useAuth";
import type { AuthUser } from "./features/auth/types";
import { AccountSettings } from "./features/settings/components/AccountSettings";
import { TaskCalendarView } from "./features/tasks/components/TaskCalendarView";
import { TaskDashboard } from "./features/tasks/components/TaskDashboard";
import { useTasks } from "./features/tasks/hooks/useTasks";

type AuthenticatedAppProps = {
  authError: string | null;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
  user: AuthUser;
};

function AuthenticatedApp({
  authError,
  isSigningOut,
  onSignOut,
  user,
}: AuthenticatedAppProps) {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const tasks = useTasks();
  const allTasks = [...tasks.activeTasks, ...tasks.completedTasks];
  let activeContent;

  if (activeView === "dashboard") {
    activeContent = (
      <TaskDashboard
        userId={user.id}
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
    );
  } else if (activeView === "calendar") {
    activeContent = (
      <TaskCalendarView
        selectedTaskId={tasks.selectedTaskId}
        tasks={allTasks}
        onSelectTask={tasks.selectTask}
      />
    );
  } else {
    activeContent = <AccountSettings username={user.username} />;
  }

  return (
    <div className="app-shell">
      <AppSidebar activeView={activeView} onSelectView={setActiveView} />

      <div className="app-main">
        <AppHeader
          authError={authError}
          isSigningOut={isSigningOut}
          onSignOut={onSignOut}
          username={user.username}
        />

        {activeContent}
      </div>
    </div>
  );
}

function App() {
  const auth = useAuth();

  if (auth.isCheckingSession) {
    return <AuthLoadingScreen />;
  }

  if (!auth.user) {
    return (
      <AuthScreen
        error={auth.authError}
        isSubmitting={auth.isSubmitting}
        onClearError={auth.clearAuthError}
        onLogin={auth.login}
        onRegister={auth.register}
      />
    );
  }

  return (
    <AuthenticatedApp
      authError={auth.authError}
      isSigningOut={auth.isSubmitting}
      onSignOut={auth.logout}
      user={auth.user}
    />
  );
}

export default App;
