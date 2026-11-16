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
import { logout } from "../src/features/auth/authService";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function CaregiverPendingScreen(): React.JSX.Element {
  const { t } = useTranslation(["mobile", "common"]);
  const router = useRouter();

  const handleUnderstood = (): void => {
    router.replace("/u-welcome");
    void logout();
  };

  const handleAdminLink = (): void => {
    router.replace("/u-modules");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <AppBar
        title={t("mobile:pending.title", { defaultValue: "Compte soignant" })}
        backgroundColor={colors.care}
        onBack={() => router.replace("/u-welcome")}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* User clock circle */}
        <View style={styles.circleContainer} testID="pending-icon">
          <FontAwesome5 name="user-clock" size={80} color={colors.care} />
        </View>

        {/* Title & subtitle */}
        <Text style={styles.title} testID="pending-title">
          {t("mobile:pending.heading", { defaultValue: "Vérification en cours" })}
        </Text>
        <Text style={styles.subtitle}>
          {t("mobile:pending.subtitle", {
            defaultValue:
              "Notre équipe vérifie votre identité professionnelle. Vous serez prévenu par SMS.",
          })}
        </Text>

        {/* Official validation notice banner */}
        <View style={styles.noticeBox} testID="pending-notice-box">
          <Text style={styles.noticeText} testID="pending-notice-text">
            {t("mobile:pending.notice", {
              defaultValue:
                "Votre compte est en cours de validation par l'équipe TSOTSA. Vous recevrez une notification dès qu'il sera activé.",
            })}
          </Text>
        </View>

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
              {t("mobile:pending.facilityStatus", { defaultValue: "Structure de rattachement ✓" })}
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
          onPress={handleAdminLink}
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
          onPress={handleUnderstood}
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  circleContainer: {
    width: 149,
    height: 149,
    borderRadius: 74.5,
    backgroundColor: colors.care50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl24,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  noticeBox: {
    width: "100%",
    backgroundColor: colors.warning50,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
  },
  noticeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.text,
    textAlign: "center",
    lineHeight: 18,
  },
  statusList: {
    width: "100%",
    backgroundColor: colors.canvas,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.text,
  },
  statusValue: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.primary,
  },
  adminButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  adminButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.care,
  },
  understoodButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  understoodText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
});
