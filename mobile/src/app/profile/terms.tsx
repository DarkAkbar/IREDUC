import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { colors, spacing, typography } from "../../theme";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Conditions d'utilisation</Text>
        <Text style={styles.meta}>Version provisoire — à relire avant mise en ligne</Text>

        <Text style={styles.heading}>1. Objet</Text>
        <Text style={styles.p}>
          IREDUC est une plateforme de mise en relation pour l'immobilier et
          l'habitat à Kinshasa. Ces conditions régissent l'utilisation de
          l'application mobile et des services associés.
        </Text>

        <Text style={styles.heading}>2. Compte utilisateur</Text>
        <Text style={styles.p}>
          Vous êtes responsable de la confidentialité de vos identifiants. Les
          informations fournies doivent être exactes. IREDUC peut suspendre un
          compte en cas d'usage abusif ou frauduleux.
        </Text>

        <Text style={styles.heading}>3. Annonces et demandes</Text>
        <Text style={styles.p}>
          Les partenaires s'engagent à publier des offres sincères. Les
          demandeurs s'engagent à utiliser la messagerie et les demandes de
          visite de bonne foi. IREDUC n'est pas partie aux contrats conclus
          entre utilisateurs.
        </Text>

        <Text style={styles.heading}>4. Contenu</Text>
        <Text style={styles.p}>
          Vous conservez vos droits sur le contenu que vous publiez et accordez
          à IREDUC une licence non exclusive pour l'afficher sur la plateforme.
        </Text>

        <Text style={styles.heading}>5. Contact</Text>
        <Text style={styles.p}>
          Pour toute question relative à ces conditions, contactez le support
          via l'application (Profil → Contacter le support).
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  heading: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 15,
    marginTop: spacing.lg,
  },
  p: { ...typography.body, marginTop: spacing.sm, lineHeight: 22 },
});
