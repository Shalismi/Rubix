CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_tags" (
    "task_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "task_tags_pkey" PRIMARY KEY ("task_id", "tag_id")
);

CREATE UNIQUE INDEX "tags_user_id_normalized_name_key"
ON "tags"("user_id", "normalized_name");

CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");
CREATE INDEX "task_tags_tag_id_idx" ON "task_tags"("tag_id");

ALTER TABLE "tags"
ADD CONSTRAINT "tags_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_tags"
ADD CONSTRAINT "task_tags_task_id_fkey"
FOREIGN KEY ("task_id") REFERENCES "tasks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_tags"
ADD CONSTRAINT "task_tags_tag_id_fkey"
FOREIGN KEY ("tag_id") REFERENCES "tags"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
