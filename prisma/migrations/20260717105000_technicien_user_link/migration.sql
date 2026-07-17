-- AlterTable
ALTER TABLE "techniciens" ADD COLUMN "user_id" TEXT;

-- Deduplicate empty/duplicate emails before unique constraint
UPDATE "techniciens" t
SET "email" = 'technicien-' || t.id::text || '@placeholder.local'
WHERE t."email" IS NULL
   OR TRIM(t."email") = ''
   OR EXISTS (
     SELECT 1 FROM "techniciens" t2
     WHERE LOWER(TRIM(t2."email")) = LOWER(TRIM(t."email"))
       AND t2.id < t.id
   );

-- CreateIndex
CREATE UNIQUE INDEX "techniciens_user_id_key" ON "techniciens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "techniciens_email_key" ON "techniciens"("email");

-- AddForeignKey
ALTER TABLE "techniciens" ADD CONSTRAINT "techniciens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
