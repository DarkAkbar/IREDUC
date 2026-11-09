import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";

/** Hauteur de la bande fixe sous l'en-tête (tous les écrans ScreenLayout). */
export const SEPARATOR_HEIGHT = 5;

/** Couleur de la bande fixe sous l'en-tête. */
export const SEPARATOR_COLOR = "#E4E8F0";

/** @deprecated Utiliser SEPARATOR_COLOR. */
export const SCREEN_SEPARATOR_COLOR = SEPARATOR_COLOR;

/** Style de contenu pour ScrollView / FlatList du corps. */
export const screenBodyContentStyle: ViewStyle = {
  paddingTop: 16,
  paddingHorizontal: 16,
};

type Props = {
  /** Zone fixe : titre (+ trailing éventuel). */
  header: ReactNode;
  /** Zone fixe sous la bande (ex. pastilles de catégories) — ne défile pas. */
  fixedBelow?: ReactNode;
  /** Corps principal (ScrollView ou FlatList). */
  children: ReactNode;
  /** FAB ou overlay hors scroll. */
  footer?: ReactNode;
};

/**
 * Gabarit : en-tête fixe + bande séparatrice + zone fixe optionnelle + corps scrollable.
 */
export function ScreenLayout({
  header,
  fixedBelow,
  children,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.fixedTop}>
        <View style={styles.header}>{header}</View>
        <View style={styles.separator} />
        {fixedBelow ? <View style={styles.fixedBelow}>{fixedBelow}</View> : null}
      </View>
      <View style={styles.body}>{children}</View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fixedTop: {
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
  },
  separator: {
    width: "100%",
    height: SEPARATOR_HEIGHT,
    backgroundColor: SEPARATOR_COLOR,
  },
  fixedBelow: {
    backgroundColor: colors.background,
    paddingTop: 12,
    paddingBottom: 8,
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
