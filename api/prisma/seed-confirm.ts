import readline from "readline";
import { getDatabaseName, maskDatabaseUrl } from "../src/utils/databaseName";

/**
 * Affiche la base cible et demande confirmation avant TRUNCATE.
 * Passez SEED_FORCE=1 pour contourner (CI / automatisation).
 */
export async function confirmSeedTruncate(actionLabel: string): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    throw new Error("DATABASE_URL est requis pour le seed.");
  }

  const dbName = getDatabaseName(url);
  console.log(`\n→ Action : ${actionLabel}`);
  console.log(`→ Base cible : ${dbName}`);
  console.log(`→ URL (masquée) : ${maskDatabaseUrl(url)}\n`);

  if (dbName === "ireduc_test" && process.env.SEED_FORCE !== "1") {
    throw new Error(
      "Refus : seed sur ireduc_test uniquement avec SEED_FORCE=1 (Vitest)."
    );
  }

  if (process.env.SEED_FORCE === "1") {
    console.log("SEED_FORCE=1 — confirmation automatique.\n");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(
      `Confirmer le VIDAGE des tables sur « ${dbName} » ? Tapez oui : `,
      (value) => {
        rl.close();
        resolve(value.trim().toLowerCase());
      }
    );
  });

  if (answer !== "oui") {
    console.log("Seed annulé.");
    process.exit(0);
  }
}
