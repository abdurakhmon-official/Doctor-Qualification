/*
  Warnings:

  - You are about to drop the column `text` on the `certificate_templates` table. All the data in the column will be lost.
  - Added the required column `body_text` to the `certificate_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand` to the `certificate_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtitle` to the `certificate_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `certificate_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "certificate_templates" DROP COLUMN "text",
ADD COLUMN     "body_text" JSONB NOT NULL,
ADD COLUMN     "brand" JSONB NOT NULL,
ADD COLUMN     "subtitle" JSONB NOT NULL,
ADD COLUMN     "title" JSONB NOT NULL;
