import { useState } from "react";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/tasks.css";
import "./styles/calendar.css";
import "./styles/auth.css";
import "./styles/settings.css";
import "./styles/streaks.css";
import "./styles/tags.css";
import "./styles/trash.css";
import { AppHeader } from "./app/components/AppHeader";
import { AppSidebar, type AppView } from "./app/components/AppSidebar";
import {
  AuthLoadingScreen,
  AuthScreen,
} from "./features/auth/components/AuthScreen";
import { EmailVerificationScreen } from "./features/auth/components/EmailVerificationScreen";
import { PasswordRecoveryScreen } from "./features/auth/components/PasswordRecoveryScreen";
import { RecoveryCodeScreen } from "./features/auth/components/RecoveryCodeScreen";
import { useAuth } from "./features/auth/hooks/useAuth";
import type { AuthUser } from "./features/auth/types";
import { AccountSettings } from "./features/settings/components/AccountSettings";
import { useStreak } from "./features/streaks/hooks/useStreak";
import { useTags } from "./features/tags/hooks/useTags";
import type { TagInput } from "./features/tags/types";
import { TaskCalendarView } from "./features/tasks/components/TaskCalendarView";
import { TaskDashboard } from "./features/tasks/components/TaskDashboard";
import { TrashView } from "./features/tasks/components/TrashView";
import { useTasks } from "./features/tasks/hooks/useTasks";

type AuthenticatedAppProps = {
  authError: string | null;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
  onUserChange: (user: AuthUser) => void;
  user: AuthUser;
};

function AuthenticatedApp({
  authError,
  isSigningOut,
  onSignOut,
  onUserChange,
  user,
}: AuthenticatedAppProps) {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const streak = useStreak();
  const tasks = useTasks({ onTaskCompleted: streak.refreshStreak });
  const tags = useTags();
  const allTasks = [...tasks.activeTasks, ...tasks.completedTasks];
  let activeContent;

  async function handleEditTag(tagId: number, input: TagInput) {
    const updatedTag = await tags.editTag(tagId, input);

    if (updatedTag) {
      tasks.syncTag(updatedTag);
    }

    return updatedTag;
  }

  async function handleRemoveTag(tagId: number) {
    const wasRemoved = await tags.removeTag(tagId);

    if (wasRemoved) {
      tasks.removeTag(tagId);
      setSelectedTagIds((currentTagIds) =>
        currentTagIds.filter((selectedTagId) => selectedTagId !== tagId),
      );
    }

    return wasRemoved;
  }

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
        streak={streak.streak}
        streakError={streak.streakError}
        isLoadingStreak={streak.isLoadingStreak}
        taskError={tasks.taskError}
        tags={tags.tags}
        selectedTagIds={selectedTagIds}
        isLoadingTags={tags.isLoadingTags}
        isTagPriorityEnabled={tags.isPriorityEnabled}
        isSavingTagOrder={tags.isSavingTagOrder}
        tagError={tags.tagError}
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
        onSelectedTagIdsChange={setSelectedTagIds}
        onAddTag={tags.addTag}
        onEditTag={handleEditTag}
        onMoveTag={tags.moveTag}
        onTagPriorityEnabledChange={tags.changePriorityEnabled}
        onRemoveTag={handleRemoveTag}
      />
    );
  } else if (activeView === "calendar") {
    activeContent = (
      <TaskCalendarView
        selectedTaskId={tasks.selectedTaskId}
        tasks={allTasks}
        tags={tags.tags}
        selectedTagIds={selectedTagIds}
        onSelectTask={tasks.selectTask}
        onSelectedTagIdsChange={setSelectedTagIds}
      />
    );
  } else if (activeView === "trash") {
    activeContent = (
      <TrashView
        tasks={tasks.trashedTasks}
        tags={tags.tags}
        isLoading={tasks.isLoadingTrash}
        error={tasks.trashError}
        onRestore={tasks.restoreTask}
        onPermanentlyDelete={tasks.permanentlyDeleteTask}
      />
    );
  } else {
    activeContent = (
      <AccountSettings user={user} onUserChange={onUserChange} />
    );
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
  const isVerifyingEmail = window.location.pathname === "/verify-email";
  const isRecoveringPassword =
    window.location.pathname === "/forgot-password";

  if (isVerifyingEmail) {
    return <EmailVerificationScreen />;
  }

  if (isRecoveringPassword) {
    return <PasswordRecoveryScreen />;
  }

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

  if (auth.registrationRecoveryCode) {
    return (
      <RecoveryCodeScreen
        code={auth.registrationRecoveryCode}
        onContinue={auth.dismissRegistrationRecoveryCode}
      />
    );
  }

  return (
    <AuthenticatedApp
      authError={auth.authError}
      isSigningOut={auth.isSubmitting}
      onSignOut={auth.logout}
      onUserChange={auth.updateUser}
      user={auth.user}
    />
  );
}

export default App;
