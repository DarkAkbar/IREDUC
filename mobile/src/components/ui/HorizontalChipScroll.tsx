import { ReactNode } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { spacing } from "../../theme";

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * Rangée de puces / onglets horizontaux à hauteur naturelle
 * (ne s'étire pas dans un layout flex).
 */
export function HorizontalChipScroll({
  children,
  contentContainerStyle,
  style,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    flexGrow: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    /** Marge finale 16 px pour le défilement. */
    paddingRight: spacing.lg,
  },
});
