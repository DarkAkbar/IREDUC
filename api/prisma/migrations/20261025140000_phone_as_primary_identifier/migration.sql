-- Téléphone = identifiant principal ; e-mail facultatif

-- 1) Nouveaux champs
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- 2) Compléter les téléphones manquants (E.164 CD uniques)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) AS n
  FROM "User"
  WHERE phone IS NULL OR BTRIM(phone) = ''
)
UPDATE "User" AS u
SET phone = '+24399' || LPAD((numbered.n)::text, 7, '0')
FROM numbered
WHERE u.id = numbered.id;

-- 3) Normaliser les formats locaux courants 08… / 00243… vers +243…
UPDATE "User"
SET phone = '+243' || SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g') FROM 2)
WHERE phone ~ '^0[89]'
   OR REGEXP_REPLACE(phone, '[^0-9]', '', 'g') ~ '^0[89]';

UPDATE "User"
SET phone = '+' || SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', '', 'g') FROM 3)
WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '00243%';

UPDATE "User"
SET phone = '+' || REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL
  AND phone NOT LIKE '+%'
  AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '243%';

-- 4) phone obligatoire + unique
ALTER TABLE "User" ALTER COLUMN phone SET NOT NULL;

DROP INDEX IF EXISTS "User_phone_key";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- 5) email facultatif (unicité conservée ; plusieurs NULL OK)
ALTER TABLE "User" ALTER COLUMN email DROP NOT NULL;

-- 6) Demandes : e-mail de contact facultatif
ALTER TABLE "Request" ALTER COLUMN email DROP NOT NULL;
