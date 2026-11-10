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
import { productStyles as styles } from "../src/features/products/productStyles";
import { FALLBACK_EQUIVALENTS } from "../src/features/products/productDefaults";
import {
  getProduct,
  getProductEquivalents,
  getProductPrice,
} from "../src/features/products/productsService";
import type {
  EquivalentFoodItem,
  ProductDetail,
} from "../src/features/products/types";

export default function ProductScreen() {
  const router = useRouter();
  const { t } = useTranslation(["mobile", "common"]);
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
  const activeNutrients = useMemo(
    () =>
      params.nutrients
        ? params.nutrients.split(",")
        : ["Protéines", "Lipides", "Fer"],
    [params.nutrients]
  );

  const [_product, setProduct] = useState<ProductDetail | null>(null);
  const [equivalents, setEquivalents] = useState<EquivalentFoodItem[]>([]);
  const [costText, setCostText] = useState<string>(
    t("mobile:product.costNotSpecified", { defaultValue: "Coût : prix non renseigné pour l'Ouest" })
  );

  const nutrientsParam = params.nutrients ?? "";

  useEffect(() => {
    let isMounted = true;
    if (params.productId && !params.productId.startsWith("ref-")) {
      getProduct(params.productId).then((data) => {
        if (isMounted && data) setProduct(data);
      });
      getProductEquivalents(params.productId, {
        nutrients: activeNutrients,
        region: regionName,
        strict: false,
      }).then((resp) => {
        if (isMounted && resp?.equivalents?.length) {
          setEquivalents(resp.equivalents);
        }
      });
      getProductPrice(params.productId, regionName).then((priceObj) => {
        if (isMounted && priceObj?.display) {
          setCostText(
            t("mobile:product.costDisplay", {
              price: priceObj.display,
              region: regionName,
              defaultValue: `Coût : ${priceObj.display} dans l'${regionName}`,
            })
          );
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [params.productId, regionName, nutrientsParam, activeNutrients, t]);

  const items = equivalents.length > 0 ? equivalents : FALLBACK_EQUIVALENTS;

  const navigateToFood = (food: EquivalentFoodItem) => {
    router.push({
      pathname: "/u-food",
      params: {
        foodId: food.food_id,
        foodName: food.food_name,
        productId: params.productId ?? "",
        productName,
        personId: params.personId ?? "",
        name: personName,
        region: regionName,
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
          onPress={() => router.push({ pathname: "/u-dropdown", params: { personId: params.personId ?? "", name: personName, region: regionName } })}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.appBarTitle}>{productName}</Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Card */}
        <View style={styles.productCard}>
          <View style={styles.productCardHeader}>
            <Text style={styles.productName}>{productName}</Text>
            <TouchableOpacity testID="btn-details">
              <Text style={styles.detailsLink}>
                {t("mobile:product.details", { defaultValue: "Détails ›" })}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.productBase}>
            {t("mobile:product.rutfBase", { defaultValue: "ATPE · pour 100 g" })}
          </Text>

          <View style={styles.nutrientGrid}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>{t("mobile:product.energy", { defaultValue: "Énergie" })}</Text>
                <Text style={styles.gridValue}>520–550 kcal</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>{t("mobile:product.proteins", { defaultValue: "Protéines" })}</Text>
                <Text style={styles.gridValue}>≈ 13–16 g</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>{t("mobile:product.lipids", { defaultValue: "Lipides" })}</Text>
                <Text style={styles.gridValue}>≈ 26–37 g</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>{t("mobile:product.iron", { defaultValue: "Fer" })}</Text>
                <Text style={styles.gridValue}>10–14 mg</Text>
              </View>
            </View>
          </View>

          <View style={styles.costBox}>
            <Text style={styles.costText}>{costText}</Text>
          </View>
        </View>

        {/* Section title */}
        <Text style={styles.sectionTitle}>
          {t("mobile:product.equivalents", { defaultValue: "Aliments locaux équivalents" })}
        </Text>

        {/* Filter Pills Row */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            testID="btn-nutrients-filter"
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/u-nutrients",
                params: {
                  productId: params.productId ?? "",
                  productName,
                  personId: params.personId ?? "",
                  name: personName,
                  region: regionName,
                  nutrients: activeNutrients.join(","),
                },
              })
            }
            style={styles.pillNutrients}
          >
            <Text style={styles.pillNutrientsText}>
              {t("mobile:product.filterNutrients", {
                count: activeNutrients.length,
                defaultValue: `Nutriments : ${activeNutrients.length} ✎`,
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-region-filter"
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/u-region",
                params: {
                  productId: params.productId ?? "",
                  productName,
                  personId: params.personId ?? "",
                  name: personName,
                  region: regionName,
                },
              })
            }
            style={styles.pillRegion}
          >
            <Text style={styles.pillRegionText}>
              {t("mobile:product.filterRegionAll", { defaultValue: "Toutes régions ▾" })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Equivalent Food Items */}
        {items.map((item, index) => {
          const rank = index + 1;
          const isArachide = item.food_name.toLowerCase().includes("arachide");
          const regionLabel = item.is_in_target_region
            ? t("mobile:product.inRegion", { region: "Ouest", defaultValue: "Ouest ✓" })
            : t("mobile:product.otherRegions", { defaultValue: "Autres régions" });
          const extraLabel = item.extra_nutrients?.length ? `+ ${item.extra_nutrients.join(", ")}` : "";

          return (
            <TouchableOpacity
              key={item.food_id || index}
              testID={`equivalent-item-${index + 1}`}
              accessibilityRole="button"
              onPress={() => navigateToFood(item)}
              style={styles.equivalentCard}
              activeOpacity={0.8}
            >
              <Text style={styles.rankText}>{rank}</Text>
              <View style={styles.eqInfoCol}>
                <View style={styles.eqNameRow}>
                  <Text style={styles.eqFoodName}>{item.food_name}</Text>
                  <View style={styles.pillScore}>
                    <Text style={styles.pillScoreText}>{item.m}/3</Text>
                  </View>
                </View>
                <View style={styles.eqBottomRow}>
                  <Text style={styles.regionStatusText}>{regionLabel}</Text>
                  {extraLabel ? (
                    <Text style={styles.extraNutrientText}>{extraLabel}</Text>
                  ) : null}
                </View>
              </View>
              {isArachide && <Text style={styles.chevronRight}>›</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Bottom Actions Row */}
        <View style={styles.bottomActionRow}>
          <TouchableOpacity testID="btn-web-version">
            <Text style={styles.webLinkText}>
              {t("mobile:product.seeWebResults", {
                count: items.length,
                defaultValue: `Voir les ${items.length} résultats · Version web ›`,
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-give"
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/u-give", params: { productName, personId: params.personId ?? "", name: personName } })}
            style={styles.btnGive}
          >
            <Text style={styles.btnGiveText}>
              {t("mobile:product.giveThisProduct", {
                name: personName,
                defaultValue: `Donner à ${personName}`,
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
