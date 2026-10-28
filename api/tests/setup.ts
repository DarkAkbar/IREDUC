import { execSync } from "child_process";
import { beforeAll } from "vitest";
import { getDatabaseName } from "../src/utils/databaseName";

beforeAll(() => {
  const url = process.env.DATABASE_URL ?? "";
  const dbName = getDatabaseName(url);

  if (dbName !== "ireduc_test") {
    throw new Error(
      `Les tests doivent utiliser la base ireduc_test (actuelle : ${dbName}). Vérifiez api/.env.test.`
    );
  }

  console.log(`[vitest] Migrations sur la base « ${dbName} »…`);
  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  console.log(`[vitest] Seed de base sur « ${dbName} »…`);
  execSync("npx ts-node --transpile-only prisma/seed.ts", {
    cwd: process.cwd(),
    env: { ...process.env, SEED_FORCE: "1" },
    stdio: "inherit",
  });
}, 180000);
