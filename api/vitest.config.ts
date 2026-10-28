import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

// Charge .env.test AVANT tout import de l'app (override de .env)
dotenv.config({
  path: path.resolve(__dirname, ".env.test"),
  override: true,
});

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    hookTimeout: 120000,
    testTimeout: 30000,
  },
});
