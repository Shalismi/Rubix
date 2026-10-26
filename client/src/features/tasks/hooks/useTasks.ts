import { useEffect, useState } from "react";
import {
  createTask,
  getTasks,
  getTrashedTasks,
  moveTaskToTrash,
  permanentlyDeleteTask as permanentlyDeleteTaskRequest,
  restoreTask as restoreTaskRequest,
  updateTask as updateTaskRequest,
} from "../api/tasksApi";
import type { NewTaskInput, Task } from "../types";
import type { Tag } from "../../tags/types";
import { compareDateValues, getDefaultDueDate } from "../utils/date";

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((firstTask, secondTask) => {
    if (firstTask.completed !== secondTask.completed) {
      return Number(firstTask.completed) - Number(secondTask.completed);
    }

    if (firstTask.dueDate !== secondTask.dueDate) {
      if (!firstTask.dueDate) {
        return 1;
      }

      if (!secondTask.dueDate) {
        return -1;
      }

      return compareDateValues(firstTask.dueDate, secondTask.dueDate);
    }

    return secondTask.id - firstTask.id;
  });
}

function splitTasks(tasks: Task[]) {
  return {
    activeTasks: tasks.filter((task) => !task.completed),
    completedTasks: tasks.filter((task) => task.completed),
  };
}

function buildTaskInput(taskInput: NewTaskInput) {
  const nextTask: NewTaskInput = {
    title: taskInput.title,
    dueDate: getDefaultDueDate(taskInput.dueDate),
  };

  if (typeof taskInput.description === "string") {
    nextTask.description = taskInput.description;
  }

  if (taskInput.tagIds !== undefined) {
    nextTask.tagIds = taskInput.tagIds;
  }

  return nextTask;
}

function replaceTask(tasks: Task[], updatedTask: Task) {
  return sortTasks(
    tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
  );
}

type UseTasksOptions = {
  onTaskCompleted?: () => void | Promise<void>;
};

export function useTasks({ onTaskCompleted }: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trashedTasks, setTrashedTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingTrash, setIsLoadingTrash] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [trashError, setTrashError] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const { activeTasks, completedTasks } = splitTasks(tasks);

  useEffect(() => {
    if (selectedTaskId === null) {
      return;
    }

    function handleOutsideSelection(event: Event) {
      const target = event.target;
      if (target instanceof Element) {
        const selectedCard = document.getElementById(`task-${selectedTaskId}`);
        if (
          selectedCard?.contains(target) ||
          target.closest(
            ".calendar-day:not(:disabled), .upcoming-task, .next-task-button, .calendar-view-task",
          )
        ) {
          return;
        }
      }

      setSelectedTaskId(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedTaskId(null);
      }
    }

    document.addEventListener("pointerdown", handleOutsideSelection, true);
    document.addEventListener("click", handleOutsideSelection, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideSelection, true);
      document.removeEventListener("click", handleOutsideSelection, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedTaskId]);

  useEffect(() => {
    getTasks()
      .then((serverTasks) => {
        setTasks(sortTasks(serverTasks));
        setTaskError(null);
      })
      .catch(() => {
        setTaskError("Could not load tasks from the server.");
      })
      .finally(() => {
        setIsLoadingTasks(false);
      });

    getTrashedTasks()
      .then((serverTasks) => {
        setTrashedTasks(serverTasks);
        setTrashError(null);
      })
      .catch(() => {
        setTrashError("Could not load deleted tasks from the server.");
      })
      .finally(() => {
        setIsLoadingTrash(false);
      });
  }, []);

  async function addTask(taskInput: NewTaskInput) {
    try {
      const createdTask = await createTask(buildTaskInput(taskInput));

      setTasks((currentTasks) => sortTasks([...currentTasks, createdTask]));
      setIsAddingTask(false);
      setSelectedTaskId(createdTask.id);
      setTaskError(null);
    } catch {
      setTaskError("Could not add task.");
    }
  }

  async function deleteTask(taskId: number) {
    try {
      const deletedTask = await moveTaskToTrash(taskId);
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
      setTrashedTasks((currentTasks) => [deletedTask, ...currentTasks]);

      if (editingTaskId === taskId) {
        setEditingTaskId(null);
      }

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }

      setTaskError(null);
    } catch {
      setTaskError("Could not move task to Trash.");
    }
  }

  async function restoreTask(taskId: number) {
    try {
      const restoredTask = await restoreTaskRequest(taskId);
      setTrashedTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
      setTasks((currentTasks) => sortTasks([...currentTasks, restoredTask]));
      setTrashError(null);
    } catch {
      setTrashError("Could not restore task.");
    }
  }

  async function permanentlyDeleteTask(taskId: number) {
    try {
      await permanentlyDeleteTaskRequest(taskId);
      setTrashedTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
      setTrashError(null);
    } catch {
      setTrashError("Could not permanently delete task.");
    }
  }

  async function updateTask(taskId: number, taskInput: NewTaskInput) {
    try {
      const updatedTask = await updateTaskRequest(
        taskId,
        buildTaskInput(taskInput),
      );

      setTasks((currentTasks) => replaceTask(currentTasks, updatedTask));
      setEditingTaskId(null);
      setSelectedTaskId(taskId);
      setTaskError(null);
    } catch {
      setTaskError("Could not update task.");
    }
  }

  function startEditingTask(taskId: number) {
    setIsAddingTask(false);
    setEditingTaskId(taskId);
    setSelectedTaskId(taskId);
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
  }

  function selectTask(taskId: number) {
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      return;
    }

    setSelectedTaskId(taskId);

    window.requestAnimationFrame(() => {
      document
        .getElementById(`task-${taskId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function toggleTaskCompleted(taskId: number) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task) {
      return;
    }

    try {
      const updatedTask = await updateTaskRequest(taskId, {
        completed: !task.completed,
      });

      setTasks((currentTasks) => replaceTask(currentTasks, updatedTask));
      setSelectedTaskId(taskId);
      setTaskError(null);

      if (!task.completed) {
        void onTaskCompleted?.();
      }
    } catch {
      setTaskError("Could not update task status.");
    }
  }

  function toggleAddTask() {
    setIsAddingTask((currentValue) => {
      if (!currentValue) {
        setEditingTaskId(null);
      }

      return !currentValue;
    });
  }

  function cancelAddTask() {
    setIsAddingTask(false);
  }

  function syncTag(updatedTag: Tag) {
    const syncTagInTasks = (currentTasks: Task[]) =>
      currentTasks.map((task) => ({
        ...task,
        tags: task.tags.map((tag) =>
          tag.id === updatedTag.id ? updatedTag : tag,
        ),
      }));

    setTasks(syncTagInTasks);
    setTrashedTasks(syncTagInTasks);
  }

  function removeTag(tagId: number) {
    const removeTagFromTasks = (currentTasks: Task[]) =>
      currentTasks.map((task) => ({
        ...task,
        tags: task.tags.filter((tag) => tag.id !== tagId),
      }));

    setTasks(removeTagFromTasks);
    setTrashedTasks(removeTagFromTasks);
  }

  return {
    activeTasks,
    completedTasks,
    editingTaskId,
    isAddingTask,
    isLoadingTasks,
    isLoadingTrash,
    selectedTaskId,
    taskError,
    trashError,
    trashedTasks,
    addTask,
    cancelAddTask,
    cancelEditingTask,
    deleteTask,
    permanentlyDeleteTask,
    restoreTask,
    selectTask,
    startEditingTask,
    syncTag,
    toggleAddTask,
    toggleTaskCompleted,
    updateTask,
    removeTag,
  };
}
