import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";
import { offlineStyles as styles } from "../src/features/intakes/offlineStyles";
import {
  getPendingIntakes,
  syncPendingIntakes,
  type OfflineIntake,
} from "../src/offline";

const DEFAULT_DEMO_ITEMS: OfflineIntake[] = [
  {
    id: "off-demo-1",
    person_id: "p-amina-1",
    person_name: "Amina",
    item_type: "product",
    item_id: "prod-plumpy-1",
    product_name: "Plumpy'Nut",
    quantity: 1,
    unit: "sachet",
    taken_at: "today-1230",
    consumption: "all",
    origin: "app",
    created_at: new Date().toISOString(),
    status: "pending",
  },
  {
    id: "off-demo-2",
    person_id: "p-amina-1",
    person_name: "Amina",
    item_type: "product",
    item_id: "prod-plumpy-1",
    product_name: "Plumpy'Nut",
    quantity: 1,
    unit: "sachet",
    taken_at: "yesterday-1800",
    consumption: "all",
    origin: "app",
    created_at: new Date().toISOString(),
    status: "pending",
  },
];

export default function OfflineScreen() {
  const router = useRouter();
  const [pendingList, setPendingList] =
    useState<OfflineIntake[]>(DEFAULT_DEMO_ITEMS);
  const [syncing, setSyncing] = useState(false);

  const loadPending = async () => {
    const list = await getPendingIntakes();
    if (list.length > 0) {
      setPendingList(list);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleRetry = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncPendingIntakes();
    } catch (_err) {
      // Ignored
    } finally {
      setSyncing(false);
      router.replace("/u-modules");
    }
  };

  const formatSubtitle = (raw: string) => {
    if (raw === "today-1230") return "Aujourd'hui 12:30";
    if (raw === "yesterday-1800") return "Hier 18:00";
    return raw.slice(0, 16);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="btn-back-offline"
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.replace("/u-modules")}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Connexion</Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Warning Network Banner */}
        <View style={styles.warningCard} testID="card-network-warning">
          <View style={styles.warningIconCol}>
            <FontAwesome5 name="wifi" size={24} color={colors.warning} />
          </View>
          <Text style={styles.warningText}>
            Pas de réseau. Vos prises sont gardées sur le téléphone.
          </Text>
        </View>

        {/* Section title */}
        <Text style={styles.sectionTitle} testID="title-pending-count">
          En attente d&apos;envoi ({pendingList.length})
        </Text>

        {/* Pending Items List */}
        {pendingList.map((item) => (
          <View
            key={item.id}
            testID={`card-pending-${item.id}`}
            style={styles.pendingCard}
          >
            <View style={styles.pendingIconCol}>
              <FontAwesome5 name="clock" size={24} color={colors.warning} />
            </View>
            <View style={styles.pendingInfoCol}>
              <Text style={styles.pendingTitle}>
                {item.person_name} · {item.product_name} · {item.quantity}{" "}
                {item.unit}
              </Text>
              <Text style={styles.pendingSubtitle}>
                {formatSubtitle(item.taken_at)}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.autoSyncText}>
          Envoi automatique dès le retour du réseau.
        </Text>

        {/* Retry Button */}
        <TouchableOpacity
          testID="btn-retry-sync"
          accessibilityRole="button"
          onPress={handleRetry}
          disabled={syncing}
          style={styles.btnRetry}
        >
          {syncing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnRetryText}>Réessayer maintenant</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
