import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../../api/client";
import {
  fetchConversations,
  fetchMessages,
  fetchWhatsappLink,
  markConversationRead,
  sendMessage,
} from "../../api/conversations";
import { Message } from "../../api/types";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";
import { formatPrice } from "../../utils/format";
import { getErrorCode, getErrorMessage } from "../../utils/errors";

function formatBubbleTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const listRef = useRef<FlatList<Message>>(null);
  const [text, setText] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  const conversation = conversationsQuery.data?.find((c) => c.id === id);

  const messagesQuery = useQuery({
    queryKey: ["messages", id],
    enabled: Boolean(id),
    queryFn: () => fetchMessages(id!, { page: 1, limit: 80 }),
    refetchInterval: 5_000,
  });

  useEffect(() => {
    if (!id) return;
    void markConversationRead(id).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
  }, [id, queryClient, messagesQuery.dataUpdatedAt]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(id!, content),
    onSuccess: async () => {
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["messages", id] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
    },
    onError: (error) => {
      Alert.alert(
        "Envoi impossible",
        getErrorMessage(error, "Le message n'a pas pu être envoyé.")
      );
    },
  });

  async function onWhatsApp() {
    if (!id) return;
    try {
      const link = await fetchWhatsappLink(id);
      await Linking.openURL(link.url);
    } catch (error) {
      const code = getErrorCode(error);
      Alert.alert(
        "WhatsApp",
        code === "WHATSAPP_MISSING"
          ? "Aucun numéro WhatsApp n'est disponible pour cet interlocuteur."
          : getErrorMessage(
              error,
              "Impossible d'ouvrir WhatsApp pour cet interlocuteur."
            )
      );
    }
  }

  const messages = messagesQuery.data?.data ?? [];
  const photo = mediaUrl(
    conversation?.property?.photo ?? conversation?.service?.photo
  );
  const title =
    conversation?.property?.title ??
    conversation?.service?.title ??
    conversation?.otherParticipant?.fullName ??
    "Discussion";
  const price =
    conversation?.property?.price != null
      ? formatPrice(
          conversation.property.price,
          conversation.property.offerType
        ).replace(" $", " USD")
      : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ListScreenHeader showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.targetCard}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.targetPhoto} contentFit="cover" />
          ) : (
            <View style={[styles.targetPhoto, styles.photoFallback]}>
              <Ionicons name="home-outline" size={22} color={colors.textMuted} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.targetTitle} numberOfLines={2}>
              {title}
            </Text>
            {price ? <Text style={styles.targetPrice}>{price}</Text> : null}
            <Text style={styles.peer}>
              {conversation?.otherParticipant?.fullName ?? "Interlocuteur"}
            </Text>
          </View>
        </View>

        <Button
          label="Continuer sur WhatsApp"
          variant="whatsapp"
          onPress={() => void onWhatsApp()}
          style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}
        />

        {messagesQuery.isLoading ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.navy} />
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          renderItem={({ item }) => {
            const mine = item.senderId === userId;
            return (
              <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                    {formatBubbleTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !messagesQuery.isLoading ? (
              <Text style={styles.empty}>
                Envoyez le premier message pour démarrer la discussion.
              </Text>
            ) : null
          }
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Écrire un message…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!text.trim() || sendMutation.isPending) && styles.sendDisabled,
            ]}
            disabled={!text.trim() || sendMutation.isPending}
            onPress={() => sendMutation.mutate(text.trim())}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={colors.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  targetCard: {
    flexDirection: "row",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetPhoto: { width: 64, height: 64, borderRadius: radii.md },
  photoFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  targetTitle: { color: colors.navy, fontWeight: "800", fontSize: 14 },
  targetPrice: { color: colors.primary, fontWeight: "800", marginTop: 2 },
  peer: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },
  bubbleRow: { marginBottom: spacing.sm, alignItems: "flex-start" },
  bubbleRowMine: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "82%",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: { backgroundColor: colors.navy, borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.navy, fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: colors.white },
  bubbleTime: {
    marginTop: 4,
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: "flex-end",
  },
  bubbleTimeMine: { color: "rgba(255,255,255,0.75)" },
  empty: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.navy,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
});
