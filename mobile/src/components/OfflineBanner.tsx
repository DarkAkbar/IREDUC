import { useEffect, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/**
 * Bandeau discret si l'API est injoignable (réseau coupé / serveur arrêté).
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!API_URL) {
        if (!cancelled) setOffline(true);
        return;
      }
      const healthUrl = API_URL.replace(/\/api\/v1\/?$/, "") + "/health";
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(healthUrl, { signal: controller.signal });
        clearTimeout(timer);
        if (!cancelled) setOffline(!res.ok);
      } catch {
        if (!cancelled) setOffline(true);
      }
    }

    void check();
    const interval = setInterval(() => void check(), 15_000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  if (!offline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>
        Connexion indisponible — vérifiez le réseau ou l&apos;API.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    color: colors.white,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
  },
});
