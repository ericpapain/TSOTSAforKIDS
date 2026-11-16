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
import { chooseStyles as styles } from "../src/features/products/chooseStyles";
import { getUserPreferredRegion } from "../src/features/products/productsService";

export default function ChooseProductScreen() {
  const router = useRouter();
  const { t } = useTranslation(["mobile", "common"]);
  const params = useLocalSearchParams<{
    personId?: string;
    name?: string;
    region?: string;
  }>();

  const personName = params.name ?? "Amina";
  const [regionName, setRegionName] = useState<string>(params.region ?? "Ouest");

  useEffect(() => {
    let isMounted = true;
    if (!params.region) {
      getUserPreferredRegion().then((r) => {
        if (isMounted && r) setRegionName(r);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [params.region]);

  const handleOpenDropdown = () => {
    router.push({
      pathname: "/u-dropdown",
      params: {
        personId: params.personId ?? "",
        name: personName,
        region: regionName,
      },
    });
  };

  const handleAddMyProduct = () => {
    router.push({
      pathname: "/u-addproduct",
      params: {
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
          onPress={() => router.push({ pathname: "/u-profile", params: { personId: params.personId ?? "", name: personName } })}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.appBarTitle}>
          {t("mobile:choose.title", { defaultValue: "Choisir un produit" })}
        </Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pills row */}
        <View style={styles.pillRow}>
          <View style={styles.personPill}>
            <Text style={styles.personPillText}>
              {t("mobile:choose.forPerson", { name: personName, defaultValue: `Pour : ${personName}` })}
            </Text>
          </View>
          <View style={styles.regionPill}>
            <Text style={styles.regionPillText}>
              {t("mobile:choose.myRegion", { region: regionName, defaultValue: `Ma région : ${regionName}` })}
            </Text>
          </View>
        </View>

        {/* Select trigger closed */}
        <TouchableOpacity
          testID="btn-open-dropdown"
          accessibilityRole="button"
          onPress={handleOpenDropdown}
          style={styles.selectTriggerClosed}
          activeOpacity={0.8}
        >
          <Text style={styles.selectTriggerText}>
            {t("mobile:choose.title", { defaultValue: "Choisir un produit" })}
          </Text>
          <Text style={styles.chevronText}>▾</Text>
        </TouchableOpacity>

        {/* Empty state illustration */}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <FontAwesome5 name="search" size={54} color={colors.primary200} />
          </View>
          <Text style={styles.emptyText}>
            {t("mobile:choose.instruction", {
              defaultValue: "Choisissez un produit pour voir sa composition et les aliments locaux équivalents.",
            })}
          </Text>

          <TouchableOpacity
            testID="btn-add-product"
            accessibilityRole="button"
            onPress={handleAddMyProduct}
            style={styles.btnAddMyProduct}
          >
            <Text style={styles.btnAddMyProductText}>
              {t("mobile:choose.addCustomProduct", { defaultValue: "+ Ajouter mon produit" })}
            </Text>
          </TouchableOpacity>
        </View>
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
