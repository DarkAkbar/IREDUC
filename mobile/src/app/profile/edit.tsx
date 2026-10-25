import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mediaUrl } from "../../api/client";
import { updateProfile, uploadAvatar } from "../../api/users";
import { ListScreenHeader } from "../../components/list/ListScreenHeader";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { colors, radii, spacing, typography } from "../../theme";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { normalizePhone } from "../../utils/phone";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    mediaUrl(user?.avatarUrl)
  );
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({});

  const phoneChanged = phone.trim() !== (user?.phone ?? "");
  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      fullName.trim() !== user.fullName ||
      phone.trim() !== user.phone ||
      (email.trim() || null) !== (user.email ?? null) ||
      (whatsapp.trim() || null) !== (user.whatsapp ?? null)
    );
  }, [user, fullName, phone, email, whatsapp]);

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à la galerie pour choisir un avatar."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    setLoading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      const updated = await uploadAvatar(manipulated.uri, "image/jpeg");
      setUser(updated);
      setAvatarPreview(mediaUrl(updated.avatarUrl));
      await queryClient.invalidateQueries({ queryKey: ["profile-summary"] });
      Alert.alert("Avatar", "Votre photo de profil a été mise à jour.");
    } catch (error) {
      Alert.alert(
        "Avatar",
        getErrorMessage(error, "Impossible d'envoyer l'avatar.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    const errors: Partial<Record<string, string>> = {};
    if (fullName.trim().length < 2) {
      errors.fullName = "Le nom complet est requis.";
    }
    if (phoneChanged && !currentPassword) {
      errors.currentPassword =
        "Saisissez votre mot de passe actuel pour changer de numéro.";
    }

    let phoneE164 = phone.trim();
    let whatsappValue: string | null = whatsapp.trim() || null;
    try {
      phoneE164 = normalizePhone(phone.trim());
    } catch {
      errors.phone = "Numéro de téléphone invalide";
    }
    if (whatsappValue) {
      try {
        whatsappValue = normalizePhone(whatsappValue);
      } catch {
        errors.whatsapp = "Numéro WhatsApp invalide";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const updated = await updateProfile({
        fullName: fullName.trim(),
        phone: phoneE164,
        email: email.trim() || null,
        whatsapp: whatsappValue,
        currentPassword: phoneChanged ? currentPassword : undefined,
      });
      setUser(updated);
      await queryClient.invalidateQueries({ queryKey: ["profile-summary"] });
      Alert.alert("Profil", "Vos informations ont été enregistrées.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const apiFields = getFieldErrors(error);
      if (Object.keys(apiFields).length > 0) {
        setFieldErrors(apiFields);
      }
      Alert.alert(
        "Profil",
        getErrorMessage(error, "Impossible de mettre à jour le profil.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ListScreenHeader showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Modifier mon profil</Text>

        <Pressable style={styles.avatarWrap} onPress={() => void pickAvatar()}>
          {avatarPreview ? (
            <Image
              source={{ uri: avatarPreview }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={36} color={colors.navy} />
            </View>
          )}
          <View style={styles.avatarEdit}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </View>
          <Text style={styles.changePhoto}>Changer la photo</Text>
        </Pressable>

        <Text style={styles.label}>Nom complet</Text>
        <TextInput
          style={[styles.input, fieldErrors.fullName && styles.inputError]}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Votre nom"
          placeholderTextColor={colors.textMuted}
        />
        {fieldErrors.fullName ? (
          <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>
        ) : null}

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={[styles.input, fieldErrors.phone && styles.inputError]}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+243 …"
          placeholderTextColor={colors.textMuted}
        />
        {fieldErrors.phone ? (
          <Text style={styles.fieldError}>{fieldErrors.phone}</Text>
        ) : null}

        {phoneChanged ? (
          <>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput
              style={[
                styles.input,
                fieldErrors.currentPassword && styles.inputError,
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Requis pour changer de numéro"
              placeholderTextColor={colors.textMuted}
            />
            {fieldErrors.currentPassword ? (
              <Text style={styles.fieldError}>{fieldErrors.currentPassword}</Text>
            ) : null}
          </>
        ) : null}

        <Text style={styles.label}>E-mail (facultatif)</Text>
        <TextInput
          style={[styles.input, fieldErrors.email && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="vous@exemple.com"
          placeholderTextColor={colors.textMuted}
        />
        {fieldErrors.email ? (
          <Text style={styles.fieldError}>{fieldErrors.email}</Text>
        ) : null}

        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          style={[styles.input, fieldErrors.whatsapp && styles.inputError]}
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
          placeholder="+243 …"
          placeholderTextColor={colors.textMuted}
        />
        {fieldErrors.whatsapp ? (
          <Text style={styles.fieldError}>{fieldErrors.whatsapp}</Text>
        ) : null}

        <Button
          label="Enregistrer"
          loading={loading}
          disabled={!dirty || loading}
          onPress={() => void onSave()}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
  avatarWrap: {
    alignItems: "center",
    marginVertical: spacing.xl,
    gap: spacing.sm,
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEdit: {
    position: "absolute",
    right: "35%",
    bottom: 28,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  changePhoto: { color: colors.navy, fontWeight: "700" },
  label: {
    color: colors.navy,
    fontWeight: "700",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.navy,
  },
  inputError: { borderColor: colors.primary },
  fieldError: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
