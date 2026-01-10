CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "Hall" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "capacity" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "movieTitle" text NOT NULL,
  "startsAt" timestamptz NOT NULL,
  "durationMinutes" integer NOT NULL,
  "hallId" text NOT NULL REFERENCES "Hall"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "Session_hallId_startsAt_idx" ON "Session"("hallId", "startsAt");

CREATE TABLE IF NOT EXISTS "Booking" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" uuid NOT NULL REFERENCES "Session"("id") ON DELETE CASCADE,
  "fullName" text NOT NULL,
  "tickets" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_sessionId_fullName_key" ON "Booking"("sessionId", "fullName");
CREATE INDEX IF NOT EXISTS "Booking_sessionId_idx" ON "Booking"("sessionId");

INSERT INTO "Hall" ("id", "name", "capacity")
VALUES
  ('hall-1', 'Зал 1', 60),
  ('hall-2', 'Зал 2', 90)
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name",
    "capacity" = EXCLUDED."capacity";

