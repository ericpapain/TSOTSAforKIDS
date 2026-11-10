import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../src/theme/colors";
import { BottomNav } from "../src/components/BottomNav";
import { profileStyles as styles } from "../src/features/persons/profileStyles";
import {
  getFamilyMember,
  calculateAgeLabel,
} from "../src/features/persons/personsService";
import { PersonItem } from "../src/features/persons/types";

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation(["mobile", "common"]);
  const params = useLocalSearchParams<{ personId?: string; name?: string }>();
  const personId = params.personId ?? "";

  const [person, setPerson] = useState<PersonItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (personId) {
      getFamilyMember(personId).then((data) => {
        if (isMounted && data) {
          setPerson(data);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [personId]);

  const displayName = person?.first_name ?? params.name ?? t("mobile:profile.title", { defaultValue: "Profil" });
  const sexLabel = person?.sex === "M"
    ? t("mobile:profile.boy", { defaultValue: "Garçon" })
    : person?.sex === "F"
      ? t("mobile:profile.girl", { defaultValue: "Fille" })
      : "";
  const localeLang = i18n.language === "en" ? "en" : "fr";
  const ageLabel = person?.birth_date ? calculateAgeLabel(person.birth_date, localeLang) : "";
  const subtitle = [sexLabel, ageLabel].filter(Boolean).join(" · ") || t("mobile:profile.child", { defaultValue: "Enfant" });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="btn-back"
          accessibilityLabel={t("common:actions.back", { defaultValue: "Retour" })}
          accessibilityRole="button"
          onPress={() => router.push("/u-persons")}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.appBarTitle} numberOfLines={1}>
          {displayName}
        </Text>

        <TouchableOpacity
          testID="btn-notif"
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          onPress={() => router.push("/u-notif-center")}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="bell" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.avatarCircle}>
              <FontAwesome5 name="child" size={32} color={colors.primary} />
            </View>

            <View style={styles.infoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.personName}>{displayName}</Text>
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>
                    {t("mobile:profile.demo", { defaultValue: "Démo" })}
                  </Text>
                </View>
              </View>
              <Text style={styles.personSub}>{subtitle}</Text>
            </View>
          </View>

          {/* Status pill */}
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {t("mobile:profile.toMonitor", { defaultValue: "À surveiller" })}
            </Text>
          </View>

          {/* Last visit */}
          <Text style={styles.lastVisitText}>
            {t("mobile:profile.lastVisit", {
              date: "29/10",
              weight: "7,9 kg",
              defaultValue: "Dernière visite : 29/10 · 7,9 kg",
            })}
          </Text>
        </View>

        {/* Appointment Box */}
        <View style={styles.appointmentBox}>
          <Text style={styles.appointmentText}>
            {t("mobile:profile.nextAppointment", {
              date: localeLang === "en" ? "November 12" : "12 novembre",
              defaultValue: "Prochain rendez-vous : 12 novembre",
            })}
          </Text>
        </View>

        {/* Action: Give product */}
        <TouchableOpacity
          testID="btn-give-product"
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/u-choose",
              params: { personId, name: displayName },
            })
          }
          style={styles.btnGiveProduct}
          activeOpacity={0.85}
        >
          <Text style={styles.btnGiveProductText}>
            {t("mobile:profile.giveProduct", { defaultValue: "Donner un produit" })}
          </Text>
        </TouchableOpacity>

        {/* Action: Intake history */}
        <TouchableOpacity
          testID="btn-history"
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/u-history",
              params: { personId, name: displayName },
            })
          }
          style={styles.btnHistory}
          activeOpacity={0.85}
        >
          <Text style={styles.btnHistoryText}>
            {t("mobile:profile.intakes", { defaultValue: "Mes prises" })}
          </Text>
        </TouchableOpacity>

        {/* Action: Reminders */}
        <TouchableOpacity
          testID="btn-schedule"
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/u-schedule",
              params: { personId, name: displayName },
            })
          }
          style={styles.btnSchedule}
          activeOpacity={0.85}
        >
          <Text style={styles.btnScheduleText}>
            {t("mobile:profile.reminders", {
              times: "08:00 · 12:30 · 18:00",
              defaultValue: "Rappels : 08:00 · 12:30 · 18:00",
            })}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Nav */}
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
