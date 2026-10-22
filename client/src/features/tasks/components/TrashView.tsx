import { useMemo, useState } from "react";
import { TagFilter } from "../../tags/components/TagFilter";
import { TagPill } from "../../tags/components/TagPill";
import type { Tag } from "../../tags/types";
import type { Task } from "../types";
import { compareDateValues, formatDueDate } from "../utils/date";
import { filterTasksByTags } from "../utils/taskFilters";

const TRASH_RETENTION_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type TrashViewProps = {
  tasks: Task[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  onRestore: (taskId: number) => void;
  onPermanentlyDelete: (taskId: number) => void;
};

type TrashSort = "deleted" | "due";

function getDaysRemaining(deletedAt: string | null) {
  if (!deletedAt) {
    return TRASH_RETENTION_DAYS;
  }

  const expiresAt =
    new Date(deletedAt).getTime() + TRASH_RETENTION_DAYS * DAY_IN_MS;

  return Math.max(0, Math.ceil((expiresAt - Date.now()) / DAY_IN_MS));
}

function formatDeletedDate(deletedAt: string | null) {
  if (!deletedAt) {
    return "Recently deleted";
  }

  return `Deleted ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(deletedAt))}`;
}

export function TrashView({
  tasks,
  tags,
  isLoading,
  error,
  onRestore,
  onPermanentlyDelete,
}: TrashViewProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<TrashSort>("deleted");
  const visibleTasks = useMemo(() => {
    const filteredTasks = filterTasksByTags(tasks, selectedTagIds);

    return [...filteredTasks].sort((firstTask, secondTask) => {
      if (sortBy === "due") {
        if (!firstTask.dueDate) {
          return 1;
        }

        if (!secondTask.dueDate) {
          return -1;
        }

        const dateComparison = compareDateValues(
          firstTask.dueDate,
          secondTask.dueDate,
        );

        if (dateComparison !== 0) {
          return dateComparison;
        }
      }

      return (
        new Date(secondTask.deletedAt ?? 0).getTime() -
        new Date(firstTask.deletedAt ?? 0).getTime()
      );
    });
  }, [selectedTagIds, sortBy, tasks]);

  function confirmPermanentDelete(task: Task) {
    const shouldDelete = window.confirm(
      `Permanently delete "${task.title}"? This cannot be undone.`,
    );

    if (shouldDelete) {
      onPermanentlyDelete(task.id);
    }
  }

  return (
    <main className="trash-view" aria-labelledby="trash-heading">
      <header className="trash-header">
        <div>
          <div className="trash-title-row">
            <h1 id="trash-heading">Trash</h1>
            <span
              className="task-section-count"
              aria-label={`${visibleTasks.length} deleted tasks`}
            >
              {visibleTasks.length}
            </span>
          </div>
          <p>Tasks are permanently deleted 30 days after they enter Trash.</p>
        </div>

        <div className="trash-controls">
          <TagFilter
            tags={tags}
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
          <label className="trash-sort-control">
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as TrashSort)}
            >
              <option value="deleted">Deleted date</option>
              <option value="due">Task due date</option>
            </select>
          </label>
        </div>
      </header>

      {isLoading && <p className="trash-message">Loading deleted tasks...</p>}
      {error && <p className="trash-message is-error">{error}</p>}

      {!isLoading && tasks.length === 0 && (
        <div className="trash-empty-state">
          <h2>Trash is empty</h2>
          <p>Tasks you delete will appear here for 30 days.</p>
        </div>
      )}

      {!isLoading && tasks.length > 0 && visibleTasks.length === 0 && (
        <div className="trash-empty-state">
          <h2>No matching tasks</h2>
          <p>No deleted tasks use the selected tags.</p>
        </div>
      )}

      {visibleTasks.length > 0 && (
        <div className="trash-list">
          {visibleTasks.map((task) => {
            const daysRemaining = getDaysRemaining(task.deletedAt);

            return (
              <article className="trash-task" key={task.id}>
                <div className="trash-task-content">
                  <div className="trash-task-heading">
                    <h2>{task.title}</h2>
                    <span className="trash-expiration">
                      {daysRemaining === 1
                        ? "1 day remaining"
                        : `${daysRemaining} days remaining`}
                    </span>
                  </div>

                  {task.description && (
                    <p className="trash-task-description">{task.description}</p>
                  )}

                  <div className="trash-task-meta">
                    {task.dueDate && <span>{formatDueDate(task.dueDate)}</span>}
                    <span>{formatDeletedDate(task.deletedAt)}</span>
                  </div>

                  {task.tags.length > 0 && (
                    <div className="trash-task-tags" aria-label="Task tags">
                      {task.tags.map((tag) => (
                        <TagPill key={tag.id} tag={tag} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="trash-task-actions">
                  <button
                    className="trash-restore-button"
                    type="button"
                    onClick={() => onRestore(task.id)}
                  >
                    Restore
                  </button>
                  <button
                    className="trash-delete-button"
                    type="button"
                    onClick={() => confirmPermanentDelete(task)}
                  >
                    Delete permanently
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
