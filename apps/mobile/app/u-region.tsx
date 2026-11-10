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
import { productStyles as styles } from "../src/features/products/productStyles";
import { FALLBACK_WEST_ITEMS } from "../src/features/products/productDefaults";
import {
  getProductEquivalents,
  getProductPrice,
} from "../src/features/products/productsService";
import type { EquivalentFoodItem } from "../src/features/products/types";

export default function RegionFilterScreen() {
  const router = useRouter();
  const { t } = useTranslation(["mobile", "common"]);
  const params = useLocalSearchParams<{
    productId?: string;
    productName?: string;
    personId?: string;
    name?: string;
    region?: string;
  }>();

  const personName = params.name ?? "Amina";
  const productName = params.productName ?? "Plumpy'Nut";
  const regionName = params.region ?? "Ouest";

  const [items, setItems] = useState<EquivalentFoodItem[]>([]);
  const [costText, setCostText] = useState<string>(
    t("mobile:product.costNotSpecified", { defaultValue: "Coût : prix non renseigné pour l'Ouest" })
  );

  useEffect(() => {
    let isMounted = true;
    if (params.productId && !params.productId.startsWith("ref-")) {
      getProductEquivalents(params.productId, {
        region: regionName,
        strict: true,
      }).then((resp) => {
        if (isMounted && resp?.equivalents?.length) {
          setItems(resp.equivalents);
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
  }, [params.productId, regionName, t]);

  const displayItems = items.length > 0 ? items : FALLBACK_WEST_ITEMS;

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
                <Text style={styles.gridLabel}>
                  {t("mobile:product.energy", { defaultValue: "Énergie" })}
                </Text>
                <Text style={styles.gridValue}>520–550 kcal</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>
                  {t("mobile:product.proteins", { defaultValue: "Protéines" })}
                </Text>
                <Text style={styles.gridValue}>≈ 13–16 g</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>
                  {t("mobile:product.lipids", { defaultValue: "Lipides" })}
                </Text>
                <Text style={styles.gridValue}>≈ 26–37 g</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>
                  {t("mobile:product.iron", { defaultValue: "Fer" })}
                </Text>
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

        {/* Active Region Filter Pills */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            testID="btn-remove-region-filter"
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
            style={styles.pillRegionActive}
          >
            <Text style={styles.pillRegionActiveText}>
              {t("mobile:region.regionOnly", { region: regionName, defaultValue: `${regionName} uniquement ✕` })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-change-region"
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/u-empty",
                params: {
                  productId: params.productId ?? "",
                  productName,
                  personId: params.personId ?? "",
                  name: personName,
                  region: "Extrême-Nord",
                },
              })
            }
            style={styles.pillRegion}
          >
            <Text style={styles.pillRegionText}>
              {t("mobile:region.change", { defaultValue: "Changer ▾" })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items available in target region */}
        {displayItems.map((item, index) => {
          const rank = index + 1;
          const isWarning = item.m < 3;
          const isArachide = item.food_name.toLowerCase().includes("arachide");
          const extraLabel = item.extra_nutrients?.length ? `+ ${item.extra_nutrients.join(", ")}` : "";

          return (
            <TouchableOpacity
              key={item.food_id || index}
              testID={`region-item-${index + 1}`}
              accessibilityRole="button"
              onPress={() => navigateToFood(item)}
              style={styles.equivalentCard}
              activeOpacity={0.8}
            >
              <Text style={styles.rankText}>{rank}</Text>
              <View style={styles.eqInfoCol}>
                <View style={styles.eqNameRow}>
                  <Text style={styles.eqFoodName}>{item.food_name}</Text>
                  <View style={isWarning ? styles.pillScoreWarning : styles.pillScore}>
                    <Text style={isWarning ? styles.pillScoreTextWarning : styles.pillScoreText}>
                      {item.m}/3
                    </Text>
                  </View>
                </View>
                <View style={styles.eqBottomRow}>
                  <Text style={styles.regionStatusText}>
                    {t("mobile:region.availableInRegion", {
                      region: regionName,
                      defaultValue: `Disponible dans l'${regionName}`,
                    })}
                  </Text>
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
          <Text style={styles.regionStatusText}>
            {t("mobile:region.foodsCountInRegion", {
              count: 5,
              region: regionName,
              defaultValue: `5 aliments disponibles dans l'${regionName}`,
            })}
          </Text>

          <TouchableOpacity
            testID="btn-give"
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/u-give",
                params: {
                  productName,
                  personId: params.personId ?? "",
                  name: personName,
                },
              })
            }
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
