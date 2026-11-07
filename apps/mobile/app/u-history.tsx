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
import { historyStyles as styles } from "../src/features/intakes/historyStyles";
import { BottomNav, type BottomNavTab } from "../src/components/BottomNav";
import { listPersonIntakes } from "../src/features/intakes/intakesService";
import type { HistoryDisplayItem } from "../src/features/intakes/types";

const DEFAULT_HISTORY_ITEMS: HistoryDisplayItem[] = [
  {
    id: "h1",
    timeLabel: "Aujourd'hui 12:30",
    productLabel: "Plumpy'Nut · 1 sachet · tout",
    statusType: "complete",
    consumption: "all",
    rawDate: "today-1230",
    isUnconfirmed: false,
    personId: "p-amina-1",
    productName: "Plumpy'Nut",
  },
  {
    id: "h2",
    timeLabel: "Hier 18:00",
    productLabel: "Plumpy'Nut · 1 sachet · tout",
    statusType: "complete",
    consumption: "all",
    rawDate: "yesterday-1800",
    isUnconfirmed: false,
    personId: "p-amina-1",
    productName: "Plumpy'Nut",
  },
  {
    id: "h3",
    timeLabel: "Hier 12:00",
    productLabel: "Plumpy'Nut · 1 sachet · la moitié",
    statusType: "partial",
    consumption: "half",
    rawDate: "yesterday-1200",
    isUnconfirmed: false,
    personId: "p-amina-1",
    productName: "Plumpy'Nut",
  },
  {
    id: "h4",
    timeLabel: "Avant-hier 18:00",
    productLabel: "Non confirmée",
    statusType: "unconfirmed",
    consumption: "refused",
    rawDate: "2daysago-1800",
    isUnconfirmed: true,
    personId: "p-amina-1",
    productName: "Plumpy'Nut",
  },
  {
    id: "h5",
    timeLabel: "Avant-hier 12:00",
    productLabel: "Plumpy'Nut · 1 sachet · tout",
    statusType: "complete",
    consumption: "all",
    rawDate: "2daysago-1200",
    isUnconfirmed: false,
    personId: "p-amina-1",
    productName: "Plumpy'Nut",
  },
];

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    personId?: string;
    name?: string;
  }>();

  const personName = params.name || "Amina";
  const personId = params.personId || "p-amina-1";

  const [historyItems, setHistoryItems] =
    useState<HistoryDisplayItem[]>(DEFAULT_HISTORY_ITEMS);

  useEffect(() => {
    let isMounted = true;
    listPersonIntakes(personId).then((items) => {
      if (!isMounted || items.length === 0) return;
      const mapped: HistoryDisplayItem[] = items.map((it) => {
        const isRefused = it.consumption === "refused";
        const consText =
          it.consumption === "half"
            ? "la moitié"
            : it.consumption === "refused"
            ? "refusé"
            : "tout";
        return {
          id: it.id,
          timeLabel: it.taken_at ? it.taken_at.slice(0, 16) : "Date",
          productLabel: isRefused
            ? "Non confirmée"
            : `${it.product_name || "Plumpy'Nut"} · ${it.quantity} ${
                it.unit
              } · ${consText}`,
          statusType: isRefused
            ? "unconfirmed"
            : it.consumption === "half"
            ? "partial"
            : "complete",
          consumption: it.consumption,
          rawDate: it.taken_at,
          isUnconfirmed: isRefused,
          personId: it.person_id,
          productName: it.product_name || "Plumpy'Nut",
        };
      });
      setHistoryItems(mapped);
    });
    return () => {
      isMounted = false;
    };
  }, [personId]);

  const handleTabPress = (tab: BottomNavTab) => {
    if (tab === "modules") router.replace("/u-modules");
    else if (tab === "persons") router.replace("/u-persons");
    else if (tab === "products") router.replace("/u-choose");
  };

  const handleConfirmLate = (item: HistoryDisplayItem) => {
    router.push({
      pathname: "/u-give",
      params: {
        personId: item.personId,
        name: personName,
        productName: item.productName,
        origin: "late",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="btn-back-history"
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.replace("/u-profile")}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Prises d&apos;{personName}</Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {historyItems.map((item) => (
          <View
            key={item.id}
            testID={`card-history-${item.id}`}
            style={[
              styles.historyCard,
              item.isUnconfirmed && styles.historyCardUnconfirmed,
            ]}
          >
            {/* Status Icon */}
            <View style={styles.iconCol}>
              {item.statusType === "complete" && (
                <FontAwesome5
                  name="check-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
              {item.statusType === "partial" && (
                <FontAwesome5 name="adjust" size={24} color={colors.warning} />
              )}
              {item.statusType === "unconfirmed" && (
                <FontAwesome5
                  name="exclamation-circle"
                  size={24}
                  color={colors.danger}
                />
              )}
            </View>

            {/* Labels */}
            <View style={styles.infoCol}>
              <Text style={styles.timeTitle}>{item.timeLabel}</Text>
              <Text
                style={[
                  styles.subtitle,
                  item.isUnconfirmed && styles.subtitleUnconfirmed,
                ]}
              >
                {item.productLabel}
              </Text>
            </View>

            {/* Late confirmation button */}
            {item.isUnconfirmed && (
              <TouchableOpacity
                testID={`btn-confirm-late-${item.id}`}
                accessibilityRole="button"
                onPress={() => handleConfirmLate(item)}
                style={styles.btnConfirmLate}
              >
                <Text style={styles.btnConfirmLateText}>Confirmer</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <Text style={styles.recapText} testID="text-recap">
          Prises des 7 derniers jours : 11 sur 14 (démo)
        </Text>
      </ScrollView>

      {/* Bottom Nav Tab Bar */}
      <BottomNav activeTab="intakes" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}
