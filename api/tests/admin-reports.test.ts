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

describe("Admin — Signalements", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("POST /reports crée un signalement authentifié", async () => {
    const token = await loginAs("jean.mukendi@example.com", "Password123!");
    const property = await prisma.property.findFirst({
      where: { status: "APPROVED" },
    });
    expect(property).toBeTruthy();

    const created = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        targetType: "PROPERTY",
        targetId: property!.id,
        reason: "Test signalement annonce",
      });
    expect(created.status).toBe(201);

    await prisma.report.delete({ where: { id: created.body.id } });
  });

  it("liste et modère les signalements en admin", async () => {
    const userToken = await loginAs("jean.mukendi@example.com", "Password123!");
    const adminToken = await loginAs("admin@ireduc.cd", "Admin123!");
    const property = await prisma.property.findFirst({
      where: { status: "APPROVED" },
    });
    expect(property).toBeTruthy();

    const created = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        targetType: "PROPERTY",
        targetId: property!.id,
        reason: "Modération test admin",
      });
    expect(created.status).toBe(201);

    const list = await request(app)
      .get("/api/v1/admin/reports")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);

    const patched = await request(app)
      .patch(`/api/v1/admin/reports/${created.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "dismiss", adminNote: "Test classé" });
    expect(patched.status).toBe(200);
    expect(patched.body.status).toBe("DISMISSED");

    const audit = await prisma.adminAction.findFirst({
      where: { action: "UPDATE_REPORT", targetId: created.body.id },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeTruthy();

    await prisma.report.delete({ where: { id: created.body.id } });
  });
});
