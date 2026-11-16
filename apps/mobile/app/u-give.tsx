import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppBar } from "../src/components/AppBar";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function ScreenM20(): React.JSX.Element {
  const { t } = useTranslation(["mobile", "common"]);
  const router = useRouter();
  const screenTitle = t("mobile:give.title", { defaultValue: "Confirmer la prise" });

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <AppBar
        title={screenTitle}
        onBack={() => router.replace("/u-product")}
      />
      <View style={styles.content} testID="screen-m20">
        <Text style={styles.codeText}>M20</Text>
        <Text style={styles.titleText}>{screenTitle}</Text>
        <Text style={styles.descText}>
          {t("mobile:give.desc", {
            defaultValue: "Écran de fondation (M20). L interface complète sera intégrée lors de l étape dédiée.",
          })}
        </Text>

        <TouchableOpacity
          testID="btn-report-meal-incident"
          style={styles.incidentButton}
          onPress={() =>
            router.push({
              pathname: "/u-health-flow" as never,
              params: {
                declarationContext: "during_meal",
              },
            })
          }
        >
          <Text style={styles.incidentButtonText}>
            ⚠️ {t("mobile:health.reportMealIncident", { defaultValue: "Signaler un problème de santé pendant le repas" })}
          </Text>
        </TouchableOpacity>
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
  incidentButton: {
    marginTop: 20,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  incidentButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs11,
    color: "#92400E",
  },
});
