import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

const app = createApp();

async function loginAs(email: string, password: string) {
  const response = await request(app).post("/api/v1/auth/login").send({
    email,
    password,
  });
  expect(response.status).toBe(200);
  return response.body.accessToken as string;
}

describe("Administration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("refuse l'accès admin à un utilisateur classique", async () => {
    const token = await loginAs("jean.mukendi@example.com", "Password123!");
    const response = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it("retourne les statistiques pour un admin", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.users.total).toBeGreaterThan(0);
    expect(response.body.series.registrationsLast30Days).toHaveLength(30);
    expect(response.body.pendingQueue).toBeTruthy();
  });

  it("liste les utilisateurs avec recherche", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/users")
      .query({ search: "jean", page: 1, limit: 10 })
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("empêche un ADMIN de suspendre un autre ADMIN", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const superAdmin = await prisma.user.findUnique({
      where: { email: "superadmin@ireduc.cd" },
    });
    const response = await request(app)
      .patch(`/api/v1/admin/users/${superAdmin!.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "SUSPENDED", reason: "Tentative non autorisée" });
    expect(response.status).toBe(403);
  });

  it("autorise le SUPER_ADMIN à lister le journal d'audit", async () => {
    const token = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const response = await request(app)
      .get("/api/v1/admin/audit-log")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("refuse le journal d'audit à un ADMIN simple", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/audit-log")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it("met une annonce à la une", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const property = await prisma.property.findFirst({
      where: { status: "APPROVED" },
    });
    expect(property).toBeTruthy();

    const response = await request(app)
      .patch(`/api/v1/admin/properties/${property!.id}/feature`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isFeatured: true });
    expect(response.status).toBe(200);
    expect(response.body.isFeatured).toBe(true);

    await request(app)
      .patch(`/api/v1/admin/properties/${property!.id}/feature`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isFeatured: false });
  });

  it("crée une catégorie en SUPER_ADMIN", async () => {
    const token = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const slug = `test-cat-${Date.now()}`;
    const response = await request(app)
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Catégorie test admin",
        kind: "REAL_ESTATE",
        slug,
        sortOrder: 99,
      });
    expect(response.status).toBe(201);
    expect(response.body.slug).toBe(slug);

    await prisma.category.delete({ where: { id: response.body.id } });
  });
});
