-- DropForeignKey
ALTER TABLE "GroupContent" DROP CONSTRAINT "GroupContent_groupId_fkey";

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "sourceContentPlanId" TEXT,
ADD COLUMN     "sourceContentPlanLessonId" TEXT;

-- CreateTable
CREATE TABLE "ContentPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPlanLesson" (
    "id" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT,
    "methodology" TEXT,
    "resources" TEXT,
    "bncc" TEXT,
    "contentPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPlanLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPlanClass" (
    "id" TEXT NOT NULL,
    "contentPlanId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LINKED',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPlanClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentPlanLesson_contentPlanId_orderIndex_key" ON "ContentPlanLesson"("contentPlanId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPlanClass_contentPlanId_classId_key" ON "ContentPlanClass"("contentPlanId", "classId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_sourceContentPlanId_fkey" FOREIGN KEY ("sourceContentPlanId") REFERENCES "ContentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_sourceContentPlanLessonId_fkey" FOREIGN KEY ("sourceContentPlanLessonId") REFERENCES "ContentPlanLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupContent" ADD CONSTRAINT "GroupContent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPlanLesson" ADD CONSTRAINT "ContentPlanLesson_contentPlanId_fkey" FOREIGN KEY ("contentPlanId") REFERENCES "ContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPlanClass" ADD CONSTRAINT "ContentPlanClass_contentPlanId_fkey" FOREIGN KEY ("contentPlanId") REFERENCES "ContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPlanClass" ADD CONSTRAINT "ContentPlanClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
