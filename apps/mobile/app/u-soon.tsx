import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBar } from "../src/components/AppBar";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function SoonScreen(): React.JSX.Element {
  const router = useRouter();

  const handleDismiss = (): void => {
    router.replace("/u-modules");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <AppBar title="Bonjour" />

      {/* Overlay background */}
      <View style={styles.overlay}>
        <Pressable
          testID="btn-soon-backdrop"
          style={styles.backdrop}
          onPress={handleDismiss}
        />

        {/* Modal Card */}
        <View style={styles.modalCard}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name="heartbeat" size={57} color={colors.danger} />
          </View>

          <Text style={styles.title}>Bientôt disponible</Text>
          <Text style={styles.message}>
            Le suivi de la tension artérielle arrive dans une prochaine version.
          </Text>

          {/* Action buttons row */}
          <View style={styles.buttonsRow}>
            {/* Me prévenir button */}
            <Pressable
              testID="btn-soon-notify"
              style={({ pressed }) => [
                styles.button,
                styles.notifyButton,
                pressed && styles.pressed,
              ]}
              onPress={handleDismiss}
            >
              <Text style={styles.notifyText}>Me prévenir</Text>
            </Pressable>

            {/* Fermer button */}
            <Pressable
              testID="btn-soon-close"
              style={({ pressed }) => [
                styles.button,
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              onPress={handleDismiss}
            >
              <Text style={styles.closeText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 17,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: "100%",
    maxWidth: 356,
    backgroundColor: colors.white,
    borderRadius: 17,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl25,
    color: colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md18,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 55,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  notifyButton: {
    backgroundColor: colors.primary,
  },
  notifyText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.white,
  },
  closeButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  closeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
