import { DocType, ProviderType, ReviewStatus } from "@prisma/client";
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

describe("Parcours partenaire", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /config expose le délai de traitement des dossiers", async () => {
    const response = await request(app).get("/api/v1/config");
    expect(response.status).toBe(200);
    expect(response.body.partnerReviewSlaHours).toBe(48);
  });

  it("crée un brouillon, refuse la soumission sans pièces, puis soumet et notifie", async () => {
    const unique = `journey${Date.now()}`;
    const phone = `+24389${String(Date.now()).slice(-7)}`;
    const register = await request(app).post("/api/v1/auth/register").send({
      fullName: "Parcours Partner",
      phone,
      email: `${unique}@example.com`,
      password: "Password123!",
    });
    expect([200, 201]).toContain(register.status);

    const token = await loginAs(phone, "Password123!");
    await prisma.user.update({
      where: { phone },
      data: { emailVerified: true, phoneVerified: true },
    });

    const create = await request(app)
      .post("/api/v1/providers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: ProviderType.INDIVIDUAL,
        displayName: "Partenaire Test",
        whatsapp: phone,
        isRegistered: false,
      });
    expect(create.status).toBe(201);
    expect(create.body.reviewStatus).toBe(ReviewStatus.DRAFT);
    expect(Array.isArray(create.body.history)).toBe(true);

    const submitMissing = await request(app)
      .post("/api/v1/providers/me/submit")
      .set("Authorization", `Bearer ${token}`);
    expect(submitMissing.status).toBe(400);
    expect(submitMissing.body.details?.missingDocuments).toContain(DocType.ID);

    const profile = await prisma.providerProfile.findFirst({
      where: { user: { phone } },
    });
    expect(profile).toBeTruthy();

    await prisma.providerDocument.create({
      data: {
        profileId: profile!.id,
        docType: DocType.ID,
        fileUrl: "/uploads/test-id.jpg",
        reviewStatus: ReviewStatus.PENDING,
      },
    });

    const submit = await request(app)
      .post("/api/v1/providers/me/submit")
      .set("Authorization", `Bearer ${token}`);
    expect(submit.status).toBe(200);
    expect(submit.body.reviewStatus).toBe(ReviewStatus.PENDING);
    expect(submit.body.submittedAt).toBeTruthy();

    const notif = await prisma.notification.findFirst({
      where: {
        user: { phone },
        type: "PROVIDER_SUBMITTED",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(notif).toBeTruthy();
    expect((notif!.data as { screen?: string } | null)?.screen).toBe(
      "partner-status"
    );

    const withdraw = await request(app)
      .post("/api/v1/providers/me/withdraw")
      .set("Authorization", `Bearer ${token}`);
    expect(withdraw.status).toBe(200);
    expect(withdraw.body.reviewStatus).toBe(ReviewStatus.DRAFT);

    await prisma.providerDocument.create({
      data: {
        profileId: profile!.id,
        docType: DocType.ID,
        fileUrl: "/uploads/test-id-2.jpg",
        reviewStatus: ReviewStatus.PENDING,
      },
    });

    const resubmit = await request(app)
      .post("/api/v1/providers/me/submit")
      .set("Authorization", `Bearer ${token}`);
    expect(resubmit.status).toBe(200);

    const adminToken = await loginAs("admin@ireduc.cd", "Admin123!");
    const approve = await request(app)
      .patch(`/api/v1/admin/providers/${profile!.id}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "APPROVED" });
    expect(approve.status).toBe(200);

    const me = await request(app)
      .get("/api/v1/providers/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.reviewStatus).toBe(ReviewStatus.APPROVED);
    expect(me.body.decidedAt).toBeTruthy();
    expect(
      me.body.history.some(
        (e: { type: string }) => e.type === "APPROVED"
      )
    ).toBe(true);

    const approvedNotif = await prisma.notification.findFirst({
      where: { user: { phone }, type: "PROVIDER_APPROVED" },
    });
    expect(approvedNotif).toBeTruthy();
  });

  it("demande un complément : reste PENDING avec reviewNote et notification", async () => {
    const phone = `+24388${String(Date.now()).slice(-7)}`;
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Complement User",
      phone,
      email: `comp${Date.now()}@example.com`,
      password: "Password123!",
    });
    const token = await loginAs(phone, "Password123!");
    await prisma.user.update({
      where: { phone },
      data: { emailVerified: true, phoneVerified: true },
    });

    await request(app)
      .post("/api/v1/providers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: ProviderType.INDIVIDUAL,
        displayName: "Comp Test",
        whatsapp: phone,
      });

    const profile = await prisma.providerProfile.findFirstOrThrow({
      where: { user: { phone } },
    });
    await prisma.providerDocument.create({
      data: {
        profileId: profile.id,
        docType: DocType.ID,
        fileUrl: "/uploads/id.jpg",
        reviewStatus: ReviewStatus.PENDING,
      },
    });
    await request(app)
      .post("/api/v1/providers/me/submit")
      .set("Authorization", `Bearer ${token}`);

    const adminToken = await loginAs("admin@ireduc.cd", "Admin123!");
    const complement = await request(app)
      .patch(`/api/v1/admin/providers/${profile.id}/request-complement`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Merci d'ajouter une photo de votre pièce d'identité." });
    expect(complement.status).toBe(200);

    const me = await request(app)
      .get("/api/v1/providers/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.body.reviewStatus).toBe(ReviewStatus.PENDING);
    expect(me.body.reviewNote).toContain("pièce d'identité");
    expect(
      me.body.history.some(
        (e: { type: string }) => e.type === "COMPLEMENT_REQUESTED"
      )
    ).toBe(true);

    const notif = await prisma.notification.findFirst({
      where: { user: { phone }, type: "PROVIDER_COMPLEMENT_REQUESTED" },
    });
    expect(notif).toBeTruthy();
  });

  it("rejette un dossier avec motif et notification", async () => {
    const phone = `+24387${String(Date.now()).slice(-7)}`;
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Reject User",
      phone,
      email: `rej${Date.now()}@example.com`,
      password: "Password123!",
    });
    const token = await loginAs(phone, "Password123!");
    await prisma.user.update({
      where: { phone },
      data: { emailVerified: true, phoneVerified: true },
    });

    await request(app)
      .post("/api/v1/providers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: ProviderType.INDIVIDUAL,
        displayName: "Reject Test",
        whatsapp: phone,
      });
    const profile = await prisma.providerProfile.findFirstOrThrow({
      where: { user: { phone } },
    });
    await prisma.providerDocument.create({
      data: {
        profileId: profile.id,
        docType: DocType.ID,
        fileUrl: "/uploads/id.jpg",
        reviewStatus: ReviewStatus.PENDING,
      },
    });
    await request(app)
      .post("/api/v1/providers/me/submit")
      .set("Authorization", `Bearer ${token}`);

    const adminToken = await loginAs("admin@ireduc.cd", "Admin123!");
    const reject = await request(app)
      .patch(`/api/v1/admin/providers/${profile.id}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "REJECTED", reason: "Documents illisibles" });
    expect(reject.status).toBe(200);

    const me = await request(app)
      .get("/api/v1/providers/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.body.reviewStatus).toBe(ReviewStatus.REJECTED);
    expect(me.body.rejectionReason).toBe("Documents illisibles");

    const notif = await prisma.notification.findFirst({
      where: { user: { phone }, type: "PROVIDER_REJECTED" },
    });
    expect(notif).toBeTruthy();
  });
});
