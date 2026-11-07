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
import { BottomNav } from "../src/components/BottomNav";
import { chooseStyles as styles } from "../src/features/products/chooseStyles";
import { listProducts } from "../src/features/products/productsService";
import type { ProductSummary } from "../src/features/products/types";

export default function DropdownScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    personId?: string;
    name?: string;
    region?: string;
  }>();

  const personName = params.name ?? "Amina";
  const regionName = params.region ?? "Ouest";
  const [products, setProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    let isMounted = true;
    listProducts().then((data) => {
      if (isMounted) setProducts(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const refProducts = products.filter((p) => p.type === "reference");
  const myProducts = products.filter((p) => p.type === "custom");

  const handleSelectProduct = (product: ProductSummary) => {
    const commonParams = {
      productId: product.id,
      productName: product.name,
      personId: params.personId ?? "",
      name: personName,
      region: regionName,
    };
    if (product.name.toUpperCase().includes("F-75")) {
      router.push({ pathname: "/u-f75", params: commonParams });
    } else if (product.type === "custom") {
      router.push({ pathname: "/u-myproduct-eq", params: commonParams });
    } else {
      router.push({ pathname: "/u-product", params: commonParams });
    }
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
          onPress={() => router.push({ pathname: "/u-choose", params: { personId: params.personId ?? "", name: personName, region: regionName } })}
          style={styles.touchIcon}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.appBarTitle}>Choisir un produit</Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pills row */}
        <View style={styles.pillRow}>
          <View style={styles.personPill}>
            <Text style={styles.personPillText}>Pour : {personName}</Text>
          </View>
          <View style={styles.regionPill}>
            <Text style={styles.regionPillText}>Ma région : {regionName}</Text>
          </View>
        </View>

        {/* Trigger opened */}
        <TouchableOpacity
          testID="btn-close-dropdown"
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/u-choose", params: { personId: params.personId ?? "", name: personName, region: regionName } })}
          style={styles.selectTriggerOpen}
          activeOpacity={0.8}
        >
          <Text style={styles.selectTriggerText}>Choisir un produit</Text>
          <Text style={styles.chevronText}>▴</Text>
        </TouchableOpacity>

        {/* Dropdown Card */}
        <View style={styles.dropdownCard}>
          <Text style={styles.sectionHeader}>PRODUITS DE RÉFÉRENCE</Text>

          {/* Reference products */}
          {(refProducts.length > 0 ? refProducts : [
            { id: "ref-f75", type: "reference" as const, name: "F-75", base: "100ml", usage: "Lait thérapeutique · à l'hôpital", status: "validated" },
            { id: "ref-f100", type: "reference" as const, name: "F-100", base: "100ml", usage: "Lait thérapeutique · à l'hôpital", status: "validated" },
            { id: "ref-plumpy-nut", type: "reference" as const, name: "Plumpy'Nut", base: "100g", usage: "Pâte prête à l'emploi (ATPE)", status: "validated" },
            { id: "ref-plumpy-sup", type: "reference" as const, name: "Plumpy'Sup", base: "100g", usage: "Supplément prêt à l'emploi", status: "validated" },
          ]).map((p) => {
            const isPlumpyNut = p.name.includes("Plumpy'Nut");
            return (
              <TouchableOpacity
                key={p.id}
                testID={`product-item-${p.id}`}
                accessibilityRole="button"
                onPress={() => handleSelectProduct(p)}
                style={isPlumpyNut ? styles.productRowSelected : styles.productRow}
              >
                <Text style={styles.productTitle}>{p.name}</Text>
                <Text style={styles.productSub}>{p.usage || "Produit de référence"}</Text>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.sectionHeader}>MES PRODUITS</Text>

          {/* Custom products */}
          {(myProducts.length > 0 ? myProducts : [
            { id: "my-farine", type: "custom" as const, name: "Farine infantile enrichie", base: "100g", status: "private" },
          ]).map((p) => (
            <TouchableOpacity
              key={p.id}
              testID={`custom-item-${p.id}`}
              accessibilityRole="button"
              onPress={() => handleSelectProduct(p)}
              style={styles.customProductRow}
            >
              <Text style={styles.productTitle}>{p.name}</Text>
              <View style={styles.badgeVerification}>
                <Text style={styles.badgeVerificationText}>En vérification</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add product action in dropdown */}
          <TouchableOpacity
            testID="btn-dropdown-add-product"
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/u-addproduct", params: { personId: params.personId ?? "", name: personName, region: regionName } })}
            style={styles.dropdownAddBtn}
          >
            <Text style={styles.dropdownAddBtnText}>+ Ajouter mon produit</Text>
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
