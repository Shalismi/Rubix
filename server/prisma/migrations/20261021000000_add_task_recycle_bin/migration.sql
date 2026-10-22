ALTER TABLE "tasks" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "tasks_deleted_at_idx" ON "tasks"("deleted_at");
