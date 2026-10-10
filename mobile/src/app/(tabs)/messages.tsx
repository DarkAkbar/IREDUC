import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { colors, spacing, typography } from "../../theme";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={typography.title}>Messages</Text>
      <Text style={styles.text}>
        Échangez avec les propriétaires et prestataires. L'écran complet arrive bientôt.
      </Text>
      {!isAuthenticated ? (
        <Button
          label="Se connecter"
          style={{ marginTop: spacing.lg }}
          onPress={() =>
            router.push({ pathname: "/auth/login", params: { returnTo: "/(tabs)/messages" } })
          }
        />
      ) : null}
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
