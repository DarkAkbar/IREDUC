import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

const app = createApp();

async function login(identifier: string, password: string) {
  const response = await request(app).post("/api/v1/auth/login").send({
    identifier,
    password,
  });
  expect(response.status).toBe(200);
  return response.body.accessToken as string;
}

describe("Demandes, messagerie, avis et paiement", () => {
  const createdRequestIds: string[] = [];

  afterAll(async () => {
    if (createdRequestIds.length > 0) {
      await prisma.review.deleteMany({
        where: { requestId: { in: createdRequestIds } },
      });
      await prisma.message.deleteMany({
        where: { conversation: { requestId: { in: createdRequestIds } } },
      });
      await prisma.conversationParticipant.deleteMany({
        where: { conversation: { requestId: { in: createdRequestIds } } },
      });
      await prisma.conversation.deleteMany({
        where: { requestId: { in: createdRequestIds } },
      });
      await prisma.request.deleteMany({
        where: { id: { in: createdRequestIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("crée une demande avec numéro unique et refuse sur sa propre annonce", async () => {
    const jeanToken = await login("jean.mukendi@example.com", "Password123!");
    const claireToken = await login("claire.mbuyi@example.com", "Provider123!");

    const property = await prisma.property.findFirst({
      where: {
        status: "APPROVED",
        owner: { email: "claire.mbuyi@example.com" },
      },
    });
    expect(property).toBeTruthy();

    const visitDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const created = await request(app)
      .post("/api/v1/requests")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({
        targetType: "PROPERTY",
        propertyId: property!.id,
        projectType: "RENT",
        visitMode: "PHYSICAL",
        visitDate: visitDate.toISOString(),
        visitSlot: "10h00",
        fullName: "Jean Mukendi",
        phone: "+243810000011",
        email: "jean.mukendi@example.com",
        message: "Je souhaite visiter ce bien.",
      });

    expect(created.status).toBe(201);
    expect(created.body.number).toMatch(/^IRD-\d{8}-\d{3}$/);
    expect(created.body.status).toBe("PENDING");
    createdRequestIds.push(created.body.id);

    const second = await request(app)
      .post("/api/v1/requests")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({
        targetType: "PROPERTY",
        propertyId: property!.id,
        projectType: "RENT",
        fullName: "Jean Mukendi",
        phone: "+243810000011",
        email: "jean.mukendi@example.com",
      });
    expect(second.status).toBe(201);
    expect(second.body.number).not.toBe(created.body.number);
    createdRequestIds.push(second.body.id);

    const own = await request(app)
      .post("/api/v1/requests")
      .set("Authorization", `Bearer ${claireToken}`)
      .send({
        targetType: "PROPERTY",
        propertyId: property!.id,
        projectType: "RENT",
        fullName: "Claire Mbuyi",
        phone: "+243820000021",
        email: "claire.mbuyi@example.com",
      });
    expect(own.status).toBe(400);
  });

  it("gère les cycles de statuts et refuse les transitions interdites (409)", async () => {
    const jeanToken = await login("jean.mukendi@example.com", "Password123!");
    const claireToken = await login("claire.mbuyi@example.com", "Provider123!");
    const property = await prisma.property.findFirst({
      where: {
        status: "APPROVED",
        owner: { email: "claire.mbuyi@example.com" },
      },
    });

    async function createPending() {
      const created = await request(app)
        .post("/api/v1/requests")
        .set("Authorization", `Bearer ${jeanToken}`)
        .send({
          targetType: "PROPERTY",
          propertyId: property!.id,
          projectType: "RENT",
          fullName: "Jean Mukendi",
          phone: "+243810000011",
          email: "jean.mukendi@example.com",
        });
      expect(created.status).toBe(201);
      createdRequestIds.push(created.body.id);
      return created.body.id as string;
    }

    const approvedId = await createPending();
    const approve = await request(app)
      .patch(`/api/v1/requests/${approvedId}/review`)
      .set("Authorization", `Bearer ${claireToken}`)
      .send({ decision: "APPROVED" });
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe("APPROVED");

    const complete = await request(app)
      .patch(`/api/v1/requests/${approvedId}/complete`)
      .set("Authorization", `Bearer ${claireToken}`);
    expect(complete.status).toBe(200);
    expect(complete.body.status).toBe("COMPLETED");

    const rejectedId = await createPending();
    const reject = await request(app)
      .patch(`/api/v1/requests/${rejectedId}/review`)
      .set("Authorization", `Bearer ${claireToken}`)
      .send({ decision: "REJECTED", reason: "Indisponible cette semaine" });
    expect(reject.status).toBe(200);
    expect(reject.body.status).toBe("REJECTED");

    const cancelledId = await createPending();
    const cancel = await request(app)
      .patch(`/api/v1/requests/${cancelledId}/cancel`)
      .set("Authorization", `Bearer ${jeanToken}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe("CANCELLED");

    const forbiddenTransition = await request(app)
      .patch(`/api/v1/requests/${cancelledId}/complete`)
      .set("Authorization", `Bearer ${claireToken}`);
    expect(forbiddenTransition.status).toBe(409);
    expect(forbiddenTransition.body.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("refuse l'accès à une demande d'un tiers (403)", async () => {
    const jeanToken = await login("jean.mukendi@example.com", "Password123!");
    const patrickToken = await login("patrick.ilunga@example.com", "Password123!");
    const property = await prisma.property.findFirst({
      where: {
        status: "APPROVED",
        owner: { email: "claire.mbuyi@example.com" },
      },
    });

    const created = await request(app)
      .post("/api/v1/requests")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({
        targetType: "PROPERTY",
        propertyId: property!.id,
        projectType: "RENT",
        fullName: "Jean Mukendi",
        phone: "+243810000011",
        email: "jean.mukendi@example.com",
      });
    expect(created.status).toBe(201);
    createdRequestIds.push(created.body.id);

    const response = await request(app)
      .get(`/api/v1/requests/${created.body.id}`)
      .set("Authorization", `Bearer ${patrickToken}`);
    expect(response.status).toBe(403);
  });

  it("simule un paiement sur demande APPROVED", async () => {
    const jeanToken = await login("jean.mukendi@example.com", "Password123!");
    const claireToken = await login("claire.mbuyi@example.com", "Provider123!");
    const property = await prisma.property.findFirst({
      where: {
        status: "APPROVED",
        owner: { email: "claire.mbuyi@example.com" },
      },
    });

    const created = await request(app)
      .post("/api/v1/requests")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({
        targetType: "PROPERTY",
        propertyId: property!.id,
        projectType: "RENT",
        fullName: "Jean Mukendi",
        phone: "+243810000011",
        email: "jean.mukendi@example.com",
      });
    createdRequestIds.push(created.body.id);

    await request(app)
      .patch(`/api/v1/requests/${created.body.id}/review`)
      .set("Authorization", `Bearer ${claireToken}`)
      .send({ decision: "APPROVED" });

    const paid = await request(app)
      .post(`/api/v1/requests/${created.body.id}/pay`)
      .set("Authorization", `Bearer ${jeanToken}`);
    expect(paid.status).toBe(200);
    expect(paid.body.paymentStatus).toBe("PAID");
  });

  it("réutilise une conversation et gère non-lu puis lu", async () => {
    const jeanToken = await login("jean.mukendi@example.com", "Password123!");
    const claireToken = await login("claire.mbuyi@example.com", "Provider123!");
    const property = await prisma.property.findFirst({
      where: {
        status: "APPROVED",
        owner: { email: "claire.mbuyi@example.com" },
      },
    });

    const created = await request(app)
      .post("/api/v1/requests")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({
        targetType: "PROPERTY",
        propertyId: property!.id,
        projectType: "RENT",
        fullName: "Jean Mukendi",
        phone: "+243810000011",
        email: "jean.mukendi@example.com",
      });
    createdRequestIds.push(created.body.id);

    const conv1 = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({ requestId: created.body.id });
    expect(conv1.status).toBe(201);

    const conv2 = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({ requestId: created.body.id });
    expect(conv2.status).toBe(201);
    expect(conv2.body.id).toBe(conv1.body.id);

    await request(app)
      .post(`/api/v1/conversations/${conv1.body.id}/messages`)
      .set("Authorization", `Bearer ${claireToken}`)
      .send({ content: "Bonjour, votre visite est possible demain." });

    const list = await request(app)
      .get("/api/v1/conversations")
      .set("Authorization", `Bearer ${jeanToken}`);
    expect(list.status).toBe(200);
    const item = list.body.data.find(
      (c: { id: string }) => c.id === conv1.body.id
    );
    expect(item.unreadCount).toBeGreaterThanOrEqual(1);

    const read = await request(app)
      .patch(`/api/v1/conversations/${conv1.body.id}/read`)
      .set("Authorization", `Bearer ${jeanToken}`);
    expect(read.status).toBe(200);

    const listAfter = await request(app)
      .get("/api/v1/conversations")
      .set("Authorization", `Bearer ${jeanToken}`);
    const itemAfter = listAfter.body.data.find(
      (c: { id: string }) => c.id === conv1.body.id
    );
    expect(itemAfter.unreadCount).toBe(0);
  });

  it("refuse un avis avant COMPLETED puis l'accepte après", async () => {
    const jeanToken = await login("jean.mukendi@example.com", "Password123!");
    const claireToken = await login("claire.mbuyi@example.com", "Provider123!");
    const property = await prisma.property.findFirst({
      where: {
        status: "APPROVED",
        owner: { email: "claire.mbuyi@example.com" },
      },
    });

    const created = await request(app)
      .post("/api/v1/requests")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({
        targetType: "PROPERTY",
        propertyId: property!.id,
        projectType: "RENT",
        fullName: "Jean Mukendi",
        phone: "+243810000011",
        email: "jean.mukendi@example.com",
      });
    createdRequestIds.push(created.body.id);

    const early = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({
        requestId: created.body.id,
        rating: 5,
        comment: "Trop tôt",
      });
    expect(early.status).toBe(400);

    await request(app)
      .patch(`/api/v1/requests/${created.body.id}/review`)
      .set("Authorization", `Bearer ${claireToken}`)
      .send({ decision: "APPROVED" });
    await request(app)
      .patch(`/api/v1/requests/${created.body.id}/complete`)
      .set("Authorization", `Bearer ${claireToken}`);

    const review = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${jeanToken}`)
      .send({
        requestId: created.body.id,
        rating: 5,
        comment: "Excellent accompagnement",
      });
    expect(review.status).toBe(201);
    expect(review.body.rating).toBe(5);
  });

  it("expose les compteurs de /requests/mine", async () => {
    const jeanToken = await login("jean.mukendi@example.com", "Password123!");
    const mine = await request(app)
      .get("/api/v1/requests/mine")
      .set("Authorization", `Bearer ${jeanToken}`);

    expect(mine.status).toBe(200);
    expect(mine.body.counters).toMatchObject({
      all: expect.any(Number),
      pending: expect.any(Number),
      approved: expect.any(Number),
      rejected: expect.any(Number),
    });
    expect(mine.body.counters.all).toBeGreaterThan(0);
  });
});
