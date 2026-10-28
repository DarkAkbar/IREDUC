import { PrismaClient, OfferType, PropertyKind, RequestStatus, RequestTarget, ProjectType, VisitMode, MediaType, ListingStatus, ProviderType, SystemRole, PaymentStatus, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import dotenv from "dotenv";
import { confirmSeedTruncate } from "./seed-confirm";
import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
} from "../src/modules/admin/admin.settings.defaults";

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

const PHOTO = (id: number) => `https://picsum.photos/seed/ireduc-${id}/800/600`;

async function main() {
  await confirmSeedTruncate("seed de base (prisma db seed)");
  console.log("Nettoyage des données existantes...");
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

  console.log("Communes et quartiers...");
  const communes = await Promise.all(
    COMMUNE_NAMES.map((name) =>
      prisma.commune.create({ data: { name } })
    )
  );
  const communeByName = Object.fromEntries(communes.map((c) => [c.name, c]));

  const neighborhoodsByCommune: Record<string, { id: string; name: string }[]> = {};
  for (const [communeName, names] of Object.entries(NEIGHBORHOODS)) {
    const commune = communeByName[communeName];
    neighborhoodsByCommune[communeName] = await Promise.all(
      names.map((name) =>
        prisma.neighborhood.create({
          data: { communeId: commune.id, name },
        })
      )
    );
  }

  console.log("Catégories...");
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

  console.log("Utilisateurs...");
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

  const users = await Promise.all(
    [
      { fullName: "Jean Mukendi", email: "jean.mukendi@example.com", phone: "+243810000011" },
      { fullName: "Marie Kabongo", email: "marie.kabongo@example.com", phone: "+243810000012" },
      { fullName: "Patrick Ilunga", email: "patrick.ilunga@example.com", phone: "+243810000013" },
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

  console.log("Prestataires...");
  const providerUsers = await Promise.all(
    [
      {
        fullName: "Claire Mbuyi",
        email: "claire.mbuyi@example.com",
        phone: "+243820000021",
        profile: {
          type: ProviderType.AGENCY,
          displayName: "Agence Gombe Habitat",
          description: "Agence immobilière spécialisée à Gombe et Ngaliema.",
          isRegistered: true,
          yearsOfExperience: 8,
        },
      },
      {
        fullName: "David Tshisekedi",
        email: "david.tshisekedi@example.com",
        phone: "+243820000022",
        profile: {
          type: ProviderType.INDIVIDUAL,
          displayName: "David Propriétés",
          description: "Bailleur particulier — villas et appartements.",
          isRegistered: false,
          yearsOfExperience: 5,
        },
      },
      {
        fullName: "Grace Nsimba",
        email: "grace.nsimba@example.com",
        phone: "+243820000023",
        profile: {
          type: ProviderType.SERVICE_PROVIDER,
          displayName: "ÉlecPro Kinshasa",
          description: "Installation et dépannage électrique.",
          isRegistered: true,
          yearsOfExperience: 10,
        },
      },
      {
        fullName: "Olivier Kasongo",
        email: "olivier.kasongo@example.com",
        phone: "+243820000024",
        profile: {
          type: ProviderType.SERVICE_PROVIDER,
          displayName: "Plomb Services",
          description: "Plomberie résidentielle et commerciale.",
          isRegistered: true,
          yearsOfExperience: 7,
        },
      },
    ].map((p) =>
      prisma.user.create({
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
              ...p.profile,
              contactEmail: p.email,
              phone: p.phone,
              whatsapp: p.phone,
              reviewStatus: "APPROVED",
            },
          },
        },
        include: { providerProfile: true },
      })
    )
  );

  const agency = providerUsers[0].providerProfile!;
  const individual = providerUsers[1].providerProfile!;
  const elecPro = providerUsers[2].providerProfile!;
  const plomb = providerUsers[3].providerProfile!;

  const gombe = communeByName["Gombe"];
  const ngaliema = communeByName["Ngaliema"];
  const limete = communeByName["Limete"];
  const montNgafula = communeByName["Mont-Ngafula"];
  const gombeNb = neighborhoodsByCommune["Gombe"];
  const ngaliemaNb = neighborhoodsByCommune["Ngaliema"];
  const limeteNb = neighborhoodsByCommune["Limete"];
  const montNb = neighborhoodsByCommune["Mont-Ngafula"];

  console.log("Biens immobiliers...");
  const propertyDefs: Array<{
    ownerId: string;
    providerProfileId: string;
    categorySlug: string;
    offerType: OfferType;
    kind: PropertyKind;
    title: string;
    description: string;
    price: number;
    communeId: string;
    neighborhoodId: string;
    bedrooms?: number;
    bathrooms?: number;
    areaM2?: number;
    parking?: boolean;
    hasPool?: boolean;
    hasTitleDeed?: boolean;
    tags: string[];
    isFeatured?: boolean;
    captions: string[];
  }> = [
    {
      ownerId: providerUsers[0].id,
      providerProfileId: agency.id,
      categorySlug: "appartement",
      offerType: OfferType.RENT,
      kind: PropertyKind.APARTMENT,
      title: "Appartement 3 chambres — Gombe",
      description: "Bel appartement meublé proche du boulevard du 30 Juin.",
      price: 1200,
      communeId: gombe.id,
      neighborhoodId: gombeNb[1].id,
      bedrooms: 3,
      bathrooms: 2,
      areaM2: 110,
      parking: true,
      hasTitleDeed: true,
      tags: ["meublé", "parking", "sécurité"],
      isFeatured: true,
      captions: ["Vue de face", "Salon", "Chambre principale"],
    },
    {
      ownerId: providerUsers[0].id,
      providerProfileId: agency.id,
      categorySlug: "villa",
      offerType: OfferType.SALE,
      kind: PropertyKind.VILLA,
      title: "Villa moderne — Ngaliema Binza",
      description: "Villa 5 chambres avec piscine et jardin.",
      price: 350000,
      communeId: ngaliema.id,
      neighborhoodId: ngaliemaNb[1].id,
      bedrooms: 5,
      bathrooms: 4,
      areaM2: 420,
      parking: true,
      hasPool: true,
      hasTitleDeed: true,
      tags: ["piscine", "jardin", "standing"],
      isFeatured: true,
      captions: ["Vue de face", "Piscine", "Salon"],
    },
    {
      ownerId: providerUsers[1].id,
      providerProfileId: individual.id,
      categorySlug: "maison",
      offerType: OfferType.RENT,
      kind: PropertyKind.HOUSE,
      title: "Maison familiale — Limete",
      description: "Maison 4 chambres dans le quartier résidentiel de Limete.",
      price: 800,
      communeId: limete.id,
      neighborhoodId: limeteNb[1].id,
      bedrooms: 4,
      bathrooms: 2,
      areaM2: 180,
      parking: true,
      tags: ["familial", "calme"],
      captions: ["Vue de face", "Cour", "Cuisine"],
    },
    {
      ownerId: providerUsers[1].id,
      providerProfileId: individual.id,
      categorySlug: "terrain",
      offerType: OfferType.SALE,
      kind: PropertyKind.LAND,
      title: "Terrain titré — Mont-Ngafula",
      description: "Parcelle de 500 m² avec titre foncier.",
      price: 45000,
      communeId: montNgafula.id,
      neighborhoodId: montNb[0].id,
      areaM2: 500,
      hasTitleDeed: true,
      tags: ["titré", "constructible"],
      captions: ["Vue générale", "Accès route"],
    },
    {
      ownerId: providerUsers[0].id,
      providerProfileId: agency.id,
      categorySlug: "appartement",
      offerType: OfferType.RENT,
      kind: PropertyKind.APARTMENT,
      title: "Studio meublé — Gombe Centre",
      description: "Studio idéal pour expatrié, tout inclus.",
      price: 600,
      communeId: gombe.id,
      neighborhoodId: gombeNb[2].id,
      bedrooms: 1,
      bathrooms: 1,
      areaM2: 45,
      tags: ["studio", "meublé"],
      captions: ["Vue de face", "Intérieur"],
    },
    {
      ownerId: providerUsers[0].id,
      providerProfileId: agency.id,
      categorySlug: "villa",
      offerType: OfferType.RENT,
      kind: PropertyKind.VILLA,
      title: "Villa standing — Ngaliema Ma Campagne",
      description: "Villa 4 chambres avec parking pour 3 véhicules.",
      price: 2500,
      communeId: ngaliema.id,
      neighborhoodId: ngaliemaNb[0].id,
      bedrooms: 4,
      bathrooms: 3,
      areaM2: 300,
      parking: true,
      hasPool: false,
      hasTitleDeed: true,
      tags: ["standing", "gardien"],
      isFeatured: true,
      captions: ["Vue de face", "Jardin", "Salon"],
    },
    {
      ownerId: providerUsers[1].id,
      providerProfileId: individual.id,
      categorySlug: "maison",
      offerType: OfferType.SALE,
      kind: PropertyKind.HOUSE,
      title: "Maison à rénover — Limete Industriel",
      description: "Bonne opportunité d'investissement.",
      price: 75000,
      communeId: limete.id,
      neighborhoodId: limeteNb[0].id,
      bedrooms: 3,
      bathrooms: 1,
      areaM2: 140,
      tags: ["à rénover", "investissement"],
      captions: ["Vue de face", "Arrière"],
    },
    {
      ownerId: providerUsers[0].id,
      providerProfileId: agency.id,
      categorySlug: "appartement",
      offerType: OfferType.SALE,
      kind: PropertyKind.APARTMENT,
      title: "Duplex — Gombe Avenue du Port",
      description: "Duplex lumineux avec vue partielle.",
      price: 180000,
      communeId: gombe.id,
      neighborhoodId: gombeNb[0].id,
      bedrooms: 3,
      bathrooms: 2,
      areaM2: 160,
      parking: true,
      hasTitleDeed: true,
      tags: ["duplex", "vue"],
      captions: ["Vue de face", "Salon", "Terrasse"],
    },
    {
      ownerId: providerUsers[1].id,
      providerProfileId: individual.id,
      categorySlug: "terrain",
      offerType: OfferType.SALE,
      kind: PropertyKind.LAND,
      title: "Terrain 800 m² — Mont-Ngafula",
      description: "Terrain plat proche de la route principale.",
      price: 60000,
      communeId: montNgafula.id,
      neighborhoodId: montNb[1].id,
      areaM2: 800,
      hasTitleDeed: false,
      tags: ["plat", "route"],
      captions: ["Vue générale"],
    },
    {
      ownerId: providerUsers[0].id,
      providerProfileId: agency.id,
      categorySlug: "maison",
      offerType: OfferType.RENT,
      kind: PropertyKind.HOUSE,
      title: "Maison 2 chambres — Ngaliema",
      description: "Petite maison idéale couple ou jeune famille.",
      price: 550,
      communeId: ngaliema.id,
      neighborhoodId: ngaliemaNb[2].id,
      bedrooms: 2,
      bathrooms: 1,
      areaM2: 90,
      tags: ["cosy", "calme"],
      captions: ["Vue de face", "Salon"],
    },
    {
      ownerId: providerUsers[1].id,
      providerProfileId: individual.id,
      categorySlug: "appartement",
      offerType: OfferType.RENT,
      kind: PropertyKind.APARTMENT,
      title: "Appartement 2 chambres — Limete Kingabwa",
      description: "Appartement neuf au 2e étage.",
      price: 450,
      communeId: limete.id,
      neighborhoodId: limeteNb[2].id,
      bedrooms: 2,
      bathrooms: 1,
      areaM2: 75,
      tags: ["neuf", "étages"],
      captions: ["Vue de face", "Cuisine"],
    },
    {
      ownerId: providerUsers[0].id,
      providerProfileId: agency.id,
      categorySlug: "villa",
      offerType: OfferType.SALE,
      kind: PropertyKind.VILLA,
      title: "Villa de luxe — Gombe",
      description: "Villa haut standing avec piscine et dépendance.",
      price: 550000,
      communeId: gombe.id,
      neighborhoodId: gombeNb[1].id,
      bedrooms: 6,
      bathrooms: 5,
      areaM2: 600,
      parking: true,
      hasPool: true,
      hasTitleDeed: true,
      tags: ["luxe", "piscine", "dépendance"],
      isFeatured: true,
      captions: ["Vue de face", "Piscine", "Salon", "Chambre"],
    },
  ];

  const properties = [];
  for (let i = 0; i < propertyDefs.length; i++) {
    const def = propertyDefs[i];
    const property = await prisma.property.create({
      data: {
        ownerId: def.ownerId,
        providerProfileId: def.providerProfileId,
        categoryId: catBySlug[def.categorySlug].id,
        offerType: def.offerType,
        kind: def.kind,
        title: def.title,
        description: def.description,
        price: def.price,
        currency: "USD",
        communeId: def.communeId,
        neighborhoodId: def.neighborhoodId,
        bedrooms: def.bedrooms,
        bathrooms: def.bathrooms,
        areaM2: def.areaM2,
        parking: def.parking,
        hasPool: def.hasPool,
        hasTitleDeed: def.hasTitleDeed,
        tags: def.tags,
        status: ListingStatus.APPROVED,
        isFeatured: def.isFeatured ?? false,
        media: {
          create: def.captions.map((caption, sortOrder) => ({
            url: PHOTO(i * 10 + sortOrder + 1),
            type: MediaType.PHOTO,
            caption,
            sortOrder,
          })),
        },
      },
    });
    properties.push(property);
  }

  console.log("Services...");
  const serviceDefs = [
    {
      providerProfileId: elecPro.id,
      categorySlug: "electricite",
      title: "Installation électrique complète",
      description: "Câblage, tableaux, prises et éclairage pour maisons et bureaux.",
      subServices: ["Tableau électrique", "Éclairage LED", "Dépannage urgent"],
      communeIds: [gombe.id, ngaliema.id, limete.id],
      isFeatured: true,
    },
    {
      providerProfileId: elecPro.id,
      categorySlug: "electricite",
      title: "Dépannage électrique 24h/24",
      description: "Intervention rapide sur panne de courant et court-circuit.",
      subServices: ["Court-circuit", "Remplacement disjoncteur"],
      communeIds: [gombe.id, limete.id, communeByName["Kinshasa"].id],
    },
    {
      providerProfileId: plomb.id,
      categorySlug: "plomberie",
      title: "Plomberie sanitaire",
      description: "Installation et réparation de sanitaires et canalisations.",
      subServices: ["Fuite d'eau", "Chauffe-eau", "Évacuation"],
      communeIds: [ngaliema.id, montNgafula.id, gombe.id],
      isFeatured: true,
    },
    {
      providerProfileId: plomb.id,
      categorySlug: "plomberie",
      title: "Réseau d'eau potable",
      description: "Mise en place de réseaux d'alimentation en eau.",
      subServices: ["Forage raccordement", "Pompes", "Filtres"],
      communeIds: [montNgafula.id, limete.id],
    },
    {
      providerProfileId: elecPro.id,
      categorySlug: "peinture",
      title: "Peinture intérieure et extérieure",
      description: "Travaux de peinture professionnelle pour habitat.",
      subServices: ["Enduit", "Peinture décorative"],
      communeIds: [gombe.id, ngaliema.id],
    },
    {
      providerProfileId: plomb.id,
      categorySlug: "menuiserie",
      title: "Menuiserie bois et aluminium",
      description: "Portes, fenêtres, placards sur mesure.",
      subServices: ["Portes", "Fenêtres", "Placards"],
      communeIds: [limete.id, gombe.id, ngaliema.id],
    },
    {
      providerProfileId: elecPro.id,
      categorySlug: "demenagement",
      title: "Déménagement Kinshasa",
      description: "Transport sécurisé de mobilier dans Kinshasa.",
      subServices: ["Emballage", "Transport", "Montage"],
      communeIds: communes.slice(0, 8).map((c) => c.id),
      isFeatured: true,
    },
    {
      providerProfileId: plomb.id,
      categorySlug: "decoration",
      title: "Décoration d'intérieur",
      description: "Conseil et réalisation d'aménagements intérieurs.",
      subServices: ["Home staging", "Éclairage déco", "Rideaux"],
      communeIds: [gombe.id, ngaliema.id],
    },
  ];

  const services = [];
  for (let i = 0; i < serviceDefs.length; i++) {
    const def = serviceDefs[i];
    const service = await prisma.service.create({
      data: {
        providerProfileId: def.providerProfileId,
        categoryId: catBySlug[def.categorySlug].id,
        title: def.title,
        description: def.description,
        subServices: def.subServices,
        status: ListingStatus.APPROVED,
        isFeatured: def.isFeatured ?? false,
        coverageCommunes: {
          connect: def.communeIds.map((id) => ({ id })),
        },
        media: {
          create: [
            {
              url: PHOTO(200 + i),
              type: MediaType.PHOTO,
              caption: "Réalisation",
              sortOrder: 0,
            },
            {
              url: PHOTO(300 + i),
              type: MediaType.PHOTO,
              caption: "Équipe sur chantier",
              sortOrder: 1,
            },
          ],
        },
      },
    });
    services.push(service);
  }

  console.log("Demandes...");
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const datePrefix = `${y}${m}${d}`;

  await prisma.request.create({
    data: {
      number: `IRD-${datePrefix}-001`,
      requesterId: users[0].id,
      targetType: RequestTarget.PROPERTY,
      propertyId: properties[0].id,
      projectType: ProjectType.RENT,
      desiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      durationMonths: 12,
      occupants: 3,
      visitMode: VisitMode.PHYSICAL,
      visitDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      visitSlot: "10:00-12:00",
      fullName: users[0].fullName,
      phone: users[0].phone!,
      email: users[0].email,
      whatsapp: users[0].whatsapp,
      message: "Je souhaite visiter cet appartement rapidement.",
      status: RequestStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  await prisma.request.create({
    data: {
      number: `IRD-${datePrefix}-002`,
      requesterId: users[1].id,
      targetType: RequestTarget.SERVICE,
      serviceId: services[0].id,
      projectType: ProjectType.OTHER,
      desiredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      fullName: users[1].fullName,
      phone: users[1].phone!,
      email: users[1].email,
      message: "Devis pour installation électrique d'un appartement.",
      status: RequestStatus.APPROVED,
      paymentStatus: PaymentStatus.PAID,
      handledById: admin.id,
    },
  });

  await prisma.request.create({
    data: {
      number: `IRD-${datePrefix}-003`,
      requesterId: users[2].id,
      targetType: RequestTarget.PROPERTY,
      propertyId: properties[1].id,
      projectType: ProjectType.BUY,
      visitMode: VisitMode.VIRTUAL,
      visitDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      visitSlot: "15:00-16:00",
      fullName: users[2].fullName,
      phone: users[2].phone!,
      email: users[2].email,
      message: "Intéressé par l'achat de cette villa.",
      status: RequestStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      handledById: superAdmin.id,
    },
  });

  for (const key of SETTING_KEYS) {
    await prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: DEFAULT_SETTINGS[key] as Prisma.InputJsonValue,
      },
      update: {},
    });
  }

  console.log("Seed IREDUC terminé avec succès.");
}

main()
  .catch((error) => {
    console.error("Erreur lors du seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
