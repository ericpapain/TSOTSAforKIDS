import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";
import { givenStyles as styles } from "../src/features/intakes/givenStyles";
import type { IntakeConsumption } from "../src/offline/types";

export default function GivenScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    personName?: string;
    productName?: string;
    quantity?: string;
    unit?: string;
    consumption?: IntakeConsumption;
    timeLabel?: string;
  }>();

  const personName = params.personName || "Amina";
  const productName = params.productName || "Plumpy'Nut";
  const quantity = params.quantity || "1";
  const unit = params.unit || "sachet";
  const consumption = params.consumption || "all";

  const getConsumptionSentence = () => {
    switch (consumption) {
      case "half":
        return `${personName} a mangé la moitié.`;
      case "refused":
        return `${personName} a refusé.`;
      case "all":
      default:
        return `${personName} a tout mangé.`;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.content}>
        {/* Large Green Check Circle */}
        <View style={styles.circleIcon} testID="icon-check-circle">
          <FontAwesome5 name="check" size={80} color={colors.white} />
        </View>

        {/* Title */}
        <Text style={styles.title} testID="title-given">
          Prise enregistrée
        </Text>

        {/* Summary text */}
        <Text style={styles.subtitle} testID="text-summary">
          {productName} · {quantity} {unit} · 12:30{"\n"}
          {getConsumptionSentence()}
        </Text>

        {/* Caregiver Notice */}
        <View style={styles.noticeBox} testID="box-notice">
          <Text style={styles.noticeText}>
            Votre soignant est prévenu et la voit dans le suivi d&apos;{personName}.
          </Text>
        </View>

        {/* Return Button */}
        <TouchableOpacity
          testID="btn-back-profile"
          accessibilityRole="button"
          onPress={() => router.replace("/u-profile")}
          style={styles.btnPrimary}
        >
          <Text style={styles.btnPrimaryText}>Retour à {personName}</Text>
        </TouchableOpacity>

        {/* View Caregiver Side */}
        <TouchableOpacity
          testID="btn-view-caregiver"
          accessibilityRole="button"
          onPress={() => router.push("/s-pending")}
          style={styles.btnCare}
        >
          <Text style={styles.btnCareText}>Voir côté soignant →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
