import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";
import { AppBar } from "../src/components/AppBar";
import { BottomNav } from "../src/components/BottomNav";

export default function HealthHubScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation(["mobile", "common", "medical"]);
  const params = useLocalSearchParams<{ personId?: string; name?: string }>();
  const personId = params.personId || "";
  const childName = params.name || t("mobile:health.defaultChild", { defaultValue: "Mon enfant" });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <AppBar
        title={t("mobile:health.hubTitle", { defaultValue: "Santé et bien-être" })}
        onBack={() => router.replace("/u-persons")}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Child Header Card */}
        <View style={styles.headerCard} testID="health-hub-header">
          <View style={styles.iconCircle}>
            <FontAwesome5 name="heartbeat" size={28} color={colors.primary} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.childName}>{childName}</Text>
            <Text style={styles.childSub}>
              {t("mobile:health.hubSubtitle", { defaultValue: "Suivi de santé & accompagnement médical" })}
            </Text>
          </View>
        </View>

        {/* Reassuring Explanation Banner */}
        <View style={styles.infoBox}>
          <FontAwesome5 name="info-circle" size={18} color={colors.primary} style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            {t(
              "mobile:health.reassuringNote",
              { defaultValue: "Ce module vous permet de signaler tout changement d'état ou signe inhabituel. Votre médecin référent sera immédiatement notifié pour ajuster la prise en charge." }
            )}
          </Text>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          {/* Action 1: Report health event */}
          <TouchableOpacity
            testID="btn-report-health-event"
            style={styles.primaryActionButton}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/u-health-flow" as never,
                params: { personId, name: childName },
              })
            }
          >
            <View style={styles.actionIconWrapper}>
              <FontAwesome5 name="notes-medical" size={24} color={colors.white} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>
                {t("mobile:health.reportProblemBtn", { defaultValue: "Signaler un changement ou problème" })}
              </Text>
              <Text style={styles.actionDesc}>
                {t("mobile:health.reportProblemDesc", { defaultValue: "Fièvre, vomissements, selles, fatigue ou tout signe inquiétant" })}
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color={colors.white} />
          </TouchableOpacity>

          {/* Action 2: View health history */}
          <TouchableOpacity
            testID="btn-view-health-history"
            style={styles.secondaryActionButton}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/u-health-history" as never,
                params: { personId, name: childName },
              })
            }
          >
            <View style={styles.secondaryIconWrapper}>
              <FontAwesome5 name="history" size={22} color={colors.text} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.secondaryActionTitle}>
                {t("mobile:health.viewHistoryBtn", { defaultValue: "Voir les conseils et l'historique" })}
              </Text>
              <Text style={styles.secondaryActionDesc}>
                {t("mobile:health.viewHistoryDesc", { defaultValue: "Consulter les événements signalés et retours du soignant" })}
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color={colors.textSubtle} />
          </TouchableOpacity>
        </View>

        {/* Emergency Notice */}
        <View style={styles.emergencyCard}>
          <FontAwesome5 name="exclamation-circle" size={18} color="#B91C1C" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>
              {t("mobile:health.emergencyTitle", { defaultValue: "En cas d'urgence grave" })}
            </Text>
            <Text style={styles.emergencyText}>
              {t("mobile:health.emergencyDesc", {
                defaultValue: "Si l'enfant convulse, ne peut plus téter ou est inconscient, rendez-vous sans attendre au centre de santé le plus proche.",
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav
        activeTab="persons"
        onTabPress={(tab) => {
          if (tab === "modules") router.push("/u-modules");
          else if (tab === "persons") router.push("/u-persons");
          else if (tab === "products") router.push("/u-choose");
          else if (tab === "intakes") router.push("/u-history");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E8F4F0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextCol: {
    flex: 1,
  },
  childName: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg21,
    color: colors.text,
  },
  childSub: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: "#166534",
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.white,
  },
  actionDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  secondaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  secondaryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryActionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.text,
  },
  secondaryActionDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.textMuted,
    marginTop: 2,
  },
  emergencyCard: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  emergencyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: "#991B1B",
  },
  emergencyText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: "#7F1D1D",
    marginTop: 2,
    lineHeight: 16,
  },
});
