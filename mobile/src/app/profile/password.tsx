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
import { changePassword } from "../../api/users";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { colors, radii, spacing, typography } from "../../theme";
import { getErrorMessage } from "../../utils/errors";

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!currentPassword || !newPassword) {
      Alert.alert("Mot de passe", "Renseignez tous les champs.");
      return;
    }
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      Alert.alert(
        "Mot de passe",
        "Le nouveau mot de passe doit contenir au moins 8 caractères et un chiffre."
      );
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert("Mot de passe", "La confirmation ne correspond pas.");
      return;
    }
    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      Alert.alert("Mot de passe", result.message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        "Mot de passe",
        getErrorMessage(error, "Impossible de modifier le mot de passe.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Changer le mot de passe</Text>
        <Text style={styles.hint}>
          Après modification, vous pourrez rester connecté sur cet appareil.
        </Text>

        <Text style={styles.label}>Mot de passe actuel</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Confirmer</Text>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <Button
          label="Enregistrer"
          loading={loading}
          onPress={() => void onSubmit()}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  hint: { ...typography.body, marginTop: spacing.sm, marginBottom: spacing.md },
  label: {
    color: colors.navy,
    fontWeight: "700",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
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
