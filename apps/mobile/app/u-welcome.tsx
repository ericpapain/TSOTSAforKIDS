import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { BrandLogo } from "../src/components/BrandLogo";
import { LanguageSelector } from "../src/components/LanguageSelector";
import { RoleSelector } from "../src/features/auth/RoleSelector";
import type { CanonicalRole } from "../src/features/auth/types";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function WelcomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("mobile");
  const [selectedRole, setSelectedRole] = useState<CanonicalRole>("parent");

  const isParent = selectedRole === "parent";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Selector Header */}
        <RoleSelector
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
        />

        {/* Symbol in circle */}
        <View style={styles.circleContainer}>
          <BrandLogo size={103} mode="symbol" />
        </View>

        {/* Word + Pill */}
        <View style={styles.brandWordRow}>
          <BrandLogo size={53} mode="word" />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {t("welcome.subtitle", { defaultValue: "Bien nourrir, bien suivre." })}
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonsGroup}>
          {/* Google Button (Only for parents) */}
          {isParent && (
            <Pressable
              testID="btn-welcome-google"
              style={({ pressed }) => [
                styles.actionButton,
                styles.googleButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push("/u-google")}
            >
              <View style={styles.buttonIcon}>
                <FontAwesome5 name="google" size={30} color="#4285F4" />
              </View>
              <Text style={styles.googleText}>
                {t("welcome.google", { defaultValue: "Continuer avec Google" })}
              </Text>
            </Pressable>
          )}

          {/* Phone Button (Only for parents) */}
          {isParent && (
            <Pressable
              testID="btn-welcome-phone"
              style={({ pressed }) => [
                styles.actionButton,
                styles.phoneButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push("/u-signup")}
            >
              <View style={styles.buttonIcon}>
                <FontAwesome5 name="mobile-alt" size={30} color={colors.white} />
              </View>
              <Text style={styles.phoneText}>
                {t("welcome.phone", { defaultValue: "Continuer avec mon téléphone" })}
              </Text>
            </Pressable>
          )}

          {/* Email Button (Available for all roles) */}
          <Pressable
            testID="btn-welcome-email"
            style={({ pressed }) => [
              styles.actionButton,
              styles.emailButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              selectedRole === "parent"
                ? router.push("/u-email")
                : router.push({
                    pathname: "/u-email",
                    params: { role: selectedRole },
                  })
            }
          >
            <View style={styles.buttonIcon}>
              <FontAwesome5 name="envelope" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emailText}>
              {t("welcome.email", { defaultValue: "Continuer avec mon e-mail" })}
            </Text>
          </Pressable>
        </View>

        {/* Family info note */}
        <Text style={styles.familyNote}>
          {isParent
            ? t("welcome.familyNote", { defaultValue: "Un seul compte pour toute la famille." })
            : t("welcome.proNote", { defaultValue: "Connexion sécurisée e-mail + mot de passe." })}
        </Text>

        {/* Language selector */}
        <LanguageSelector mode="button" testID="btn-welcome-language" />
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
    paddingHorizontal: 17,
    paddingTop: 24,
    paddingBottom: 24,
  },
  circleContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  brandWordRow: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.lg21,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonsGroup: {
    width: "100%",
    gap: 14,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "100%",
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneButton: {
    backgroundColor: colors.primary,
  },
  emailButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonIcon: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  phoneText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.white,
  },
  emailText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.primary,
  },
  familyNote: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
