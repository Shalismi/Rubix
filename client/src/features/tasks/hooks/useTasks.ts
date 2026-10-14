import { useEffect, useState } from "react";
import {
  createTask,
  deleteTask as deleteTaskRequest,
  getTasks,
  updateTask as updateTaskRequest,
} from "../api/tasksApi";
import type { NewTaskInput, Task } from "../types";
import { getDefaultDueDate } from "../utils/date";

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

  if (taskInput.description) {
    nextTask.description = taskInput.description;
  }

  return nextTask;
}

function replaceTask(tasks: Task[], updatedTask: Task) {
  return tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const { activeTasks, completedTasks } = splitTasks(tasks);

  useEffect(() => {
    getTasks()
      .then((serverTasks) => {
        setTasks(serverTasks);
        setTaskError(null);
      })
      .catch(() => {
        setTaskError("Could not load tasks from the server.");
      })
      .finally(() => {
        setIsLoadingTasks(false);
      });
  }, []);

  async function addTask(taskInput: NewTaskInput) {
    try {
      const createdTask = await createTask(buildTaskInput(taskInput));

      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setIsAddingTask(false);
      setSelectedTaskId(createdTask.id);
      setTaskError(null);
    } catch {
      setTaskError("Could not add task.");
    }
  }

  async function deleteTask(taskId: number) {
    try {
      await deleteTaskRequest(taskId);
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );

      if (editingTaskId === taskId) {
        setEditingTaskId(null);
      }

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }

      setTaskError(null);
    } catch {
      setTaskError("Could not delete task.");
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

  function clearSelectedTask() {
    setSelectedTaskId(null);
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

  return {
    activeTasks,
    completedTasks,
    editingTaskId,
    isAddingTask,
    isLoadingTasks,
    selectedTaskId,
    taskError,
    addTask,
    cancelAddTask,
    cancelEditingTask,
    clearSelectedTask,
    deleteTask,
    selectTask,
    startEditingTask,
    toggleAddTask,
    toggleTaskCompleted,
    updateTask,
  };
}
