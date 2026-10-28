import fs from "fs";
import path from "path";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";

const app = createApp();

/** PNG 1x1 minimal */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const fixturePath = path.join(process.cwd(), "tests", "fixtures", "pixel.png");

describe("Biens, accueil et modération", () => {
  let createdPropertyId: string | undefined;

  afterAll(async () => {
    if (createdPropertyId) {
      await prisma.propertyMedia.deleteMany({ where: { propertyId: createdPropertyId } });
      await prisma.property.deleteMany({ where: { id: createdPropertyId } });
    }
    await prisma.$disconnect();
  });

  it("liste les biens avec filtres et pagination", async () => {
    const commune = await prisma.commune.findFirst({ where: { name: "Gombe" } });
    expect(commune).toBeTruthy();

    const response = await request(app).get("/api/v1/properties").query({
      offerType: "RENT",
      communeId: commune!.id,
      page: 1,
      limit: 5,
      sort: "recent",
    });

    expect(response.status).toBe(200);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 5,
    });
    expect(typeof response.body.meta.total).toBe("number");
    expect(Array.isArray(response.body.data)).toBe(true);
    for (const item of response.body.data) {
      expect(item.status).toBe("APPROVED");
      expect(item.offerType).toBe("RENT");
      expect(item.commune.id).toBe(commune!.id);
    }
  });

  it("incrémente viewsCount sur le détail", async () => {
    const property = await prisma.property.findFirst({
      where: { status: "APPROVED" },
    });
    expect(property).toBeTruthy();

    const before = property!.viewsCount;
    const response = await request(app).get(`/api/v1/properties/${property!.id}`);
    expect(response.status).toBe(200);
    expect(response.body.viewsCount).toBe(before + 1);
  });

  it("n'affiche pas un bien DRAFT dans la liste publique", async () => {
    const owner = await prisma.user.findUnique({
      where: { email: "claire.mbuyi@example.com" },
      include: { providerProfile: true },
    });
    const category = await prisma.category.findFirst({
      where: { slug: "appartement" },
    });
    const commune = await prisma.commune.findFirst({ where: { name: "Gombe" } });

    const draft = await prisma.property.create({
      data: {
        ownerId: owner!.id,
        providerProfileId: owner!.providerProfile!.id,
        categoryId: category!.id,
        offerType: "RENT",
        kind: "APARTMENT",
        title: "Draft secret test",
        description: "Ce bien ne doit pas apparaître dans la liste publique.",
        price: 999,
        communeId: commune!.id,
        status: "DRAFT",
      },
    });

    const response = await request(app).get("/api/v1/properties").query({
      q: "Draft secret test",
    });
    expect(response.status).toBe(200);
    expect(response.body.data.find((item: { id: string }) => item.id === draft.id)).toBeUndefined();

    await prisma.property.delete({ where: { id: draft.id } });
  });

  it("refuse la publication à un utilisateur simple (403)", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({
      identifier: "jean.mukendi@example.com",
      password: "Password123!",
    });
    expect(login.status).toBe(200);

    const category = await prisma.category.findFirst({
      where: { slug: "appartement" },
    });
    const commune = await prisma.commune.findFirst({ where: { name: "Gombe" } });

    const response = await request(app)
      .post("/api/v1/properties")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .send({
        categoryId: category!.id,
        offerType: "RENT",
        kind: "APARTMENT",
        title: "Tentative non autorisée",
        description: "Un utilisateur simple ne doit pas pouvoir publier de bien.",
        price: 500,
        communeId: commune!.id,
      });

    expect(response.status).toBe(403);
  });

  it("flux complet offreur → médias → soumission → approbation admin", async () => {
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.writeFileSync(fixturePath, TINY_PNG);

    const providerLogin = await request(app).post("/api/v1/auth/login").send({
      identifier: "claire.mbuyi@example.com",
      password: "Provider123!",
    });
    expect(providerLogin.status).toBe(200);
    const providerToken = providerLogin.body.accessToken as string;

    const category = await prisma.category.findFirst({
      where: { slug: "appartement" },
    });
    const commune = await prisma.commune.findFirst({ where: { name: "Gombe" } });

    const created = await request(app)
      .post("/api/v1/properties")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({
        categoryId: category!.id,
        offerType: "RENT",
        kind: "APARTMENT",
        title: "Appartement test flux modération",
        description:
          "Bien de test pour le flux complet de publication et modération IREDUC.",
        price: 750,
        communeId: commune!.id,
        bedrooms: 2,
        bathrooms: 1,
      });

    expect(created.status).toBe(201);
    expect(created.body.status).toBe("DRAFT");
    createdPropertyId = created.body.id;

    const media = await request(app)
      .post(`/api/v1/properties/${createdPropertyId}/media`)
      .set("Authorization", `Bearer ${providerToken}`)
      .field("caption", "Vue de face")
      .attach("file", fixturePath);

    expect(media.status).toBe(201);
    expect(media.body.caption).toBe("Vue de face");

    const submitted = await request(app)
      .post(`/api/v1/properties/${createdPropertyId}/submit`)
      .set("Authorization", `Bearer ${providerToken}`);
    expect(submitted.status).toBe(200);
    expect(submitted.body.status).toBe("PENDING");

    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      identifier: "admin@ireduc.cd",
      password: "Admin123!",
    });
    expect(adminLogin.status).toBe(200);

    const reviewed = await request(app)
      .patch(`/api/v1/admin/properties/${createdPropertyId}/review`)
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`)
      .send({ decision: "APPROVED" });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.status).toBe("APPROVED");

    const listed = await request(app).get("/api/v1/properties").query({
      q: "Appartement test flux modération",
    });
    expect(listed.status).toBe(200);
    expect(
      listed.body.data.some((item: { id: string }) => item.id === createdPropertyId)
    ).toBe(true);

    const action = await prisma.adminAction.findFirst({
      where: { targetId: createdPropertyId, action: "APPROVE_PROPERTY" },
    });
    expect(action).toBeTruthy();
  });

  it("varie le contenu de /home entre deux appels", async () => {
    let different = false;
    let firstIds = "";

    for (let i = 0; i < 8; i += 1) {
      const response = await request(app).get("/api/v1/home");
      expect(response.status).toBe(200);
      expect(response.body.counters.activeUsers).toBeGreaterThan(0);
      expect(response.body.sections.featuredProperties.items).toBeDefined();

      const ids = JSON.stringify({
        featured: response.body.sections.featuredProperties.items.map(
          (item: { id: string }) => item.id
        ),
        rent: response.body.sections.housesForRent.items.map(
          (item: { id: string }) => item.id
        ),
        sale: response.body.sections.propertiesForSale.items.map(
          (item: { id: string }) => item.id
        ),
      });

      if (i === 0) {
        firstIds = ids;
      } else if (ids !== firstIds) {
        different = true;
        break;
      }
    }

    expect(different).toBe(true);
  });
});
