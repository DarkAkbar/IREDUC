import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { colors, spacing, typography } from "../../theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={typography.title}>Profil</Text>
      {isAuthenticated && user ? (
        <>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.text}>{user.email}</Text>
          <Button
            label="Se déconnecter"
            variant="outline"
            style={{ marginTop: spacing.xl }}
            onPress={() => void logout()}
          />
        </>
      ) : (
        <>
          <Text style={styles.text}>
            Connectez-vous pour gérer votre compte et vos annonces.
          </Text>
          <Button
            label="Se connecter"
            style={{ marginTop: spacing.lg }}
            onPress={() => router.push("/auth/login")}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  name: { ...typography.section, marginTop: spacing.lg },
  text: { ...typography.body, marginTop: spacing.sm },
});
