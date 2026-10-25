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
  const [email, setEmail] = useState("");
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

  async function onSubmit() {
    clearErrors();

    if (!email.trim() || !password) {
      setFormError("Saisissez votre e-mail et votre mot de passe.");
      return;
    }

    if (mode === "register" && fullName.trim().length < 2) {
      setFieldErrors({ fullName: "Le nom complet est requis" });
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        if (params.returnTo) {
          router.replace(params.returnTo as never);
        } else {
          router.back();
        }
      } else {
        const result = await register(fullName, email, password);
        if (result.autoVerified) {
          Alert.alert("Compte créé", result.message, [
            {
              text: "Se connecter",
              onPress: () => setMode("login"),
            },
          ]);
          return;
        }
        router.replace({
          pathname: "/auth/verify-email",
          params: {
            email: email.trim().toLowerCase(),
            emailSent: result.emailSent ? "1" : "0",
            message: result.message,
            returnTo: params.returnTo ?? "",
          },
        } as never);
      }
    } catch (error) {
      if (isNetworkError(error)) {
        setFormError("Impossible de joindre le serveur");
      } else {
        const fields = getFieldErrors(error);
        if (Object.keys(fields).length > 0) {
          setFieldErrors(fields);
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
    if (!email.trim()) {
      setFieldErrors({ email: "Saisissez votre e-mail" });
      return;
    }
    try {
      const data = await forgotPassword(email.trim().toLowerCase());
      Alert.alert("E-mail envoyé", data.message);
    } catch (error) {
      setFormError(
        getErrorMessage(error, "Impossible d'envoyer l'e-mail.")
      );
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
        <IreducLogo />
        <Text style={[typography.hero, { marginTop: spacing.xl }]}>
          {mode === "login" ? "Bon retour" : "Créer un compte"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Connectez-vous pour suivre vos demandes et publier vos annonces."
            : "Inscrivez-vous pour réserver un bien ou devenir partenaire."}
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
              onChangeText={(v) => {
                setFullName(v);
                if (fieldErrors.fullName) {
                  setFieldErrors((e) => ({ ...e, fullName: undefined }));
                }
              }}
              placeholder="Jean Mukendi"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
            {fieldErrors.fullName ? (
              <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={[styles.input, fieldErrors.email && styles.inputError]}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (fieldErrors.email) {
                setFieldErrors((e) => ({ ...e, email: undefined }));
              }
            }}
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
              onChangeText={(v) => {
                setPassword(v);
                if (fieldErrors.password) {
                  setFieldErrors((e) => ({ ...e, password: undefined }));
                }
              }}
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
          ) : null}
          {mode === "login" ? (
            <Pressable onPress={() => void onForgotPassword()}>
              <Text style={styles.forgot}>Mot de passe oublié ?</Text>
            </Pressable>
          ) : null}
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: spacing.xxl,
  },
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
