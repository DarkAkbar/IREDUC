/**
 * Seed de démonstration IREDUC — données enrichies pour tests utilisateurs.
 * Usage : npm run seed:demo
 */
import {
  ListingStatus,
  MediaType,
  OfferType,
  PaymentStatus,
  ProjectType,
  PropertyKind,
  ProviderType,
  RequestStatus,
  RequestTarget,
  SystemRole,
  VisitMode,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { confirmSeedTruncate } from "./seed-confirm";

// Ne pas écraser DATABASE_URL déjà définie (ex. Vitest → .env.test / ireduc_test)
dotenv.config({ override: false });

const prisma = new PrismaClient();

const COMMUNE_NAMES = [
  "Bandalungwa",
  "Barumbu",
  "Bumbu",
  "Gombe",
  "Kalamu",
  "Kasa-Vubu",
  "Kimbanseke",
  "Kinshasa",
  "Kintambo",
  "Kisenso",
  "Lemba",
  "Limete",
  "Lingwala",
  "Makala",
  "Maluku",
  "Masina",
  "Matete",
  "Mont-Ngafula",
  "N'djili",
  "Ngaba",
  "Ngaliema",
  "Ngiri-Ngiri",
  "N'sele",
  "Selembao",
] as const;

const NEIGHBORHOODS: Record<string, string[]> = {
  Gombe: ["Avenue du Port", "Boulevard du 30 Juin", "Gombe Centre"],
  Ngaliema: ["Ma Campagne", "Binza", "Mont Fleury"],
  Limete: ["Industriel", "Résidentiel", "Kingabwa"],
  "Mont-Ngafula": ["Kimwenza", "Matadi Kibala", "Mba-Sumbu"],
  Kalamu: ["Yolo Nord", "Matonge", "Kalamu Centre"],
  Lemba: ["Righini", "Livulu", "Lemba Terminus"],
  Masina: ["Sans Fil", "Boulevard Lumumba", "Masina 1"],
  "N'djili": ["Aéroport", "N'djili Brasserie", "Quartier 7"],
};

const REAL_ESTATE_CATEGORIES = [
  { name: "Maison", slug: "maison", icon: "home" },
  { name: "Appartement", slug: "appartement", icon: "building" },
  { name: "Villa", slug: "villa", icon: "villa" },
  { name: "Terrain", slug: "terrain", icon: "land" },
] as const;

const SERVICE_CATEGORIES = [
  { name: "Électricité", slug: "electricite", icon: "bolt" },
  { name: "Plomberie", slug: "plomberie", icon: "droplet" },
  { name: "Menuiserie", slug: "menuiserie", icon: "hammer" },
  { name: "Peinture", slug: "peinture", icon: "paintbrush" },
  { name: "Décoration", slug: "decoration", icon: "sparkles" },
  { name: "Déménagement", slug: "demenagement", icon: "truck" },
  { name: "Bâtiment", slug: "batiment", icon: "hard-hat" },
  { name: "Mécanique", slug: "mecanique", icon: "wrench" },
  { name: "Ameublement", slug: "ameublement", icon: "sofa" },
] as const;

const DEMO_COLORS = [
  "#0B2A8A",
  "#E30613",
  "#1B9E4B",
  "#6B7A99",
  "#14325c",
  "#F4A261",
  "#2A9D8F",
  "#264653",
];

function demoImagesDir() {
  const dir = path.resolve(process.cwd(), "uploads", "demo");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Supprime les anciens placeholders pour forcer le re-téléchargement. */
function clearDemoImages() {
  const dir = demoImagesDir();
  for (const name of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, name));
  }
}

/**
 * Photos locales libres de droits : téléchargées depuis Lorem Picsum (CC0-like),
 * puis stockées dans uploads/demo pour usage offline.
 */
