import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

const app = createApp();
const suffix = Date.now();
const basePhone = `+24381${String(suffix).slice(-7)}`;

describe("Inscription téléphone", () => {
  const createdPhones: string[] = [];

  afterAll(async () => {
    for (const phone of createdPhones) {
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) continue;
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.userToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it("inscrit avec un mot de passe valide", async () => {
    const phone = `${basePhone.slice(0, -1)}1`;
    createdPhones.push(phone);

    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "Utilisateur Valide",
      phone,
      password: "Test12345",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.phone).toBe(phone);
    expect(response.body.accessToken).toBeTruthy();
  });

  it("refuse un numéro déjà utilisé", async () => {
    const phone = `${basePhone.slice(0, -1)}2`;
    createdPhones.push(phone);

    await request(app).post("/api/v1/auth/register").send({
      fullName: "Premier",
      phone,
      password: "Test12345",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "Second",
      phone,
      password: "Test12345",
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("PHONE_TAKEN");
  });

  it("refuse un mot de passe faible", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "Faible",
      phone: `${basePhone.slice(0, -1)}3`,
      password: "TestTest",
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
