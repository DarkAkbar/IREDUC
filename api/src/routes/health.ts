import { Router } from "express";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { getDatabaseName } from "../utils/databaseName";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * Infos de diagnostic — uniquement hors production.
 * GET /health/info
 */
healthRouter.get("/info", async (_req, res) => {
  if (env.NODE_ENV === "production") {
    res.status(404).json({
      message: "Non disponible en production",
      code: "NOT_FOUND",
    });
    return;
  }

  const rows = await prisma.property.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const propertiesByStatus = Object.fromEntries(
    rows.map((row) => [row.status, row._count._all])
  ) as Record<string, number>;

  res.status(200).json({
    database: getDatabaseName(env.DATABASE_URL),
    apiUrl: env.APP_URL,
    nodeEnv: env.NODE_ENV,
    propertiesByStatus,
    propertiesTotal: rows.reduce((sum, row) => sum + row._count._all, 0),
  });
});