async function ensureDemoImage(index: number): Promise<string> {
  const dir = demoImagesDir();
  const filename = `demo-${index}.jpg`;
  const filePath = path.join(dir, filename);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 20_000) {
    try {
      const response = await fetch(
        `https://picsum.photos/seed/ireduc-kin-${index}/960/720`,
        { redirect: "follow" }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await sharp(buffer)
        .resize({ width: 960, height: 720, fit: "cover" })
        .jpeg({ quality: 82 })
        .toFile(filePath);
    } catch {
      // Repli hors-ligne : image unie (évite un seed cassé sans réseau)
      const color = DEMO_COLORS[index % DEMO_COLORS.length]!;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720">
        <rect width="960" height="720" fill="${color}"/>
        <text x="480" y="360" text-anchor="middle" font-family="Arial" font-size="36" fill="#ffffff">IREDUC</text>
      </svg>`;
      await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(filePath);
    }
  }

  return `/uploads/demo/${filename}`;
}

async function main() {
  await confirmSeedTruncate("seed de démonstration (npm run seed:demo)");
  console.log("Seed DEMO — nettoyage…");
  clearDemoImages();
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "UserToken",
      "RefreshToken",
      "AdminAction",
      "Notification",
      "Alert",
      "Favorite",
      "Review",
      "Message",
      "ConversationParticipant",
      "Conversation",
      "Request",
      "ServiceMedia",
      "PropertyMedia",
      "Service",
      "Property",
      "ProviderDocument",
      "ProviderProfile",
      "Neighborhood",
      "Commune",
      "Category",
      "User"
    CASCADE;
  `);

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const superAdminHash = await bcrypt.hash("SuperAdmin123!", 10);
  const adminHash = await bcrypt.hash("Admin123!", 10);
  const providerHash = await bcrypt.hash("Provider123!", 10);

  console.log("Communes / catégories…");
  const communes = await Promise.all(
    COMMUNE_NAMES.map((name) => prisma.commune.create({ data: { name } }))
  );
  const communeByName = Object.fromEntries(communes.map((c) => [c.name, c]));

  const neighborhoodsByCommune: Record<string, { id: string; name: string }[]> = {};
  for (const [communeName, names] of Object.entries(NEIGHBORHOODS)) {
    const commune = communeByName[communeName]!;
    neighborhoodsByCommune[communeName] = await Promise.all(
      names.map((name) =>
        prisma.neighborhood.create({ data: { communeId: commune.id, name } })
      )
    );
  }

  const realEstateCats = await Promise.all(
    REAL_ESTATE_CATEGORIES.map((cat, index) =>
      prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          kind: "REAL_ESTATE",
          icon: cat.icon,
          sortOrder: index + 1,
        },
      })
    )
  );
  const serviceCats = await Promise.all(
    SERVICE_CATEGORIES.map((cat, index) =>
      prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          kind: "SERVICE",
          icon: cat.icon,
          sortOrder: index + 1,
        },
      })
    )
  );
  const catBySlug = Object.fromEntries(
    [...realEstateCats, ...serviceCats].map((c) => [c.slug, c])
  );

  console.log("Comptes admin / clients…");
  const superAdmin = await prisma.user.create({
    data: {
      fullName: "Super Admin IREDUC",
      email: "superadmin@ireduc.cd",
      passwordHash: superAdminHash,
      phone: "+243810000001",
      systemRole: SystemRole.SUPER_ADMIN,
      emailVerified: true,
      phoneVerified: true,
    },
  });
  const admin = await prisma.user.create({
    data: {
      fullName: "Admin IREDUC",
      email: "admin@ireduc.cd",
      passwordHash: adminHash,
      phone: "+243810000002",
      systemRole: SystemRole.ADMIN,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const clients = await Promise.all(
    [
      { fullName: "Jean Mukendi", email: "jean.mukendi@example.com", phone: "+243810000011" },
      { fullName: "Marie Kabongo", email: "marie.kabongo@example.com", phone: "+243810000012" },
      { fullName: "Patrick Ilunga", email: "patrick.ilunga@example.com", phone: "+243810000013" },
      { fullName: "Sarah Kalonji", email: "sarah.kalonji@example.com", phone: "+243810000014" },
      { fullName: "Eric Mbuyi", email: "eric.mbuyi@example.com", phone: "+243810000015" },
    ].map((u) =>
      prisma.user.create({
        data: {
          ...u,
          passwordHash,
          whatsapp: u.phone,
          systemRole: SystemRole.USER,
          emailVerified: true,
      phoneVerified: true,
        },
      })
    )
  );

  console.log("12 prestataires (toutes catégories)…");
  const providerDefs = [
    {
      fullName: "Claire Mbuyi",
      email: "claire.mbuyi@example.com",
      phone: "+243820000021",
      type: ProviderType.AGENCY,
      displayName: "Agence Gombe Habitat",
      description: "Agence immobilière Gombe / Ngaliema.",
    },
    {
      fullName: "David Tshisekedi",
      email: "david.tshisekedi@example.com",
      phone: "+243820000022",
      type: ProviderType.INDIVIDUAL,
      displayName: "David Propriétés",
      description: "Bailleur particulier — villas et appartements.",
    },
    {
      fullName: "Grace Nsimba",
      email: "grace.nsimba@example.com",
      phone: "+243820000023",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "ÉlecPro Kinshasa",
      description: "Électricité résidentielle et commerciale.",
      categorySlug: "electricite",
    },
    {
      fullName: "Olivier Kasongo",
      email: "olivier.kasongo@example.com",
      phone: "+243820000024",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "Plomb Services",
      description: "Plomberie et réseaux d'eau.",
      categorySlug: "plomberie",
    },
    {
      fullName: "Amina Fwamba",
      email: "amina.fwamba@example.com",
      phone: "+243820000025",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "Bois & Alu Pro",
      description: "Menuiserie bois et aluminium.",
      categorySlug: "menuiserie",
    },
    {
      fullName: "Jules Katanga",
      email: "jules.katanga@example.com",
      phone: "+243820000026",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "Peinture Plus",
      description: "Peinture intérieure et extérieure.",
      categorySlug: "peinture",
    },
    {
      fullName: "Nadia Lumumba",
      email: "nadia.lumumba@example.com",
      phone: "+243820000027",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "Déco Maison CD",
      description: "Décoration d'intérieur.",
      categorySlug: "decoration",
    },
    {
      fullName: "Serge Kalala",
      email: "serge.kalala@example.com",
      phone: "+243820000028",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "Déménage Express",
      description: "Déménagements sécurisés à Kinshasa.",
      categorySlug: "demenagement",
    },
    {
      fullName: "Patricia Nkongolo",
      email: "patricia.nkongolo@example.com",
      phone: "+243820000029",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "Bâtiment Solid",
      description: "Maçonnerie et gros œuvre.",
      categorySlug: "batiment",
    },
    {
      fullName: "Michel Kabeya",
      email: "michel.kabeya@example.com",
      phone: "+243820000030",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "Mécano Auto Habitat",
      description: "Mécanique et maintenance équipement.",
      categorySlug: "mecanique",
    },
    {
      fullName: "Esther Mwamba",
      email: "esther.mwamba@example.com",
      phone: "+243820000031",
      type: ProviderType.SERVICE_PROVIDER,
      displayName: "Ameublement Kin",
      description: "Fabrication et pose de meubles.",
      categorySlug: "ameublement",
    },
    {
      fullName: "Joseph Mbala",
      email: "joseph.mbala@example.com",
      phone: "+243820000032",
      type: ProviderType.AGENCY,
      displayName: "Limete Immo Partner",
      description: "Agence immobilière Limete / Masina.",
    },
  ] as const;

  const providerUsers = [];
  for (let i = 0; i < providerDefs.length; i++) {
    const p = providerDefs[i]!;
    const user = await prisma.user.create({
      data: {
        fullName: p.fullName,
        email: p.email,
        phone: p.phone,
        whatsapp: p.phone,
        passwordHash: providerHash,
        systemRole: SystemRole.USER,
        emailVerified: true,
        phoneVerified: true,
        providerProfile: {
          create: {
            type: p.type,
            displayName: p.displayName,
            description: p.description,
            contactEmail: p.email,
            phone: p.phone,
            whatsapp: p.phone,
            isRegistered: true,
            yearsOfExperience: 3 + (i % 10),
            reviewStatus: "APPROVED",
            logoUrl: await ensureDemoImage(100 + i),
          },
        },
      },
      include: { providerProfile: true },
    });
    providerUsers.push(user);
  }

  const agency = providerUsers[0]!.providerProfile!;
  const individual = providerUsers[1]!.providerProfile!;
  const agency2 = providerUsers[11]!.providerProfile!;

  const communePool = [
    "Gombe",
    "Ngaliema",
    "Limete",
    "Mont-Ngafula",
    "Kalamu",
    "Lemba",
    "Masina",
    "N'djili",
    "Kintambo",
    "Kinshasa",
  ];

  const propertyKinds: Array<{
    slug: string;
    kind: PropertyKind;
    offer: OfferType;
    title: string;
    price: number;
  }> = [
    { slug: "appartement", kind: PropertyKind.APARTMENT, offer: OfferType.RENT, title: "Appartement 3 chambres", price: 900 },
    { slug: "appartement", kind: PropertyKind.APARTMENT, offer: OfferType.SALE, title: "Appartement à vendre", price: 95000 },
    { slug: "maison", kind: PropertyKind.HOUSE, offer: OfferType.RENT, title: "Maison familiale", price: 700 },
    { slug: "maison", kind: PropertyKind.HOUSE, offer: OfferType.SALE, title: "Maison à rénover", price: 68000 },
    { slug: "villa", kind: PropertyKind.VILLA, offer: OfferType.RENT, title: "Villa standing", price: 2500 },
    { slug: "villa", kind: PropertyKind.VILLA, offer: OfferType.SALE, title: "Villa de luxe", price: 420000 },
    { slug: "terrain", kind: PropertyKind.LAND, offer: OfferType.SALE, title: "Terrain constructible", price: 45000 },
    { slug: "terrain", kind: PropertyKind.LAND, offer: OfferType.SALE, title: "Parcelle titrée", price: 78000 },
    { slug: "appartement", kind: PropertyKind.APARTMENT, offer: OfferType.RENT, title: "Studio meublé", price: 350 },
    { slug: "maison", kind: PropertyKind.HOUSE, offer: OfferType.RENT, title: "Maison 4 chambres", price: 1100 },
  ];

  console.log("25 biens Kinshasa…");
  const properties = [];
  for (let i = 0; i < 25; i++) {
    const template = propertyKinds[i % propertyKinds.length]!;
    const communeName = communePool[i % communePool.length]!;
    const commune = communeByName[communeName]!;
    const nbs = neighborhoodsByCommune[communeName];
    const neighborhoodId = nbs?.[i % (nbs.length || 1)]?.id;
    const ownerProfile = i % 3 === 0 ? agency : i % 3 === 1 ? individual : agency2;
    const ownerUser = providerUsers.find((u) => u.providerProfile?.id === ownerProfile.id)!;

    const property = await prisma.property.create({
      data: {
        ownerId: ownerUser.id,
        providerProfileId: ownerProfile.id,
        categoryId: catBySlug[template.slug]!.id,
        offerType: template.offer,
        kind: template.kind,
        title: `${template.title} — ${communeName} (#${i + 1})`,
        description: `Bien de démonstration à ${communeName}. Idéal pour tests et parcours clients.`,
        price: template.price + i * 50,
        currency: "USD",
        communeId: commune.id,
        neighborhoodId: neighborhoodId ?? null,
        bedrooms: template.kind === PropertyKind.LAND ? null : 2 + (i % 4),
        bathrooms: template.kind === PropertyKind.LAND ? null : 1 + (i % 3),
        areaM2: template.kind === PropertyKind.LAND ? 400 + i * 20 : 70 + i * 8,
        parking: i % 2 === 0,
        hasPool: template.kind === PropertyKind.VILLA,
        hasTitleDeed: i % 3 !== 0,
        tags: ["démo", communeName.toLowerCase(), template.offer === OfferType.RENT ? "location" : "vente"],
        status: ListingStatus.APPROVED,
        isFeatured: i < 5,
        media: {
          create: [
            {
              url: await ensureDemoImage(i * 2 + 1),
              type: MediaType.PHOTO,
              caption: "Vue principale",
              sortOrder: 0,
            },
            {
              url: await ensureDemoImage(i * 2 + 2),
              type: MediaType.PHOTO,
              caption: "Intérieur",
              sortOrder: 1,
            },
          ],
        },
      },
    });
    properties.push(property);
  }

  console.log("Services + avis…");
  const services = [];
  for (let i = 2; i < 11; i++) {
    const def = providerDefs[i]!;
    const profile = providerUsers[i]!.providerProfile!;
    const slug = "categorySlug" in def ? def.categorySlug : "electricite";
    const service = await prisma.service.create({
      data: {
        providerProfileId: profile.id,
        categoryId: catBySlug[slug]!.id,
        title: `${def.displayName} — prestation principale`,
        description: def.description,
        subServices: ["Devis gratuit", "Intervention rapide", "Garantie"],
        status: ListingStatus.APPROVED,
        isFeatured: i < 5,
        coverageCommunes: {
          connect: communes.slice(0, 6).map((c) => ({ id: c.id })),
        },
        media: {
          create: [
            {
              url: await ensureDemoImage(200 + i),
              type: MediaType.PHOTO,
              caption: "Réalisation",
              sortOrder: 0,
            },
          ],
        },
      },
    });
    services.push(service);

    // Avis : créer une demande COMPLETED + review
    const reviewer = clients[i % clients.length]!;
    const completedReq = await prisma.request.create({
      data: {
        number: `IRD-DEMO-REV-${String(i).padStart(3, "0")}`,
        requesterId: reviewer.id,
        targetType: RequestTarget.SERVICE,
        serviceId: service.id,
        projectType: ProjectType.OTHER,
        fullName: reviewer.fullName,
        phone: reviewer.phone!,
        email: reviewer.email,
        message: "Prestation réalisée (données démo).",
        status: RequestStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        handledById: admin.id,
      },
    });
    await prisma.review.create({
      data: {
        requestId: completedReq.id,
        authorId: reviewer.id,
        serviceId: service.id,
        rating: 3 + (i % 3),
        comment: "Bon service, ponctuel et professionnel (avis démo).",
      },
    });
  }

  console.log("Demandes dans chaque statut…");
  const today = new Date();
  const prefix = `IRD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const statusSamples: RequestStatus[] = [
    RequestStatus.PENDING,
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.CANCELLED,
    RequestStatus.COMPLETED,
  ];

  for (let i = 0; i < statusSamples.length; i++) {
    const status = statusSamples[i]!;
    const client = clients[i % clients.length]!;
    await prisma.request.create({
      data: {
        number: `${prefix}-${String(i + 1).padStart(3, "0")}`,
        requesterId: client.id,
        targetType: RequestTarget.PROPERTY,
        propertyId: properties[i]!.id,
        projectType: ProjectType.RENT,
        visitMode: VisitMode.PHYSICAL,
        visitDate: new Date(Date.now() + (i + 1) * 86400000),
        visitSlot: "10:00-12:00",
        fullName: client.fullName,
        phone: client.phone!,
        email: client.email,
        message: `Demande démo statut ${status}`,
        status,
        paymentStatus:
          status === RequestStatus.COMPLETED || status === RequestStatus.APPROVED
            ? PaymentStatus.PAID
            : PaymentStatus.UNPAID,
        rejectionReason: status === RequestStatus.REJECTED ? "Dossier incomplet (démo)" : null,
        handledById:
          status === RequestStatus.PENDING ? null : admin.id,
      },
    });
  }

  console.log(
    `Seed DEMO terminé : ${properties.length} biens, ${providerUsers.length} prestataires, ${services.length} services.`
  );
  console.log(`Comptes : jean.mukendi@example.com / Password123!`);
  console.log(`claire.mbuyi@example.com / Provider123!`);
  console.log(`admin@ireduc.cd / Admin123! | superadmin@ireduc.cd / SuperAdmin123!`);
  void superAdmin;
}

main()
  .catch((error) => {
    console.error("Erreur seed demo:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
