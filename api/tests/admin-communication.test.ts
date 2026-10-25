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

describe("Admin — Communication", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("crée une annonce et alimente l'inbox", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const announcement = await request(app)
      .post("/api/v1/admin/announcements")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Maintenance planifiée",
        body: "Test annonce admin",
        audience: "ALL",
      });
    expect(announcement.status).toBe(201);
    expect(announcement.body.recipients).toBeGreaterThan(0);

    const inbox = await request(app)
      .get("/api/v1/admin/inbox")
      .set("Authorization", `Bearer ${token}`);
    expect(inbox.status).toBe(200);

    const unread = await request(app)
      .get("/api/v1/admin/inbox/unread-count")
      .set("Authorization", `Bearer ${token}`);
    expect(unread.status).toBe(200);
    expect(typeof unread.body.count).toBe("number");
  });
});
