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
import { f75Styles as styles } from "../src/features/products/f75Styles";
import { getProduct } from "../src/features/products/productsService";
import type { ProductDetail } from "../src/features/products/types";

interface NutrientDisplayRow {
  label: string;
  value: string;
}

const DEFAULT_F75_ROWS: NutrientDisplayRow[] = [
  { label: "Énergie", value: "75 kcal" },
  { label: "Protéines", value: "0,9 g" },
  { label: "Lactose", value: "1,3 g" },
  { label: "Potassium", value: "3,6 mmol" },
  { label: "Sodium", value: "0,6 mmol" },
  { label: "Magnésium", value: "0,43 mmol" },
  { label: "Zinc", value: "2,0 mg" },
  { label: "Cuivre", value: "0,25 mg" },
];

export default function F75Screen() {
  const router = useRouter();
  const { t } = useTranslation(["mobile", "common"]);
  const params = useLocalSearchParams<{
    productId?: string;
    personId?: string;
    name?: string;
    region?: string;
  }>();

  const [product, setProduct] = useState<ProductDetail | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (params.productId && !params.productId.startsWith("ref-")) {
      getProduct(params.productId).then((data) => {
        if (isMounted && data) setProduct(data);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [params.productId]);

  const rows: NutrientDisplayRow[] = product?.nutrients?.length
    ? product.nutrients.map((n) => ({
        label: n.nutrient_name || n.nutrient_code,
        value: `${n.value} ${n.unit}`,
      }))
    : DEFAULT_F75_ROWS;

  const handleBackToDropdown = () => {
    router.push({
      pathname: "/u-dropdown",
      params: {
        personId: params.personId ?? "",
        name: params.name ?? "Amina",
        region: params.region ?? "Ouest",
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
          onPress={handleBackToDropdown}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.appBarTitle}>F-75</Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hospital Warning */}
        <View style={styles.dangerBanner}>
          <Text style={styles.dangerBannerText}>
            {t("mobile:f75.warning", {
              defaultValue:
                "Lait thérapeutique de stabilisation, donné à l'hôpital sous surveillance médicale.",
            })}
          </Text>
        </View>

        {/* Composition Title */}
        <Text style={styles.sectionTitle}>
          {t("mobile:f75.compositionTitle", { defaultValue: "Composition pour 100 ml" })}
        </Text>

        {/* Composition Table */}
        {rows.map((row, index) => {
          const isEven = index % 2 === 0;
          return (
            <View
              key={row.label}
              style={isEven ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.nutrientLabel}>{row.label}</Text>
              <Text style={styles.nutrientValue}>{row.value}</Text>
            </View>
          );
        })}

        {/* Source citation */}
        <Text style={styles.sourceText}>
          {t("mobile:f75.sourceText", {
            defaultValue:
              "Source : OMS, prise en charge de la malnutrition sévère (1999). À confirmer par la référente médicale.",
          })}
        </Text>

        {/* Choose other product button */}
        <TouchableOpacity
          testID="btn-choose-other"
          accessibilityRole="button"
          onPress={handleBackToDropdown}
          style={styles.btnChooseOther}
        >
          <Text style={styles.btnChooseOtherText}>
            {t("mobile:f75.chooseOther", { defaultValue: "Choisir un autre produit" })}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav
        activeTab="products"
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
