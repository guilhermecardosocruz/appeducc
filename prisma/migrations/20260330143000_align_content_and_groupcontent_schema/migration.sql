-- Align schema drift between prisma/schema.prisma and database

-- Add missing column Content.isCustomized
ALTER TABLE "Content"
ADD COLUMN IF NOT EXISTS "isCustomized" BOOLEAN NOT NULL DEFAULT false;

-- Add missing column GroupContent.description
ALTER TABLE "GroupContent"
ADD COLUMN IF NOT EXISTS "description" TEXT;
