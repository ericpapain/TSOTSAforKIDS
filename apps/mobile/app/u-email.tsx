import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppBar } from "../src/components/AppBar";
import { EmailLoginForm } from "../src/features/auth/EmailLoginForm";
import {
  EmailRegisterForm,
  type RegisterFormState,
} from "../src/features/auth/EmailRegisterForm";
import { RoleSelector } from "../src/features/auth/RoleSelector";
import { loginWithEmail, registerWithEmail } from "../src/features/auth/authService";
import type { CanonicalRole } from "../src/features/auth/types";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

const initialFormState: RegisterFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  region: "centre",
  locality: "",
  phone: "+237 ",
  facility: "",
  specialty: "",
  orderNumber: "",
  organization: "",
};

export default function EmailAuthScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; tab?: string }>();
  const { t } = useTranslation("mobile");

  const [role, setRole] = useState<CanonicalRole>(
    (params.role as CanonicalRole) || "parent"
  );
  const [tab, setTab] = useState<"login" | "register">(
    params.tab === "register" && role !== "admin" && role !== "super_caregiver"
      ? "register"
      : "login"
  );

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerState, setRegisterState] = useState<RegisterFormState>(initialFormState);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canRegister = role === "parent" || role === "caregiver" || role === "field_agent";

  const handleLogin = async (): Promise<void> => {
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage(t("email.fillBoth", { defaultValue: "Veuillez renseigner votre adresse e-mail et votre mot de passe." }));
      return;
    }
    if (loginPassword.length < 8) {
      setErrorMessage(t("email.passTooShort", { defaultValue: "Le mot de passe doit comporter au moins 8 caractères." }));
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = role === "parent"
        ? await loginWithEmail(loginEmail, loginPassword)
        : await loginWithEmail(loginEmail, loginPassword, role);
      if (res.success) {
        if (res.status === "pending") {
          router.replace("/s-pending");
        } else if (res.role && res.role !== "parent" && res.role !== "user") {
          router.replace("/p-web-redirect" as never);
        } else {
          router.replace("/u-modules");
        }
      } else {
        setErrorMessage(res.error || t("email.wrongCredentials", { defaultValue: "Adresse e-mail ou mot de passe incorrect." }));
      }
    } catch {
      setErrorMessage(t("email.serverError", { defaultValue: "Erreur de connexion au serveur." }));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (!registerState.email.trim() || !registerState.password) {
      setErrorMessage(t("email.fillBoth", { defaultValue: "Veuillez renseigner votre adresse e-mail et votre mot de passe." }));
      return;
    }
    if (registerState.password.length < 8) {
      setErrorMessage(t("email.passTooShort", { defaultValue: "Le mot de passe doit comporter au moins 8 caractères." }));
      return;
    }
    if (registerState.passwordConfirm && registerState.password !== registerState.passwordConfirm) {
      setErrorMessage(t("email.passwordMismatch", { defaultValue: "Les mots de passe ne correspondent pas." }));
      return;
    }
    if (role === "caregiver" && (!registerState.facility.trim() || !registerState.specialty.trim())) {
      setErrorMessage(t("email.fillCaregiverDetails", { defaultValue: "Veuillez renseigner l'établissement et votre spécialité." }));
      return;
    }
    const finalFirst = registerState.firstName.trim() || registerState.email.split("@")[0] || "Parent";
    const finalLast = registerState.lastName.trim() || "Famille";
    const displayName = `${finalFirst} ${finalLast}`.trim();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = role === "parent"
        ? await registerWithEmail(registerState.email.trim(), registerState.password, displayName)
        : await registerWithEmail({
            role,
            first_name: finalFirst,
            last_name: finalLast,
            email: registerState.email.trim(),
            password: registerState.password,
            password_confirm: registerState.passwordConfirm || registerState.password,
            region: registerState.region,
            locality: registerState.locality.trim() || undefined,
            phone: registerState.phone.trim() || undefined,
            facility_name: registerState.facility.trim() || undefined,
            specialty: registerState.specialty.trim() || undefined,
            order_number: registerState.orderNumber.trim() || undefined,
            organization: registerState.organization.trim() || undefined,
          });
      if (res.success) {
        if (res.status === "pending") {
          router.replace("/s-pending");
        } else {
          setSuccessMessage(
            res.message ||
              t("email.accountCreated", {
                defaultValue: "Compte créé avec succès. Vous pouvez maintenant vous connecter.",
              })
          );
          setTab("login");
          setLoginEmail(registerState.email);
        }
      } else {
        setErrorMessage(res.error || t("email.createFailed", { defaultValue: "Impossible de créer le compte." }));
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

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <RoleSelector
          selectedRole={role}
          onSelectRole={(newRole) => {
            setRole(newRole);
            if (newRole === "admin" || newRole === "super_caregiver") {
              setTab("login");
            }
          }}
        />

        {/* Tab row */}
        <View style={styles.tabRow}>
          <Pressable
            testID="tab-email-login"
            style={[styles.tabButton, tab === "login" ? styles.tabActive : styles.tabInactive]}
            onPress={() => setTab("login")}
          >
            <Text style={[styles.tabText, tab === "login" ? styles.tabTextActive : styles.tabTextInactive]}>
              {t("email.tabLogin", { defaultValue: "Se connecter" })}
            </Text>
          </Pressable>

          {canRegister && (
            <Pressable
              testID="tab-email-register"
              style={[styles.tabButton, tab === "register" ? styles.tabActive : styles.tabInactive]}
              onPress={() => setTab("register")}
            >
              <Text style={[styles.tabText, tab === "register" ? styles.tabTextActive : styles.tabTextInactive]}>
                {t("email.tabRegister", { defaultValue: "Créer un compte" })}
              </Text>
            </Pressable>
          )}
        </View>

        {errorMessage && (
          <View style={styles.errorBox} testID="error-box">
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {successMessage && (
          <View style={styles.successBox} testID="success-box">
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {tab === "login" ? (
          <EmailLoginForm
            email={loginEmail}
            onChangeEmail={setLoginEmail}
            password={loginPassword}
            onChangePassword={setLoginPassword}
            loading={loading}
            onSubmit={handleLogin}
            onCaregiverClick={() => router.push("/s-pending")}
          />
        ) : (
          <EmailRegisterForm
            role={role}
            state={registerState}
            onChangeState={setRegisterState}
            loading={loading}
            onSubmit={handleRegister}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, alignItems: "center" },
  tabRow: { flexDirection: "row", width: "100%", borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: colors.primary },
  tabInactive: { backgroundColor: colors.canvas },
  tabText: { fontFamily: fontFamilies.bold, fontSize: fontSizes.sm13 },
  tabTextActive: { color: colors.white },
  tabTextInactive: { color: colors.textMuted },
  errorBox: { width: "100%", backgroundColor: colors.danger50, borderWidth: 1, borderColor: colors.danger, borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: fontFamilies.regular, fontSize: fontSizes.sm13, color: colors.danger },
  successBox: { width: "100%", backgroundColor: colors.primary50, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: 12, marginBottom: 16 },
  successText: { fontFamily: fontFamilies.regular, fontSize: fontSizes.sm13, color: colors.primary },
});
