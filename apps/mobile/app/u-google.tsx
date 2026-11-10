import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { authenticateWithGoogle } from "../src/features/auth/authService";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function GoogleAuthScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("mobile");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectDemoAccount = async (): Promise<void> => {
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await authenticateWithGoogle("demo-google-id-token");
      if (result.success) {
        if (result.role === "caregiver") {
          router.replace("/s-pending");
        } else {
          router.replace("/u-modules");
        }
      } else {
        setErrorMessage(result.error || t("google.authFailed", { defaultValue: "Échec de l'authentification Google." }));
      }
    } catch {
      setErrorMessage(t("google.connError", { defaultValue: "Erreur de connexion. Veuillez réessayer." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
      <Pressable
        testID="btn-google-dismiss"
        style={styles.backdrop}
        onPress={() => router.replace("/u-welcome")}
      />

      <View style={styles.modalCard}>
        {/* Google Icon */}
        <View style={styles.iconContainer}>
          <FontAwesome5 name="google" size={39} color="#4285F4" />
        </View>

        {/* Title & subtitle */}
        <Text style={styles.title}>
          {t("google.chooseAccount", { defaultValue: "Choisir un compte" })}
        </Text>
        <Text style={styles.subtitle}>
          {t("google.toContinue", { defaultValue: "pour continuer vers TSOTSA Kids" })}
        </Text>

        {/* Error message */}
        {errorMessage && (
          <Text testID="google-error-text" style={styles.errorText}>
            {errorMessage}
          </Text>
        )}

        {/* Demo Account card */}
        <Pressable
          testID="btn-google-account-demo"
          style={({ pressed }) => [
            styles.accountCard,
            pressed && styles.pressed,
          ]}
          onPress={handleSelectDemoAccount}
          disabled={loading}
        >
          <View style={styles.userIconWrapper}>
            <FontAwesome5 name="user-circle" size={32} color={colors.textMuted} />
          </View>
          <View style={styles.accountTextCol}>
            <Text style={styles.accountName}>
              {t("google.demoAccount", { defaultValue: "Compte Google de démo" })}
            </Text>
            <Text style={styles.accountEmail}>parent.demo@gmail.com</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </Pressable>

        {/* Caregiver option */}
        <Pressable
          testID="btn-google-caregiver"
          style={({ pressed }) => [
            styles.caregiverButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/s-pending")}
        >
          <Text style={styles.caregiverText}>
            {t("google.caregiverLink", { defaultValue: "Je suis soignant ›" })}
          </Text>
        </Pressable>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          {t("google.disclaimer", {
            defaultValue: "Google partagera votre nom, votre adresse e-mail et votre photo avec TSOTSA Kids.",
          })}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    paddingHorizontal: 17,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 14,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  errorText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.danger,
    textAlign: "center",
    marginBottom: 10,
  },
  accountCard: {
    width: "100%",
    height: 80,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  userIconWrapper: {
    width: 32,
    marginRight: 14,
    alignItems: "center",
  },
  accountTextCol: {
    flex: 1,
  },
  accountName: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.text,
    marginBottom: 2,
  },
  accountEmail: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
  },
  chevron: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl25,
    color: colors.textSubtle,
    marginLeft: 8,
  },
  caregiverButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  caregiverText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.care,
    textAlign: "center",
  },
  disclaimer: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.85,
  },
});
