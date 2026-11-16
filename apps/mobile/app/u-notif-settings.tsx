import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppBar } from "../src/components/AppBar";
import { LanguageSelector } from "../src/components/LanguageSelector";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function ScreenM28(): React.JSX.Element {
  const { t } = useTranslation(["mobile", "common"]);
  const router = useRouter();
  const screenTitle = t("mobile:notifSettings.title", { defaultValue: "Réglages notifications" });

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <AppBar
        title={screenTitle}
        onBack={() => router.replace("/u-notif-center")}
      />
      <View style={styles.content} testID="screen-m28">
        <Text style={styles.codeText}>M28</Text>
        <Text style={styles.titleText}>{screenTitle}</Text>
        <Text style={styles.descText}>
          {t("mobile:notifSettings.desc", {
            defaultValue: "Écran de fondation (M28). L interface complète sera intégrée lors de l étape dédiée.",
          })}
        </Text>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>
            {t("mobile:notifSettings.languageTitle", {
              defaultValue: "Langue de l'application",
            })}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {t("mobile:notifSettings.languageSubtitle", {
              defaultValue: "Choisissez entre français et anglais",
            })}
          </Text>
          <View style={styles.selectorWrapper}>
            <LanguageSelector mode="pills" testID="language-selector-settings" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    padding: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  codeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl24,
    color: colors.primary,
    marginBottom: 8,
  },
  titleText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg22,
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  descText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 300,
  },
  settingsSection: {
    marginTop: 24,
    padding: 16,
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 12,
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
    marginBottom: 12,
    textAlign: "center",
  },
  selectorWrapper: {
    marginTop: 4,
  },
});
