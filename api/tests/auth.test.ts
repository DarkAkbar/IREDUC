import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

const app = createApp();
const suffix = Date.now();
const testPhone = `+24385${String(suffix).slice(-7)}`;
const testEmail = `auth.test.${suffix}@example.com`;
const testPassword = "Password123!";

describe("Authentification IREDUC", () => {
  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { phone: testPhone } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.userToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it("inscrit un nouvel utilisateur", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "Test Auth User",
      phone: testPhone,
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(201);
    expect(response.body.user.phone).toBe(testPhone);
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.accessToken).toBeTruthy();
  });

  it("refuse la connexion avec un mauvais mot de passe", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: testPhone,
      password: "WrongPass1",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("connecte un utilisateur avec de bons identifiants", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
    expect(response.body.user.phone).toBe(testPhone);
  });

  it("rafraîchit le jeton avec rotation", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({
      identifier: testPhone,
      password: testPassword,
    });

    const oldRefresh = login.body.refreshToken as string;
    const refresh = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: oldRefresh });

    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
    expect(refresh.body.refreshToken).toBeTruthy();
    expect(refresh.body.refreshToken).not.toBe(oldRefresh);

    const reuse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: oldRefresh });
    expect(reuse.status).toBe(401);
  });

  it("refuse une route protégée sans jeton", async () => {
    const response = await request(app).get("/api/v1/users/me");
    expect(response.status).toBe(401);
    expect(response.body.code).toBe("UNAUTHORIZED");
  });

  it("refuse une route admin à un utilisateur simple (403)", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({
      identifier: "jean.mukendi@example.com",
      password: "Password123!",
    });

    expect(login.status).toBe(200);

    const response = await request(app)
      .get("/api/v1/admin/ping")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FORBIDDEN");
  });
});
