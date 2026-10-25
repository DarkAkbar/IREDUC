ALTER TABLE "ProviderProfile"
  ADD COLUMN IF NOT EXISTS "reviewNote" TEXT,
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "decidedAt" TIMESTAMP(3);

ALTER TABLE "ProviderProfile" ALTER COLUMN "reviewStatus" SET DEFAULT 'DRAFT';

CREATE TABLE IF NOT EXISTS "ProviderReviewEvent" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "type" "ProviderEventType" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderReviewEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProviderReviewEvent_profileId_idx" ON "ProviderReviewEvent"("profileId");
CREATE INDEX IF NOT EXISTS "ProviderReviewEvent_type_idx" ON "ProviderReviewEvent"("type");
CREATE INDEX IF NOT EXISTS "ProviderReviewEvent_createdAt_idx" ON "ProviderReviewEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ProviderReviewEvent"
    ADD CONSTRAINT "ProviderReviewEvent_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "ProviderProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
