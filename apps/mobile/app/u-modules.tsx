import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBar } from "../src/components/AppBar";
import { BottomNav, type BottomNavTab } from "../src/components/BottomNav";
import { fetchModules } from "../src/features/persons/personsService";
import type { ModuleItem } from "../src/features/persons/types";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function ModulesScreen(): React.JSX.Element {
  const router = useRouter();
  const [, setModules] = useState<ModuleItem[]>([]);

  useEffect(() => {
    fetchModules().then(setModules).catch(() => {});
  }, []);

  const handleTabPress = (tab: BottomNavTab): void => {
    if (tab === "modules") return;
    if (tab === "persons") router.push("/u-persons");
    if (tab === "products") router.push("/u-choose");
    if (tab === "intakes") router.push("/u-history");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppBar
        title="Bonjour"
        rightIcon="wifi"
        onRightPress={() => router.push("/u-offline")}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Que voulez-vous suivre ?</Text>

        {/* Nutrition Card */}
        <Pressable
          testID="card-module-nutrition"
          style={({ pressed }) => [
            styles.nutritionCard,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/u-persons")}
        >
          <View style={styles.appleIconWrapper}>
            <FontAwesome5 name="apple-alt" size={69} color={colors.white} />
          </View>
          <View style={styles.nutritionTextCol}>
            <Text style={styles.nutritionTitle}>Nutrition</Text>
            <Text style={styles.nutritionSubtitle}>
              Produits, aliments locaux, suivi des prises
            </Text>
          </View>
        </Pressable>

        {/* Secondary Modules Row */}
        <View style={styles.secondaryRow}>
          {/* HTA Card */}
          <Pressable
            testID="card-module-hta"
            style={({ pressed }) => [
              styles.soonCard,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/u-soon")}
          >
            <FontAwesome5 name="heartbeat" size={48} color={colors.textSubtle} />
            <Text style={styles.soonTitle}>HTA</Text>
            <View style={styles.soonPill}>
              <Text style={styles.soonPillText}>Bientôt</Text>
            </View>
          </Pressable>

          {/* Diabète Card */}
          <Pressable
            testID="card-module-diabete"
            style={({ pressed }) => [
              styles.soonCard,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/u-soon")}
          >
            <FontAwesome5 name="tint" size={48} color={colors.textSubtle} />
            <Text style={styles.soonTitle}>Diabète</Text>
            <View style={styles.soonPill}>
              <Text style={styles.soonPillText}>Bientôt</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <BottomNav activeTab="modules" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 24,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg22,
    color: colors.text,
    marginBottom: 16,
  },
  nutritionCard: {
    width: "100%",
    minHeight: 184,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 22,
  },
  appleIconWrapper: {
    width: 69,
    alignItems: "center",
    marginRight: 17,
  },
  nutritionTextCol: {
    flex: 1,
  },
  nutritionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.h2_32,
    color: colors.white,
    marginBottom: 6,
  },
  nutritionSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.white,
    lineHeight: 22,
  },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  soonCard: {
    flex: 1,
    height: 166,
    backgroundColor: colors.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  soonTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg21,
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 10,
  },
  soonPill: {
    backgroundColor: colors.neutral200,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 14,
  },
  soonPillText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
});
