/**
 * Seed de démonstration IREDUC — données enrichies pour tests utilisateurs.
 * Photos : uniquement api/seed-assets/ → copiées dans uploads/demo/.
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
import { PrismaClient } from "@prisma/client";
import { confirmSeedTruncate } from "./seed-confirm";

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

/** Coordonnées approximatives (Kinshasa) par commune. */
const COMMUNE_COORDS: Record<string, { lat: number; lng: number }> = {
  Gombe: { lat: -4.305, lng: 15.31 },
  Ngaliema: { lat: -4.345, lng: 15.25 },
  Limete: { lat: -4.375, lng: 15.34 },
  "Mont-Ngafula": { lat: -4.42, lng: 15.27 },
  Kalamu: { lat: -4.34, lng: 15.3 },
  Lemba: { lat: -4.39, lng: 15.32 },
  Masina: { lat: -4.38, lng: 15.39 },
  "N'djili": { lat: -4.385, lng: 15.43 },
  Kintambo: { lat: -4.325, lng: 15.27 },
  Kinshasa: { lat: -4.33, lng: 15.31 },
};

/** Multiplicateur de prix selon la commune (Gombe / Ngaliema plus chers). */
const COMMUNE_PRICE_FACTOR: Record<string, number> = {
  Gombe: 1.35,
  Ngaliema: 1.25,
  Kintambo: 1.15,
  Limete: 1.0,
  Kalamu: 0.95,
  Lemba: 0.9,
  "Mont-Ngafula": 1.1,
  Masina: 0.8,
  "N'djili": 0.85,
  Kinshasa: 1.0,
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

const TAG_POOL = [
  "Jardin",
  "Parking",
  "Sécurité 24h",
  "Quartier calme",
  "Proche des commodités",
  "Titre foncier",
  "Climatisation",
  "Eau courante",
  "Groupe électrogène",
  "Cuisine équipée",
] as const;

function seedAssetsRoot() {
  return path.resolve(process.cwd(), "seed-assets");
}

function demoUploadsDir() {
  const dir = path.resolve(process.cwd(), "uploads", "demo");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function clearDemoUploads() {
  const dir = demoUploadsDir();
  for (const name of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, name));
  }
}

function listAssetFiles(...segments: string[]): string[] {
  const dir = path.join(seedAssetsRoot(), ...segments);
  if (!fs.existsSync(dir)) {
    throw new Error(
      `Dossier d'assets manquant : ${dir}. Lancez node scripts/generate-seed-assets.mjs`
    );
  }
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
    .map((f) => path.join(dir, f));
}

/**
 * Copie un fichier de seed-assets vers uploads/demo et retourne l'URL publique.
 */
function copyAssetToUploads(sourcePath: string, destName: string): string {
  const dest = path.join(demoUploadsDir(), destName);
  fs.copyFileSync(sourcePath, dest);
  return `/uploads/demo/${destName}`;
}

function kindFolder(kind: PropertyKind): string {
  switch (kind) {
    case PropertyKind.HOUSE:
      return "maison";
    case PropertyKind.APARTMENT:
      return "appartement";
    case PropertyKind.VILLA:
      return "villa";
    case PropertyKind.LAND:
      return "terrain";
    default:
      return "maison";
  }
}

function pickTags(kind: PropertyKind, hasTitleDeed: boolean, index: number): string[] {
  const tags: string[] = [];
  if (hasTitleDeed) tags.push("Titre foncier");
  if (kind !== PropertyKind.LAND) {
    tags.push(TAG_POOL[index % 5]!);
    tags.push(TAG_POOL[(index + 3) % TAG_POOL.length]!);
  } else {
    tags.push("Quartier calme");
    tags.push("Proche des commodités");
  }
  if (kind === PropertyKind.VILLA) tags.push("Jardin");
  if (index % 2 === 0 && kind !== PropertyKind.LAND) tags.push("Parking");
  return [...new Set(tags)].slice(0, 4);
}

type PropertyTemplate = {
  slug: string;
  kind: PropertyKind;
  offer: OfferType;
  title: string;
  description: string;
  basePrice: number;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number;
};

