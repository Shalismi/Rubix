import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { serializeTask } from "./taskSerializer.js";
import type { TaskInput } from "./taskTypes.js";
import { purgeExpiredTasks } from "./trashService.js";
import {
  buildTaskCreateData,
  buildTaskUpdateData,
  parseTaskId,
} from "./taskValidation.js";

export const taskRouter = Router();

const tagsInclude = {
  taskTags: {
    include: { tag: true },
    orderBy: { tag: { name: "asc" as const } },
  },
};

async function userOwnsTags(userId: number, tagIds: number[]) {
  if (tagIds.length === 0) {
    return true;
  }

  const ownedTagCount = await prisma.tag.count({
    where: { id: { in: tagIds }, userId },
  });

  return ownedTagCount === tagIds.length;
}

taskRouter.use(requireAuth);

taskRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tasks = await prisma.task.findMany({
      where: { userId: req.auth!.user.id, deletedAt: null },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { id: "desc" }],
      include: tagsInclude,
    });

    res.json({ tasks: tasks.map(serializeTask) });
  }),
);

taskRouter.get(
  "/trash",
  asyncHandler(async (req, res) => {
    await purgeExpiredTasks();

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.auth!.user.id,
        deletedAt: { not: null },
      },
      orderBy: [{ deletedAt: "desc" }, { id: "desc" }],
      include: tagsInclude,
    });

    res.json({ tasks: tasks.map(serializeTask) });
  }),
);

taskRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const taskData = buildTaskCreateData(req.body as TaskInput);

    if ("error" in taskData) {
      res.status(400).json({ message: taskData.error });
      return;
    }

    const { tagIds, ...taskFields } = taskData.data;

    if (!(await userOwnsTags(req.auth!.user.id, tagIds))) {
      res.status(400).json({ message: "One or more tags are not available." });
      return;
    }

    const task = await prisma.task.create({
      data: {
        ...taskFields,
        userId: req.auth!.user.id,
        taskTags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: tagsInclude,
    });

    res.status(201).json({ task: serializeTask(task) });
  }),
);

taskRouter.patch(
  "/:id/restore",
  asyncHandler(async (req, res) => {
    await purgeExpiredTasks();

    const taskId = parseTaskId(req.params.id);

    if (taskId === null) {
      res.status(400).json({ message: "Task id must be a number." });
      return;
    }

    const deletedTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.auth!.user.id,
        deletedAt: { not: null },
      },
    });

    if (!deletedTask) {
      res.status(404).json({ message: "Deleted task not found." });
      return;
    }

    const restoredTask = await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: null },
      include: tagsInclude,
    });

    res.json({ task: serializeTask(restoredTask) });
  }),
);

taskRouter.delete(
  "/:id/permanent",
  asyncHandler(async (req, res) => {
    const taskId = parseTaskId(req.params.id);

    if (taskId === null) {
      res.status(400).json({ message: "Task id must be a number." });
      return;
    }

    const deletedTasks = await prisma.task.deleteMany({
      where: {
        id: taskId,
        userId: req.auth!.user.id,
        deletedAt: { not: null },
      },
    });

    if (deletedTasks.count === 0) {
      res.status(404).json({ message: "Deleted task not found." });
      return;
    }

    res.status(204).send();
  }),
);

taskRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const taskId = parseTaskId(req.params.id);

    if (taskId === null) {
      res.status(400).json({ message: "Task id must be a number." });
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.auth!.user.id,
        deletedAt: null,
      },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found." });
      return;
    }

    const updateData = buildTaskUpdateData(req.body as TaskInput);

    if ("error" in updateData) {
      res.status(400).json({ message: updateData.error });
      return;
    }

    const { tagIds, ...taskFields } = updateData.data;

    if (tagIds && !(await userOwnsTags(req.auth!.user.id, tagIds))) {
      res.status(400).json({ message: "One or more tags are not available." });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...taskFields,
        ...(tagIds
          ? {
              taskTags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: tagsInclude,
    });

    res.json({ task: serializeTask(updatedTask) });
  }),
);

taskRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const taskId = parseTaskId(req.params.id);

    if (taskId === null) {
      res.status(400).json({ message: "Task id must be a number." });
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.auth!.user.id,
        deletedAt: null,
      },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found." });
      return;
    }

    const deletedTask = await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
      include: tagsInclude,
    });

    res.json({ task: serializeTask(deletedTask) });
  }),
);
