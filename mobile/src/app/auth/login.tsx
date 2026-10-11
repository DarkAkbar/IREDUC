import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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

type Mode = "login" | "register";

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  return fallback;
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !password) {
      Alert.alert("Champs requis", "Saisissez votre e-mail et votre mot de passe.");
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
        if (fullName.trim().length < 2) {
          Alert.alert("Nom requis", "Indiquez votre nom complet.");
          return;
        }
        const message = await register(fullName, email, password);
        Alert.alert("Vérifiez votre e-mail", message, [
          {
            text: "OK",
            onPress: () => setMode("login"),
          },
        ]);
      }
    } catch (error) {
      Alert.alert(
        "Erreur",
        getErrorMessage(
          error,
          mode === "login"
            ? "Connexion impossible. Vérifiez vos identifiants."
            : "Inscription impossible."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    if (!email.trim()) {
      Alert.alert(
        "E-mail requis",
        "Saisissez votre e-mail puis appuyez sur « Mot de passe oublié ? »."
      );
      return;
    }
    try {
      const data = await forgotPassword(email.trim().toLowerCase());
      Alert.alert("E-mail envoyé", data.message);
    } catch (error) {
      Alert.alert("Erreur", getErrorMessage(error, "Impossible d'envoyer l'e-mail."));
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + spacing.md }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
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
            onPress={() => setMode("login")}
          >
            <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
              Connexion
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "register" && styles.tabActive]}
            onPress={() => setMode("register")}
          >
            <Text
              style={[styles.tabText, mode === "register" && styles.tabTextActive]}
            >
              Inscription
            </Text>
          </Pressable>
        </View>

        {mode === "register" ? (
          <View style={styles.field}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jean Mukendi"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
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
              <Text style={styles.linkRed} onPress={() => setMode("register")}>
                Créer un compte
              </Text>
            </Text>
          ) : (
            <Text style={styles.footerText}>
              Déjà inscrit ?{" "}
              <Text style={styles.linkRed} onPress={() => setMode("login")}>
                Se connecter
              </Text>
            </Text>
          )}
          <Text style={[styles.footerText, { marginTop: spacing.sm }]}>
            Vous êtes propriétaire ou agence ?{" "}
            <Text style={styles.linkNavy} onPress={() => setMode("register")}>
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
    paddingHorizontal: spacing.xl,
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
  passwordRow: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 90 },
  showBtn: { position: "absolute", right: spacing.lg },
  showText: { color: colors.textMuted, fontWeight: "600" },
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
