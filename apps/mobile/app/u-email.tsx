import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppBar } from "../src/components/AppBar";
import { loginWithEmail, registerWithEmail } from "../src/features/auth/authService";
import { emailStyles as styles } from "../src/features/auth/emailStyles";
import { colors } from "../src/theme/colors";

export default function EmailAuthScreen(): React.JSX.Element {
    const router = useRouter();
    const { t } = useTranslation("mobile");
    const [tab, setTab] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleContinue = async (): Promise<void> => {
      if (!email.trim() || !password) {
        setErrorMessage(t("email.fillBoth", { defaultValue: "Veuillez renseigner votre adresse e-mail et votre mot de passe." }));
        return;
      }
      if (password.length < 8) {
        setErrorMessage(t("email.passTooShort", { defaultValue: "Le mot de passe doit comporter au moins 8 caractères." }));
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        if (tab === "login") {
          const res = await loginWithEmail(email, password);
          if (res.success) {
            if (res.role === "caregiver") {
              router.replace("/s-pending");
            } else {
              router.replace("/u-modules");
            }
          } else {
            setErrorMessage(res.error || t("email.wrongCredentials", { defaultValue: "Adresse e-mail ou mot de passe incorrect." }));
          }
        } else {
          const res = await registerWithEmail(email, password);
          if (res.success) {
            setSuccessMessage(res.message || t("email.accountCreated", { defaultValue: "Compte créé. Vérifiez vos e-mails." }));
          } else {
            setErrorMessage(res.error || t("email.createFailed", { defaultValue: "Impossible de créer le compte." }));
          }
        }
      } catch {
        setErrorMessage(t("email.serverError", { defaultValue: "Erreur de connexion au serveur." }));
      } finally {
        setLoading(false);
      }
    };

    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <AppBar
          title={t("email.title", { defaultValue: "Mon e-mail" })}
          onBack={() => router.replace("/u-welcome")}
        />

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
            {/* Toggle tabs: Se connecter / Créer un compte */}
            <View style={styles.tabRow}>
              <Pressable
                testID="tab-email-login"
                style={[styles.tabButton, tab === "login" ? styles.tabActive : styles.tabInactive]}
                onPress={() => {
                  setTab("login");
                  setErrorMessage(null);
                }}
              >
                <Text style={[styles.tabText, tab === "login" ? styles.tabTextActive : styles.tabTextInactive]}>
                  {t("email.tabLogin", { defaultValue: "Se connecter" })}
                </Text>
              </Pressable>

              <Pressable
                testID="tab-email-register"
                style={[styles.tabButton, tab === "register" ? styles.tabActive : styles.tabInactive]}
                onPress={() => {
                  setTab("register");
                  setErrorMessage(null);
                }}
              >
                <Text style={[styles.tabText, tab === "register" ? styles.tabTextActive : styles.tabTextInactive]}>
                  {t("email.tabRegister", { defaultValue: "Créer un compte" })}
                </Text>
              </Pressable>
            </View>

            {/* Success or error message */}
            {successMessage && (
              <View style={styles.successBox}>
                <Text testID="email-success-text" style={styles.successText}>
                  {successMessage}
                </Text>
              </View>
            )}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text testID="email-error-text" style={styles.errorText}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t("email.label", { defaultValue: "Adresse e-mail" })}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  testID="input-email"
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="nom@exemple.com"
                  placeholderTextColor={colors.textSubtle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t("email.passwordLabel", { defaultValue: "Mot de passe" })}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  testID="input-password"
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Hints: 8 chars min / Forgot password */}
            <View style={styles.passwordHintsRow}>
              <Text style={styles.hintText}>
                {t("email.minChars", { defaultValue: "8 caractères minimum" })}
              </Text>
              {tab === "login" && (
                <Pressable
                  testID="btn-forgot-password"
                  onPress={() => { }}
                >
                  <Text style={styles.forgotText}>
                    {t("email.forgotPassword", { defaultValue: "Mot de passe oublié ?" })}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Continue Button */}
            <Pressable
              testID="btn-email-continue"
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
                  {t("email.submit", { defaultValue: "Continuer" })}
                </Text>
              )}
            </Pressable>

            {/* Caregiver Link */}
            <Pressable
              testID="btn-email-caregiver"
              style={({ pressed }) => [
                styles.caregiverButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push("/s-pending")}
            >
              <Text style={styles.caregiverText}>
                {t("email.caregiverLink", { defaultValue: "Je suis soignant ›" })}
              </Text>
            </Pressable>

            {/* Encryption note */}
            <View style={styles.securityBox}>
              <View style={styles.lockIconCol}>
                <FontAwesome5 name="lock" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.securityText}>
                {t("email.securityNote", {
                  defaultValue: "Votre mot de passe est chiffré : personne, même notre équipe, ne peut le lire.",
                })}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
}
