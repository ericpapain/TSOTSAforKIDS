import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppBar } from "../src/components/AppBar";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function CaregiverPendingScreen(): React.JSX.Element {
  const { t } = useTranslation(["mobile", "common"]);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <AppBar
        title={t("mobile:pending.title", { defaultValue: "Compte soignant" })}
        backgroundColor={colors.care}
        onBack={() => router.replace("/u-signup")}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* User clock circle */}
        <View style={styles.circleContainer}>
          <FontAwesome5 name="user-clock" size={80} color={colors.care} />
        </View>

        {/* Title & subtitle */}
        <Text style={styles.title}>
          {t("mobile:pending.heading", { defaultValue: "Vérification en cours" })}
        </Text>
        <Text style={styles.subtitle}>
          {t("mobile:pending.subtitle", {
            defaultValue:
              "Notre équipe vérifie votre identité professionnelle. Vous serez prévenu par SMS.",
          })}
        </Text>

        {/* Status items */}
        <View style={styles.statusList}>
          {/* Item 1 */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              {t("mobile:pending.proCard", { defaultValue: "Carte professionnelle" })}
            </Text>
            <Text style={styles.statusValue}>
              {t("mobile:pending.sentStatus", { defaultValue: "envoyée ✓" })}
            </Text>
          </View>

          {/* Item 2 */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              {t("mobile:pending.facility", { defaultValue: "Établissement" })}
            </Text>
            <Text style={styles.statusValue}>
              {t("mobile:pending.demoFacilityStatus", { defaultValue: "CMA de démo ✓" })}
            </Text>
          </View>

          {/* Item 3 */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              {t("mobile:pending.registrationNumber", { defaultValue: "Numéro d'ordre" })}
            </Text>
            <Text style={styles.statusValue}>
              {t("mobile:pending.sentStatusMasc", { defaultValue: "envoyé ✓" })}
            </Text>
          </View>
        </View>

        {/* Admin Link Button */}
        <Pressable
          testID="btn-pending-admin"
          style={({ pressed }) => [
            styles.adminButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace("/u-modules")}
        >
          <Text style={styles.adminButtonText}>
            {t("mobile:pending.viewAdmin", { defaultValue: "Voir côté administration →" })}
          </Text>
        </Pressable>

        {/* Understood text link */}
        <Pressable
          testID="btn-pending-understood"
          style={({ pressed }) => [
            styles.understoodButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace("/u-welcome")}
        >
          <Text style={styles.understoodText}>
            {t("mobile:pending.understood", { defaultValue: "Compris" })}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    paddingHorizontal: 17,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  circleContainer: {
    width: 149,
    height: 149,
    borderRadius: 74.5,
    backgroundColor: colors.care50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 23,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.h3_27,
    color: colors.text,
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md18,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 12,
    marginBottom: 28,
  },
  statusList: {
    width: "100%",
    paddingHorizontal: 12,
    gap: 4,
    marginBottom: 22,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 41,
  },
  statusLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  statusValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.primary,
  },
  adminButton: {
    width: "100%",
    height: 57,
    backgroundColor: colors.admin,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  adminButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md19,
    color: colors.white,
  },
  understoodButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  understoodText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.care,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.85,
  },
});
