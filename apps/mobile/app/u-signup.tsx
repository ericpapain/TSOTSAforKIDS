import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppBar } from "../src/components/AppBar";
import { requestPhoneOtp } from "../src/features/auth/authService";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function PhoneSignupScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("mobile");
  const [phone, setPhone] = useState("+237 ");
  const [selectedProfile, setSelectedProfile] = useState<"family" | "caregiver">("family");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleContinue = async (): Promise<void> => {
    if (selectedProfile === "caregiver") {
      router.push("/s-pending");
      return;
    }

    const cleanNumber = phone.trim().replace(/\s+/g, "");
    if (cleanNumber.length < 8) {
      setErrorMessage(t("phone.invalidPhone", { defaultValue: "Veuillez saisir un numéro de téléphone valide." }));
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await requestPhoneOtp(cleanNumber);
      if (res.success) {
        router.push({
          pathname: "/u-otp",
          params: { phone: cleanNumber },
        });
      } else {
        setErrorMessage(res.error || t("phone.sendFailed", { defaultValue: "Impossible d'envoyer le code SMS." }));
      }
    } catch {
      setErrorMessage(t("phone.networkError", { defaultValue: "Erreur réseau. Vérifiez votre connexion." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <AppBar
        title={t("phone.title", { defaultValue: "Mon numéro" })}
        onBack={() => router.replace("/u-welcome")}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Phone input field */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>
            {t("phone.label", { defaultValue: "Numéro de téléphone" })}
          </Text>
          <View style={[styles.inputContainer, errorMessage ? styles.inputError : null]}>
            <TextInput
              testID="input-phone"
              style={styles.input}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="+237  6XX XX XX XX"
              placeholderTextColor={colors.textSubtle}
              keyboardType="phone-pad"
              autoFocus={false}
            />
          </View>
          {errorMessage && (
            <Text testID="phone-error-text" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}
        </View>

        {/* Profile choice title */}
        <Text style={styles.sectionTitle}>
          {t("phone.registerAs", { defaultValue: "Je m'inscris :" })}
        </Text>

        {/* Option 1: Family */}
        <Pressable
          testID="btn-profile-family"
          style={({ pressed }) => [
            styles.cardOption,
            selectedProfile === "family" ? styles.cardOptionSelected : styles.cardOptionNormal,
            pressed && styles.pressed,
          ]}
          onPress={() => setSelectedProfile("family")}
        >
          <View style={styles.iconCol}>
            <FontAwesome5 name="user-friends" size={32} color={colors.primary} />
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>
              {t("phone.forFamily", { defaultValue: "Pour moi ou un proche" })}
            </Text>
            <Text style={styles.cardSubtitle}>
              {t("phone.forFamilySub", { defaultValue: "Enfant, adulte, parent âgé…" })}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* Option 2: Caregiver */}
        <Pressable
          testID="btn-profile-caregiver"
          style={({ pressed }) => [
            styles.cardOption,
            selectedProfile === "caregiver" ? styles.cardCaregiverSelected : styles.cardOptionNormal,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setSelectedProfile("caregiver");
            router.push("/s-pending");
          }}
        >
          <View style={styles.iconCol}>
            <FontAwesome5 name="user-md" size={32} color={colors.care} />
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>
              {t("phone.forCaregiver", { defaultValue: "Je suis soignant" })}
            </Text>
            <Text style={styles.cardSubtitle}>
              {t("phone.forCaregiverSub", { defaultValue: "Vérification par notre équipe" })}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* Terms notice */}
        <Text style={styles.termsText}>
          {t("phone.terms", {
            defaultValue: "En continuant, j'accepte les conditions d'utilisation et la politique de confidentialité.",
          })}
        </Text>

        {/* Continue Button */}
        <Pressable
          testID="btn-signup-continue"
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.pressed,
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.continueButtonText}>
              {t("phone.submit", { defaultValue: "Continuer" })}
            </Text>
          )}
        </Pressable>
      </ScrollView>
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
    paddingTop: 24,
    paddingBottom: 32,
  },
  fieldBlock: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    height: 25,
  },
  inputContainer: {
    height: 44,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  inputError: { borderColor: colors.danger },
  input: { fontFamily: fontFamilies.regular, fontSize: fontSizes.md18, color: colors.text, padding: 0 },
  errorText: { fontFamily: fontFamilies.regular, fontSize: fontSizes.sm13, color: colors.danger, marginTop: 6 },
  sectionTitle: { fontFamily: fontFamilies.bold, fontSize: fontSizes.md19, color: colors.text, marginBottom: 12 },
  cardOption: {
    width: "100%",
    height: 92,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 15,
  },
  cardOptionNormal: { backgroundColor: colors.white, borderColor: colors.border },
  cardOptionSelected: { backgroundColor: colors.primary50, borderColor: colors.primary },
  cardCaregiverSelected: { backgroundColor: colors.care50, borderColor: colors.care },
  iconCol: { width: 32, alignItems: "center", marginRight: 14 },
  cardTextCol: { flex: 1 },
  cardTitle: { fontFamily: fontFamilies.bold, fontSize: fontSizes.md18, color: colors.text, marginBottom: 2 },
  cardSubtitle: { fontFamily: fontFamilies.regular, fontSize: fontSizes.sm14, color: colors.textMuted },
  chevron: { fontFamily: fontFamilies.bold, fontSize: fontSizes.xl25, color: colors.textSubtle, marginLeft: 8 },
  termsText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 28,
  },
  continueButton: {
    height: 63,
    backgroundColor: colors.primary,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: { fontFamily: fontFamilies.bold, fontSize: fontSizes.lg21, color: colors.white },
  pressed: { opacity: 0.85 },
});
