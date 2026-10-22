import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { CalendarPanel } from "./CalendarPanel";
import { TaskForm } from "./TaskForm";
import { TaskSection } from "./TaskSection";
import { TagFilter } from "../../tags/components/TagFilter";
import { TagManager } from "../../tags/components/TagManager";
import { StreakPanel } from "../../streaks/components/StreakPanel";
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
  activeTasks: Task[];
  completedTasks: Task[];
  editingTaskId: number | null;
  isAddingTask: boolean;
  isLoadingTasks: boolean;
  selectedTaskId: number | null;
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
  onClearSelectedTask: () => void;
  onDeleteTask: (taskId: number) => void;
  onSelectTask: (taskId: number) => void;
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
  activeTasks,
  completedTasks,
  editingTaskId,
  isAddingTask,
  isLoadingTasks,
  selectedTaskId,
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
  onClearSelectedTask,
  onDeleteTask,
  onSelectTask,
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

  function handleDashboardClick(event: MouseEvent<HTMLElement>) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const shouldKeepSelection = event.target.closest(
      "button, input, textarea, form, .task-card, .calendar-panel, .task-search",
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

              <button
                className="primary-button"
                type="button"
                onClick={onToggleAddTask}
                aria-expanded={isAddingTask}
              >
                {isAddingTask ? "Close Form" : "+ Add Task"}
              </button>
            </div>
          </div>

          {isAddingTask && (
            <TaskForm
              idPrefix="new-task"
              submitLabel="Add Task"
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
          <StreakPanel />
          <CalendarPanel
            selectedTaskId={selectedTaskId}
            tasks={filteredActiveTasks}
            onSelectTask={onSelectTask}
          />
        </div>
      </div>
    </main>
  );
}
