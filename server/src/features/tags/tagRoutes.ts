import { Router } from "express";
import { Prisma, type Tag } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import type {
  ApiTag,
  TagInput,
  TagOrderInput,
  TagPriorityInput,
} from "./tagTypes.js";
import {
  buildTagData,
  buildTagOrderData,
  buildTagPriorityData,
  parseTagId,
} from "./tagValidation.js";

export const tagRouter = Router();

tagRouter.use(requireAuth);

function serializeTag(tag: Tag): ApiTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function getOrderedTags(userId: number, priorityEnabled: boolean) {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: priorityEnabled
      ? [{ sortOrder: "asc" }, { id: "asc" }]
      : [{ createdAt: "asc" }, { id: "asc" }],
  });
}

tagRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.auth!.user.id;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tagPriorityEnabled: true },
    });
    const tags = await getOrderedTags(userId, user.tagPriorityEnabled);

    res.json({
      tags: tags.map(serializeTag),
      priorityEnabled: user.tagPriorityEnabled,
    });
  }),
);

tagRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const tagData = buildTagData(req.body as TagInput);

    if ("error" in tagData) {
      res.status(400).json({ message: tagData.error });
      return;
    }

    try {
      const highestSortOrder = await prisma.tag.aggregate({
        where: { userId: req.auth!.user.id },
        _max: { sortOrder: true },
      });
      const tag = await prisma.tag.create({
        data: {
          ...tagData.data,
          userId: req.auth!.user.id,
          sortOrder: (highestSortOrder._max.sortOrder ?? -1) + 1,
        },
      });

      res.status(201).json({ tag: serializeTag(tag) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        res.status(409).json({ message: "You already have a tag with that name." });
        return;
      }

      throw error;
    }
  }),
);

tagRouter.patch(
  "/order",
  asyncHandler(async (req, res) => {
    const userId = req.auth!.user.id;
    const orderData = buildTagOrderData(req.body as TagOrderInput);

    if ("error" in orderData) {
      res.status(400).json({ message: orderData.error });
      return;
    }

    const ownedTags = await prisma.tag.findMany({
      where: { userId },
      select: { id: true },
    });
    const ownedTagIds = new Set(ownedTags.map((tag) => tag.id));

    if (
      orderData.data.length !== ownedTags.length ||
      orderData.data.some((tagId) => !ownedTagIds.has(tagId))
    ) {
      res.status(400).json({ message: "Tag order must include all your tags." });
      return;
    }

    await prisma.$transaction(
      orderData.data.map((tagId, sortOrder) =>
        prisma.tag.update({
          where: { id: tagId },
          data: { sortOrder },
        }),
      ),
    );

    const tags = await getOrderedTags(userId, true);
    res.json({ tags: tags.map(serializeTag) });
  }),
);

tagRouter.patch(
  "/priority",
  asyncHandler(async (req, res) => {
    const userId = req.auth!.user.id;
    const priorityData = buildTagPriorityData(req.body as TagPriorityInput);

    if ("error" in priorityData) {
      res.status(400).json({ message: priorityData.error });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { tagPriorityEnabled: priorityData.data },
    });

    const tags = await getOrderedTags(userId, priorityData.data);
    res.json({
      tags: tags.map(serializeTag),
      priorityEnabled: priorityData.data,
    });
  }),
);

tagRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const tagId = parseTagId(req.params.id);

    if (tagId === null) {
      res.status(400).json({ message: "Tag id must be a number." });
      return;
    }

    const existingTag = await prisma.tag.findFirst({
      where: { id: tagId, userId: req.auth!.user.id },
    });

    if (!existingTag) {
      res.status(404).json({ message: "Tag not found." });
      return;
    }

    const tagData = buildTagData(req.body as TagInput);

    if ("error" in tagData) {
      res.status(400).json({ message: tagData.error });
      return;
    }

    try {
      const tag = await prisma.tag.update({
        where: { id: tagId },
        data: tagData.data,
      });

      res.json({ tag: serializeTag(tag) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        res.status(409).json({ message: "You already have a tag with that name." });
        return;
      }

      throw error;
    }
  }),
);

tagRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const tagId = parseTagId(req.params.id);

    if (tagId === null) {
      res.status(400).json({ message: "Tag id must be a number." });
      return;
    }

    const deletedTags = await prisma.tag.deleteMany({
      where: { id: tagId, userId: req.auth!.user.id },
    });

    if (deletedTags.count === 0) {
      res.status(404).json({ message: "Tag not found." });
      return;
    }

    res.status(204).send();
  }),
);
