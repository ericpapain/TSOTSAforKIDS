import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { logout } from "../src/features/auth/authService";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function ProfessionalWebRedirectScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("mobile");

  const WEB_URL = "https://app.tsotsa-for-kids.com";

  const handleOpenWeb = async (): Promise<void> => {
    try {
      await Linking.openURL(WEB_URL);
    } catch {
      // Gracefully handle browser open error
    }
  };

  const handleDisconnect = (): void => {
    router.replace("/u-welcome");
    void logout();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconCircle} testID="icon-web-redirect">
          <FontAwesome5 name="laptop-medical" size={64} color={colors.primary} />
        </View>

        <Text style={styles.heading}>
          {t("proRedirect.heading", { defaultValue: "Espace professionnel" })}
        </Text>

        <Text style={styles.message}>
          {t("proRedirect.message", {
            defaultValue:
              "L'application mobile TSOTSA Kids est réservée au suivi des familles sur le terrain. Votre espace professionnel complet est disponible sur notre portail web sécurisé.",
          })}
        </Text>

        <Pressable
          testID="btn-open-web-portal"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={handleOpenWeb}
        >
          <FontAwesome5 name="external-link-alt" size={18} color={colors.white} />
          <Text style={styles.primaryButtonText}>
            {t("proRedirect.openWeb", { defaultValue: "Ouvrir app.tsotsa-for-kids.com" })}
          </Text>
        </Pressable>

        <Pressable
          testID="btn-pro-logout"
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
          onPress={handleDisconnect}
        >
          <Text style={styles.secondaryButtonText}>
            {t("proRedirect.disconnect", { defaultValue: "Se déconnecter / Changer de rôle" })}
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.primary50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl24,
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 36,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.white,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});

