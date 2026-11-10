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

import { BrandLogo } from "../src/components/BrandLogo";
import { LanguageSelector } from "../src/components/LanguageSelector";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function WelcomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("mobile");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
          {/* Google Button */}
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

          {/* Phone Button */}
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

          {/* Email Button */}
          <Pressable
            testID="btn-welcome-email"
            style={({ pressed }) => [
              styles.actionButton,
              styles.emailButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/u-email")}
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
          {t("welcome.familyNote", { defaultValue: "Un seul compte pour toute la famille." })}
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
    paddingTop: 42,
    paddingBottom: 24,
  },
  circleContainer: {
    width: 161,
    height: 161,
    borderRadius: 80.5,
    backgroundColor: colors.primary50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  brandWordRow: {
    height: 53,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.lg21,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 32,
  },
  buttonsGroup: {
    width: "100%",
    gap: 14,
    marginBottom: 24,
  },
  actionButton: {
    height: 63,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 19,
  },
  buttonIcon: {
    position: "absolute",
    left: 19,
    width: 30,
    alignItems: "center",
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md19,
    color: colors.text,
  },
  phoneButton: {
    backgroundColor: colors.primary,
  },
  phoneText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md19,
    color: colors.white,
  },
  emailButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emailText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md19,
    color: colors.primary,
  },
  familyNote: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  languageText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.85,
  },
});
