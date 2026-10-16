import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../theme";
import {
  addMonths,
  buildMonthGrid,
  isBeforeToday,
  isSameDay,
  monthLabel,
  parseDateKey,
  toDateKey,
} from "../../utils/dates";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

type Props = {
  value: string | null;
  onChange: (dateKey: string) => void;
};

export function MonthCalendar({ value, onChange }: Props) {
  const selected = value ? parseDateKey(value) : null;
  const [month, setMonth] = useState(() =>
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  );
  const cells = useMemo(() => buildMonthGrid(month), [month]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={() => setMonth((m) => addMonths(m, -1))} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </Pressable>
        <Text style={styles.month}>{monthLabel(month)}</Text>
        <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={colors.navy} />
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`e-${index}`} style={styles.cell} />;
          const disabled = isBeforeToday(day);
          const active = selected ? isSameDay(day, selected) : false;
          return (
            <Pressable
              key={toDateKey(day)}
              disabled={disabled}
              onPress={() => onChange(toDateKey(day))}
              style={[styles.cell, active && styles.cellActive, disabled && styles.cellDisabled]}
            >
              <Text
                style={[
                  styles.dayText,
                  active && styles.dayTextActive,
                  disabled && styles.dayTextDisabled,
                ]}
              >
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  month: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  weekRow: { flexDirection: "row", marginBottom: spacing.sm },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellActive: {
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
  },
  cellDisabled: { opacity: 0.35 },
  dayText: { color: colors.navy, fontWeight: "700" },
  dayTextActive: { color: colors.white },
  dayTextDisabled: { color: colors.textMuted },
});
