import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import {
  LOGIN_ATTEMPT_LIMIT,
  resetLoginAttemptsForTests,
} from "../src/utils/loginAttempts";
import {
  normalizePhone,
  phoneDigitsForWhatsApp,
} from "../src/utils/phone";

const app = createApp();
const suffix = Date.now();
const createdPhones: string[] = [];

describe("Téléphone comme identifiant", () => {
  beforeEach(() => {
    resetLoginAttemptsForTests();
  });

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

  it("normalise plusieurs formats vers E.164 CD", () => {
    expect(normalizePhone("0812345678")).toBe("+243812345678");
    expect(normalizePhone("812345678")).toBe("+243812345678");
    expect(normalizePhone("+243 812 345 678")).toBe("+243812345678");
    expect(normalizePhone("00243812345678")).toBe("+243812345678");
  });

  it("refuse un numéro invalide", () => {
    expect(() => normalizePhone("123")).toThrow(/invalide/i);
  });

  it("construit un lien WhatsApp sans « + »", () => {
    expect(phoneDigitsForWhatsApp("+243812345678")).toBe("243812345678");
  });

  it("inscrit sans e-mail et connecte immédiatement", async () => {
    const phone = `+24381${String(suffix).slice(-7)}`;
    createdPhones.push(phone);

    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "Sans Email",
      phone: `0${phone.slice(4)}`,
      password: "Test12345",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.phone).toBe(phone);
    expect(response.body.user.email).toBeNull();
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  });

  it("refuse un numéro déjà utilisé sous un autre format", async () => {
    const phone = `+24382${String(suffix).slice(-7)}`;
    createdPhones.push(phone);

    await request(app).post("/api/v1/auth/register").send({
      fullName: "Premier",
      phone,
      password: "Test12345",
    });

    const duplicate = await request(app).post("/api/v1/auth/register").send({
      fullName: "Second",
      phone: `0${phone.slice(4)}`,
      password: "Test12345",
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe("PHONE_TAKEN");
    expect(duplicate.body.message).toBe("Ce numéro est déjà utilisé");
  });

  it("connecte par numéro et par e-mail", async () => {
    const phone = `+24399${String(suffix).slice(-7)}`;
    const email = `phone.auth.${suffix}@example.com`;
    createdPhones.push(phone);

    await request(app).post("/api/v1/auth/register").send({
      fullName: "Dual Login",
      phone,
      email,
      password: "Test12345",
    });

    const byPhone = await request(app).post("/api/v1/auth/login").send({
      identifier: phone,
      password: "Test12345",
    });
    expect(byPhone.status).toBe(200);
    expect(byPhone.body.accessToken).toBeTruthy();

    const byEmail = await request(app).post("/api/v1/auth/login").send({
      identifier: email,
      password: "Test12345",
    });
    expect(byEmail.status).toBe(200);
  });

  it("renvoie le même message pour compte inexistant et mauvais mot de passe", async () => {
    const phone = `+24377${String(suffix).slice(-7)}`;
    createdPhones.push(phone);

    await request(app).post("/api/v1/auth/register").send({
      fullName: "Msg User",
      phone,
      password: "Test12345",
    });

    const unknown = await request(app).post("/api/v1/auth/login").send({
      identifier: "+243700000099",
      password: "Test12345",
    });
    const wrong = await request(app).post("/api/v1/auth/login").send({
      identifier: phone,
      password: "WrongPass1",
    });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.message).toBe(wrong.body.message);
    expect(unknown.body.message).toBe("Identifiant ou mot de passe incorrect");
  });

  it("bloque après 5 échecs sur le même numéro", async () => {
    const phone = `+24366${String(suffix).slice(-7)}`;
    createdPhones.push(phone);

    await request(app).post("/api/v1/auth/register").send({
      fullName: "Lock User",
      phone,
      password: "Test12345",
    });

    for (let i = 0; i < LOGIN_ATTEMPT_LIMIT; i += 1) {
      const fail = await request(app).post("/api/v1/auth/login").send({
        identifier: phone,
        password: "WrongPass1",
      });
      expect(fail.status).toBe(401);
    }

    const blocked = await request(app).post("/api/v1/auth/login").send({
      identifier: phone,
      password: "Test12345",
    });
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe("RATE_LIMITED");
  });
});
