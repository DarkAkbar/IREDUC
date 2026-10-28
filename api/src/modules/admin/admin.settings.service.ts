import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { badRequest, notFound } from "../../utils/errors";
import { logAdminAction } from "./admin.shared";
import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  type SettingKey,
} from "./admin.settings.defaults";

type CacheEntry = { value: unknown; loadedAt: number };

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

function isSettingKey(key: string): key is SettingKey {
  return (SETTING_KEYS as readonly string[]).includes(key);
}

export function invalidateSettingsCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

export async function ensureDefaultSettings() {
  for (const key of SETTING_KEYS) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.setting.create({
        data: {
          key,
          value: DEFAULT_SETTINGS[key] as Prisma.InputJsonValue,
        },
      });
    }
  }
}

async function readSetting(key: SettingKey): Promise<unknown> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  let row = await prisma.setting.findUnique({ where: { key } });
  if (!row) {
    row = await prisma.setting.create({
      data: {
        key,
        value: DEFAULT_SETTINGS[key] as Prisma.InputJsonValue,
      },
    });
  }

  cache.set(key, { value: row.value, loadedAt: Date.now() });
  return row.value;
}

export async function getSetting(key: string) {
  if (!isSettingKey(key)) throw notFound("Paramètre introuvable");
  const value = await readSetting(key);
  return { key, value };
}

export async function listSettings() {
  await ensureDefaultSettings();
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
    orderBy: { key: "asc" },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return SETTING_KEYS.map((key) => ({
    key,
    value: byKey[key] ?? DEFAULT_SETTINGS[key],
  }));
}

export async function updateSetting(
  adminId: string,
  key: string,
  value: unknown,
  reason?: string | null
) {
  if (!isSettingKey(key)) throw notFound("Paramètre introuvable");
  if (value === undefined || value === null || typeof value !== "object") {
    throw badRequest("La valeur doit être un objet JSON");
  }

  const previous = await readSetting(key);
  const updated = await prisma.setting.upsert({
    where: { key },
    create: {
      key,
      value: value as Prisma.InputJsonValue,
    },
    update: {
      value: value as Prisma.InputJsonValue,
    },
  });

  invalidateSettingsCache(key);

  await logAdminAction(
    adminId,
    "SETTING",
    key,
    "UPDATE_SETTING",
    reason?.trim() ||
      JSON.stringify({ previous, next: updated.value }).slice(0, 2000)
  );

  return { key: updated.key, value: updated.value };
}

export async function getSettingHistory(key: string, page = 1, limit = 20) {
  if (!isSettingKey(key)) throw notFound("Paramètre introuvable");
  const skip = (page - 1) * limit;
  const where = { targetType: "SETTING", targetId: key };

  const [total, data] = await Promise.all([
    prisma.adminAction.count({ where }),
    prisma.adminAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        admin: { select: { id: true, fullName: true, email: true } },
      },
    }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/** Lecture typée pour GET /config et autres services. */
export async function getCachedSettingObject<T extends Record<string, unknown>>(
  key: SettingKey
): Promise<T> {
  const value = await readSetting(key);
  return value as T;
}
