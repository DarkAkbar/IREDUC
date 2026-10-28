import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { colors, spacing, typography } from "../../theme";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Politique de confidentialité</Text>
        <Text style={styles.meta}>Version provisoire — à relire avant mise en ligne</Text>

        <Text style={styles.heading}>1. Données collectées</Text>
        <Text style={styles.p}>
          Nous collectons notamment votre nom, numéro de téléphone, e-mail
          facultatif, photo de profil, préférences de recherche et historique
          d'activité nécessaire au service (demandes, messages, favoris).
        </Text>

        <Text style={styles.heading}>2. Finalités</Text>
        <Text style={styles.p}>
          Ces données servent à créer et sécuriser votre compte, mettre en
          relation acheteurs/locataires et partenaires, améliorer le service et
          vous contacter en cas de besoin.
        </Text>

        <Text style={styles.heading}>3. Conservation</Text>
        <Text style={styles.p}>
          Les données sont conservées tant que votre compte est actif. La
          suppression du compte anonymise votre profil et libère votre numéro
          et e-mail, tout en conservant l'historique nécessaire aux autres
          utilisateurs (demandes terminées).
        </Text>

        <Text style={styles.heading}>4. Vos droits</Text>
        <Text style={styles.p}>
          Vous pouvez consulter et modifier votre profil, changer de numéro ou
          d'e-mail, et demander la suppression de votre compte depuis
          l'application.
        </Text>

        <Text style={styles.heading}>5. Contact</Text>
        <Text style={styles.p}>
          Pour toute question relative à vos données, utilisez Profil →
          Contacter le support.
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
