CREATE TABLE "streak_days" (
    "user_id" INTEGER NOT NULL,
    "activity_date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_days_pkey" PRIMARY KEY ("user_id", "activity_date")
);

ALTER TABLE "streak_days"
ADD CONSTRAINT "streak_days_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
