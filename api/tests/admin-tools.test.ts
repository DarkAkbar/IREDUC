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

describe("Admin — Outils", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /admin/search", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/search")
      .query({ q: "Jean" })
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.users)).toBe(true);
  });

  it("GET /admin/system-health", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/system-health")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.api).toBe("ok");
    expect(response.body.version).toBeTruthy();
  });

  it("export CSV partenaires", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/exports/partners.csv")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.text).toContain("id,nom");
  });
});
