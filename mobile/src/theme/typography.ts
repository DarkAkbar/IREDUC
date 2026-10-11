import { TextStyle } from "react-native";
import { colors } from "./colors";

export const typography = {
  hero: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.navy,
  } satisfies TextStyle,
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.navy,
  } satisfies TextStyle,
  section: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.navy,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.textMuted,
  } satisfies TextStyle,
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.navy,
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
  } satisfies TextStyle,
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  } satisfies TextStyle,
} as const;
