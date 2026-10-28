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

describe("Admin — Utilisateurs enrichis", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /admin/users/:id inclut activité et sessions", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const user = await prisma.user.findFirst({
      where: { systemRole: "USER" },
    });
    expect(user).toBeTruthy();

    const response = await request(app)
      .get(`/api/v1/admin/users/${user!.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.activity).toBeTruthy();
    expect(Array.isArray(response.body.sessions)).toBe(true);
  });

  it("force-logout et reset-password (SUPER_ADMIN)", async () => {
    const adminToken = await loginAs("admin@ireduc.cd", "Admin123!");
    const superToken = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const user = await prisma.user.findFirst({
      where: { email: "jean.mukendi@example.com" },
    });
    expect(user).toBeTruthy();

    const logout = await request(app)
      .post(`/api/v1/admin/users/${user!.id}/force-logout`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(logout.status).toBe(200);

    const resetDenied = await request(app)
      .post(`/api/v1/admin/users/${user!.id}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(resetDenied.status).toBe(403);

    const reset = await request(app)
      .post(`/api/v1/admin/users/${user!.id}/reset-password`)
      .set("Authorization", `Bearer ${superToken}`);
    expect(reset.status).toBe(200);
    expect(reset.body.temporaryPassword).toMatch(/^Ir\d{6}!$/);
  });

  it("export CSV", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/users/export.csv")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.text).toContain("id,nom,email");
  });
});
