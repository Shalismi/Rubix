-- AlterTable
ALTER TABLE "users"
ADD COLUMN "email" TEXT,
ADD COLUMN "email_verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
