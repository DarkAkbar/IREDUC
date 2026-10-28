import { ListingStatus, MediaType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createNotification } from "../../services/notification.service";
import {
  badRequest,
  forbidden,
  notFound,
} from "../../utils/errors";
import {
  buildPaginatedResult,
  getPagination,
} from "../../utils/pagination";
import { phoneDigitsForWhatsApp } from "../../utils/phone";

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
  if (!participant) {
    throw forbidden("Accès interdit à cette conversation");
  }
}

async function resolveCounterpart(input: {
  userId: string;
  requestId?: string;
  propertyId?: string;
  serviceId?: string;
}) {
  if (input.requestId) {
    const request = await prisma.request.findUnique({
      where: { id: input.requestId },
      include: {
        property: true,
        service: { include: { providerProfile: true } },
      },
    });
    if (!request) throw notFound("Demande introuvable");

    let ownerId: string | null = null;
    if (request.property) ownerId = request.property.ownerId;
    if (request.service) ownerId = request.service.providerProfile.userId;

    if (input.userId !== request.requesterId && input.userId !== ownerId) {
      throw forbidden("Vous n'êtes pas partie prenante de cette demande");
    }

    const otherUserId =
      input.userId === request.requesterId ? ownerId! : request.requesterId;

    return {
      otherUserId,
      requestId: request.id,
      propertyId: request.propertyId,
      serviceId: request.serviceId,
    };
  }

  if (input.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    });
    if (!property || property.status !== ListingStatus.APPROVED) {
      throw notFound("Bien introuvable");
    }
    if (property.ownerId === input.userId) {
      throw badRequest("Vous ne pouvez pas démarrer une conversation avec vous-même");
    }
    return {
      otherUserId: property.ownerId,
      requestId: null as string | null,
      propertyId: property.id,
      serviceId: null as string | null,
    };
  }

  if (input.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: input.serviceId },
      include: { providerProfile: true },
    });
    if (!service || service.status !== ListingStatus.APPROVED) {
      throw notFound("Service introuvable");
    }
    if (service.providerProfile.userId === input.userId) {
      throw badRequest("Vous ne pouvez pas démarrer une conversation avec vous-même");
    }
    return {
      otherUserId: service.providerProfile.userId,
      requestId: null as string | null,
      propertyId: null as string | null,
      serviceId: service.id,
    };
  }

  throw badRequest("Cible de conversation invalide");
}

export async function createOrReuse(
  userId: string,
  input: { requestId?: string; propertyId?: string; serviceId?: string }
) {
  const counterpart = await resolveCounterpart({ userId, ...input });

  if (input.requestId) {
    const existingByRequest = await prisma.conversation.findUnique({
      where: { requestId: input.requestId },
      include: { participants: true },
    });
    if (existingByRequest) {
      return existingByRequest;
    }
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      ...(counterpart.propertyId
        ? { propertyId: counterpart.propertyId }
        : {}),
      ...(counterpart.serviceId ? { serviceId: counterpart.serviceId } : {}),
      ...(counterpart.requestId ? { requestId: counterpart.requestId } : {}),
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: counterpart.otherUserId } } },
      ],
    },
    include: { participants: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      requestId: counterpart.requestId,
      propertyId: counterpart.propertyId,
      serviceId: counterpart.serviceId,
      participants: {
        create: [{ userId }, { userId: counterpart.otherUserId }],
      },
    },
    include: { participants: true },
  });
}

export async function listConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true, whatsapp: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          offerType: true,
          media: {
            where: { type: MediaType.PHOTO },
            orderBy: { sortOrder: "asc" as const },
            take: 1,
            select: { url: true },
          },
        },
      },
      service: {
        select: {
          id: true,
          title: true,
          media: {
            where: { type: MediaType.PHOTO },
            orderBy: { sortOrder: "asc" as const },
            take: 1,
            select: { url: true },
          },
        },
      },
      request: { select: { id: true, number: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const withUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          readAt: null,
        },
      });

      const other = conversation.participants.find((p) => p.userId !== userId);
      const property = conversation.property
        ? {
            id: conversation.property.id,
            title: conversation.property.title,
            price: Number(conversation.property.price),
            currency: conversation.property.currency,
            offerType: conversation.property.offerType,
            photo: conversation.property.media[0]?.url ?? null,
          }
        : null;
      const service = conversation.service
        ? {
            id: conversation.service.id,
            title: conversation.service.title,
            photo: conversation.service.media[0]?.url ?? null,
          }
        : null;

      return {
        id: conversation.id,
        request: conversation.request,
        property,
        service,
        otherParticipant: other?.user ?? null,
        lastMessage: conversation.messages[0] ?? null,
        unreadCount,
        updatedAt: conversation.updatedAt,
      };
    })
  );

  return { data: withUnread };
}

export async function listMessages(
  userId: string,
  conversationId: string,
  query: { page: number; limit: number }
) {
  await assertParticipant(conversationId, userId);
  const { page, limit, skip } = getPagination(query);

  const where = { conversationId };
  const [total, data] = await prisma.$transaction([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    }),
  ]);

  return buildPaginatedResult(data.reverse(), total, page, limit);
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string
) {
  await assertParticipant(conversationId, userId);

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return created;
  });

  const other = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: { not: userId } },
  });

  if (other) {
    await createNotification({
      userId: other.userId,
      type: "NEW_MESSAGE",
      title: "Nouveau message",
      body: content.trim().slice(0, 120),
      data: { conversationId, messageId: message.id },
    });
  }

  return message;
}

export async function markRead(userId: string, conversationId: string) {
  await assertParticipant(conversationId, userId);

  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { message: "Messages marqués comme lus.", count: result.count };
}

export async function getWhatsappLink(userId: string, conversationId: string) {
  await assertParticipant(conversationId, userId);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, fullName: true, whatsapp: true, phone: true },
          },
        },
      },
      property: { select: { title: true } },
      service: { select: { title: true } },
      request: { select: { number: true } },
    },
  });

  if (!conversation) throw notFound("Conversation introuvable");

  const other = conversation.participants.find((p) => p.userId !== userId)?.user;
  if (!other) throw notFound("Interlocuteur introuvable");

  const raw = other.whatsapp || other.phone;
  if (!raw) {
    throw badRequest(
      "Aucun numéro WhatsApp n'est disponible pour cet interlocuteur",
      undefined,
      "WHATSAPP_MISSING"
    );
  }

  const digits = phoneDigitsForWhatsApp(raw);
  const me = conversation.participants.find((p) => p.userId === userId)?.user;
  const topic =
    conversation.property?.title ||
    conversation.service?.title ||
    conversation.request?.number ||
    "IREDUC";

  const text = encodeURIComponent(
    `Bonjour ${other.fullName}, je vous contacte via IREDUC concernant « ${topic} ». — ${me?.fullName ?? ""}`
  );

  return {
    url: `https://wa.me/${digits}?text=${text}`,
    phone: digits,
  };
}
