-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "specialty_id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "question_ids" TEXT[],
    "duration_minutes" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "week_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_entries" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "answers" JSONB,
    "score" INTEGER,
    "correct_count" INTEGER,
    "time_spent_seconds" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "competition_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competitions_starts_at_ends_at_idx" ON "competitions"("starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "competitions_week_key_specialty_id_key" ON "competitions"("week_key", "specialty_id");

-- CreateIndex
CREATE INDEX "competition_entries_competition_id_score_time_spent_seconds_idx" ON "competition_entries"("competition_id", "score", "time_spent_seconds");

-- CreateIndex
CREATE INDEX "competition_entries_user_id_idx" ON "competition_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "competition_entries_competition_id_user_id_key" ON "competition_entries"("competition_id", "user_id");

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
