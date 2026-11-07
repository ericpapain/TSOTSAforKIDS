import {
  Carlito_400Regular,
  Carlito_700Bold,
  useFonts,
} from "@expo-google-fonts/carlito";
import { SplashScreen, Stack } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "../src/theme/colors";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen prevention may fail in testing environments
});

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    Carlito_400Regular,
    Carlito_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError && Platform.OS !== "web") {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      />
    </SafeAreaProvider>
  );
}

