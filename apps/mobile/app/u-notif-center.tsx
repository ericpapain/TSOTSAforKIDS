import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppBar } from "../src/components/AppBar";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function ScreenM27(): React.JSX.Element {
  const { t } = useTranslation(["mobile", "common"]);
  const router = useRouter();
  const screenTitle = t("mobile:notifCenter.title", { defaultValue: "Mes notifications" });

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <AppBar
        title={screenTitle}
        onBack={() => router.replace("/u-modules")}
      />
      <View style={styles.content} testID="screen-m27">
        <Text style={styles.codeText}>M27</Text>
        <Text style={styles.titleText}>{screenTitle}</Text>
        <Text style={styles.descText}>
          {t("mobile:notifCenter.desc", {
            defaultValue: "Écran de fondation (M27). L interface complète sera intégrée lors de l étape dédiée.",
          })}
        </Text>
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
});
