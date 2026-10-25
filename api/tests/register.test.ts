import { TokenPurpose } from "@prisma/client";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { hashToken } from "../src/utils/crypto";

const app = createApp();
const suffix = Date.now();
const baseEmail = `register.test.${suffix}@example.com`;

describe("Inscription et vérification e-mail", () => {
  const createdEmails: string[] = [];

  afterAll(async () => {
    for (const email of createdEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) continue;
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.userToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it("inscrit un utilisateur avec un mot de passe valide", async () => {
    const email = `ok.${baseEmail}`;
    createdEmails.push(email);

    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "Utilisateur Valide",
      email,
      password: "Test12345",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.emailVerified).toBe(false);
    expect(response.body.emailSent).toBe(true);
    expect(response.body.message).toMatch(/Vérifiez votre e-mail/i);
  });

  it("refuse un e-mail déjà utilisé", async () => {
    const email = `dup.${baseEmail}`;
    createdEmails.push(email);

    await request(app).post("/api/v1/auth/register").send({
      fullName: "Premier",
      email,
      password: "Test12345",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "Second",
      email,
      password: "Test12345",
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("EMAIL_TAKEN");
    expect(response.body.message).toBe(
      "Cette adresse e-mail est déjà utilisée"
    );
  });

  it("refuse un mot de passe faible", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "Faible",
      email: `weak.${baseEmail}`,
      password: "TestTest",
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "password",
          message:
            "Le mot de passe doit contenir au moins 8 caractères et un chiffre",
        }),
      ])
    );
  });

  it("vérifie l'e-mail avec un code correct puis refuse un code incorrect", async () => {
    const email = `code.${baseEmail}`;
    createdEmails.push(email);

    const register = await request(app).post("/api/v1/auth/register").send({
      fullName: "Code User",
      email,
      password: "Test12345",
    });
    expect(register.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const tokenRow = await prisma.userToken.findFirstOrThrow({
      where: {
        userId: user.id,
        purpose: TokenPurpose.VERIFY_EMAIL,
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    // Injecte un code connu pour le test
    const knownCode = "654321";
    await prisma.userToken.update({
      where: { id: tokenRow.id },
      data: { codeHash: hashToken(knownCode) },
    });

    const wrong = await request(app).post("/api/v1/auth/verify-email").send({
      email,
      code: "000000",
    });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe("INVALID_TOKEN");

    const ok = await request(app).post("/api/v1/auth/verify-email").send({
      email,
      code: knownCode,
    });
    expect(ok.status).toBe(200);
    expect(ok.body.message).toMatch(/vérifiée/i);

    const refreshed = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(refreshed.emailVerified).toBe(true);
  });
});
