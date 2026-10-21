import { Router } from "express";
import { Prisma, type Tag } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import type { ApiTag, TagInput } from "./tagTypes.js";
import { buildTagData, parseTagId } from "./tagValidation.js";

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

tagRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const tags = await prisma.tag.findMany({
      where: { userId: req.auth!.user.id },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });

    res.json({ tags: tags.map(serializeTag) });
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
      const tag = await prisma.tag.create({
        data: {
          ...tagData.data,
          userId: req.auth!.user.id,
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
