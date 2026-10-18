-- AlterTable
ALTER TABLE "certificate_templates" ADD COLUMN     "accreditation_text" JSONB,
ADD COLUMN     "is_accredited" BOOLEAN NOT NULL DEFAULT false;
