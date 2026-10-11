import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../theme";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={typography.title}>Rechercher</Text>
      <Text style={styles.text}>
        La recherche détaillée (listes et filtres) arrive à l'étape 5B.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  text: { ...typography.body, marginTop: spacing.md },
});
