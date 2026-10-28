import { ListingStatus, ReviewStatus } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

describe("Modération admin (review)", () => {
  let propertyId = "";
  let providerId = "";
  let serviceId = "";

  beforeAll(async () => {
    const property = await prisma.property.findFirst({
      where: { status: ListingStatus.APPROVED },
      orderBy: { createdAt: "desc" },
    });
    expect(property).toBeTruthy();
    propertyId = property!.id;
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: ListingStatus.PENDING, rejectionReason: null },
    });

    const provider = await prisma.providerProfile.findFirst({
      where: { reviewStatus: ReviewStatus.APPROVED },
      orderBy: { createdAt: "desc" },
    });
    expect(provider).toBeTruthy();
    providerId = provider!.id;
    await prisma.providerProfile.update({
      where: { id: providerId },
      data: { reviewStatus: ReviewStatus.PENDING, rejectionReason: null },
    });

    const service = await prisma.service.findFirst({
      where: { status: ListingStatus.APPROVED },
      orderBy: { createdAt: "desc" },
    });
    if (service) {
      serviceId = service.id;
      await prisma.service.update({
        where: { id: serviceId },
        data: { status: ListingStatus.PENDING, rejectionReason: null },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("refuse la modération à un utilisateur simple (403)", async () => {
    const token = await loginAs("jean.mukendi@example.com", "Password123!");
    const response = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/review`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "APPROVED" });
    expect(response.status).toBe(403);
  });

  it("approuve un bien avec un ADMIN (y compris reason vide)", async () => {
    const token = await loginAs("+243810000002", "Admin123!");
    const response = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/review`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "APPROVED", reason: "" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("APPROVED");
    expect(response.body).toHaveProperty("nextPendingId");
  });

  it("exige un motif au rejet", async () => {
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: ListingStatus.PENDING, rejectionReason: null },
    });
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/review`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "REJECTED" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejette un bien avec motif (SUPER_ADMIN)", async () => {
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: ListingStatus.PENDING, rejectionReason: null },
    });
    const token = await loginAs("superadmin@ireduc.cd", "SuperAdmin123!");
    const response = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/review`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "REJECTED", reason: "Annonce incomplète" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("REJECTED");
    expect(response.body.rejectionReason).toBe("Annonce incomplète");
  });

  it("refuse une double décision (409)", async () => {
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .patch(`/api/v1/admin/properties/${propertyId}/review`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "APPROVED" });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("approuve un partenaire avec SUPER_ADMIN", async () => {
    const token = await loginAs("+243810000001", "SuperAdmin123!");
    const response = await request(app)
      .patch(`/api/v1/admin/providers/${providerId}/review`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "APPROVED" });

    expect(response.status).toBe(200);
    expect(response.body.reviewStatus).toBe("APPROVED");
    expect(response.body).toHaveProperty("nextPendingId");
  });

  it("rejette un service avec motif si disponible", async () => {
    if (!serviceId) return;
    const token = await loginAs("admin@ireduc.cd", "Admin123!");
    const response = await request(app)
      .patch(`/api/v1/admin/services/${serviceId}/review`)
      .set("Authorization", `Bearer ${token}`)
      .send({ decision: "REJECTED", reason: "Service non conforme" });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("REJECTED");
  });
});
