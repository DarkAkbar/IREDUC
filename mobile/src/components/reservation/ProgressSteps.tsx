import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";

const STEPS = [
  { n: 1, label: "Projet" },
  { n: 2, label: "Visite" },
  { n: 3, label: "Coordonnées" },
  { n: 4, label: "Confirmation" },
];

type Props = {
  current: number;
  visitLabel?: string;
};

export function ProgressSteps({ current, visitLabel = "Visite" }: Props) {
  const labels = STEPS.map((s) =>
    s.n === 2 ? { ...s, label: visitLabel } : s
  );

  return (
    <View style={styles.row}>
      {labels.map((step, index) => {
        const done = current > step.n;
        const active = current === step.n;
        return (
          <View key={step.n} style={styles.item}>
            <View style={styles.circleRow}>
              {index > 0 ? (
                <View style={[styles.line, current >= step.n && styles.lineActive]} />
              ) : (
                <View style={styles.lineSpacer} />
              )}
              <View
                style={[
                  styles.circle,
                  done && styles.circleDone,
                  active && styles.circleActive,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      (active || done) && styles.circleTextActive,
                    ]}
                  >
                    {step.n}
                  </Text>
                )}
              </View>
              {index < labels.length - 1 ? (
                <View
                  style={[styles.line, current > step.n && styles.lineActive]}
                />
              ) : (
                <View style={styles.lineSpacer} />
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: spacing.sm },
  item: { flex: 1, alignItems: "center" },
  circleRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  line: { flex: 1, height: 2, backgroundColor: colors.border },
  lineActive: { backgroundColor: colors.navy },
  lineSpacer: { flex: 1 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  circleDone: { backgroundColor: colors.navy, borderColor: colors.navy },
  circleText: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
  circleTextActive: { color: colors.white },
  label: {
    marginTop: 6,
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
  labelActive: { color: colors.navy, fontWeight: "800" },
});
