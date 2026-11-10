import React, { useEffect, useMemo, useState } from "react";
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

export default function FoodDetailScreen() {
  const { t } = useTranslation(["mobile", "common"]);
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

  const defaultComparison: ComparisonRow[] = useMemo(
    () => [
      {
        nutrient: t("mobile:food.proteins", { defaultValue: "Protéines" }),
        isEssential: true,
        refValue: "≈ 13–16 g",
        foodValue: "25,8 g",
        isHighlight: true,
      },
      {
        nutrient: t("mobile:food.lipids", { defaultValue: "Lipides" }),
        isEssential: true,
        refValue: "≈ 26–37 g",
        foodValue: "49,2 g",
        isHighlight: true,
      },
      {
        nutrient: t("mobile:food.iron", { defaultValue: "Fer" }),
        isEssential: true,
        refValue: "10–14 mg",
        foodValue: "4,6 mg",
        isHighlight: true,
      },
      {
        nutrient: t("mobile:food.calcium", { defaultValue: "Calcium" }),
        isEssential: false,
        refValue: "300–600 mg",
        foodValue: "92 mg",
        isHighlight: false,
      },
      {
        nutrient: t("mobile:food.energy", { defaultValue: "Énergie" }),
        isEssential: false,
        refValue: "520–550 kcal",
        foodValue: "567 kcal",
        isHighlight: false,
      },
    ],
    [t]
  );

  const sourceCitation = foodDetail?.nutrients?.[0]?.source?.citation
    ? `Source : ${foodDetail.nutrients[0].source.citation}`
    : t("mobile:food.sourceDemo", {
        defaultValue:
          "Source : article [référence] · comparaison ORKG [identifiant] · validé le [date]. Valeurs de la démo : USDA, indicatives.",
      });

  const categoryLabel = foodDetail?.category
    ? t("mobile:food.categoryPer100g", {
        category: foodDetail.category,
        defaultValue: `${foodDetail.category} · pour 100 g`,
      })
    : t("mobile:food.rawSeedPer100g", {
        defaultValue: "Graine crue · pour 100 g",
      });

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

        <Text style={styles.appBarTitle}>{foodName}</Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SubHeader row */}
        <View style={styles.subHeaderRow}>
          <Text style={styles.foodCategoryText}>{categoryLabel}</Text>
          <View style={styles.pillScore}>
            <Text style={styles.pillScoreText}>
              {t("mobile:food.nutrientsScore", {
                count: 3,
                total: 3,
                defaultValue: "3/3 nutriments",
              })}
            </Text>
          </View>
        </View>

        {/* Comparison Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCol}>
            {t("mobile:food.tableNutrient", { defaultValue: "Nutriment" })}
          </Text>
          <Text style={styles.tableHeaderCol}>{productName}</Text>
          <Text style={styles.tableHeaderCol}>{foodName}</Text>
        </View>

        {/* Comparison Table Rows */}
        {defaultComparison.map((row, idx) => {
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
        <Text style={styles.legendText}>
          {t("mobile:food.essentialLegend", {
            defaultValue: "★ nutriment essentiel recherché",
          })}
        </Text>

        {/* Scientific Source Card */}
        <View style={styles.sourceCard}>
          <Text style={styles.sourceText}>{sourceCitation}</Text>
        </View>

        {/* Medical Advisory Notice */}
        <View style={styles.warningNotice}>
          <Text style={styles.warningNoticeText}>
            {t("mobile:food.advisory", {
              defaultValue:
                "Équivalence nutritionnelle indicative. Ne remplace pas un traitement prescrit : demandez l'avis de votre soignant.",
            })}
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
          <Text style={styles.btnGiveFoodText}>
            {t("mobile:food.giveToPerson", {
              name: personName,
              defaultValue: `Donner à ${personName}`,
            })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
