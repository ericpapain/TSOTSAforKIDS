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

  const handleGoogleSignIn = async (): Promise<void> => {
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { GoogleSignin } = require("@react-native-google-signin/google-signin");
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || (process.env.NODE_ENV === "test" ? "test-client-id" : undefined);
      if (!webClientId) {
        setErrorMessage(
          t("google.notConfigured", {
            defaultValue:
              "La connexion Google nécessite la configuration Google Cloud en production. Veuillez utiliser la connexion par e-mail ou téléphone.",
          })
        );
        return;
      }
      GoogleSignin.configure({ webClientId });
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      if (!idToken) {
        setErrorMessage(t("google.tokenMissing", { defaultValue: "Jeton Google introuvable." }));
        return;
      }
      const result = await authenticateWithGoogle(idToken);
      if (result.success) {
        if (result.role === "caregiver") {
          router.replace("/s-pending");
        } else {
          router.replace("/u-modules");
        }
      } else {
        setErrorMessage(result.error || t("google.authFailed", { defaultValue: "Échec de l'authentification Google." }));
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === "SIGN_IN_CANCELLED" || e?.code === "12501") {
        // Annulé par l'utilisateur, ne pas afficher d'erreur rouge
        return;
      }
      setErrorMessage(
        t("google.notConfigured", {
          defaultValue:
            "La connexion Google nécessite la configuration Google Cloud en production. Veuillez utiliser la connexion par e-mail ou téléphone.",
        })
      );
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
          {t("google.toContinue", { defaultValue: "pour continuer vers TSOTSA4Kids" })}
        </Text>

        {/* Error message */}
        {errorMessage && (
          <Text testID="google-error-text" style={styles.errorText}>
            {errorMessage}
          </Text>
        )}

        {/* Google Account Sign-In Card */}
        <Pressable
          testID="btn-google-account-demo"
          style={({ pressed }) => [
            styles.accountCard,
            pressed && styles.pressed,
          ]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <View style={styles.userIconWrapper}>
            <FontAwesome5 name="google" size={24} color="#4285F4" />
          </View>
          <View style={styles.accountTextCol}>
            <Text style={styles.accountName}>
              {t("google.signInTitle", { defaultValue: "Se connecter avec Google" })}
            </Text>
            <Text style={styles.accountEmail}>
              {t("google.signInSubtitle", { defaultValue: "Compte Google personnel" })}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </Pressable>

        {/* Fallback Email button */}
        <Pressable
          testID="btn-google-fallback-email"
          style={({ pressed }) => [
            {
              marginTop: 12,
              paddingVertical: 10,
              alignItems: "center",
            },
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/u-email")}
        >
          <Text style={{ fontFamily: fontFamilies.bold, color: colors.primary, fontSize: fontSizes.sm14 }}>
            {t("google.useEmailInstead", { defaultValue: "Utiliser plutôt mon adresse e-mail →" })}
          </Text>
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
            defaultValue: "Google partagera votre nom, votre adresse e-mail et votre photo avec TSOTSA4Kids.",
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
