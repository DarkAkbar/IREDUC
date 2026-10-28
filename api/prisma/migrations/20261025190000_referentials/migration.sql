-- AlterTable
ALTER TABLE "Commune" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Neighborhood" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "RejectionReason" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RejectionReason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RejectionReason_code_key" ON "RejectionReason"("code");

-- CreateIndex
CREATE INDEX "RejectionReason_isActive_idx" ON "RejectionReason"("isActive");

-- CreateIndex
CREATE INDEX "RejectionReason_sortOrder_idx" ON "RejectionReason"("sortOrder");

-- CreateIndex
CREATE INDEX "Commune_isActive_idx" ON "Commune"("isActive");

-- CreateIndex
CREATE INDEX "Neighborhood_isActive_idx" ON "Neighborhood"("isActive");
