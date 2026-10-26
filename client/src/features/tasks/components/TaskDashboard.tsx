import { useEffect, useMemo, useState } from "react";
import { CalendarPanel } from "./CalendarPanel";
import { TaskForm } from "./TaskForm";
import { TaskSection } from "./TaskSection";
import { TagFilter } from "../../tags/components/TagFilter";
import { TagManager } from "../../tags/components/TagManager";
import { StreakPanel } from "../../streaks/components/StreakPanel";
import type { StreakSummary } from "../../streaks/types";
import type { Tag, TagInput, TagMoveDirection } from "../../tags/types";
import type { NewTaskInput, Task } from "../types";
import { getActiveTaskGroups } from "../utils/taskGroups";
import { filterTasksBySearchAndTags } from "../utils/taskFilters";

type CollapsibleTaskSection = "today" | "upcoming" | "completed";
type OpenTaskSections = Record<CollapsibleTaskSection, boolean>;

const TASK_SECTION_STORAGE_KEY = "rubix.task-sections";
const DEFAULT_OPEN_SECTIONS: OpenTaskSections = {
  today: true,
  upcoming: true,
  completed: true,
};

function getTaskSectionStorageKey(userId: number) {
  return `${TASK_SECTION_STORAGE_KEY}.${userId}`;
}

function getSavedOpenSections(userId: number): OpenTaskSections {
  try {
    const savedValue = window.localStorage.getItem(
      getTaskSectionStorageKey(userId),
    );

    if (!savedValue) {
      return { ...DEFAULT_OPEN_SECTIONS };
    }

    const savedSections = JSON.parse(savedValue) as Partial<OpenTaskSections>;

    return {
      today:
        typeof savedSections.today === "boolean"
          ? savedSections.today
          : DEFAULT_OPEN_SECTIONS.today,
      upcoming:
        typeof savedSections.upcoming === "boolean"
          ? savedSections.upcoming
          : DEFAULT_OPEN_SECTIONS.upcoming,
      completed:
        typeof savedSections.completed === "boolean"
          ? savedSections.completed
          : DEFAULT_OPEN_SECTIONS.completed,
    };
  } catch {
    return { ...DEFAULT_OPEN_SECTIONS };
  }
}

type TaskDashboardProps = {
  userId: number;
  username: string;
  welcomeMessage: string;
  activeTasks: Task[];
  completedTasks: Task[];
  editingTaskId: number | null;
  isAddingTask: boolean;
  isLoadingTasks: boolean;
  selectedTaskId: number | null;
  streak: StreakSummary | null;
  streakError: string | null;
  isLoadingStreak: boolean;
  taskError: string | null;
  tags: Tag[];
  selectedTagIds: number[];
  isLoadingTags: boolean;
  isTagPriorityEnabled: boolean;
  isSavingTagOrder: boolean;
  tagError: string | null;
  onAddTask: (task: NewTaskInput) => void;
  onCancelAddTask: () => void;
  onCancelEditTask: () => void;
  onDeleteTask: (taskId: number) => void;
  onSelectTask: (taskId: number) => void;
  onOpenCalendar: () => void;
  onStartEditTask: (taskId: number) => void;
  onToggleAddTask: () => void;
  onToggleTaskCompleted: (taskId: number) => void;
  onUpdateTask: (taskId: number, task: NewTaskInput) => void;
  onSelectedTagIdsChange: (tagIds: number[]) => void;
  onAddTag: (tag: TagInput) => Promise<Tag | null>;
  onEditTag: (tagId: number, tag: TagInput) => Promise<Tag | null>;
  onMoveTag: (tagId: number, direction: TagMoveDirection) => Promise<boolean>;
  onTagPriorityEnabledChange: (enabled: boolean) => Promise<boolean>;
  onRemoveTag: (tagId: number) => Promise<boolean>;
};

