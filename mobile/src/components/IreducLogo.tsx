import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

type Props = {
  tagline?: string;
  compact?: boolean;
};

export function IreducLogo({
  tagline = "Trouvez. Comparez. Réalisez.",
  compact = false,
}: Props) {
  return (
    <View>
      <View style={styles.row}>
        <Ionicons name="home-outline" size={compact ? 22 : 26} color={colors.primary} />
        <Text style={[styles.brand, compact && styles.brandCompact]}>IREDUC</Text>
      </View>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brand: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandCompact: { fontSize: 18 },
  tagline: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginLeft: 2,
  },
});
