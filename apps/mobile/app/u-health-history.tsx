import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../src/theme/colors";
import { fontFamilies } from "../src/theme/typography";
import { AppBar } from "../src/components/AppBar";
import { fetchChildHealthEvents } from "../src/features/health/healthService";
import { historyStyles as styles } from "../src/features/health/healthHistoryStyles";
import type { MobileHealthEventOut } from "../src/features/health/healthTypes";

export default function HealthHistoryScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation(["mobile", "common", "medical"]);
  const params = useLocalSearchParams<{ personId?: string; name?: string }>();
  const personId = params.personId || "";
  const childName = params.name || t("mobile:health.defaultChild", { defaultValue: "Mon enfant" });

  const [events, setEvents] = useState<MobileHealthEventOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchChildHealthEvents(personId)
      .then((data) => {
        if (isMounted) {
          setEvents(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [personId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <AppBar
        title={`${t("mobile:health.historyTitle", { defaultValue: "Historique" })} · ${childName}`}
        onBack={() => router.replace({ pathname: "/u-health-hub" as never, params: { personId, name: childName } })}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topInfo}>
          <Text style={styles.heading}>
            {t("mobile:health.eventsHistoryTitle", { defaultValue: "Événements de santé signalés" })}
          </Text>
          <Text style={styles.subtitle}>
            {t("mobile:health.eventsHistorySubtitle", {
              defaultValue: "Retrouvez ici le suivi des signes signalés et les recommandations de l'équipe médicale.",
            })}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
        ) : events.length === 0 ? (
          <View testID="empty-health-history" style={styles.emptyCard}>
            <FontAwesome5 name="check-circle" size={40} color={colors.primary} />
            <Text style={styles.emptyTitle}>
              {t("mobile:health.noEventsReported", { defaultValue: "Aucun problème signalé" })}
            </Text>
            <Text style={styles.emptyDesc}>
              {t("mobile:health.noEventsDesc", {
                defaultValue: "Votre enfant n'a aucun incident ou signe de maladie signalé pour le moment.",
              })}
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((ev) => (
              <View key={ev.id} testID={`mobile-event-card-${ev.id}`} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.dateCol}>
                    <Text style={styles.eventDate}>
                      {new Date(ev.created_at).toLocaleDateString()}
                    </Text>
                    {ev.declaration_context === "during_meal" && (
                      <View style={styles.mealBadge}>
                        <FontAwesome5 name="utensils" size={10} color="#92400E" />
                        <Text style={styles.mealBadgeText}>
                          {t("mobile:health.duringMealBadge", { defaultValue: "Pendant repas" })}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      ev.status === "resolved" ? styles.statusResolved : styles.statusOpen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        ev.status === "resolved" ? styles.statusTextResolved : styles.statusTextOpen,
                      ]}
                    >
                      {ev.status === "resolved"
                        ? t("mobile:health.statusResolved", { defaultValue: "Résolu" })
                        : t("mobile:health.statusInReview", { defaultValue: "Transmis au médecin" })}
                    </Text>
                  </View>
                </View>

                {/* Symptoms */}
                <View style={styles.symptomsBox}>
                  {ev.symptoms.map((s, idx) => (
                    <Text key={idx} style={styles.symptomText}>
                      • <Text style={{ fontFamily: fontFamilies.bold }}>{s.symptom_code}</Text> ({s.duration})
                    </Text>
                  ))}
                </View>

                {/* Advice from guidance message */}
                {ev.parent_guidance_message ? (
                  <View style={styles.guidanceBox}>
                    <FontAwesome5 name="heart" size={12} color="#166534" style={{ marginTop: 2 }} />
                    <Text style={styles.guidanceText}>{ev.parent_guidance_message}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          testID="btn-new-health-report"
          style={styles.newReportBtn}
          onPress={() =>
            router.push({
              pathname: "/u-health-flow" as never,
              params: { personId, name: childName },
            })
          }
        >
          <FontAwesome5 name="plus" size={16} color={colors.white} />
          <Text style={styles.newReportText}>
            {t("mobile:health.newReportBtn", { defaultValue: "Signaler un nouveau problème" })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
