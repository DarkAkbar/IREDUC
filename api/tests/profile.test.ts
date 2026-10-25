import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

const app = createApp();
const suffix = Date.now();
const phone = `+24383${String(suffix).slice(-7)}`;
const password = "Test12345";
let accessToken = "";
let refreshToken = "";
let userId = "";

describe("Profil enrichi (summary, sessions, suppression, config)", () => {
  afterAll(async () => {
    if (userId) {
      await prisma.refreshToken.deleteMany({ where: { userId } });
      await prisma.userToken.deleteMany({ where: { userId } });
      await prisma.favorite.deleteMany({ where: { userId } });
      await prisma.alert.deleteMany({ where: { userId } });
      await prisma.notification.deleteMany({ where: { userId } });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
      }
    }
    await prisma.$disconnect();
  });

  it("expose la configuration publique", async () => {
    const response = await request(app).get("/api/v1/config");
    expect(response.status).toBe(200);
    expect(response.body.supportWhatsapp).toMatch(/^\+/);
    expect(response.body.minAppVersion).toBeTruthy();
    expect(response.body.legal.termsUrl).toBeTruthy();
    expect(response.body.legal.privacyUrl).toBeTruthy();
  });

  it("inscrit un utilisateur pour les tests profil", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Device-Name", "Vitest Phone")
      .send({
        fullName: "Profil Test",
        phone,
        password,
        email: `profil.${suffix}@example.com`,
      });

    expect(response.status).toBe(201);
    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
    userId = response.body.user.id;
  });

  it("retourne un résumé de profil", async () => {
    const response = await request(app)
      .get("/api/v1/users/me/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.requests).toBeTruthy();
    expect(response.body.favorites).toBe(0);
    expect(response.body.alerts).toBe(0);
    expect(typeof response.body.unreadMessages).toBe("number");
    expect(typeof response.body.unreadNotifications).toBe("number");
    expect(response.body.partner).toBeNull();
  });

  it("liste les sessions et marque la session courante", async () => {
    const response = await request(app)
      .get("/api/v1/users/me/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Refresh-Token", refreshToken);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.some((s: { isCurrent: boolean }) => s.isCurrent)).toBe(
      true
    );
    expect(response.body.data[0].deviceName).toBeTruthy();
  });

  it("refuse la suppression sans mot de passe correct", async () => {
    const response = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "WrongPass1" });

    expect(response.status).toBe(401);
  });

  it("refuse la suppression d'un SUPER_ADMIN", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({
      identifier: "superadmin@ireduc.cd",
      password: "SuperAdmin123!",
    });
    expect(login.status).toBe(200);

    const response = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .send({ password: "SuperAdmin123!" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("SUPER_ADMIN_DELETE_FORBIDDEN");
  });

  it("anonymise le compte et libère le numéro", async () => {
    const response = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password });

    expect(response.status).toBe(200);

    const anonymized = await prisma.user.findUnique({ where: { id: userId } });
    expect(anonymized?.fullName).toBe("Compte supprimé");
    expect(anonymized?.phone).not.toBe(phone);
    expect(anonymized?.email).toBeNull();
    expect(anonymized?.accountStatus).toBe("SUSPENDED");

    const reuse = await request(app).post("/api/v1/auth/register").send({
      fullName: "Reprend Numero",
      phone,
      password: "Test12345",
    });
    expect(reuse.status).toBe(201);
    userId = reuse.body.user.id;
    accessToken = reuse.body.accessToken;
    refreshToken = reuse.body.refreshToken;
  });
});
