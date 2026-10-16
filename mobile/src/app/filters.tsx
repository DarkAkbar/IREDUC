import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchCommunes } from "../api/catalog";
import { fetchProperties } from "../api/properties";
import { OfferType, PropertyKind } from "../api/types";
import { Button } from "../components/ui/Button";
import { useSearchStore } from "../store/searchStore";
import { colors, radii, spacing, typography } from "../theme";

const OFFER_OPTIONS: { key: OfferType | ""; label: string }[] = [
  { key: "", label: "Tous" },
  { key: "RENT", label: "À louer" },
  { key: "SALE", label: "À vendre" },
];

const KIND_OPTIONS: { key: PropertyKind | ""; label: string }[] = [
  { key: "", label: "Tous" },
  { key: "HOUSE", label: "Maison" },
  { key: "APARTMENT", label: "Appartement" },
  { key: "VILLA", label: "Villa" },
  { key: "LAND", label: "Terrain" },
];

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const stored = useSearchStore((s) => s.filters);
  const setFilters = useSearchStore((s) => s.setFilters);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  const [offerType, setOfferType] = useState<OfferType | "">(stored.offerType ?? "");
  const [kind, setKind] = useState<PropertyKind | "">(stored.kind ?? "");
  const [communeId, setCommuneId] = useState(stored.communeId ?? "");
  const [minPrice, setMinPrice] = useState(
    stored.minPrice != null ? String(stored.minPrice) : ""
  );
  const [maxPrice, setMaxPrice] = useState(
    stored.maxPrice != null ? String(stored.maxPrice) : ""
  );
  const [bedrooms, setBedrooms] = useState(
    stored.bedrooms != null ? String(stored.bedrooms) : ""
  );
  const [bathrooms, setBathrooms] = useState(
    stored.bathrooms != null ? String(stored.bathrooms) : ""
  );
  const [minArea, setMinArea] = useState(
    stored.minArea != null ? String(stored.minArea) : ""
  );

  const communesQuery = useQuery({
    queryKey: ["communes"],
    queryFn: fetchCommunes,
  });

  const draft = {
    offerType: offerType || undefined,
    kind: kind || undefined,
    communeId: communeId || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    bathrooms: bathrooms ? Number(bathrooms) : undefined,
    minArea: minArea ? Number(minArea) : undefined,
  };

  const countQuery = useQuery({
    queryKey: ["properties-count", draft],
    queryFn: () => fetchProperties({ ...draft, page: 1, limit: 1 }),
  });

  function apply() {
    setFilters(draft);
    router.back();
  }

  function reset() {
    setOfferType("");
    setKind("");
    setCommuneId("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setBathrooms("");
    setMinArea("");
    resetFilters();
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={typography.title}>Filtres</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>Fermer</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Type d'offre</Text>
        <View style={styles.row}>
          {OFFER_OPTIONS.map((opt) => (
            <Pill
              key={opt.key || "all-offer"}
              label={opt.label}
              active={offerType === opt.key}
              onPress={() => setOfferType(opt.key)}
            />
          ))}
        </View>

        <Text style={styles.section}>Type de bien</Text>
        <View style={styles.row}>
          {KIND_OPTIONS.map((opt) => (
            <Pill
              key={opt.key || "all-kind"}
              label={opt.label}
              active={kind === opt.key}
              onPress={() => setKind(opt.key)}
            />
          ))}
        </View>

        <Text style={styles.section}>Commune</Text>
        <View style={styles.row}>
          <Pill
            label="Toutes"
            active={!communeId}
            onPress={() => setCommuneId("")}
          />
          {(communesQuery.data ?? []).map((c) => (
            <Pill
              key={c.id}
              label={c.name}
              active={communeId === c.id}
              onPress={() => setCommuneId(c.id)}
            />
          ))}
        </View>

        <Text style={styles.section}>Prix (USD)</Text>
        <View style={styles.inputs}>
          <Field value={minPrice} onChangeText={setMinPrice} placeholder="Min" />
          <Field value={maxPrice} onChangeText={setMaxPrice} placeholder="Max" />
        </View>

        <Text style={styles.section}>Chambres / salles de bain / surface</Text>
        <View style={styles.inputs}>
          <Field value={bedrooms} onChangeText={setBedrooms} placeholder="Ch." />
          <Field value={bathrooms} onChangeText={setBathrooms} placeholder="Sdb" />
          <Field value={minArea} onChangeText={setMinArea} placeholder="m² min" />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label="Réinitialiser" variant="outline" onPress={reset} style={{ flex: 1 }} />
        <Button
          label={`Appliquer (${countQuery.data?.meta.total ?? "…"})`}
          onPress={apply}
          style={{ flex: 1.4 }}
          loading={countQuery.isFetching}
        />
      </View>
    </View>
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      style={styles.field}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType="numeric"
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  close: { color: colors.primary, fontWeight: "700" },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  section: { ...typography.label, marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  pillText: { color: colors.navy, fontWeight: "700", fontSize: 13 },
  pillTextActive: { color: colors.white },
  inputs: { flexDirection: "row", gap: spacing.sm },
  field: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.navy,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