export function TaskDashboard({
  userId,
  username,
  welcomeMessage,
  activeTasks,
  completedTasks,
  editingTaskId,
  isAddingTask,
  isLoadingTasks,
  selectedTaskId,
  streak,
  streakError,
  isLoadingStreak,
  taskError,
  tags,
  selectedTagIds,
  isLoadingTags,
  isTagPriorityEnabled,
  isSavingTagOrder,
  tagError,
  onAddTask,
  onCancelAddTask,
  onCancelEditTask,
  onDeleteTask,
  onSelectTask,
  onOpenCalendar,
  onStartEditTask,
  onToggleAddTask,
  onToggleTaskCompleted,
  onUpdateTask,
  onSelectedTagIdsChange,
  onAddTag,
  onEditTag,
  onMoveTag,
  onTagPriorityEnabledChange,
  onRemoveTag,
}: TaskDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<OpenTaskSections>(() =>
    getSavedOpenSections(userId),
  );
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearchQuery.length > 0;
  const isFilteringTags = selectedTagIds.length > 0;
  const isNarrowingTasks = isSearching || isFilteringTags;
  const filteredActiveTasks = useMemo(
    () =>
      filterTasksBySearchAndTags(
        activeTasks,
        normalizedSearchQuery,
        selectedTagIds,
      ),
    [activeTasks, normalizedSearchQuery, selectedTagIds],
  );
  const filteredCompletedTasks = useMemo(
    () =>
      filterTasksBySearchAndTags(
        completedTasks,
        normalizedSearchQuery,
        selectedTagIds,
      ),
    [completedTasks, normalizedSearchQuery, selectedTagIds],
  );
  const activeTaskGroups = useMemo(
    () => getActiveTaskGroups(filteredActiveTasks),
    [filteredActiveTasks],
  );
  const visibleActiveTaskGroups = isNarrowingTasks
    ? activeTaskGroups.filter((taskGroup) => taskGroup.tasks.length > 0)
    : activeTaskGroups;
  const hasSearchResults =
    filteredActiveTasks.length + filteredCompletedTasks.length > 0;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getTaskSectionStorageKey(userId),
        JSON.stringify(openSections),
      );
    } catch {
      // The dashboard still works when browser storage is unavailable.
    }
  }, [openSections, userId]);

  function toggleSection(sectionId: CollapsibleTaskSection) {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [sectionId]: !currentSections[sectionId],
    }));
  }

  return (
    <main className="dashboard">
      <div className="dashboard-layout">
        <section className="dashboard-card" aria-labelledby="tasks-heading">
          <header className="dashboard-welcome">
            <div className="dashboard-welcome-copy">
              <h1 id="tasks-heading">Welcome {username},</h1>
              <p className="dashboard-welcome-message">{welcomeMessage}</p>
            </div>
            <button
              className="primary-button task-primary-button dashboard-add-button"
              type="button"
              onClick={onToggleAddTask}
              aria-expanded={isAddingTask}
            >
              {isAddingTask ? "Close Form" : "+ Add Task"}
            </button>
          </header>
          <div className="dashboard-card-header">
            <div className="dashboard-card-actions">
              <label className="task-search">
                <span className="task-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search tasks..."
                  aria-label="Search tasks"
                />
              </label>

              <TagFilter
                tags={tags}
                selectedTagIds={selectedTagIds}
                onChange={onSelectedTagIdsChange}
              />

              <TagManager
                tags={tags}
                isLoading={isLoadingTags}
                isPriorityEnabled={isTagPriorityEnabled}
                isSavingOrder={isSavingTagOrder}
                error={tagError}
                onAddTag={onAddTag}
                onEditTag={onEditTag}
                onMoveTag={onMoveTag}
                onPriorityEnabledChange={onTagPriorityEnabledChange}
                onRemoveTag={onRemoveTag}
              />
            </div>
          </div>

          {isLoadingTasks && <p className="dashboard-status">Loading tasks...</p>}
          {taskError && <p className="dashboard-status dashboard-error" role="alert">{taskError}</p>}

          {isAddingTask && (
            <TaskForm
              tags={tags}
              onAddTag={onAddTag}
              onSubmitTask={onAddTask}
              onCancel={onCancelAddTask}
            />
          )}

          {visibleActiveTaskGroups.map((taskGroup) => {
            const collapsibleSectionId =
              taskGroup.id === "today" || taskGroup.id === "upcoming"
                ? taskGroup.id
                : null;

            return (
              <TaskSection
                key={taskGroup.id}
                title={taskGroup.title}
                subtitle={taskGroup.subtitle}
                emptyMessage={
                  normalizedSearchQuery && taskGroup.id === "today"
                    ? "No matching tasks due today."
                    : taskGroup.emptyMessage
                }
                tasks={taskGroup.tasks}
                availableTags={tags}
                onAddTag={onAddTag}
                hideHeader={isSearching}
                variant={
                  taskGroup.id === "past-due"
                    ? "overdue"
                    : taskGroup.id === "today"
                      ? "today"
                      : taskGroup.id === "upcoming"
                        ? "upcoming"
                        : "default"
                }
                isCollapsed={
                  !isSearching && collapsibleSectionId
                    ? !openSections[collapsibleSectionId]
                    : false
                }
                onToggleCollapsed={
                  !isSearching && collapsibleSectionId
                    ? () => toggleSection(collapsibleSectionId)
                    : undefined
                }
                editingTaskId={editingTaskId}
                selectedTaskId={selectedTaskId}
                onCancelEditTask={onCancelEditTask}
                onDeleteTask={onDeleteTask}
                onStartEditTask={onStartEditTask}
                onToggleTaskCompleted={onToggleTaskCompleted}
                onUpdateTask={onUpdateTask}
              />
            );
          })}

          {(!isNarrowingTasks || filteredCompletedTasks.length > 0) && (
            <TaskSection
              title="Completed"
              emptyMessage="No completed tasks yet."
              tasks={filteredCompletedTasks}
              availableTags={tags}
              onAddTag={onAddTag}
              variant="completed"
              hideHeader={isSearching}
              isCollapsed={isSearching ? false : !openSections.completed}
              onToggleCollapsed={
                isSearching ? undefined : () => toggleSection("completed")
              }
              editingTaskId={editingTaskId}
              selectedTaskId={selectedTaskId}
              onCancelEditTask={onCancelEditTask}
              onDeleteTask={onDeleteTask}
              onStartEditTask={onStartEditTask}
              onToggleTaskCompleted={onToggleTaskCompleted}
              onUpdateTask={onUpdateTask}
            />
          )}

          {isNarrowingTasks && !hasSearchResults && (
            <p className="task-search-empty">No tasks match these filters.</p>
          )}
        </section>

        <div className="dashboard-rail">
          <StreakPanel
            streak={streak}
            isLoading={isLoadingStreak}
            error={streakError}
          />
          <CalendarPanel
            selectedTaskId={selectedTaskId}
            tasks={filteredActiveTasks}
            onSelectTask={onSelectTask}
            onOpenCalendar={onOpenCalendar}
          />
        </div>
      </div>
    </main>
  );
}
