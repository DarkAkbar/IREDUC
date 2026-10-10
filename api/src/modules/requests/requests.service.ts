import {
  ListingStatus,
  MediaType,
  PaymentStatus,
  Prisma,
  ProjectType,
  RequestStatus,
  RequestTarget,
  VisitMode,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createNotification } from "../../services/notification.service";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { mapPropertyListItem } from "../properties/properties.mapper";
import { mapRequestListItem } from "./requests.mapper";

const targetInclude = {
  property: {
    include: {
      commune: { select: { id: true, name: true } },
      neighborhood: { select: { id: true, name: true } },
      media: {
        where: { type: MediaType.PHOTO },
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: { url: true },
      },
    },
  },
  service: {
    include: {
      category: { select: { name: true } },
      coverageCommunes: { select: { name: true } },
      providerProfile: { select: { userId: true } },
      media: {
        where: { type: MediaType.PHOTO },
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: { url: true },
      },
    },
  },
} satisfies Prisma.RequestInclude;

async function generateRequestNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dayKey = Number(`${y}${m}${d}`);
  const prefix = `IRD-${y}${m}${d}`;

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${dayKey})`;

  const last = await tx.request.findFirst({
    where: { number: { startsWith: `${prefix}-` } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const nextSeq = last ? Number(last.number.split("-").pop()) + 1 : 1;
  return `${prefix}-${String(nextSeq).padStart(3, "0")}`;
}

function getTargetOwnerId(request: {
  property: { ownerId: string } | null;
  service: { providerProfile: { userId: string } } | null;
}): string | null {
  if (request.property) return request.property.ownerId;
  if (request.service) return request.service.providerProfile.userId;
  return null;
}

async function resolveTarget(input: {
  targetType: RequestTarget;
  propertyId?: string;
  serviceId?: string;
}) {
  if (input.targetType === RequestTarget.PROPERTY && input.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
      include: { owner: { select: { id: true, fullName: true } } },
    });
    if (!property) throw notFound("Bien introuvable");
    if (property.status !== ListingStatus.APPROVED) {
      throw badRequest("Ce bien n'est pas disponible pour une demande");
    }
    return {
      ownerId: property.ownerId,
      title: property.title,
    };
  }

  if (input.targetType === RequestTarget.SERVICE && input.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: input.serviceId },
      include: {
        providerProfile: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!service) throw notFound("Service introuvable");
    if (service.status !== ListingStatus.APPROVED) {
      throw badRequest("Ce service n'est pas disponible pour une demande");
    }
    return {
      ownerId: service.providerProfile.userId,
      title: service.title,
    };
  }

  throw badRequest("Cible de demande invalide");
}

async function getRequestOrThrow(id: string) {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      ...targetInclude,
      requester: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          whatsapp: true,
        },
      },
    },
  });
  if (!request) throw notFound("Demande introuvable");
  return request;
}

function assertCanAccessRequest(
  userId: string,
  request: {
    requesterId: string;
    property: { ownerId: string } | null;
    service: { providerProfile: { userId: string } } | null;
  }
) {
  if (request.requesterId === userId) return "requester" as const;
  const ownerId = getTargetOwnerId(request);
  if (ownerId === userId) return "owner" as const;
  throw forbidden("Accès interdit à cette demande");
}

function ensureFromStatus(
  current: RequestStatus,
  expected: RequestStatus,
  nextLabel: string
) {
  if (current !== expected) {
    throw conflict(
      `Transition interdite : impossible de passer de ${current} à ${nextLabel}`,
      "INVALID_STATUS_TRANSITION"
    );
  }
}

export async function createRequest(
  requesterId: string,
  input: {
    targetType: RequestTarget;
    propertyId?: string;
    serviceId?: string;
    projectType: ProjectType;
    desiredDate?: Date;
    durationMonths?: number;
    occupants?: number;
    visitMode?: VisitMode;
    visitDate?: Date;
    visitSlot?: string;
    fullName: string;
    phone: string;
    email: string;
    whatsapp?: string;
    message?: string;
  }
) {
  if (input.visitDate && input.visitDate.getTime() < Date.now()) {
    throw badRequest("La date de visite ne peut pas être dans le passé");
  }

  const target = await resolveTarget(input);
  if (target.ownerId === requesterId) {
    throw badRequest(
      "Vous ne pouvez pas créer une demande sur votre propre annonce"
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const number = await generateRequestNumber(tx);
    return tx.request.create({
      data: {
        number,
        requesterId,
        targetType: input.targetType,
        propertyId:
          input.targetType === RequestTarget.PROPERTY
            ? input.propertyId!
            : null,
        serviceId:
          input.targetType === RequestTarget.SERVICE ? input.serviceId! : null,
        projectType: input.projectType,
        desiredDate: input.desiredDate ?? null,
        durationMonths: input.durationMonths ?? null,
        occupants: input.occupants ?? null,
        visitMode: input.visitMode ?? null,
        visitDate: input.visitDate ?? null,
        visitSlot: input.visitSlot ?? null,
        fullName: input.fullName.trim(),
        phone: input.phone,
        email: input.email.toLowerCase().trim(),
        whatsapp: input.whatsapp ?? null,
        message: input.message ?? null,
        status: RequestStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
      },
      include: targetInclude,
    });
  });

  await createNotification({
    userId: target.ownerId,
    type: "REQUEST_CREATED",
    title: "Nouvelle demande reçue",
    body: `Une nouvelle demande (${created.number}) concerne « ${target.title} ».`,
    data: { requestId: created.id, number: created.number },
  });

  return mapRequestListItem(created);
}

export async function listMine(
  requesterId: string,
  query: { page: number; limit: number; status?: RequestStatus }
) {
  const { page, limit, skip } = getPagination(query);
  const baseWhere = { requesterId };

  const [
    all,
    pending,
    approved,
    rejected,
    cancelled,
    completed,
    total,
    rows,
  ] = await prisma.$transaction([
    prisma.request.count({ where: baseWhere }),
    prisma.request.count({
      where: { ...baseWhere, status: RequestStatus.PENDING },
    }),
    prisma.request.count({
      where: { ...baseWhere, status: RequestStatus.APPROVED },
    }),
    prisma.request.count({
      where: { ...baseWhere, status: RequestStatus.REJECTED },
    }),
    prisma.request.count({
      where: { ...baseWhere, status: RequestStatus.CANCELLED },
    }),
    prisma.request.count({
      where: { ...baseWhere, status: RequestStatus.COMPLETED },
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        ...(query.status ? { status: query.status } : {}),
      },
    }),
    prisma.request.findMany({
      where: {
        ...baseWhere,
        ...(query.status ? { status: query.status } : {}),
      },
      include: targetInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const counters = {
    all,
    pending,
    approved,
    rejected,
    cancelled,
    completed,
  };

  return {
    counters,
    ...buildPaginatedResult(rows.map(mapRequestListItem), total, page, limit),
  };
}

export async function listReceived(
  ownerId: string,
  query: { page: number; limit: number; status?: RequestStatus }
) {
  const { page, limit, skip } = getPagination(query);

  const [ownedProperties, ownedServices] = await Promise.all([
    prisma.property.findMany({ where: { ownerId }, select: { id: true } }),
    prisma.service.findMany({
      where: { providerProfile: { userId: ownerId } },
      select: { id: true },
    }),
  ]);

  const where: Prisma.RequestWhereInput = {
    OR: [
      { propertyId: { in: ownedProperties.map((p) => p.id) } },
      { serviceId: { in: ownedServices.map((s) => s.id) } },
    ],
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.request.count({ where }),
    prisma.request.findMany({
      where,
      include: {
        ...targetInclude,
        requester: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return buildPaginatedResult(
    rows.map((row) => ({
      ...mapRequestListItem(row),
      requester: row.requester,
    })),
    total,
    page,
    limit
  );
}

export async function getById(userId: string, requestId: string) {
  const request = await getRequestOrThrow(requestId);
  const role = assertCanAccessRequest(userId, request);

  return {
    id: request.id,
    number: request.number,
    targetType: request.targetType,
    projectType: request.projectType,
    desiredDate: request.desiredDate,
    durationMonths: request.durationMonths,
    occupants: request.occupants,
    visitMode: request.visitMode,
    visitDate: request.visitDate,
    visitSlot: request.visitSlot,
    fullName: request.fullName,
    phone: request.phone,
    email: request.email,
    whatsapp: request.whatsapp,
    message: request.message,
    status: request.status,
    rejectionReason: request.rejectionReason,
    paymentStatus: request.paymentStatus,
    requester: request.requester,
    target: mapRequestListItem(request).target,
    accessRole: role,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export async function reviewRequest(
  ownerId: string,
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  reason?: string
) {
  const request = await getRequestOrThrow(requestId);
  const role = assertCanAccessRequest(ownerId, request);
  if (role !== "owner") {
    throw forbidden(
      "Seul le propriétaire de l'annonce peut modérer cette demande"
    );
  }

  ensureFromStatus(request.status, RequestStatus.PENDING, decision);

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status:
        decision === "APPROVED"
          ? RequestStatus.APPROVED
          : RequestStatus.REJECTED,
      rejectionReason: decision === "REJECTED" ? reason!.trim() : null,
      handledById: ownerId,
    },
    include: targetInclude,
  });

  await createNotification({
    userId: request.requesterId,
    type: decision === "APPROVED" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
    title: decision === "APPROVED" ? "Demande approuvée" : "Demande rejetée",
    body:
      decision === "APPROVED"
        ? `Votre demande ${request.number} a été approuvée.`
        : `Votre demande ${request.number} a été rejetée${reason ? ` : ${reason}` : "."}`,
    data: { requestId, decision },
  });

  return mapRequestListItem(updated);
}

export async function cancelRequest(requesterId: string, requestId: string) {
  const request = await getRequestOrThrow(requestId);
  if (request.requesterId !== requesterId) {
    throw forbidden("Seul le demandeur peut annuler cette demande");
  }
  ensureFromStatus(
    request.status,
    RequestStatus.PENDING,
    RequestStatus.CANCELLED
  );

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: RequestStatus.CANCELLED },
    include: targetInclude,
  });

  return mapRequestListItem(updated);
}

export async function completeRequest(ownerId: string, requestId: string) {
  const request = await getRequestOrThrow(requestId);
  const role = assertCanAccessRequest(ownerId, request);
  if (role !== "owner") {
    throw forbidden(
      "Seul le propriétaire de l'annonce peut clôturer cette demande"
    );
  }
  ensureFromStatus(
    request.status,
    RequestStatus.APPROVED,
    RequestStatus.COMPLETED
  );

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: RequestStatus.COMPLETED, handledById: ownerId },
    include: targetInclude,
  });

  await createNotification({
    userId: request.requesterId,
    type: "REQUEST_COMPLETED",
    title: "Demande terminée",
    body: `Votre demande ${request.number} est marquée comme terminée. Vous pouvez laisser un avis.`,
    data: { requestId },
  });

  return mapRequestListItem(updated);
}

export async function payRequest(requesterId: string, requestId: string) {
  const request = await getRequestOrThrow(requestId);
  if (request.requesterId !== requesterId) {
    throw forbidden("Seul le demandeur peut payer cette demande");
  }
  if (request.status !== RequestStatus.APPROVED) {
    throw conflict(
      "Le paiement n'est possible que pour une demande approuvée",
      "INVALID_STATUS_TRANSITION"
    );
  }
  if (request.paymentStatus !== PaymentStatus.UNPAID) {
    throw conflict("Cette demande est déjà payée", "ALREADY_PAID");
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { paymentStatus: PaymentStatus.PAID },
    include: targetInclude,
  });

  const ownerId = getTargetOwnerId(request);
  if (ownerId) {
    await createNotification({
      userId: ownerId,
      type: "REQUEST_PAID",
      title: "Paiement reçu (simulé)",
      body: `Le paiement de la demande ${request.number} a été enregistré.`,
      data: { requestId },
    });
  }

  return mapRequestListItem(updated);
}

export async function listSimilar(userId: string, requestId: string) {
  const request = await getRequestOrThrow(requestId);
  assertCanAccessRequest(userId, request);

  if (request.targetType !== RequestTarget.PROPERTY || !request.property) {
    return { data: [] };
  }

  if (request.status !== RequestStatus.REJECTED) {
    throw badRequest(
      "Les biens similaires sont disponibles uniquement pour une demande rejetée"
    );
  }

  const rows = await prisma.property.findMany({
    where: {
      status: ListingStatus.APPROVED,
      kind: request.property.kind,
      communeId: request.property.communeId,
      id: { not: request.property.id },
    },
    include: {
      commune: { select: { id: true, name: true } },
      neighborhood: { select: { id: true, name: true } },
      media: {
        where: { type: MediaType.PHOTO },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      owner: {
        select: {
          id: true,
          fullName: true,
          emailVerified: true,
          phone: true,
          whatsapp: true,
          providerProfile: {
            select: {
              id: true,
              displayName: true,
              type: true,
              logoUrl: true,
              reviewStatus: true,
              phone: true,
              whatsapp: true,
            },
          },
        },
      },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return { data: rows.map(mapPropertyListItem) };
}
