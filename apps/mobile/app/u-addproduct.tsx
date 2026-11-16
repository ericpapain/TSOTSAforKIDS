import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../src/theme/colors";
import { addProductStyles as styles } from "../src/features/products/addProductStyles";
import { createCustomProduct } from "../src/features/products/productsService";

interface NutrientFormItem {
  id: string;
  name: string;
  value: string;
  unit: string;
}

const DEFAULT_NUTRIENT_ITEMS: NutrientFormItem[] = [
  { id: "energy", name: "Énergie", value: "400", unit: "kcal" },
  { id: "protein", name: "Protéines", value: "15", unit: "g" },
  { id: "fat", name: "Lipides", value: "9", unit: "g" },
  { id: "iron", name: "Fer", value: "8", unit: "mg" },
  { id: "calcium", name: "Calcium", value: "300", unit: "mg" },
];

export default function AddProductScreen() {
  const { t } = useTranslation(["mobile", "common"]);
  const router = useRouter();
  const params = useLocalSearchParams<{
    personId?: string;
    name?: string;
    region?: string;
  }>();

  const personName = params.name ?? "Amina";
  const regionName = params.region ?? "Ouest";

  const [productName, setProductName] = useState<string>("Farine infantile enrichie");
  const [nutrients, setNutrients] = useState<NutrientFormItem[]>(DEFAULT_NUTRIENT_ITEMS);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const getNutrientLabel = (name: string): string => {
    const map: Record<string, string> = {
      Énergie: t("mobile:food.energy", { defaultValue: "Énergie" }),
      Protéines: t("mobile:food.proteins", { defaultValue: "Protéines" }),
      Lipides: t("mobile:food.lipids", { defaultValue: "Lipides" }),
      Fer: t("mobile:food.iron", { defaultValue: "Fer" }),
      Calcium: t("mobile:food.calcium", { defaultValue: "Calcium" }),
      Zinc: t("mobile:food.zinc", { defaultValue: "Zinc" }),
    };
    return map[name] ?? name;
  };

  const updateValue = (id: string, text: string) => {
    setNutrients((prev) =>
      prev.map((n) => (n.id === id ? { ...n, value: text.replace(",", ".") } : n))
    );
  };

  const cycleUnit = (id: string) => {
    const unitMap: Record<string, string[]> = {
      energy: ["kcal", "kJ"],
      protein: ["g", "mg"],
      fat: ["g", "mg"],
      iron: ["mg", "µg", "g"],
      calcium: ["mg", "µg", "g"],
    };
    setNutrients((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const available = unitMap[n.id] || ["g", "mg", "µg"];
        const currIdx = available.indexOf(n.unit);
        const nextIdx = (currIdx + 1) % available.length;
        return { ...n, unit: available[nextIdx] };
      })
    );
  };

  const handleAddNutrient = () => {
    const newId = `extra_${Date.now()}`;
    setNutrients((prev) => [
      ...prev,
      { id: newId, name: "Zinc", value: "5", unit: "mg" },
    ]);
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      setErrorMessage(
        t("mobile:addProduct.errNameRequired", {
          defaultValue: "Veuillez renseigner le nom du produit.",
        })
      );
      return;
    }
    setErrorMessage("");
    setLoading(true);

    const nutrientPayload = nutrients
      .filter((n) => parseFloat(n.value) > 0)
      .map((n) => ({
        nutrient: n.name,
        value: parseFloat(n.value),
        unit: n.unit,
      }));

    if (nutrientPayload.length === 0) {
      setErrorMessage(
        t("mobile:addProduct.errNutrientRequired", {
          defaultValue: "Veuillez renseigner au moins un nutriment valide.",
        })
      );
      setLoading(false);
      return;
    }

    const res = await createCustomProduct({
      name: productName.trim(),
      base: "100g",
      nutrients: nutrientPayload,
    });

    setLoading(false);
    const newProductId = res.data?.id ?? "my-farine";

    router.push({
      pathname: "/u-myproduct-eq",
      params: {
        productId: newProductId,
        productName: productName.trim(),
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
          onPress={() =>
            router.push({
              pathname: "/u-choose",
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
          {t("mobile:addProduct.title", { defaultValue: "Ajouter mon produit" })}
        </Text>
        <View style={styles.touchIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Name Field */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>
            {t("mobile:addProduct.nameLabel", { defaultValue: "Nom du produit" })}
          </Text>
          <TextInput
            testID="input-product-name"
            style={styles.textInput}
            value={productName}
            onChangeText={setProductName}
            placeholder={t("mobile:addProduct.namePlaceholder", {
              defaultValue: "Ex : Farine infantile enrichie",
            })}
          />
        </View>

        {/* Composition Section */}
        <Text style={styles.sectionTitle}>
          {t("mobile:addProduct.compositionTitle", {
            defaultValue: "Composition pour 100 g (étiquette)",
          })}
        </Text>

        {nutrients.map((item) => (
          <View key={item.id} style={styles.nutrientRow}>
            <Text style={styles.nutrientNameText}>{getNutrientLabel(item.name)}</Text>
            <TextInput
              testID={`input-nutrient-${item.id}`}
              style={styles.valueInput}
              keyboardType="decimal-pad"
              value={item.value}
              onChangeText={(txt) => updateValue(item.id, txt)}
            />
            <TouchableOpacity
              testID={`unit-toggle-${item.id}`}
              accessibilityRole="button"
              onPress={() => cycleUnit(item.id)}
              style={styles.unitSelector}
            >
              <Text style={styles.unitText}>{item.unit} ▾</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity testID="btn-add-nutrient" onPress={handleAddNutrient}>
            <Text style={styles.linkActionText}>
              {t("mobile:addProduct.addNutrient", { defaultValue: "+ Ajouter un nutriment" })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-add-photo">
            <Text style={styles.linkActionText}>
              {t("mobile:addProduct.addPhoto", { defaultValue: "+ Photo de l'étiquette" })}
            </Text>
          </TouchableOpacity>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {/* Submit Button */}
        <TouchableOpacity
          testID="btn-see-equivalents"
          accessibilityRole="button"
          onPress={handleSubmit}
          disabled={loading}
          style={styles.btnSubmit}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnSubmitText}>
              {t("mobile:addProduct.seeEquivalents", { defaultValue: "Voir les équivalents" })}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
