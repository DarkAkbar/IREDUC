-- Métadonnées d'appareil pour la gestion des sessions
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "deviceName" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);
