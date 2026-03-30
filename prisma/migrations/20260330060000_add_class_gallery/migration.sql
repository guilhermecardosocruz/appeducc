-- CreateTable
CREATE TABLE "ClassGalleryImage" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassGalleryImage_objectKey_key" ON "ClassGalleryImage"("objectKey");

-- CreateIndex
CREATE INDEX "ClassGalleryImage_classId_createdAt_idx" ON "ClassGalleryImage"("classId", "createdAt");

-- CreateIndex
CREATE INDEX "ClassGalleryImage_uploadedById_createdAt_idx" ON "ClassGalleryImage"("uploadedById", "createdAt");

-- AddForeignKey
ALTER TABLE "ClassGalleryImage" ADD CONSTRAINT "ClassGalleryImage_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassGalleryImage" ADD CONSTRAINT "ClassGalleryImage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

