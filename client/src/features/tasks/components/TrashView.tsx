import { useMemo, useState } from "react";
import { TagFilter } from "../../tags/components/TagFilter";
import { TagPill } from "../../tags/components/TagPill";
import type { Tag } from "../../tags/types";
import type { Task } from "../types";
import { compareDateValues, formatSectionDate } from "../utils/date";
import { filterTasksBySearchAndTags } from "../utils/taskFilters";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<TrashSort>("deleted");
  const visibleTasks = useMemo(() => {
    const filteredTasks = filterTasksBySearchAndTags(
      tasks,
      searchQuery,
      selectedTagIds,
    );

    return [...filteredTasks].sort((firstTask, secondTask) => {
      if (sortBy === "due" && firstTask.dueDate !== secondTask.dueDate) {
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
  }, [searchQuery, selectedTagIds, sortBy, tasks]);

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
      <div className="trash-toolbar">
        <label className="task-search trash-search">
          <span className="task-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search deleted tasks..."
            aria-label="Search deleted tasks"
          />
        </label>
        <TagFilter
          tags={tags}
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
        />
        <label className="trash-sort-control">
          <span className="visually-hidden">Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as TrashSort)}
          >
            <option value="deleted">Deleted date</option>
            <option value="due">Task date</option>
          </select>
        </label>
      </div>

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
      </header>

      {isLoading && <p className="trash-message">Loading deleted tasks...</p>}
      {error && (
        <p className="trash-message is-error" role="alert">{error}</p>
      )}

      {!isLoading && !error && tasks.length === 0 && (
        <div className="trash-empty-state">
          <h2>Trash is empty</h2>
          <p>Tasks you delete will appear here for 30 days.</p>
        </div>
      )}

      {!isLoading && !error && tasks.length > 0 && visibleTasks.length === 0 && (
        <div className="trash-empty-state" role="status">
          <h2>No matching tasks</h2>
          <p>Try another search or adjust the tag filter.</p>
          <button
            className="trash-reset-button"
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedTagIds([]);
            }}
          >
            Clear search and filters
          </button>
        </div>
      )}

      {visibleTasks.length > 0 && (
        <div className="trash-list">
          {visibleTasks.map((task) => {
            const daysRemaining = getDaysRemaining(task.deletedAt);

            return (
              <article className="trash-task" key={task.id} aria-label={task.title}>
                <div className="trash-task-content">
                  <div className="trash-task-heading">
                    <h2>{task.title}</h2>
                  </div>

                  {task.description && (
                    <p className="trash-task-description">{task.description}</p>
                  )}

                  <div className="trash-task-details">
                    {task.dueDate && (
                      <div className="trash-task-meta">
                        <time dateTime={task.dueDate}>
                          {formatSectionDate(task.dueDate)}
                        </time>
                      </div>
                    )}
                    <div className="trash-retention">
                      <span className="trash-deleted-date">
                        {formatDeletedDate(task.deletedAt)}
                      </span>
                      <span className="trash-expiration">
                        {daysRemaining === 1
                          ? "1 day remaining"
                          : `${daysRemaining} days remaining`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="trash-task-actions">
                  {task.tags.length > 0 && (
                    <div
                      className="task-tags trash-task-tags"
                      aria-label="Task tags"
                    >
                      {task.tags.map((tag) => (
                        <TagPill key={tag.id} tag={tag} />
                      ))}
                    </div>
                  )}
                  <div className="trash-task-buttons">
                    <button
                      className="trash-restore-button"
                      type="button"
                      onClick={() => onRestore(task.id)}
                      aria-label={`Restore ${task.title}`}
                    >
                      <svg
                        className="trash-action-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6M12 8v5l3 2" />
                      </svg>
                      Restore
                    </button>
                    <button
                      className="trash-delete-button"
                      type="button"
                      onClick={() => confirmPermanentDelete(task)}
                      aria-label={`Permanently delete ${task.title}`}
                    >
                      <svg
                        className="trash-action-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M4 7h16M9 7V4h6v3M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6" />
                      </svg>
                      Delete permanently
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
