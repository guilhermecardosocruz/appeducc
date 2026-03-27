-- CreateTable
CREATE TABLE "GroupContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT,
    "methodology" TEXT,
    "resources" TEXT,
    "bncc" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupContent" ADD CONSTRAINT "GroupContent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
