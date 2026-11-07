import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";
import { giveStyles as styles } from "../src/features/intakes/giveStyles";
import { recordIntake } from "../src/features/intakes/intakesService";
import type { IntakeConsumption, IntakeOrigin } from "../src/offline/types";

export default function GiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    personId?: string;
    name?: string;
    productId?: string;
    productName?: string;
    unit?: string;
    origin?: IntakeOrigin;
  }>();

  const personName = params.name || "Amina";
  const personId = params.personId || "p-amina-1";
  const productName = params.productName || "Plumpy'Nut";
  const productId = params.productId || "prod-plumpy-1";
  const unit = params.unit || "sachet";
  const origin: IntakeOrigin = params.origin === "late" ? "late" : "app";

  const [quantity, setQuantity] = useState<number>(1);
  const [consumption, setConsumption] = useState<IntakeConsumption>("all");
  const [submitting, setSubmitting] = useState(false);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleIncrease = () => {
    setQuantity((q) => q + 1);
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    const now = new Date();
    const timeLabel = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    try {
      await recordIntake({
        person_id: personId,
        person_name: personName,
        item_type: "product",
        item_id: productId,
        product_name: productName,
        quantity,
        unit,
        consumption,
        origin,
        taken_at: now.toISOString(),
      });
    } catch (_err) {
      // Handled and queued in service
    } finally {
      setSubmitting(false);
      router.push({
        pathname: "/u-given",
        params: {
          personName,
          productName,
          quantity: String(quantity),
          unit,
          consumption,
          timeLabel: `Aujourd'hui · ${timeLabel}`,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="btn-back"
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Confirmer la prise</Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Child Info Card */}
        <View style={styles.infoCard} testID="card-person-info">
          <FontAwesome5 name="child" size={32} color={colors.primary} />
          <Text style={styles.infoCardText}>Pour : {personName}</Text>
        </View>

        {/* Product Info Card */}
        <View style={styles.infoCard} testID="card-product-info">
          <FontAwesome5 name="apple-alt" size={32} color={colors.primary} />
          <Text style={styles.infoCardText}>{productName}</Text>
        </View>

        {/* Quantity Section */}
        <Text style={styles.sectionLabel}>Quantité</Text>
        <View style={styles.quantityBox}>
          <TouchableOpacity
            testID="btn-qty-minus"
            accessibilityRole="button"
            accessibilityLabel="Diminuer la quantité"
            onPress={handleDecrease}
            style={styles.btnStep}
          >
            <Text style={styles.btnStepText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText} testID="text-quantity">
            {quantity} {unit}
            {quantity > 1 ? "s" : ""}
          </Text>
          <TouchableOpacity
            testID="btn-qty-plus"
            accessibilityRole="button"
            accessibilityLabel="Augmenter la quantité"
            onPress={handleIncrease}
            style={styles.btnStep}
          >
            <Text style={styles.btnStepText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* When Section */}
        <Text style={styles.sectionLabel}>Quand ?</Text>
        <View style={styles.whenBox} testID="box-when">
          <Text style={styles.whenText}>Aujourd'hui · 12:30 ▾</Text>
        </View>

        {/* Consumption Section */}
        <Text style={styles.sectionLabel}>{personName} a mangé :</Text>
        <View style={styles.consumptionRow}>
          <TouchableOpacity
            testID="btn-consumption-all"
            accessibilityRole="button"
            onPress={() => setConsumption("all")}
            style={[
              styles.consumptionBtn,
              consumption === "all" && styles.consumptionBtnActive,
            ]}
          >
            <Text
              style={[
                styles.consumptionBtnText,
                consumption === "all" && styles.consumptionBtnTextActive,
              ]}
            >
              Tout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-consumption-half"
            accessibilityRole="button"
            onPress={() => setConsumption("half")}
            style={[
              styles.consumptionBtn,
              consumption === "half" && styles.consumptionBtnActive,
            ]}
          >
            <Text
              style={[
                styles.consumptionBtnText,
                consumption === "half" && styles.consumptionBtnTextActive,
              ]}
            >
              La moitié
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-consumption-refused"
            accessibilityRole="button"
            onPress={() => setConsumption("refused")}
            style={[
              styles.consumptionBtn,
              consumption === "refused" && styles.consumptionBtnActive,
            ]}
          >
            <Text
              style={[
                styles.consumptionBtnText,
                consumption === "refused" && styles.consumptionBtnTextActive,
              ]}
            >
              Refusé
            </Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          testID="btn-confirm-intake"
          accessibilityRole="button"
          onPress={handleConfirm}
          disabled={submitting}
          style={styles.btnConfirm}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnConfirmText}>Confirmer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
