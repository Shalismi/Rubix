import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { serializeTask } from "./taskSerializer.js";
import type { TaskInput } from "./taskTypes.js";
import {
  buildTaskCreateData,
  buildTaskUpdateData,
  parseTaskId,
} from "./taskValidation.js";

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tasks = await prisma.task.findMany({
      where: { userId: req.auth!.user.id },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { id: "desc" }],
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

    const task = await prisma.task.create({
      data: {
        ...taskData.data,
        userId: req.auth!.user.id,
      },
    });

    res.status(201).json({ task: serializeTask(task) });
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

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData.data,
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
      },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found." });
      return;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.status(204).send();
  }),
);
