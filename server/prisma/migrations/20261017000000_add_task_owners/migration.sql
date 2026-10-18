-- Add the task owner as nullable long enough to preserve existing task data.
ALTER TABLE "tasks" ADD COLUMN "user_id" INTEGER;

-- Existing tasks predate accounts, so give them to the earliest-created user.
UPDATE "tasks"
SET "user_id" = (
    SELECT "id"
    FROM "users"
    ORDER BY "created_at" ASC, "id" ASC
    LIMIT 1
);

ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL;

CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
