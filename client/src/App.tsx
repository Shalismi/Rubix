import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import "./styles/fonts.css";
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
import "./styles/theme.css";
import { AppHeader } from "./app/components/AppHeader";
import { AppSidebar } from "./app/components/AppSidebar";
import { FONT_OPTIONS } from "./app/config/fonts";
import { APP_PATHS, getAccountPath, getPageTitle, getReturnPath, type AuthMode } from "./app/config/routes";
import { useFont } from "./app/hooks/useFont";
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
import { sortTasksByTagPriority } from "./features/tasks/utils/taskPriority";

type AuthenticatedAppProps = {
  authError: string | null;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
  onUserChange: (user: AuthUser) => void;
  user: AuthUser;
  welcomeMessage: string;
};

function AuthenticatedApp({
  authError,
  isSigningOut,
  onSignOut,
  onUserChange,
  user,
  welcomeMessage,
}: AuthenticatedAppProps) {
  const { font, setFont } = useFont(user.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const streak = useStreak();
  const tasks = useTasks({ onTaskCompleted: streak.refreshStreak });
  const tags = useTags();
  const activeTasks = sortTasksByTagPriority(
    tasks.activeTasks,
    tags.tags,
    tags.isPriorityEnabled,
  );
  const completedTasks = sortTasksByTagPriority(
    tasks.completedTasks,
    tags.tags,
    tags.isPriorityEnabled,
  );
  const allTasks = [...activeTasks, ...completedTasks];

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

  const dashboard = (
    <TaskDashboard
      userId={user.id}
      username={user.username}
      welcomeMessage={welcomeMessage}
      activeTasks={activeTasks}
      completedTasks={completedTasks}
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
  const calendar = (
    <TaskCalendarView
      selectedTaskId={tasks.selectedTaskId}
      tasks={allTasks}
      tags={tags.tags}
      selectedTagIds={selectedTagIds}
      onSelectTask={(taskId) => {
        tasks.selectTask(taskId);
        void navigate(APP_PATHS.dashboard);
      }}
      onSelectedTagIdsChange={setSelectedTagIds}
    />
  );
  const trash = (
    <div className="trash-layout">
      <TrashView
        tasks={tasks.trashedTasks}
        tags={tags.tags}
        isLoading={tasks.isLoadingTrash}
        error={tasks.trashError}
        onRestore={tasks.restoreTask}
        onPermanentlyDelete={tasks.permanentlyDeleteTask}
      />
    </div>
  );
  const settings = (
    <AccountSettings
      user={user}
      onUserChange={onUserChange}
      font={font}
      onFontChange={setFont}
    />
  );

  return (
    <div
      className="app-shell"
      data-font={font}
      style={{ fontFamily: FONT_OPTIONS[font].family }}
    >
      <AppSidebar />

      <div className={`app-main${location.pathname.replace(/\/+$/, "") === APP_PATHS.calendar ? " app-main-calendar" : ""}`}>
        <AppHeader
          authError={authError}
          isSigningOut={isSigningOut}
          onSignOut={onSignOut}
          username={user.username}
        />

        <Routes>
          <Route path={APP_PATHS.dashboard} element={dashboard} />
          <Route path={APP_PATHS.calendar} element={calendar} />
          <Route path={APP_PATHS.trash} element={trash} />
          <Route path={APP_PATHS.settings} element={settings} />
          <Route path="*" element={
            <main className="route-not-found">
              <h1>Page not found</h1>
              <p>This address doesn’t match a Rubix page.</p>
              <Link className="secondary-button" to={APP_PATHS.dashboard}>
                Go to dashboard
              </Link>
            </main>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const auth = useAuth();
  const location = useLocation();
  const returnPath = getReturnPath(location.search);
  const { clearAuthError } = auth;

  useEffect(() => {
    document.title = getPageTitle(location.pathname);
    clearAuthError();
    window.scrollTo(0, 0);
  }, [location.pathname, clearAuthError]);

  function accountPage(mode: AuthMode) {
    if (auth.isCheckingSession) return <AuthLoadingScreen />;
    if (auth.registrationRecoveryCode) {
      return <Navigate replace to={getAccountPath("recovery-code", returnPath)} />;
    }
    if (auth.user) return <Navigate replace to={returnPath} />;

    return (
      <AuthScreen
        key={mode}
        mode={mode}
        returnPath={returnPath}
        error={auth.authError}
        isSubmitting={auth.isSubmitting}
        onClearError={auth.clearAuthError}
        onLogin={auth.login}
        onRegister={auth.register}
      />
    );
  }

  function recoveryPage() {
    if (auth.isCheckingSession) return <AuthLoadingScreen />;
    if (!auth.user) return <Navigate replace to={getAccountPath("login", returnPath)} />;
    if (!auth.registrationRecoveryCode) return <Navigate replace to={returnPath} />;

    return (
      <RecoveryCodeScreen
        code={auth.registrationRecoveryCode}
        onContinue={auth.dismissRegistrationRecoveryCode}
      />
    );
  }

  function protectedPages() {
    if (auth.isCheckingSession) return <AuthLoadingScreen />;
    const destination = location.pathname + location.search + location.hash;
    if (!auth.user) return <Navigate replace to={getAccountPath("login", destination)} />;
    if (auth.registrationRecoveryCode) {
      return <Navigate replace to={getAccountPath("recovery-code", destination)} />;
    }

    return (
      <AuthenticatedApp
        key={auth.user.id}
        authError={auth.authError}
        isSigningOut={auth.isSubmitting}
        onSignOut={auth.logout}
        onUserChange={auth.updateUser}
        user={auth.user}
        welcomeMessage={auth.welcomeMessage}
      />
    );
  }

  if (location.pathname.length > 1 && location.pathname.endsWith("/")) {
    return <Navigate replace to={location.pathname.replace(/\/+$/, "") + location.search + location.hash} />;
  }

  return (
    <Routes>
      <Route path="/login" element={accountPage("login")} />
      <Route path="/register" element={accountPage("register")} />
      <Route path="/forgot-password" element={<PasswordRecoveryScreen />} />
      <Route path="/verify-email" element={<EmailVerificationScreen key={location.search} />} />
      <Route path="/recovery-code" element={recoveryPage()} />
      <Route path="/*" element={protectedPages()} />
    </Routes>
  );
}

export default App;
