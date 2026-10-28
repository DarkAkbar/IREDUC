import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { ensureDefaultSettings } from "../src/modules/admin/admin.settings.service";

const app = createApp();

async function loginAs(identifier: string, password: string) {
  const response = await request(app).post("/api/v1/auth/login").send({
    identifier,
    password,
  });
  expect(response.status).toBe(200);
  return response.body.accessToken as string;
}

describe("Admin — Paramètres", () => {
  beforeAll(async () => {
    await ensureDefaultSettings();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /config expose les valeurs Setting", async () => {
    const response = await request(app).get("/api/v1/config");
    expect(response.status).toBe(200);
    expect(response.body.platformName).toBeTruthy();
    expect(response.body.supportWhatsapp).toBeTruthy();
    expect(response.body.legal?.termsUrl).toBeTruthy();
    expect(typeof response.body.maintenanceMode).toBe("boolean");
  });

  it("liste les paramètres pour un ADMIN", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(6);
  });

  it("refuse la modification à un ADMIN simple", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .patch("/api/v1/admin/settings/general")
      .set("Authorization", `Bearer ${token}`)
      .send({
        value: {
          platformName: "Hack",
          slogan: "x",
          logoUrl: null,
          defaultCurrency: "USD",
          launchCity: "Kinshasa",
          supportWhatsapp: "+243810000000",
          contactEmail: "a@b.cd",
        },
      });
    expect(response.status).toBe(403);
  });

  it("autorise le SUPER_ADMIN à modifier et journalise", async () => {
    const token = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const current = await request(app)
      .get("/api/v1/admin/settings/general")
      .set("Authorization", `Bearer ${token}`);
    expect(current.status).toBe(200);

    const nextValue = {
      ...(current.body.value as Record<string, unknown>),
      slogan: "Trouvez. Comparez. Réalisez. (test)",
    };

    const patch = await request(app)
      .patch("/api/v1/admin/settings/general")
      .set("Authorization", `Bearer ${token}`)
      .send({ value: nextValue, reason: "Mise à jour slogan test" });
    expect(patch.status).toBe(200);
    expect(patch.body.value.slogan).toContain("test");

    const history = await request(app)
      .get("/api/v1/admin/settings/general/history")
      .set("Authorization", `Bearer ${token}`);
    expect(history.status).toBe(200);
    expect(history.body.data.length).toBeGreaterThan(0);
    expect(history.body.data[0].action).toBe("UPDATE_SETTING");

    const config = await request(app).get("/api/v1/config");
    expect(config.body.slogan).toContain("test");
  });
});
