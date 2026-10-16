import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";
import { useFavoritesStore } from "../store/favoritesStore";
import { colors } from "../theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);
  const clearFavorites = useFavoritesStore((s) => s.clear);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated) {
      void hydrateFavorites();
    } else {
      clearFavorites();
    }
  }, [isAuthenticated, isHydrated, hydrateFavorites, clearFavorites]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="auth/login"
              options={{ presentation: "modal", headerShown: false }}
            />
            <Stack.Screen
              name="filters"
              options={{ presentation: "modal", headerShown: false }}
            />
            <Stack.Screen name="properties/index" />
            <Stack.Screen name="services/index" />
            <Stack.Screen name="property/[id]" />
            <Stack.Screen name="service/[id]" />
            <Stack.Screen name="favorites" />
            <Stack.Screen name="reserve" />
            <Stack.Screen name="discuss" />
            <Stack.Screen name="conversation/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="partner" />
            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="profile/password" />
            <Stack.Screen name="profile/alerts" />
            <Stack.Screen name="profile/about" />
            <Stack.Screen name="request/[id]" />
            <Stack.Screen name="request/similar" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
