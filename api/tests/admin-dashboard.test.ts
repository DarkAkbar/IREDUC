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

describe("Admin — Dashboard", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /admin/stats avec période", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .get("/api/v1/admin/stats")
      .query({ from: "2020-01-01", to: "2030-12-31" })
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.moderation).toBeTruthy();
    expect(response.body.properties.byCommune).toBeTruthy();
    expect(response.body.period.from).toBeTruthy();
  });
});
