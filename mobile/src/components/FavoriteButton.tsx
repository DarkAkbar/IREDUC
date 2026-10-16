import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { RequestTarget } from "../api/types";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { favoriteKey, useFavoritesStore } from "../store/favoritesStore";
import { colors } from "../theme";

type Props = {
  targetType: RequestTarget;
  targetId: string;
  returnTo?: string;
  size?: number;
};

export function FavoriteButton({
  targetType,
  targetId,
  returnTo,
  size = 22,
}: Props) {
  const { onToggle } = useFavoriteToggle(returnTo);
  // S'abonner à byKey pour re-rendre après hydrate / toggle
  const active = useFavoritesStore((s) =>
    Boolean(s.byKey[favoriteKey(targetType, targetId)])
  );

  return (
    <Pressable
      style={styles.btn}
      hitSlop={8}
      onPress={() => void onToggle(targetType, targetId)}
    >
      <Ionicons
        name={active ? "heart" : "heart-outline"}
        size={size}
        color={active ? colors.primary : colors.navy}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
