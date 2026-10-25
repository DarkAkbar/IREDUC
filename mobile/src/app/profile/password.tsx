import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

function passwordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Faible", color: colors.primary };
  if (score <= 3) return { score, label: "Moyen", color: "#D97706" };
  return { score, label: "Fort", color: "#16A34A" };
}

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const rules = useMemo(
    () => ({
      length: newPassword.length >= 8,
      digit: /\d/.test(newPassword),
    }),
    [newPassword]
  );
  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  async function onSubmit() {
    if (!currentPassword || !newPassword) {
      Alert.alert("Mot de passe", "Renseignez tous les champs.");
      return;
    }
    if (!rules.length || !rules.digit) {
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
          Après modification, vous serez déconnecté des autres appareils.
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

        {newPassword.length > 0 ? (
          <View style={styles.strengthBox}>
            <View style={styles.strengthTrack}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: `${Math.min(100, (strength.score / 5) * 100)}%`,
                    backgroundColor: strength.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>
              Force : {strength.label}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.rule, rules.length && styles.ruleOk]}>
          {rules.length ? "✓" : "○"} Au moins 8 caractères
        </Text>
        <Text style={[styles.rule, rules.digit && styles.ruleOk]}>
          {rules.digit ? "✓" : "○"} Au moins un chiffre
        </Text>

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
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
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
  strengthBox: { marginTop: spacing.sm },
  strengthTrack: {
    height: 6,
    backgroundColor: colors.skeleton,
    borderRadius: 3,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: "700", marginTop: 6 },
  rule: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  ruleOk: { color: "#16A34A" },
});
