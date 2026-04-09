/*
  Warnings:

  - You are about to drop the column `sourceContentPlanId` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `sourceContentPlanLessonId` on the `Content` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_sourceContentPlanId_fkey";

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_sourceContentPlanLessonId_fkey";

-- DropIndex
DROP INDEX "ClassGalleryImage_classId_createdAt_idx";

-- DropIndex
DROP INDEX "ClassGalleryImage_uploadedById_createdAt_idx";

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "sourceContentPlanId",
DROP COLUMN "sourceContentPlanLessonId";

-- CreateTable
CREATE TABLE "DeletedStudentArchive" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3),
    "exitDate" TIMESTAMP(3) NOT NULL,
    "attendancePercentage" DOUBLE PRECISION,
    "exitReason" TEXT,
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedStudentArchive_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeletedStudentArchive" ADD CONSTRAINT "DeletedStudentArchive_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletedStudentArchive" ADD CONSTRAINT "DeletedStudentArchive_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
