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

describe("Admin — Référentiels", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("liste les communes pour un ADMIN", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/communes")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("crée une commune et journalise", async () => {
    const token = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const name = `Commune test ${Date.now()}`;
    const created = await request(app)
      .post("/api/v1/admin/communes")
      .set("Authorization", `Bearer ${token}`)
      .send({ name });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe(name);

    const audit = await prisma.adminAction.findFirst({
      where: {
        action: "CREATE_COMMUNE",
        targetId: created.body.id,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeTruthy();

    await prisma.commune.delete({ where: { id: created.body.id } });
  });

  it("CRUD motifs de rejet", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const created = await request(app)
      .post("/api/v1/admin/rejection-reasons")
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Contenu inapproprié (test)", code: `test_${Date.now()}` });
    expect(created.status).toBe(201);

    const list = await request(app)
      .get("/api/v1/admin/rejection-reasons")
      .set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((r: { id: string }) => r.id === created.body.id)).toBe(
      true
    );

    const updated = await request(app)
      .patch(`/api/v1/admin/rejection-reasons/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isActive: false });
    expect(updated.status).toBe(200);
    expect(updated.body.isActive).toBe(false);

    await prisma.rejectionReason.delete({ where: { id: created.body.id } });
  });

  it("filtre les catégories par parentId", async () => {
    const token = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const response = await request(app)
      .get("/api/v1/admin/categories?parentId=null")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(
      response.body.data.every((c: { parentId: string | null }) => c.parentId === null)
    ).toBe(true);
  });
});
