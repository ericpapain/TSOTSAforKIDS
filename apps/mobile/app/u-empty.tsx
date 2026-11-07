import React from "react";
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
import { productStyles as styles } from "../src/features/products/productStyles";

export default function EmptyEquivalentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string;
    productName?: string;
    personId?: string;
    name?: string;
    region?: string;
  }>();

  const personName = params.name ?? "Amina";
  const productName = params.productName ?? "Plumpy'Nut";
  const regionName = params.region ?? "Extrême-Nord";

  const handleShowAllRegions = () => {
    router.push({
      pathname: "/u-product",
      params: {
        productId: params.productId ?? "",
        productName,
        personId: params.personId ?? "",
        name: personName,
        region: "Ouest",
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
          accessibilityLabel="Retour"
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/u-region", params: { personId: params.personId ?? "", name: personName, region: "Ouest" } })}
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
              <Text style={styles.detailsLink}>Détails ›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.productBase}>ATPE · pour 100 g</Text>

          <View style={styles.nutrientGrid}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Énergie</Text>
                <Text style={styles.gridValue}>520–550 kcal</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Protéines</Text>
                <Text style={styles.gridValue}>≈ 13–16 g</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Lipides</Text>
                <Text style={styles.gridValue}>≈ 26–37 g</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Fer</Text>
                <Text style={styles.gridValue}>10–14 mg</Text>
              </View>
            </View>
          </View>

          <View style={styles.costBox}>
            <Text style={styles.costText}>Coût : prix non renseigné pour l'Ouest</Text>
          </View>
        </View>

        {/* Filter pill */}
        <TouchableOpacity
          testID="btn-remove-filter"
          accessibilityRole="button"
          onPress={handleShowAllRegions}
          style={styles.pillRegionActive}
        >
          <Text style={styles.pillRegionActiveText}>{regionName} uniquement ✕</Text>
        </TouchableOpacity>

        {/* Empty state illustration & text */}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <FontAwesome5 name="map-marker-alt" size={54} color={colors.primary200} />
          </View>

          <Text style={styles.emptyNoticeText}>
            Aucun aliment local n'est encore renseigné pour cette région.
          </Text>

          <TouchableOpacity
            testID="btn-show-all-regions"
            accessibilityRole="button"
            onPress={handleShowAllRegions}
            style={styles.btnShowAllRegions}
          >
            <Text style={styles.btnShowAllRegionsText}>Afficher toutes les régions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
