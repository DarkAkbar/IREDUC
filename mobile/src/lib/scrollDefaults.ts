import { FlatList, ScrollView, SectionList } from "react-native";

const HIDDEN_INDICATORS = {
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
} as const;

/**
 * Masque les barres de défilement par défaut dans toute l'app.
 * À appeler une fois au démarrage (root layout).
 */
export function applyScrollDefaults() {
  const scroll = ScrollView as typeof ScrollView & {
    defaultProps?: Record<string, unknown>;
  };
  const list = FlatList as typeof FlatList & {
    defaultProps?: Record<string, unknown>;
  };
  const section = SectionList as typeof SectionList & {
    defaultProps?: Record<string, unknown>;
  };

  scroll.defaultProps = {
    ...scroll.defaultProps,
    ...HIDDEN_INDICATORS,
  };
  list.defaultProps = {
    ...list.defaultProps,
    ...HIDDEN_INDICATORS,
  };
  section.defaultProps = {
    ...section.defaultProps,
    ...HIDDEN_INDICATORS,
  };
}
