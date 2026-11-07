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

  const displayName = person?.first_name ?? params.name ?? "Profil";
  const sexLabel = person?.sex === "M" ? "Garçon" : person?.sex === "F" ? "Fille" : "";
  const ageLabel = person?.birth_date ? calculateAgeLabel(person.birth_date) : "";
  const subtitle = [sexLabel, ageLabel].filter(Boolean).join(" · ") || "Enfant";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="btn-back"
          accessibilityLabel="Retour"
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
                  <Text style={styles.demoBadgeText}>Démo</Text>
                </View>
              </View>
              <Text style={styles.personSub}>{subtitle}</Text>
            </View>
          </View>

          {/* Status pill */}
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>À surveiller</Text>
          </View>

          {/* Last visit */}
          <Text style={styles.lastVisitText}>Dernière visite : 29/10 · 7,9 kg</Text>
        </View>

        {/* Appointment Box */}
        <View style={styles.appointmentBox}>
          <Text style={styles.appointmentText}>Prochain rendez-vous : 12 novembre</Text>
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
          <Text style={styles.btnGiveProductText}>Donner un produit</Text>
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
          <Text style={styles.btnHistoryText}>Mes prises</Text>
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
          <Text style={styles.btnScheduleText}>Rappels : 08:00 · 12:30 · 18:00</Text>
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
