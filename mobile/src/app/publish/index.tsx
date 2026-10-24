import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchCategories, fetchCommunes, fetchNeighborhoods } from "../../api/catalog";
import { fetchMyProvider } from "../../api/providers";
import {
  addPropertyMedia,
  createProperty,
  fetchProperty,
  submitProperty,
  updateProperty,
  updatePropertyMedia,
} from "../../api/properties";
import {
  addServiceMedia,
  createService,
  fetchService,
  submitService,
  updateService,
} from "../../api/services";
import { PropertyKind } from "../../api/types";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import {
  PHOTO_CAPTIONS,
  PublishListingType,
  usePublishStore,
} from "../../store/publishStore";
import { colors, radii, spacing, typography } from "../../theme";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/errors";
import { compressImage, uploadWithRetry } from "../../utils/media";

const LISTING_TYPES: { key: PublishListingType; label: string }[] = [
  { key: "RENT", label: "À louer" },
  { key: "SALE", label: "À vendre" },
  { key: "LAND", label: "Terrain" },
  { key: "SERVICE", label: "Service" },
];

const KINDS: { key: PropertyKind; label: string }[] = [
  { key: "APARTMENT", label: "Appartement" },
  { key: "HOUSE", label: "Maison" },
  { key: "VILLA", label: "Villa" },
];

