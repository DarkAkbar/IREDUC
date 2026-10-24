import { Redirect } from "expo-router";

/** Ancienne route stack → onglet Favoris. */
export default function FavoritesRedirect() {
  return <Redirect href="/(tabs)/favorites" />;
}
