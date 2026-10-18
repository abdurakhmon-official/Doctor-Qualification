-- CreateEnum
CREATE TYPE "ANALYSIS_KIND" AS ENUM ('EXAM', 'PRACTICE', 'COMPETITION');

-- CreateTable
CREATE TABLE "attempt_analyses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "ANALYSIS_KIND" NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attempt_analyses_user_id_created_at_idx" ON "attempt_analyses"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_analyses_kind_attempt_id_locale_key" ON "attempt_analyses"("kind", "attempt_id", "locale");

-- AddForeignKey
ALTER TABLE "attempt_analyses" ADD CONSTRAINT "attempt_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
