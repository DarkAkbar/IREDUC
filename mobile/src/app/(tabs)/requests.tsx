import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { colors, spacing, typography } from "../../theme";

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push({ pathname: "/auth/login", params: { returnTo: "/(tabs)/requests" } });
    }
  }, [isAuthenticated, isHydrated, router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={typography.title}>Mes demandes</Text>
      <Text style={styles.text}>
        Suivez vos réservations et demandes de services. Le détail arrive bientôt.
      </Text>
      {!isAuthenticated ? (
        <Button
          label="Se connecter"
          style={{ marginTop: spacing.lg }}
          onPress={() =>
            router.push({ pathname: "/auth/login", params: { returnTo: "/(tabs)/requests" } })
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
