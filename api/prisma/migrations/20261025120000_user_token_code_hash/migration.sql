-- AlterTable
ALTER TABLE "UserToken" ADD COLUMN "codeHash" TEXT;

-- CreateIndex
CREATE INDEX "UserToken_codeHash_idx" ON "UserToken"("codeHash");
