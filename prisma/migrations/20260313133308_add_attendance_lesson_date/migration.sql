/*
  Warnings:

  - Added the required column `lessonDate` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "lessonDate" TIMESTAMP(3) NOT NULL;
