import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IreducLogo } from "../../components/IreducLogo";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { colors, spacing, typography } from "../../theme";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <View style={styles.content}>
        <IreducLogo tagline={undefined} />
        <Text style={[typography.section, { marginTop: spacing.xl }]}>
          À propos d'IREDUC
        </Text>
        <Text style={styles.text}>
          IREDUC est la plateforme immobilière et habitat de Kinshasa. Elle vous
          aide à trouver un bien, comparer les offres et échanger avec les
          propriétaires et prestataires de confiance.
        </Text>
        <Text style={styles.version}>Version mobile 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  text: { ...typography.body, marginTop: spacing.md, lineHeight: 22 },
  version: { color: colors.textMuted, marginTop: spacing.xl, fontWeight: "600" },
});
