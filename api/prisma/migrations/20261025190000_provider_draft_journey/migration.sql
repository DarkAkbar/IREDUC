-- Étape 1 : ajouter DRAFT (doit être commitée avant usage en DEFAULT)
DO $$ BEGIN
  ALTER TYPE "ReviewStatus" ADD VALUE 'DRAFT';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProviderEventType" AS ENUM (
    'CREATED',
    'SUBMITTED',
    'UNDER_REVIEW',
    'COMPLEMENT_REQUESTED',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
