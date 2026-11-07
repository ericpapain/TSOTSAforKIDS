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
import { foodStyles as styles } from "../src/features/products/foodStyles";
import { getFoodDetail } from "../src/features/products/productsService";
import type { FoodDetail } from "../src/features/products/types";

interface ComparisonRow {
  nutrient: string;
  isEssential: boolean;
  refValue: string;
  foodValue: string;
  isHighlight: boolean;
}

const DEFAULT_COMPARISON: ComparisonRow[] = [
  {
    nutrient: "Protéines",
    isEssential: true,
    refValue: "≈ 13–16 g",
    foodValue: "25,8 g",
    isHighlight: true,
  },
  {
    nutrient: "Lipides",
    isEssential: true,
    refValue: "≈ 26–37 g",
    foodValue: "49,2 g",
    isHighlight: true,
  },
  {
    nutrient: "Fer",
    isEssential: true,
    refValue: "10–14 mg",
    foodValue: "4,6 mg",
    isHighlight: true,
  },
  {
    nutrient: "Calcium",
    isEssential: false,
    refValue: "300–600 mg",
    foodValue: "92 mg",
    isHighlight: false,
  },
  {
    nutrient: "Énergie",
    isEssential: false,
    refValue: "520–550 kcal",
    foodValue: "567 kcal",
    isHighlight: false,
  },
];

export default function FoodDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    foodId?: string;
    foodName?: string;
    productId?: string;
    productName?: string;
    personId?: string;
    name?: string;
    region?: string;
  }>();

  const foodName = params.foodName ?? "Arachide";
  const productName = params.productName ?? "Plumpy'Nut";
  const personName = params.name ?? "Amina";
  const regionName = params.region ?? "Ouest";

  const [foodDetail, setFoodDetail] = useState<FoodDetail | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (params.foodId && !params.foodId.startsWith("food-")) {
      getFoodDetail(params.foodId).then((data) => {
        if (isMounted && data) setFoodDetail(data);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [params.foodId]);

  const sourceCitation = foodDetail?.nutrients?.[0]?.source?.citation
    ? `Source : ${foodDetail.nutrients[0].source.citation}`
    : "Source : article [référence] · comparaison ORKG [identifiant] · validé le [date]. Valeurs de la démo : USDA, indicatives.";

  const categoryLabel = foodDetail?.category
    ? `${foodDetail.category} · pour 100 g`
    : "Graine crue · pour 100 g";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="btn-back"
          accessibilityLabel="Retour"
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

        <Text style={styles.appBarTitle}>{foodName}</Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SubHeader row */}
        <View style={styles.subHeaderRow}>
          <Text style={styles.foodCategoryText}>{categoryLabel}</Text>
          <View style={styles.pillScore}>
            <Text style={styles.pillScoreText}>3/3 nutriments</Text>
          </View>
        </View>

        {/* Comparison Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCol}>Nutriment</Text>
          <Text style={styles.tableHeaderCol}>{productName}</Text>
          <Text style={styles.tableHeaderCol}>{foodName}</Text>
        </View>

        {/* Comparison Table Rows */}
        {DEFAULT_COMPARISON.map((row, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <View
              key={row.nutrient}
              style={isEven ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.nutrientNameCol}>
                {row.nutrient}
                {row.isEssential ? " ★" : ""}
              </Text>
              <Text style={styles.refValueCol}>{row.refValue}</Text>
              <Text style={row.isHighlight ? styles.foodValueCol : styles.refValueCol}>
                {row.foodValue}
              </Text>
            </View>
          );
        })}

        {/* Legend */}
        <Text style={styles.legendText}>★ nutriment essentiel recherché</Text>

        {/* Scientific Source Card */}
        <View style={styles.sourceCard}>
          <Text style={styles.sourceText}>{sourceCitation}</Text>
        </View>

        {/* Medical Advisory Notice */}
        <View style={styles.warningNotice}>
          <Text style={styles.warningNoticeText}>
            Équivalence nutritionnelle indicative. Ne remplace pas un traitement prescrit : demandez l'avis de votre soignant.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          testID="btn-give-food"
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/u-give",
              params: {
                productName: foodName,
                personId: params.personId ?? "",
                name: personName,
              },
            })
          }
          style={styles.btnGiveFood}
        >
          <Text style={styles.btnGiveFoodText}>Donner à {personName}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
