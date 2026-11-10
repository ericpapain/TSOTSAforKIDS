import React, { useState } from "react";
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
import { nutrientsStyles as styles } from "../src/features/products/nutrientsStyles";

const ALL_NUTRIENTS = [
  "Énergie",
  "Protéines",
  "Lipides",
  "Fer",
  "Calcium",
  "Zinc",
  "Vitamine A",
];

const DEFAULT_NUTRIENTS = ["Protéines", "Lipides", "Fer"];

export default function NutrientsScreen() {
  const { t } = useTranslation(["mobile", "common"]);
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string;
    productName?: string;
    personId?: string;
    name?: string;
    region?: string;
    nutrients?: string;
  }>();

  const personName = params.name ?? "Amina";
  const productName = params.productName ?? "Plumpy'Nut";
  const regionName = params.region ?? "Ouest";

  const initialSelected = params.nutrients
    ? params.nutrients.split(",")
    : DEFAULT_NUTRIENTS;

  const [selected, setSelected] = useState<string[]>(initialSelected);

  const getNutrientLabel = (name: string): string => {
    const map: Record<string, string> = {
      Énergie: t("mobile:food.energy", { defaultValue: "Énergie" }),
      Protéines: t("mobile:food.proteins", { defaultValue: "Protéines" }),
      Lipides: t("mobile:food.lipids", { defaultValue: "Lipides" }),
      Fer: t("mobile:food.iron", { defaultValue: "Fer" }),
      Calcium: t("mobile:food.calcium", { defaultValue: "Calcium" }),
      Zinc: t("mobile:food.zinc", { defaultValue: "Zinc" }),
      "Vitamine A": t("mobile:food.vitaminA", { defaultValue: "Vitamine A" }),
    };
    return map[name] ?? name;
  };

  const toggleNutrient = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter((item) => item !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  const handleResetDefault = () => {
    setSelected(DEFAULT_NUTRIENTS);
  };

  const handleApply = () => {
    router.push({
      pathname: "/u-product",
      params: {
        productId: params.productId ?? "",
        productName,
        personId: params.personId ?? "",
        name: personName,
        region: regionName,
        nutrients: selected.join(","),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="btn-back"
          accessibilityLabel={t("common:actions.back", { defaultValue: "Retour" })}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/u-product",
              params: {
                productId: params.productId ?? "",
                productName,
                personId: params.personId ?? "",
                name: personName,
                region: regionName,
              },
            })
          }
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.appBarTitle}>
          {t("mobile:nutrients.title", { defaultValue: "Nutriments" })}
        </Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          {t("mobile:nutrients.intro", {
            defaultValue: "Nutriments à retrouver dans les aliments locaux :",
          })}
        </Text>

        {ALL_NUTRIENTS.map((item) => {
          const isChecked = selected.includes(item);
          return (
            <TouchableOpacity
              key={item}
              testID={`checkbox-${item}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              onPress={() => toggleNutrient(item)}
              style={isChecked ? styles.checkRowChecked : styles.checkRow}
              activeOpacity={0.8}
            >
              <View style={isChecked ? styles.checkboxChecked : styles.checkbox}>
                {isChecked && (
                  <FontAwesome5 name="check" size={14} color={colors.white} />
                )}
              </View>
              <Text style={isChecked ? styles.checkLabelChecked : styles.checkLabel}>
                {getNutrientLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Reset Default */}
        <TouchableOpacity
          testID="btn-reset-default"
          accessibilityRole="button"
          onPress={handleResetDefault}
          style={styles.btnReset}
        >
          <Text style={styles.btnResetText}>
            {t("mobile:nutrients.resetDefault", {
              defaultValue: "Rétablir le choix par défaut",
            })}
          </Text>
        </TouchableOpacity>

        {/* Apply Button */}
        <TouchableOpacity
          testID="btn-apply"
          accessibilityRole="button"
          onPress={handleApply}
          style={styles.btnApply}
        >
          <Text style={styles.btnApplyText}>
            {t("mobile:nutrients.apply", { defaultValue: "Appliquer" })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
