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
import { myProductStyles as styles } from "../src/features/products/myProductStyles";
import { getProductEquivalents } from "../src/features/products/productsService";
import type { EquivalentFoodItem } from "../src/features/products/types";

interface MyProductEquivalentDisplay {
  id: string;
  name: string;
  score: string;
  details: string;
  extra?: string;
}

const DEFAULT_MY_EQUIVALENTS: MyProductEquivalentDisplay[] = [
  {
    id: "eq-1",
    name: "Niébé",
    score: "3/3",
    details: "Prot. 23,5 g · fer 8,3 mg · Ca 110 mg",
  },
  {
    id: "eq-2",
    name: "Feuilles de moringa",
    score: "3/3",
    details: "Prot. 9,4 g · fer 4,0 mg · Ca 185 mg",
  },
  {
    id: "eq-3",
    name: "Arachide",
    score: "3/3",
    details: "Prot. 25,8 g · fer 4,6 mg · Ca 92 mg",
    extra: "+ lipides",
  },
  {
    id: "eq-4",
    name: "Soja",
    score: "3/3",
    details: "Prot. 36,5 g · fer 15,7 mg · Ca 277 mg",
    extra: "+ lipides",
  },
  {
    id: "eq-5",
    name: "Sésame",
    score: "3/3",
    details: "Prot. 17,7 g · fer 14,6 mg · Ca 975 mg",
    extra: "+ lipides",
  },
];

export default function MyProductEquivalentsScreen() {
  const { t } = useTranslation(["mobile", "common"]);
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string;
    productName?: string;
    personId?: string;
    name?: string;
    region?: string;
  }>();

  const productName = params.productName ?? "Farine infantile enrichie";
  const personName = params.name ?? "Amina";
  const regionName = params.region ?? "Ouest";

  const [items, setItems] = useState<MyProductEquivalentDisplay[]>(DEFAULT_MY_EQUIVALENTS);

  useEffect(() => {
    let isMounted = true;
    if (params.productId && !params.productId.startsWith("my-")) {
      getProductEquivalents(params.productId).then((resp) => {
        if (isMounted && resp?.equivalents?.length) {
          const mapped = resp.equivalents.map((item: EquivalentFoodItem, idx: number) => ({
            id: item.food_id || `eq-${idx}`,
            name: item.food_name,
            score: `${item.m}/3`,
            details: `Prot. ${item.teneurs["Protéines"] ?? 20} g · fer ${item.teneurs["Fer"] ?? 5} mg · Ca ${item.teneurs["Calcium"] ?? 100} mg`,
            extra: item.extra_nutrients?.length ? `+ ${item.extra_nutrients.join(", ")}` : undefined,
          }));
          setItems(mapped);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [params.productId]);

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
              pathname: "/u-dropdown",
              params: {
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
          {t("mobile:myProductEq.title", { defaultValue: "Mon produit" })}
        </Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Card */}
        <View style={styles.customProductCard}>
          <Text style={styles.productName}>{productName}</Text>
          <View style={styles.badgeVerificationLarge}>
            <Text style={styles.badgeVerificationTextLarge}>
              {t("mobile:myProductEq.badgePrivate", {
                defaultValue: "Privé · en vérification",
              })}
            </Text>
          </View>
        </View>

        {/* Nutriments summary label */}
        <Text style={styles.myProductNutrientsSummary}>
          {t("mobile:myProductEq.summary", {
            defaultValue: "Nutriments : protéines, fer, calcium",
          })}
        </Text>

        {/* Equivalents List */}
        {items.map((item, index) => {
          const rank = index + 1;
          return (
            <View
              key={item.id}
              testID={`my-eq-item-${rank}`}
              style={styles.equivalentCard}
            >
              <Text style={styles.rankText}>{rank}</Text>
              <View style={styles.eqInfoCol}>
                <View style={styles.eqNameRow}>
                  <Text style={styles.eqFoodName}>{item.name}</Text>
                  <View style={styles.pillScore}>
                    <Text style={styles.pillScoreText}>{item.score}</Text>
                  </View>
                </View>
                <View style={styles.eqBottomRow}>
                  <Text style={styles.nutrientsBreakdownText}>{item.details}</Text>
                  {item.extra ? (
                    <Text style={styles.extraNutrientText}>{item.extra}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}

        {/* Action Button */}
        <TouchableOpacity
          testID="btn-give-myproduct"
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
          style={styles.btnGiveFull}
        >
          <Text style={styles.btnGiveFullText}>
            {t("mobile:myProductEq.giveToPerson", {
              name: personName,
              defaultValue: `Donner à ${personName}`,
            })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
