import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

const app = createApp();

async function loginAs(identifier: string, password: string) {
  const response = await request(app).post("/api/v1/auth/login").send({
    identifier,
    password,
  });
  expect(response.status).toBe(200);
  return response.body.accessToken as string;
}

describe("Admin — Équipe et sécurité", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /admin/me/profile pour un ADMIN", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/me/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.systemRole).toBe("ADMIN");
  });

  it("journalise les connexions dans auth-events", async () => {
    await loginAs("admin@ireduc.cd", "Admin123!");
    const superToken = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const events = await request(app)
      .get("/api/v1/admin/auth-events")
      .set("Authorization", `Bearer ${superToken}`);
    expect(events.status).toBe(200);
    expect(events.body.data.some((e: { eventType: string }) => e.eventType === "LOGIN")).toBe(
      true
    );
  });

  it("export audit CSV", async () => {
    const token = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const response = await request(app)
      .get("/api/v1/admin/audit-log/export.csv")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.text).toContain("id,admin,action");
  });
});
