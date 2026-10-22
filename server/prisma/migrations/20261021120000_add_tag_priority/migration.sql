ALTER TABLE "users"
ADD COLUMN "tag_priority_enabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "tags"
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

WITH ranked_tags AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "user_id"
      ORDER BY "created_at" ASC, "id" ASC
    ) - 1 AS "position"
  FROM "tags"
)
UPDATE "tags"
SET "sort_order" = ranked_tags."position"::INTEGER
FROM ranked_tags
WHERE "tags"."id" = ranked_tags."id";

CREATE INDEX "tags_user_id_sort_order_idx"
ON "tags"("user_id", "sort_order");