export default function PublishScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    id?: string;
    type?: string;
  }>();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const {
    step,
    draft,
    uploadProgress,
    setStep,
    patchDraft,
    setListingType,
    reset,
    loadFromProperty,
    loadFromService,
    setUploadProgress,
  } = usePublishStore();
  const [saving, setSaving] = useState(false);
  const [loadedEdit, setLoadedEdit] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) requireAuth("/publish");
  }, [isAuthenticated, requireAuth]);

  useEffect(() => {
    if (!params.id) reset();
  }, [params.id, reset]);

  const providerQuery = useQuery({
    queryKey: ["provider-me"],
    enabled: isAuthenticated,
    queryFn: fetchMyProvider,
    retry: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", draft.targetType],
    queryFn: () =>
      fetchCategories(draft.targetType === "SERVICE" ? "SERVICE" : "REAL_ESTATE"),
  });

  const communesQuery = useQuery({
    queryKey: ["communes"],
    queryFn: fetchCommunes,
  });

  const neighborhoodsQuery = useQuery({
    queryKey: ["neighborhoods", draft.communeId],
    enabled: Boolean(draft.communeId) && draft.targetType === "PROPERTY",
    queryFn: () => fetchNeighborhoods(draft.communeId!),
  });

  useEffect(() => {
    if (loadedEdit || !params.id || !params.type) return;
    void (async () => {
      try {
        if (params.type === "SERVICE") {
          const service = await fetchService(params.id!);
          loadFromService(service);
        } else {
          const property = await fetchProperty(params.id!);
          loadFromProperty(property);
        }
        setLoadedEdit(true);
      } catch (error) {
        Alert.alert(
          "Publication",
          getErrorMessage(error, "Impossible de charger l'annonce.")
        );
      }
    })();
  }, [loadedEdit, loadFromProperty, loadFromService, params.id, params.type]);

  useEffect(() => {
    if (!draft.categoryId && categoriesQuery.data?.[0]) {
      patchDraft({ categoryId: categoriesQuery.data[0].id });
    }
  }, [categoriesQuery.data, draft.categoryId, patchDraft]);

  const approved = providerQuery.data?.reviewStatus === "APPROVED";
  const photos = draft.pendingMedia.filter((m) => !m.isVideo);
  const video = draft.pendingMedia.find((m) => m.isVideo);

  const tags = useMemo(() => {
    const list = draft.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (draft.hasSecurity) list.push("Sécurité");
    if (draft.hasGarden) list.push("Jardin");
    return Array.from(new Set(list));
  }, [draft.tags, draft.hasSecurity, draft.hasGarden]);

  async function pickMedia(isVideo: boolean) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission", "Autorisez l'accès à la galerie.");
      return;
    }
    if (!isVideo && photos.length >= 8) {
      Alert.alert("Photos", "Maximum 8 photos.");
      return;
    }
    if (isVideo && video) {
      Alert.alert("Vidéo", "Une seule vidéo est autorisée.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isVideo ? ["videos"] : ["images"],
      quality: 0.85,
      allowsMultipleSelection: !isVideo,
      selectionLimit: isVideo ? 1 : 8 - photos.length,
    });
    if (result.canceled) return;
    const next = result.assets.map((asset, index) => ({
      key: `${Date.now()}-${index}`,
      uri: asset.uri,
      mimeType: asset.mimeType,
      isVideo,
      caption: isVideo
        ? "Vidéo"
        : PHOTO_CAPTIONS[(photos.length + index) % PHOTO_CAPTIONS.length],
    }));
    patchDraft({ pendingMedia: [...draft.pendingMedia, ...next] });
  }

  function validateStep1() {
    if (!draft.title.trim() || draft.title.trim().length < 5) {
      Alert.alert("Détails", "Le titre doit contenir au moins 5 caractères.");
      return false;
    }
    if (!draft.description.trim() || draft.description.trim().length < 20) {
      Alert.alert("Détails", "La description doit contenir au moins 20 caractères.");
      return false;
    }
    if (draft.targetType === "PROPERTY") {
      if (!draft.price || Number(draft.price) <= 0) {
        Alert.alert("Détails", "Indiquez un prix en USD.");
        return false;
      }
      if (!draft.communeId) {
        Alert.alert("Détails", "Choisissez une commune.");
        return false;
      }
    } else {
      if (!draft.categoryId) {
        Alert.alert("Détails", "Choisissez une catégorie de service.");
        return false;
      }
      if (draft.coverageCommuneIds.length === 0) {
        Alert.alert("Détails", "Indiquez au moins une zone d'intervention.");
        return false;
      }
    }
    if (draft.pendingMedia.filter((m) => !m.isVideo).length === 0 && !draft.listingId) {
      Alert.alert("Photos", "Ajoutez au moins une photo.");
      return false;
    }
    return true;
  }

  async function saveDraft(options?: { submit?: boolean }) {
    if (!validateStep1()) return;
    setSaving(true);
    try {
      let listingId = draft.listingId;

      if (draft.targetType === "PROPERTY") {
        const payload = {
          categoryId: draft.categoryId!,
          offerType: draft.offerType,
          kind: draft.kind,
          title: draft.title.trim(),
          description: draft.description.trim(),
          price: Number(draft.price),
          currency: "USD",
          communeId: draft.communeId!,
          neighborhoodId: draft.neighborhoodId,
          address: draft.address.trim() || null,
          latitude: draft.latitude ? Number(draft.latitude) : null,
          longitude: draft.longitude ? Number(draft.longitude) : null,
          bedrooms:
            draft.kind === "LAND" || !draft.bedrooms
              ? null
              : Number(draft.bedrooms),
          bathrooms:
            draft.kind === "LAND" || !draft.bathrooms
              ? null
              : Number(draft.bathrooms),
          areaM2: draft.areaM2 ? Number(draft.areaM2) : null,
          parking: draft.parking,
          hasPool: draft.hasPool,
          hasTitleDeed: draft.kind === "LAND" ? draft.hasTitleDeed : null,
          tags,
        };
        if (listingId) {
          await updateProperty(listingId, payload);
        } else {
          const created = await createProperty(payload);
          listingId = created.id;
          patchDraft({ listingId });
        }
      } else {
        const payload = {
          categoryId: draft.categoryId!,
          title: draft.title.trim(),
          description: draft.description.trim(),
          subServices: draft.subServices
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          coverageCommuneIds: draft.coverageCommuneIds,
        };
        if (listingId) {
          await updateService(listingId, payload);
        } else {
          const created = await createService(payload);
          listingId = created.id;
          patchDraft({ listingId });
        }
      }

      const pending = draft.pendingMedia;
      if (pending.length > 0 && listingId) {
        setUploadProgress({ done: 0, total: pending.length });
        const remaining = [];
        for (let i = 0; i < pending.length; i += 1) {
          const media = pending[i];
          try {
            const uri = media.isVideo
              ? media.uri
              : await compressImage(media.uri);
            if (draft.targetType === "PROPERTY") {
              const uploaded = await uploadWithRetry(() =>
                addPropertyMedia(listingId!, uri, {
                  caption: media.caption,
                  mimeType: media.isVideo ? "video/mp4" : "image/jpeg",
                  isVideo: media.isVideo,
                })
              );
              if (!media.isVideo) {
                await updatePropertyMedia(listingId!, uploaded.id, {
                  sortOrder: i,
                  caption: media.caption,
                });
              }
            } else {
              await uploadWithRetry(() =>
                addServiceMedia(listingId!, uri, {
                  caption: media.caption,
                  mimeType: media.isVideo ? "video/mp4" : "image/jpeg",
                  isVideo: media.isVideo,
                })
              );
            }
            setUploadProgress({ done: i + 1, total: pending.length });
          } catch {
            remaining.push(media);
          }
        }
        patchDraft({ pendingMedia: remaining });
        setUploadProgress(null);
        if (remaining.length > 0) {
          Alert.alert(
            "Médias",
            `${remaining.length} fichier(s) n'ont pas pu être envoyés. Réessayez via Brouillon.`
          );
          return;
        }
      }

      if (options?.submit && listingId) {
        if (draft.targetType === "PROPERTY") {
          await submitProperty(listingId);
        } else {
          await submitService(listingId);
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-properties"] }),
        queryClient.invalidateQueries({ queryKey: ["my-services"] }),
        queryClient.invalidateQueries({ queryKey: ["home"] }),
        queryClient.invalidateQueries({ queryKey: ["health-info"] }),
      ]);

      if (options?.submit && listingId) {
        Alert.alert(
          "Annonce soumise",
          "Votre annonce a été envoyée pour validation.",
          [
            {
              text: "Voir mes annonces",
              onPress: () => {
                reset();
                router.replace("/listings" as never);
              },
            },
          ]
        );
        return;
      }

      Alert.alert("Brouillon", "Annonce enregistrée en brouillon.");
    } catch (error) {
      Alert.alert(
        "Publication",
        getErrorMessage(error, "Impossible d'enregistrer l'annonce.")
      );
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <Text style={styles.center}>Connexion requise…</Text>
      </View>
    );
  }

  if (providerQuery.isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <Text style={styles.center}>Vérification du profil partenaire…</Text>
      </View>
    );
  }

  if (!approved) {
    const status = providerQuery.data?.reviewStatus;
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ListScreenHeader showBack />
        <View style={styles.gate}>
          <Text style={typography.title}>Publication indisponible</Text>
          <Text style={styles.subtitle}>
            {!status
              ? "Vous devez d'abord devenir partenaire IREDUC pour publier une annonce."
              : status === "PENDING"
                ? "Votre dossier partenaire est en attente de validation. La publication sera débloquée après approbation."
                : `Votre dossier partenaire a été rejeté${
                    providerQuery.data?.rejectionReason
                      ? ` : ${providerQuery.data.rejectionReason}`
                      : "."
                  }`}
          </Text>
          <Button
            label={status ? "Voir mon dossier" : "Devenir partenaire"}
            onPress={() => router.push("/partner" as never)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Publier une annonce</Text>
        <Text style={styles.subtitle}>
          Remplissez les informations pour soumettre votre offre à Kinshasa.
        </Text>

        <View style={styles.steps}>
          {["Détails", "Caractéristiques", "Aperçu"].map((label, index) => {
            const n = (index + 1) as 1 | 2 | 3;
            const active = step === n;
            const done = step > n;
            return (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    (active || done) && styles.stepCircleOn,
                  ]}
                >
                  <Text style={styles.stepNum}>{n}</Text>
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelOn]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {step === 1 ? (
          <View style={styles.block}>
            <Text style={styles.section}>Type d'annonce</Text>
            <View style={styles.seg}>
              {LISTING_TYPES.map((item) => (
                <Pressable
                  key={item.key}
                  style={[
                    styles.segItem,
                    draft.listingType === item.key && styles.segOn,
                  ]}
                  onPress={() => setListingType(item.key)}
                >
                  <Text
                    style={[
                      styles.segText,
                      draft.listingType === item.key && styles.segTextOn,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {draft.targetType === "PROPERTY" && draft.listingType !== "LAND" ? (
              <>
                <Text style={styles.section}>Type de bien</Text>
                <View style={styles.chipRow}>
                  {KINDS.map((k) => (
                    <Pressable
                      key={k.key}
                      style={[styles.chip, draft.kind === k.key && styles.chipOn]}
                      onPress={() => patchDraft({ kind: k.key })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          draft.kind === k.key && styles.chipTextOn,
                        ]}
                      >
                        {k.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.section}>Photos et vidéo</Text>
            <View style={styles.mediaRow}>
              {draft.pendingMedia.map((media) => (
                <View key={media.key} style={styles.mediaCard}>
                  {media.isVideo ? (
                    <View style={[styles.thumb, styles.videoThumb]}>
                      <Ionicons name="videocam" size={22} color={colors.white} />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: media.uri }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
                  )}
                  <TextInput
                    style={styles.caption}
                    value={media.caption}
                    onChangeText={(caption) =>
                      patchDraft({
                        pendingMedia: draft.pendingMedia.map((m) =>
                          m.key === media.key ? { ...m, caption } : m
                        ),
                      })
                    }
                  />
                  <Pressable
                    onPress={() =>
                      patchDraft({
                        pendingMedia: draft.pendingMedia.filter(
                          (m) => m.key !== media.key
                        ),
                      })
                    }
                  >
                    <Text style={styles.remove}>Retirer</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addMedia} onPress={() => void pickMedia(false)}>
                <Ionicons name="camera-outline" size={22} color={colors.navy} />
                <Text style={styles.addMediaText}>Photo</Text>
              </Pressable>
              <Pressable style={styles.addMedia} onPress={() => void pickMedia(true)}>
                <Ionicons name="videocam-outline" size={22} color={colors.navy} />
                <Text style={styles.addMediaText}>Vidéo</Text>
              </Pressable>
            </View>

            <Field
              label="Titre"
              value={draft.title}
              onChangeText={(title) => patchDraft({ title })}
            />

            {draft.targetType === "PROPERTY" ? (
              <Field
                label="Prix (USD)"
                value={draft.price}
                onChangeText={(price) => patchDraft({ price })}
                keyboardType="decimal-pad"
              />
            ) : null}

            {draft.targetType === "SERVICE" ? (
              <>
                <Text style={styles.label}>Catégorie</Text>
                <View style={styles.chipRow}>
                  {(categoriesQuery.data ?? []).map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.chip,
                        draft.categoryId === c.id && styles.chipOn,
                      ]}
                      onPress={() => patchDraft({ categoryId: c.id })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          draft.categoryId === c.id && styles.chipTextOn,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Field
                  label="Sous-services (séparés par des virgules)"
                  value={draft.subServices}
                  onChangeText={(subServices) => patchDraft({ subServices })}
                />
                <Text style={styles.label}>Zones d'intervention</Text>
                <View style={styles.chipRow}>
                  {(communesQuery.data ?? []).map((c) => {
                    const active = draft.coverageCommuneIds.includes(c.id);
                    return (
                      <Pressable
                        key={c.id}
                        style={[styles.chip, active && styles.chipOn]}
                        onPress={() =>
                          patchDraft({
                            coverageCommuneIds: active
                              ? draft.coverageCommuneIds.filter((id) => id !== c.id)
                              : [...draft.coverageCommuneIds, c.id],
                          })
                        }
                      >
                        <Text style={[styles.chipText, active && styles.chipTextOn]}>
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Commune</Text>
                <View style={styles.chipRow}>
                  {(communesQuery.data ?? []).map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.chip,
                        draft.communeId === c.id && styles.chipOn,
                      ]}
                      onPress={() =>
                        patchDraft({ communeId: c.id, neighborhoodId: null })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          draft.communeId === c.id && styles.chipTextOn,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {neighborhoodsQuery.data && neighborhoodsQuery.data.length > 0 ? (
                  <>
                    <Text style={styles.label}>Quartier</Text>
                    <View style={styles.chipRow}>
                      {neighborhoodsQuery.data.map((n) => (
                        <Pressable
                          key={n.id}
                          style={[
                            styles.chip,
                            draft.neighborhoodId === n.id && styles.chipOn,
                          ]}
                          onPress={() => patchDraft({ neighborhoodId: n.id })}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              draft.neighborhoodId === n.id && styles.chipTextOn,
                            ]}
                          >
                            {n.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}

                {draft.kind !== "LAND" ? (
                  <View style={styles.row2}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Chambres"
                        value={draft.bedrooms}
                        onChangeText={(bedrooms) => patchDraft({ bedrooms })}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Salles de bain"
                        value={draft.bathrooms}
                        onChangeText={(bathrooms) => patchDraft({ bathrooms })}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                ) : (
                  <SwitchRow
                    label="Titre foncier disponible"
                    value={draft.hasTitleDeed}
                    onValueChange={(hasTitleDeed) => patchDraft({ hasTitleDeed })}
                  />
                )}
                <Field
                  label="Surface (m²)"
                  value={draft.areaM2}
                  onChangeText={(areaM2) => patchDraft({ areaM2 })}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            <Field
              label="Description"
              value={draft.description}
              onChangeText={(description) => patchDraft({ description })}
              multiline
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.block}>
            {draft.targetType === "PROPERTY" ? (
              <>
                <SwitchRow
                  label="Parking"
                  value={draft.parking}
                  onValueChange={(parking) => patchDraft({ parking })}
                />
                <SwitchRow
                  label="Piscine"
                  value={draft.hasPool}
                  onValueChange={(hasPool) => patchDraft({ hasPool })}
                />
                <SwitchRow
                  label="Sécurité"
                  value={draft.hasSecurity}
                  onValueChange={(hasSecurity) => patchDraft({ hasSecurity })}
                />
                <SwitchRow
                  label="Jardin"
                  value={draft.hasGarden}
                  onValueChange={(hasGarden) => patchDraft({ hasGarden })}
                />
                <Field
                  label="Tags (séparés par des virgules)"
                  value={draft.tags}
                  onChangeText={(tagsValue) => patchDraft({ tags: tagsValue })}
                />
              </>
            ) : (
              <Text style={styles.subtitle}>
                Précisez l'adresse d'intervention si utile pour vos clients.
              </Text>
            )}
            <Field
              label="Adresse"
              value={draft.address}
              onChangeText={(address) => patchDraft({ address })}
            />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Latitude (facultatif)"
                  value={draft.latitude}
                  onChangeText={(latitude) => patchDraft({ latitude })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Longitude (facultatif)"
                  value={draft.longitude}
                  onChangeText={(longitude) => patchDraft({ longitude })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.block}>
            <Text style={styles.section}>Aperçu client</Text>
            <View style={styles.previewCard}>
              {photos[0] ? (
                <Image
                  source={{ uri: photos[0].uri }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.previewImage, styles.previewFallback]}>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.previewBody}>
                <Text style={styles.previewTitle}>{draft.title || "Titre"}</Text>
                {draft.targetType === "PROPERTY" ? (
                  <Text style={styles.previewPrice}>
                    {draft.price
                      ? formatPrice(Number(draft.price), draft.offerType).replace(
                          " $",
                          " USD"
                        )
                      : "—"}
                  </Text>
                ) : (
                  <Text style={styles.previewPrice}>Service</Text>
                )}
                <Text style={styles.previewMeta} numberOfLines={3}>
                  {draft.description}
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Vérifiez les informations puis soumettez pour validation IREDUC.
            </Text>
          </View>
        ) : null}

        {uploadProgress ? (
          <View style={styles.progressBox}>
            <Text style={styles.progressText}>
              Envoi des médias {uploadProgress.done}/{uploadProgress.total}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      uploadProgress.total
                        ? (uploadProgress.done / uploadProgress.total) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          {step > 1 ? (
            <Button
              label="Retour"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setStep((step - 1) as 1 | 2)}
            />
          ) : null}
          <Button
            label="Brouillon"
            variant="outline"
            style={{ flex: 1 }}
            loading={saving}
            onPress={() => void saveDraft()}
          />
          {step < 3 ? (
            <Button
              label="Continuer"
              style={{ flex: 1.2 }}
              onPress={() => {
                if (step === 1 && !validateStep1()) return;
                setStep((step + 1) as 2 | 3);
              }}
            />
          ) : (
            <Button
              label="Soumettre pour validation"
              style={{ flex: 1.4 }}
              loading={saving}
              onPress={() => void saveDraft({ submit: true })}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.navy, false: colors.border }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { ...typography.body, padding: spacing.xl },
  gate: { padding: spacing.xl, gap: spacing.md },
  subtitle: { ...typography.body, marginTop: spacing.xs, marginBottom: spacing.md },
  steps: { flexDirection: "row", marginBottom: spacing.lg },
  stepItem: { flex: 1, alignItems: "center" },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleOn: { backgroundColor: colors.navy },
  stepNum: { color: colors.white, fontWeight: "800", fontSize: 12 },
  stepLabel: { marginTop: 4, fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  stepLabelOn: { color: colors.navy, fontWeight: "800" },
  block: { gap: 2 },
  section: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  seg: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  segItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.white,
  },
  segOn: { backgroundColor: colors.navy },
  segText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  segTextOn: { color: colors.white },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  chipTextOn: { color: colors.white },
  mediaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  mediaCard: { width: 100 },
  thumb: { width: 100, height: 80, borderRadius: radii.md },
  videoThumb: {
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 11,
    color: colors.navy,
    backgroundColor: colors.white,
  },
  remove: { color: colors.primary, fontSize: 11, fontWeight: "700", marginTop: 2 },
  addMedia: {
    width: 100,
    height: 80,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addMediaText: { color: colors.navy, fontWeight: "700", fontSize: 12 },
  label: { color: colors.navy, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.navy,
  },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  row2: { flexDirection: "row", gap: spacing.sm },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  switchLabel: { color: colors.navy, fontWeight: "700" },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  previewImage: { width: "100%", height: 180 },
  previewFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBody: { padding: spacing.md, gap: 4 },
  previewTitle: { color: colors.navy, fontWeight: "800", fontSize: 16 },
  previewPrice: { color: colors.primary, fontWeight: "800" },
  previewMeta: { color: colors.textMuted, fontSize: 13 },
  progressBox: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressText: { color: colors.navy, fontWeight: "700", marginBottom: 8 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.skeleton,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.navy },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
});