const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  {
    slug: "appartement",
    kind: PropertyKind.APARTMENT,
    offer: OfferType.RENT,
    title: "Appartement lumineux trois chambres",
    description:
      "Bel appartement traversant avec séjour ouvert et balcon. Idéal pour une famille recherchant calme et proximité des écoles.",
    basePrice: 850,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 95,
  },
  {
    slug: "appartement",
    kind: PropertyKind.APARTMENT,
    offer: OfferType.SALE,
    title: "Appartement rénové avec vue dégagée",
    description:
      "Appartement entièrement rénové, finitions soignées et rangements intégrés. Une opportunité rare pour un premier achat en ville.",
    basePrice: 98000,
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 78,
  },
  {
    slug: "maison",
    kind: PropertyKind.HOUSE,
    offer: OfferType.RENT,
    title: "Maison familiale avec cour intérieure",
    description:
      "Maison confortable disposant d'une cour ombragée et d'un espace de réception. Parfaite pour un quotidien familial à Kinshasa.",
    basePrice: 720,
    bedrooms: 4,
    bathrooms: 2,
    areaM2: 140,
  },
  {
    slug: "maison",
    kind: PropertyKind.HOUSE,
    offer: OfferType.SALE,
    title: "Maison à personnaliser, bel emplacement",
    description:
      "Maison solide sur une parcelle bien orientée, à remettre au goût du jour. Le quartier offre commerces et transports à proximité.",
    basePrice: 72000,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 120,
  },
  {
    slug: "villa",
    kind: PropertyKind.VILLA,
    offer: OfferType.RENT,
    title: "Villa standing avec jardin privé",
    description:
      "Villa spacieuse, salon double hauteur et jardin arboré. Prestations haut de gamme pour un accueil professionnel ou familial.",
    basePrice: 2800,
    bedrooms: 5,
    bathrooms: 4,
    areaM2: 320,
  },
  {
    slug: "villa",
    kind: PropertyKind.VILLA,
    offer: OfferType.SALE,
    title: "Villa contemporaine sécurisée",
    description:
      "Architecture moderne, suite parentale et annexe indépendante. Résidence fermée avec gardiennage et accès aisé au centre-ville.",
    basePrice: 385000,
    bedrooms: 5,
    bathrooms: 4,
    areaM2: 380,
  },
  {
    slug: "terrain",
    kind: PropertyKind.LAND,
    offer: OfferType.SALE,
    title: "Terrain constructible viabilisé",
    description:
      "Parcelle plane, prête à bâtir, avec accès bitumé. Idéale pour un projet résidentiel ou un petit immeuble de rapport.",
    basePrice: 48000,
    bedrooms: null,
    bathrooms: null,
    areaM2: 450,
  },
  {
    slug: "terrain",
    kind: PropertyKind.LAND,
    offer: OfferType.SALE,
    title: "Parcelle titrée en zone calme",
    description:
      "Terrain titré, borné et facilement accessible. Environnement résidentiel recherché pour une construction pérenne.",
    basePrice: 82000,
    bedrooms: null,
    bathrooms: null,
    areaM2: 600,
  },
  {
    slug: "appartement",
    kind: PropertyKind.APARTMENT,
    offer: OfferType.RENT,
    title: "Studio meublé prêt à emménager",
    description:
      "Studio fonctionnel et meublé, cuisine équipée et connexion internet. Solution clé en main pour un séjour professionnel.",
    basePrice: 380,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 42,
  },
  {
    slug: "maison",
    kind: PropertyKind.HOUSE,
    offer: OfferType.RENT,
    title: "Maison quatre chambres proche commodités",
    description:
      "Grande maison bien entretenue, pièce de séjour généreuse et dépendance. À deux pas des marchés et des axes principaux.",
    basePrice: 1150,
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 180,
  },
];

