import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteAccount } from "../../api/users";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function confirmDelete() {
    if (!password) {
      Alert.alert("Suppression", "Saisissez votre mot de passe.");
      return;
    }
    Alert.alert(
      "Confirmation finale",
      "Cette action est irréversible. Confirmer la suppression ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: () => void doDelete(),
        },
      ]
    );
  }

  async function doDelete() {
    setLoading(true);
    try {
      await deleteAccount(password);
      await logout();
      Alert.alert("Compte supprimé", "Votre compte a été anonymisé.", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)" as never),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Suppression",
        getErrorMessage(error, "Impossible de supprimer le compte.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Supprimer mon compte</Text>
        <Text style={styles.warn}>
          Cette action anonymise votre profil. Voici ce qui se passera :
        </Text>
        <Text style={styles.bullet}>• Votre nom devient « Compte supprimé »</Text>
        <Text style={styles.bullet}>
          • Votre numéro et votre e-mail sont libérés
        </Text>
        <Text style={styles.bullet}>• Toutes vos sessions sont révoquées</Text>
        <Text style={styles.bullet}>• Vos annonces sont archivées</Text>
        <Text style={styles.bullet}>
          • Vos demandes en cours sont annulées
        </Text>
        <Text style={styles.bullet}>
          • L'historique des demandes terminées est conservé pour les autres
          utilisateurs
        </Text>

        <Text style={styles.label}>Mot de passe actuel</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Confirmez avec votre mot de passe"
          placeholderTextColor={colors.textMuted}
        />

        <Button
          label="Supprimer mon compte"
          loading={loading}
          onPress={confirmDelete}
          style={{ marginTop: spacing.xl, backgroundColor: colors.primary }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
  warn: {
    ...typography.body,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: "700",
    color: colors.navy,
  },
  bullet: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  label: {
    color: colors.navy,
    fontWeight: "700",
    marginBottom: spacing.xs,
    marginTop: spacing.xl,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.navy,
  },
});
