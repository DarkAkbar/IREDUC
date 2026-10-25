import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { getErrorMessage } from "../../utils/errors";
import { normalizePhone } from "../../utils/phone";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  const phoneChanged = phone.trim() !== (user?.phone ?? "");

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
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setLoading(true);
    try {
      const updated = await uploadAvatar(asset.uri, asset.mimeType);
      setUser(updated);
      setAvatarPreview(mediaUrl(updated.avatarUrl));
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
    if (fullName.trim().length < 2) {
      Alert.alert("Profil", "Le nom complet est requis.");
      return;
    }
    if (phoneChanged && !currentPassword) {
      Alert.alert(
        "Profil",
        "Saisissez votre mot de passe actuel pour changer de numéro."
      );
      return;
    }

    let phoneE164 = phone.trim();
    let whatsappValue: string | null = whatsapp.trim() || null;
    try {
      phoneE164 = normalizePhone(phone.trim());
      if (whatsappValue) whatsappValue = normalizePhone(whatsappValue);
    } catch {
      Alert.alert("Profil", "Numéro de téléphone invalide");
      return;
    }

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
      Alert.alert("Profil", "Vos informations ont été enregistrées.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
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
          <Text style={styles.changePhoto}>Changer la photo</Text>
        </Pressable>

        <Text style={styles.label}>Nom complet</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Votre nom"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+243 …"
          placeholderTextColor={colors.textMuted}
        />

        {phoneChanged ? (
          <>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Requis pour changer de numéro"
              placeholderTextColor={colors.textMuted}
            />
          </>
        ) : null}

        <Text style={styles.label}>E-mail (facultatif)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="vous@exemple.com"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
          placeholder="+243 …"
          placeholderTextColor={colors.textMuted}
        />

        <Button
          label="Enregistrer"
          loading={loading}
          onPress={() => void onSave()}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  avatarWrap: { alignItems: "center", marginVertical: spacing.xl, gap: spacing.sm },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    backgroundColor: colors.skeleton,
    alignItems: "center",
    justifyContent: "center",
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
});
