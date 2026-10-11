import { api } from "./client";
import {
  ConversationDetail,
  ConversationListItem,
  CreateConversationInput,
  Message,
  Paginated,
} from "./types";

export async function createConversation(input: CreateConversationInput) {
  const { data } = await api.post<ConversationDetail>("/conversations", input);
  return data;
}

export async function fetchConversations() {
  const { data } = await api.get<{ data: ConversationListItem[] }>(
    "/conversations"
  );
  return Array.isArray(data.data) ? data.data : [];
}

export async function fetchMessages(
  conversationId: string,
  params?: { page?: number; limit?: number }
) {
  const { data } = await api.get<Paginated<Message>>(
    `/conversations/${conversationId}/messages`,
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
      },
    }
  );
  return data;
}

export async function sendMessage(conversationId: string, content: string) {
  const { data } = await api.post<Message>(
    `/conversations/${conversationId}/messages`,
    { content }
  );
  return data;
}

export async function markConversationRead(conversationId: string) {
  const { data } = await api.patch<{ message: string; count: number }>(
    `/conversations/${conversationId}/read`
  );
  return data;
}

export async function fetchWhatsappLink(conversationId: string) {
  const { data } = await api.get<{ url: string; phone: string }>(
    `/conversations/${conversationId}/whatsapp-link`
  );
  return data;
}
