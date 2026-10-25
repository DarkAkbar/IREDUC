import { Prisma, RequestStatus, RequestTarget } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createNotifications } from "../../services/notification.service";
import { badRequest, conflict, notFound } from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { logAdminAction } from "./admin.shared";

function getOwnerId(request: {
  property: { ownerId: string } | null;
  service: { providerProfile: { userId: string } } | null;
}): string | null {
  if (request.property) return request.property.ownerId;
  if (request.service) return request.service.providerProfile.userId;
  return null;
}

export async function listRequests(query: {
  page: number;
  limit: number;
  status?: RequestStatus;
  type?: RequestTarget;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { page, limit, skip } = getPagination(query);
  const createdAt: Prisma.DateTimeFilter = {};
  if (query.dateFrom) {
    createdAt.gte = new Date(query.dateFrom);
  }
  if (query.dateTo) {
    const end = new Date(query.dateTo);
    end.setHours(23, 59, 59, 999);
    createdAt.lte = end;
  }

  const where: Prisma.RequestWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { targetType: query.type } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    ...(query.search
      ? {
          OR: [
            { number: { contains: query.search, mode: "insensitive" } },
            { fullName: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
            {
              requester: {
                fullName: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              requester: {
                phone: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              property: {
                title: { contains: query.search, mode: "insensitive" },
              },
            },
            {
              service: {
                title: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.request.count({ where }),
    prisma.request.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            owner: {
              select: { id: true, fullName: true, phone: true, email: true },
            },
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            providerProfile: {
              select: {
                user: {
                  select: { id: true, fullName: true, phone: true, email: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const data = rows.map((row) => {
    const owner =
      row.property?.owner ??
      row.service?.providerProfile.user ??
      null;
    const targetTitle = row.property?.title ?? row.service?.title ?? null;
    return {
      id: row.id,
      number: row.number,
      targetType: row.targetType,
      status: row.status,
      createdAt: row.createdAt,
      requester: row.requester,
      owner,
      target: {
        type: row.targetType,
        id: row.propertyId ?? row.serviceId,
        title: targetTitle,
      },
    };
  });

  return buildPaginatedResult(data, total, page, limit);
}

export async function getRequest(requestId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      requester: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          whatsapp: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          status: true,
          owner: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
        },
      },
      service: {
        select: {
          id: true,
          title: true,
          status: true,
          providerProfile: {
            select: {
              displayName: true,
              user: {
                select: { id: true, fullName: true, phone: true, email: true },
              },
            },
          },
        },
      },
      handledBy: {
        select: { id: true, fullName: true, phone: true, email: true },
      },
    },
  });

  if (!request) {
    throw notFound("Demande introuvable");
  }

  const adminHistory = await prisma.adminAction.findMany({
    where: { targetType: "REQUEST", targetId: requestId },
    orderBy: { createdAt: "asc" },
    include: {
      admin: { select: { id: true, fullName: true, email: true } },
    },
  });

  const statusHistory = [
    {
      status: RequestStatus.PENDING,
      at: request.createdAt,
      source: "system" as const,
      label: "Demande créée",
    },
    ...adminHistory.map((h) => ({
      status: h.action.includes("CANCEL")
        ? RequestStatus.CANCELLED
        : request.status,
      at: h.createdAt,
      source: "admin" as const,
      label: h.action,
      reason: h.reason,
      admin: h.admin,
    })),
  ];

  if (
    request.status !== RequestStatus.PENDING &&
    !adminHistory.some((h) => h.action.includes(request.status))
  ) {
    statusHistory.push({
      status: request.status,
      at: request.updatedAt,
      source: "system" as const,
      label: `Statut actuel : ${request.status}`,
    });
  }

  return {
    ...request,
    owner:
      request.property?.owner ??
      request.service?.providerProfile.user ??
      null,
    statusHistory,
  };
}

export async function cancelRequestAsAdmin(
  adminId: string,
  requestId: string,
  reason: string
) {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    throw badRequest("Le motif est obligatoire (3 caractères minimum)");
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      property: { select: { ownerId: true } },
      service: {
        select: { providerProfile: { select: { userId: true } } },
      },
    },
  });

  if (!request) {
    throw notFound("Demande introuvable");
  }

  if (
    request.status === RequestStatus.CANCELLED ||
    request.status === RequestStatus.COMPLETED
  ) {
    throw conflict(
      "Cette demande ne peut plus être annulée",
      "INVALID_STATUS_TRANSITION"
    );
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: RequestStatus.CANCELLED,
      rejectionReason: trimmed,
      handledById: adminId,
    },
  });

  await logAdminAction(
    adminId,
    "REQUEST",
    requestId,
    "CANCEL_REQUEST",
    trimmed
  );

  const ownerId = getOwnerId(request);
  const recipients = [request.requesterId, ownerId].filter(
    (id): id is string => Boolean(id) && id !== adminId
  );
  const uniqueRecipients = [...new Set(recipients)];

  await createNotifications(
    uniqueRecipients.map((userId) => ({
      userId,
      type: "REQUEST_CANCELLED_BY_ADMIN",
      title: "Demande annulée par l'administration",
      body: `La demande ${request.number} a été annulée. Motif : ${trimmed}`,
      data: { requestId, number: request.number },
    }))
  );

  return updated;
}
