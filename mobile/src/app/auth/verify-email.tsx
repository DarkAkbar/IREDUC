import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resendVerification, verifyEmail } from "../../api/auth";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { colors, radii, spacing, typography } from "../../theme";
import {
  getErrorMessage,
  getFieldErrors,
  isNetworkError,
} from "../../utils/errors";

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    emailSent?: string;
    message?: string;
    returnTo?: string;
  }>();

  const email = (params.email ?? "").trim().toLowerCase();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState(
    params.message ??
      "Saisissez le code à 6 chiffres reçu par e-mail."
  );
  const [error, setError] = useState<string | null>(null);
  const mailFailed = params.emailSent === "0";

  async function onVerify() {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }
    if (!email) {
      setError("Adresse e-mail manquante");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmail({ email, code: code.trim() });
      setInfo(result.message);
      router.replace({
        pathname: "/auth/login",
        params: {
          mode: "login",
          returnTo: params.returnTo || undefined,
        },
      } as never);
    } catch (err) {
      if (isNetworkError(err)) {
        setError("Impossible de joindre le serveur");
      } else {
        const fields = getFieldErrors(err);
        setError(
          fields.code ??
            getErrorMessage(err, "Code de vérification invalide ou expiré")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (!email) return;
    setResending(true);
    setError(null);
    try {
      const result = await resendVerification(email);
      setInfo(
        result.emailSent === false
          ? "Impossible d'envoyer l'e-mail pour le moment. Réessayez."
          : "Un nouveau code a été envoyé si le compte existe."
      );
    } catch (err) {
      setError(
        getErrorMessage(err, "Impossible de renvoyer le code.")
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ListScreenHeader showBack />
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <Text style={typography.title}>Vérifiez votre e-mail</Text>
        <Text style={styles.subtitle}>
          {mailFailed
            ? "Compte créé, mais l'e-mail n'a pas pu être envoyé. Demandez un nouvel envoi ci-dessous."
            : `Un code à 6 chiffres a été envoyé à ${email || "votre adresse"}.`}
        </Text>
        <Text style={styles.info}>{info}</Text>

        <Text style={styles.label}>Code à 6 chiffres</Text>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={code}
          onChangeText={(v) => {
            setCode(v.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={colors.textMuted}
          autoFocus
        />
        {error ? <Text style={styles.fieldError}>{error}</Text> : null}

        <Button
          label="Valider le code"
          loading={loading}
          onPress={() => void onVerify()}
          style={{ marginTop: spacing.lg }}
        />
        <Button
          label="Renvoyer le code"
          variant="outline"
          loading={resending}
          onPress={() => void onResend()}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: spacing.md },
  subtitle: { ...typography.body, marginTop: spacing.sm },
  info: {
    ...typography.body,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    color: colors.navy,
    fontWeight: "600",
  },
  label: { ...typography.label, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    color: colors.navy,
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  inputError: { borderColor: colors.primary },
  fieldError: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
});
