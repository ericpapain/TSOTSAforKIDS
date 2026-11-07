import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";
import { fontFamilies } from "../src/theme/typography";
import { submitConsent } from "../src/features/persons/personsService";

interface BulletItemProps {
  icon: string;
  text: string;
}

function BulletItem({ icon, text }: BulletItemProps) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.iconContainer}>
        <FontAwesome5 name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export default function ConsentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ personId?: string; name?: string }>();
  const personId = params.personId ?? "";
  const personName = params.name ?? "l'enfant";

  const [accepted, setAccepted] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setAccepted((prev) => !prev);
  };

  const handleReadFullText = () => {
    Alert.alert(
      "Accord de traitement des données",
      "Les données de santé de votre proche sont traitées de manière confidentielle et sécurisée conformément à la réglementation en vigueur.",
      [{ text: "Compris" }]
    );
  };

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      if (personId) {
        await submitConsent(personId);
      }
      router.push({
        pathname: "/u-profile",
        params: { personId, name: personName },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          testID="btn-back"
          accessibilityLabel="Retour"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.touchBack}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Votre accord</Text>
        <View style={styles.appBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BulletItem
          icon="clipboard-check"
          text={`Les informations d'${personName} servent à suivre sa nutrition.`}
        />
        <BulletItem
          icon="user-md"
          text="Seul son soignant les voit."
        />
        <BulletItem
          icon="undo"
          text="Vous pouvez retirer votre accord à tout moment."
        />

        {/* Checkbox row */}
        <TouchableOpacity
          testID="checkbox-consent"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={handleToggle}
          style={styles.checkboxRow}
          activeOpacity={0.85}
        >
          <View style={[styles.checkboxBox, accepted && styles.checkboxBoxChecked]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            J&apos;ai lu et j&apos;accepte pour {personName}
          </Text>
        </TouchableOpacity>

        {/* Link Read full text */}
        <TouchableOpacity
          testID="link-full-text"
          onPress={handleReadFullText}
          style={styles.linkTouch}
          activeOpacity={0.85}
        >
          <Text style={styles.linkText}>Lire le texte complet</Text>
        </TouchableOpacity>

        {/* Submit button */}
        <TouchableOpacity
          testID="btn-accept"
          accessibilityRole="button"
          disabled={!accepted || loading}
          onPress={handleAccept}
          style={[styles.submitButton, (!accepted || loading) && styles.submitButtonDisabled]}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>J&apos;accepte</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  appBar: {
    height: 67,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  touchBack: {
    width: 69,
    height: 67,
    justifyContent: "center",
    alignItems: "center",
  },
  appBarTitle: {
    fontSize: 22,
    fontFamily: fontFamilies.bold,
    color: colors.white,
    textAlign: "center",
  },
  appBarSpacer: {
    width: 69,
  },
  content: {
    paddingHorizontal: 17,
    paddingTop: 32,
    paddingBottom: 40,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 35,
  },
  iconContainer: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 18,
    fontFamily: fontFamilies.regular,
    color: colors.text,
    lineHeight: 26,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 16,
  },
  checkboxBox: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fontFamilies.bold,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 17,
    fontFamily: fontFamilies.regular,
    color: colors.text,
  },
  linkTouch: {
    paddingVertical: 10,
    marginBottom: 38,
  },
  linkText: {
    fontSize: 16,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  submitButton: {
    height: 63,
    backgroundColor: colors.primary,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 21,
    fontFamily: fontFamilies.bold,
  },
});
