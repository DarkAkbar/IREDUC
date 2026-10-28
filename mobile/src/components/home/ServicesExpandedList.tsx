import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ServiceListItem } from "../../api/types";
import { PUBLISH_FAB_SIDE_INSET } from "../PublishFab";
import { ServiceCard } from "../ServiceCard";
import { SectionHeader } from "../ui/SectionHeader";
import { spacing, typography } from "../../theme";

export type ServicesExpandedSection = {
  title: string;
  category: { id: string; name: string; slug: string };
  items: ServiceListItem[];
};

type Props = {
  sections: ServicesExpandedSection[];
};

/** Affichage empilé d'origine des catégories de services (accueil déplié). */
export function ServicesExpandedList({ sections }: Props) {
  const router = useRouter();

  return (
    <View>
      {sections.map((section) => (
        <View key={section.category.id} style={styles.section}>
          <SectionHeader
            title={section.title}
            subtitle="Prestataires vérifiés à Kinshasa"
            icon="construct-outline"
            onSeeAll={() =>
              router.push({
                pathname: "/services",
                params: {
                  categoryId: section.category.id,
                  categorySlug: section.category.slug,
                },
              })
            }
          />
          {section.items.length === 0 ? (
            <Text style={styles.empty}>Aucun service dans cette catégorie.</Text>
          ) : (
            <ScrollView
              horizontal
              style={styles.carouselScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {section.items.map((item) => (
                <ServiceCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    router.push({
                      pathname: "/service/[id]",
                      params: { id: item.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md },
  carouselScroll: { flexGrow: 0, flexShrink: 0 },
  carousel: {
    flexGrow: 0,
    paddingLeft: spacing.lg,
    paddingRight: PUBLISH_FAB_SIDE_INSET,
    paddingBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
  },
});
