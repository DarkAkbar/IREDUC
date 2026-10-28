import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { forgotPassword } from "../../api/auth";
import { IreducLogo } from "../../components/IreducLogo";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";
import {
  getErrorMessage,
  getFieldErrors,
  isNetworkError,
} from "../../utils/errors";
import {
  formatCdNationalDisplay,
  looksLikeEmail,
  nationalDigitsFromInput,
  toE164FromCdNational,
} from "../../utils/phone";

type Mode = "login" | "register";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    returnTo?: string;
    mode?: string;
  }>();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [mode, setMode] = useState<Mode>(
    params.mode === "register" ? "register" : "login"
  );
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [nationalPhone, setNationalPhone] = useState("");
  const [emailOptional, setEmailOptional] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({});

  useEffect(() => {
    if (params.mode === "register" || params.mode === "login") {
      setMode(params.mode);
    }
  }, [params.mode]);

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      digit: /\d/.test(password),
    }),
    [password]
  );

  function clearErrors() {
    setFormError(null);
    setFieldErrors({});
  }

  function afterAuth() {
    if (params.returnTo) {
      router.replace(params.returnTo as never);
    } else {
      router.back();
    }
  }

  async function onSubmit() {
    clearErrors();

    if (mode === "login") {
      if (!identifier.trim() || !password) {
        setFormError("Saisissez votre identifiant et votre mot de passe.");
        return;
      }
    } else {
      if (fullName.trim().length < 2) {
        setFieldErrors({ fullName: "Le nom complet est requis" });
        return;
      }
      if (nationalPhone.replace(/\D/g, "").length < 9) {
        setFieldErrors({ phone: "Numéro de téléphone invalide" });
        return;
      }
      if (!password) {
        setFieldErrors({
          password:
            "Le mot de passe doit contenir au moins 8 caractères et un chiffre",
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(identifier.trim(), password);
        afterAuth();
      } else {
        let phoneE164: string;
        try {
          phoneE164 = toE164FromCdNational(nationalPhone);
        } catch {
          setFieldErrors({ phone: "Numéro de téléphone invalide" });
          return;
        }
        await register({
          fullName,
          phone: phoneE164,
          password,
          email: emailOptional.trim() || undefined,
        });
        afterAuth();
      }
    } catch (error) {
      if (isNetworkError(error)) {
        setFormError("Impossible de joindre le serveur");
      } else {
        const fields = getFieldErrors(error);
        if (fields.phone || fields.email || fields.password || fields.fullName) {
          setFieldErrors({
            ...fields,
            phone: fields.phone,
          });
        } else {
          setFormError(
            getErrorMessage(
              error,
              mode === "login"
                ? "Connexion impossible. Vérifiez vos identifiants."
                : "Inscription impossible."
            )
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    const value = identifier.trim();
    if (!value || !looksLikeEmail(value)) {
      setFieldErrors({
        identifier:
          "Saisissez l'e-mail associé au compte pour réinitialiser le mot de passe.",
      });
      return;
    }
    try {
      const data = await forgotPassword(value.toLowerCase());
      Alert.alert("E-mail envoyé", data.message);
    } catch (error) {
      setFormError(getErrorMessage(error, "Impossible d'envoyer l'e-mail."));
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + spacing.md }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <IreducLogo tagline={undefined} />
        <Text style={[typography.hero, { marginTop: spacing.xl }]}>
          {mode === "login" ? "Bon retour" : "Créer un compte"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Connectez-vous avec votre numéro ou votre e-mail."
            : "Inscrivez-vous avec votre numéro de téléphone."}
        </Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, mode === "login" && styles.tabActive]}
            onPress={() => {
              clearErrors();
              setMode("login");
            }}
          >
            <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
              Connexion
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "register" && styles.tabActive]}
            onPress={() => {
              clearErrors();
              setMode("register");
            }}
          >
            <Text
              style={[styles.tabText, mode === "register" && styles.tabTextActive]}
            >
              Inscription
            </Text>
          </Pressable>
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        {mode === "register" ? (
          <View style={styles.field}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={[styles.input, fieldErrors.fullName && styles.inputError]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jean Mukendi"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
            {fieldErrors.fullName ? (
              <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>
            ) : null}
          </View>
        ) : null}

        {mode === "login" ? (
          <View style={styles.field}>
            <Text style={styles.label}>Téléphone ou e-mail</Text>
            <TextInput
              style={[
                styles.input,
                (fieldErrors.identifier || fieldErrors.phone || fieldErrors.email) &&
                  styles.inputError,
              ]}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="+243… ou vous@exemple.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            {fieldErrors.identifier || fieldErrors.phone || fieldErrors.email ? (
              <Text style={styles.fieldError}>
                {fieldErrors.identifier ||
                  fieldErrors.phone ||
                  fieldErrors.email}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <View
                style={[
                  styles.phoneRow,
                  fieldErrors.phone && styles.inputError,
                ]}
              >
                <Text style={styles.prefix}>+243</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={formatCdNationalDisplay(nationalPhone)}
                  onChangeText={(v) =>
                    setNationalPhone(nationalDigitsFromInput(v))
                  }
                  placeholder="81 234 56 78"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
              {fieldErrors.phone ? (
                <Text style={styles.fieldError}>{fieldErrors.phone}</Text>
              ) : null}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>E-mail (facultatif)</Text>
              <TextInput
                style={[styles.input, fieldErrors.email && styles.inputError]}
                value={emailOptional}
                onChangeText={setEmailOptional}
                placeholder="vous@exemple.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {fieldErrors.email ? (
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              ) : null}
            </View>
          </>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                fieldErrors.password && styles.inputError,
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
            />
            <Pressable
              style={styles.showBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Text style={styles.showText}>
                {showPassword ? "Masquer" : "Afficher"}
              </Text>
            </Pressable>
          </View>
          {fieldErrors.password ? (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          ) : null}
          {mode === "register" ? (
            <View style={styles.rules}>
              <Text
                style={[
                  styles.rule,
                  password.length > 0 &&
                    (passwordRules.length ? styles.ruleOk : styles.ruleBad),
                ]}
              >
                • Au moins 8 caractères
              </Text>
              <Text
                style={[
                  styles.rule,
                  password.length > 0 &&
                    (passwordRules.digit ? styles.ruleOk : styles.ruleBad),
                ]}
              >
                • Au moins un chiffre
              </Text>
            </View>
          ) : (
            <Pressable onPress={() => void onForgotPassword()}>
              <Text style={styles.forgot}>Mot de passe oublié ?</Text>
            </Pressable>
          )}
        </View>

        <Button
          label={mode === "login" ? "Se connecter" : "Créer mon compte"}
          loading={loading}
          onPress={() => void onSubmit()}
          style={{ marginTop: spacing.md }}
        />

        <View style={styles.footer}>
          {mode === "login" ? (
            <Text style={styles.footerText}>
              Pas de compte ?{" "}
              <Text
                style={styles.linkRed}
                onPress={() => {
                  clearErrors();
                  setMode("register");
                }}
              >
                Créer un compte
              </Text>
            </Text>
          ) : (
            <Text style={styles.footerText}>
              Déjà inscrit ?{" "}
              <Text
                style={styles.linkRed}
                onPress={() => {
                  clearErrors();
                  setMode("login");
                }}
              >
                Se connecter
              </Text>
            </Text>
          )}
          <Text style={[styles.footerText, { marginTop: spacing.sm }]}>
            Vous êtes propriétaire ou agence ?{" "}
            <Text
              style={styles.linkNavy}
              onPress={() => router.push("/partner" as never)}
            >
              Devenir partenaire
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
  subtitle: { ...typography.body, marginTop: spacing.sm, marginBottom: spacing.xl },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#E8EEF9",
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.navy },
  tabText: { color: colors.navy, fontWeight: "700" },
  tabTextActive: { color: colors.white },
  formError: {
    color: colors.primary,
    fontWeight: "700",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  field: { marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    color: colors.navy,
    fontSize: 15,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  prefix: {
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    backgroundColor: "#E8EEF9",
    color: colors.navy,
    fontWeight: "800",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    color: colors.navy,
    fontSize: 15,
  },
  inputError: { borderColor: colors.primary },
  fieldError: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  passwordRow: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 90 },
  showBtn: { position: "absolute", right: spacing.lg },
  showText: { color: colors.textMuted, fontWeight: "600" },
  rules: { marginTop: spacing.sm, gap: 2 },
  rule: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  ruleOk: { color: "#0F7B3A" },
  ruleBad: { color: colors.primary },
  forgot: {
    color: colors.primary,
    fontWeight: "700",
    textAlign: "right",
    marginTop: spacing.sm,
  },
  footer: { marginTop: spacing.xxl, alignItems: "center" },
  footerText: { ...typography.body, textAlign: "center" },
  linkRed: { color: colors.primary, fontWeight: "700" },
  linkNavy: { color: colors.navy, fontWeight: "700" },
});
