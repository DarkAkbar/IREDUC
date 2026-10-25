import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "./ui/Button";
import { colors, spacing, typography } from "../theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  returnTo: string;
  showBack?: boolean;
};

export function GuestPrompt({
  icon,
  title,
  message,
  returnTo,
  showBack = false,
}: Props) {
  const router = useRouter();

  function goLogin(mode?: "login" | "register") {
    router.push({
      pathname: "/auth/login",
      params: {
        returnTo,
        ...(mode ? { mode } : {}),
      },
    } as never);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.inner}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={styles.back}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={colors.navy} />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={40} color={colors.navy} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button
            label="Se connecter"
            onPress={() => goLogin("login")}
            style={styles.btn}
          />
          <Button
            label="Créer un compte"
            variant="outline"
            onPress={() => goLogin("register")}
            style={styles.btn}
          />
        </View>

        <Pressable
          onPress={() => router.push("/partner" as never)}
          style={styles.partner}
        >
          <Text style={styles.partnerText}>
            Vous êtes propriétaire ou agence ?{" "}
            <Text style={styles.partnerLink}>Devenir partenaire</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 40,
  },
  backText: { color: colors.navy, fontWeight: "700", fontSize: 15 },
  backSpacer: { minHeight: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E8EEF9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.navy,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  btn: {
    alignSelf: "stretch",
    marginBottom: spacing.sm,
  },
  partner: {
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  partnerText: {
    ...typography.body,
    textAlign: "center",
    fontSize: 13,
  },
  partnerLink: {
    color: colors.navy,
    fontWeight: "700",
  },
});