const SERVICE_TITLES: Record<string, { title: string; description: string }> = {
  electricite: {
    title: "Installation et dépannage électrique",
    description:
      "Mise aux normes, tableaux électriques et interventions d'urgence. Équipe certifiée pour particuliers et petits commerces.",
  },
  plomberie: {
    title: "Plomberie et réseaux d'eau",
    description:
      "Réparation de fuites, pose de sanitaires et entretien des canalisations. Devis clair avant chaque intervention.",
  },
  menuiserie: {
    title: "Menuiserie bois et aluminium",
    description:
      "Portes, fenêtres et aménagements sur mesure. Finitions soignées adaptées au climat de Kinshasa.",
  },
  peinture: {
    title: "Peinture intérieure et façade",
    description:
      "Préparation des supports et application professionnelle. Résultat propre, durable et respectueux des délais.",
  },
  decoration: {
    title: "Décoration et aménagement d'intérieur",
    description:
      "Conseils d'ambiance, choix de matériaux et coordination des artisans. Transformez vos espaces avec élégance.",
  },
  demenagement: {
    title: "Déménagement sécurisé à Kinshasa",
    description:
      "Emballage, transport et réinstallation soignés. Véhicules adaptés et équipe ponctuelle pour vos déménagements.",
  },
  batiment: {
    title: "Maçonnerie et gros œuvre",
    description:
      "Extensions, dalles et réfections structurelles. Suivi de chantier transparent pour un résultat solide.",
  },
  mecanique: {
    title: "Maintenance mécanique et équipements",
    description:
      "Entretien de groupes, pompes et équipements techniques. Diagnostic rapide et pièces de qualité.",
  },
  ameublement: {
    title: "Fabrication et pose de meubles",
    description:
      "Meubles sur mesure, dressings et cuisines. Du plan à la pose, un accompagnement complet.",
  },
};

