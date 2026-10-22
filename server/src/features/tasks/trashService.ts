import { prisma } from "../../db/prisma.js";

const TRASH_RETENTION_DAYS = 30;
const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function getTrashExpirationCutoff(now = new Date()) {
  return new Date(now.getTime() - TRASH_RETENTION_MS);
}

export async function purgeExpiredTasks() {
  return prisma.task.deleteMany({
    where: {
      deletedAt: { lte: getTrashExpirationCutoff() },
    },
  });
}
