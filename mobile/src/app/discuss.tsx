import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createConversation } from "../api/conversations";
import { CreateConversationInput } from "../api/types";
import { ListScreenHeader } from "../components/list/ListScreenHeader";
import { Button } from "../components/ui/Button";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { colors, spacing, typography } from "../theme";
import { getErrorMessage } from "../utils/errors";

export default function DiscussScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    id?: string;
    requestId?: string;
    title?: string;
  }>();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const returnTo = params.requestId
    ? `/discuss?requestId=${params.requestId}`
    : `/discuss?type=${params.type ?? "PROPERTY"}&id=${params.id ?? ""}`;

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(returnTo);
      return;
    }
    if (started.current) return;
    started.current = true;

    let input: CreateConversationInput | null = null;
    if (params.requestId) {
      input = { requestId: params.requestId };
    } else if (params.type === "SERVICE" && params.id) {
      input = { serviceId: params.id };
    } else if (params.id) {
      input = { propertyId: params.id };
    }

    if (!input) {
      setError("Cible de conversation manquante.");
      return;
    }

    void createConversation(input)
      .then((conversation) => {
        router.replace({
          pathname: "/conversation/[id]",
          params: { id: conversation.id },
        } as never);
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Impossible d'ouvrir la conversation."));
      });
  }, [
    isAuthenticated,
    params.id,
    params.requestId,
    params.type,
    requireAuth,
    returnTo,
    router,
  ]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <View style={styles.content}>
        <Text style={typography.title}>Messagerie</Text>
        {error ? (
          <>
            <Text style={styles.text}>{error}</Text>
            <Button
              label="Retour"
              variant="outline"
              style={{ marginTop: spacing.xl }}
              onPress={() => router.back()}
            />
          </>
        ) : (
          <>
            <Text style={styles.text}>Ouverture de la conversation…</Text>
            <ActivityIndicator
              style={{ marginTop: spacing.xl }}
              color={colors.navy}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  text: { ...typography.body, marginTop: spacing.md },
});