async function main() {
  await confirmSeedTruncate("seed de démonstration (npm run seed:demo)");
  console.log("Seed DEMO — nettoyage…");
  clearDemoUploads();
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

  const neighborhoodsByCommune: Record<string, { id: string; name: string }[]> =
    {};
  for (const [communeName, names] of Object.entries(NEIGHBORHOODS)) {
    const commune = communeByName[communeName]!;
    neighborhoodsByCommune[communeName] = await Promise.all(
      names.map((name) =>
        prisma.neighborhood.create({
          data: { communeId: commune.id, name },
        })
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
      {
        fullName: "Jean Mukendi",
        email: "jean.mukendi@example.com",
        phone: "+243810000011",
      },
      {
        fullName: "Marie Kabongo",
        email: "marie.kabongo@example.com",
        phone: "+243810000012",
      },
      {
        fullName: "Patrick Ilunga",
        email: "patrick.ilunga@example.com",
        phone: "+243810000013",
      },
      {
        fullName: "Sarah Kalonji",
        email: "sarah.kalonji@example.com",
        phone: "+243810000014",
      },
      {
        fullName: "Eric Mbuyi",
        email: "eric.mbuyi@example.com",
        phone: "+243810000015",
      },
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
      description:
        "Agence immobilière spécialisée Gombe et Ngaliema. Accompagnement location et vente.",
    },
    {
      fullName: "David Tshisekedi",
      email: "david.tshisekedi@example.com",
      phone: "+243820000022",
      type: ProviderType.INDIVIDUAL,
      displayName: "David Propriétés",
      description:
        "Propriétaire bailleur de villas et appartements soigneusement entretenus.",
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
      description:
        "Agence immobilière Limete et Masina. Biens vérifiés pour familles et investisseurs.",
    },
  ] as const;

  const providerLogoFiles = listAssetFiles("providers");
  const providerUsers = [];
  for (let i = 0; i < providerDefs.length; i++) {
    const p = providerDefs[i]!;
    const logoSrc = providerLogoFiles[i % providerLogoFiles.length]!;
    const logoUrl = copyAssetToUploads(logoSrc, `provider-${i + 1}.jpg`);
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
            logoUrl,
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

  const assetsByKind: Record<string, string[]> = {
    maison: listAssetFiles("maison"),
    appartement: listAssetFiles("appartement"),
    villa: listAssetFiles("villa"),
    terrain: listAssetFiles("terrain"),
  };

  console.log("25 biens Kinshasa…");
  const properties = [];
  for (let i = 0; i < 25; i++) {
    const template = PROPERTY_TEMPLATES[i % PROPERTY_TEMPLATES.length]!;
    const communeName = communePool[i % communePool.length]!;
    const commune = communeByName[communeName]!;
    const nbs = neighborhoodsByCommune[communeName];
    const neighborhood = nbs?.[i % (nbs.length || 1)];
    const ownerProfile =
      i % 3 === 0 ? agency : i % 3 === 1 ? individual : agency2;
    const ownerUser = providerUsers.find(
      (u) => u.providerProfile?.id === ownerProfile.id
    )!;

    const factor = COMMUNE_PRICE_FACTOR[communeName] ?? 1;
    const price = Math.round(template.basePrice * factor);
    const hasTitleDeed = template.kind === PropertyKind.LAND || i % 3 !== 0;
    const coords = COMMUNE_COORDS[communeName] ?? { lat: -4.33, lng: 15.31 };
    const folder = kindFolder(template.kind);
    const kindFiles = assetsByKind[folder]!;
    const photoA = kindFiles[i % kindFiles.length]!;
    const photoB = kindFiles[(i + 1) % kindFiles.length]!;
    const urlA = copyAssetToUploads(photoA, `property-${i + 1}-a.jpg`);
    const urlB = copyAssetToUploads(photoB, `property-${i + 1}-b.jpg`);
    const street = neighborhood?.name ?? "Avenue principale";

    const property = await prisma.property.create({
      data: {
        ownerId: ownerUser.id,
        providerProfileId: ownerProfile.id,
        categoryId: catBySlug[template.slug]!.id,
        offerType: template.offer,
        kind: template.kind,
        title: `${template.title} à ${communeName}`,
        description: template.description,
        price,
        currency: "USD",
        communeId: commune.id,
        neighborhoodId: neighborhood?.id ?? null,
        address: `${12 + (i % 80)}, ${street}, ${communeName}`,
        latitude: coords.lat + (i % 7) * 0.001,
        longitude: coords.lng + (i % 5) * 0.001,
        bedrooms: template.bedrooms,
        bathrooms: template.bathrooms,
        areaM2: template.areaM2 + (i % 5) * 5,
        parking: i % 2 === 0,
        hasPool: template.kind === PropertyKind.VILLA,
        hasTitleDeed,
        tags: pickTags(template.kind, hasTitleDeed, i),
        status: ListingStatus.APPROVED,
        isFeatured: i < 5,
        media: {
          create: [
            {
              url: urlA,
              type: MediaType.PHOTO,
              caption: "Vue principale",
              sortOrder: 0,
            },
            {
              url: urlB,
              type: MediaType.PHOTO,
              caption: "Autre vue",
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
    const copy = SERVICE_TITLES[slug] ?? {
      title: def.displayName,
      description: def.description,
    };
    const serviceFiles = listAssetFiles("services", slug);
    const mediaUrl = copyAssetToUploads(
      serviceFiles[0]!,
      `service-${slug}-${i}.jpg`
    );

    const service = await prisma.service.create({
      data: {
        providerProfileId: profile.id,
        categoryId: catBySlug[slug]!.id,
        title: copy.title,
        description: copy.description,
        subServices: ["Devis gratuit", "Intervention rapide", "Garantie"],
        status: ListingStatus.APPROVED,
        isFeatured: i < 5,
        coverageCommunes: {
          connect: communes.slice(0, 6).map((c) => ({ id: c.id })),
        },
        media: {
          create: [
            {
              url: mediaUrl,
              type: MediaType.PHOTO,
              caption: "Réalisation",
              sortOrder: 0,
            },
          ],
        },
      },
    });
    services.push(service);

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
        message: "Prestation réalisée dans les délais convenus.",
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
        comment: "Travail soigné, équipe ponctuelle et à l'écoute.",
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
        message: `Demande de visite pour le bien sélectionné.`,
        status,
        paymentStatus:
          status === RequestStatus.COMPLETED || status === RequestStatus.APPROVED
            ? PaymentStatus.PAID
            : PaymentStatus.UNPAID,
        rejectionReason:
          status === RequestStatus.REJECTED
            ? "Dossier incomplet — pièces manquantes."
            : null,
        handledById: status === RequestStatus.PENDING ? null : admin.id,
      },
    });
  }

  console.log(
    `Seed DEMO terminé : ${properties.length} biens, ${providerUsers.length} prestataires, ${services.length} services.`
  );
  console.log(`Comptes : jean.mukendi@example.com / Password123!`);
  console.log(`claire.mbuyi@example.com / Provider123!`);
  console.log(
    `admin@ireduc.cd / Admin123! | superadmin@ireduc.cd / SuperAdmin123!`
  );
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
