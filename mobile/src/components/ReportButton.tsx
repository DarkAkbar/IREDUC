import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { submitReport, type ReportTargetType } from "../api/reports";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { colors, spacing, typography } from "../theme";

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  returnTo: string;
};

export function ReportButton({ targetType, targetId, returnTo }: Props) {
  const { requireAuth } = useRequireAuth();

  function onPress() {
    if (!requireAuth(returnTo)) return;

    Alert.alert(
      "Signaler",
      "Signaler ce contenu à l'équipe IREDUC pour modération ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Signaler",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await submitReport({
                  targetType,
                  targetId,
                  reason: "Contenu signalé depuis l'application mobile",
                });
                Alert.alert("Signalement", "Merci, votre signalement a été enregistré.");
              } catch {
                Alert.alert(
                  "Signalement",
                  "Impossible d'envoyer le signalement. Réessayez."
                );
              }
            })();
          },
        },
      ]
    );
  }

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name="flag-outline" size={20} color={colors.navy} />
      <Text style={styles.label}>Signaler</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.bodySm,
    color: colors.navy,
    fontWeight: "600",
  },
});
