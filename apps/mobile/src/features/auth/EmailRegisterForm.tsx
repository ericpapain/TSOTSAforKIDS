import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";
import { CaregiverFields } from "./CaregiverFields";
import { RegionSelector } from "./RegionSelector";
import type { CanonicalRole } from "./types";

export interface RegisterFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  region: string;
  locality: string;
  phone: string;
  facility: string;
  specialty: string;
  orderNumber: string;
  organization: string;
}

interface EmailRegisterFormProps {
  role: CanonicalRole;
  state: RegisterFormState;
  onChangeState: (updater: (prev: RegisterFormState) => RegisterFormState) => void;
  loading: boolean;
  onSubmit: () => void;
}

export function EmailRegisterForm({
  role,
  state,
  onChangeState,
  loading,
  onSubmit,
}: EmailRegisterFormProps): React.JSX.Element {
  const { t } = useTranslation("mobile");

  const setField = (field: keyof RegisterFormState, val: string): void => {
    onChangeState((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <View style={styles.container}>
      {/* Name row */}
      <View style={styles.row}>
        <View style={styles.flexHalf}>
          <Text style={styles.label}>{t("email.firstName", { defaultValue: "Prénom *" })}</Text>
          <TextInput
            testID="input-register-firstname"
            style={styles.input}
            value={state.firstName}
            onChangeText={(v) => setField("firstName", v)}
            placeholder="Prénom"
          />
        </View>
        <View style={styles.flexHalf}>
          <Text style={styles.label}>{t("email.lastName", { defaultValue: "Nom *" })}</Text>
          <TextInput
            testID="input-register-lastname"
            style={styles.input}
            value={state.lastName}
            onChangeText={(v) => setField("lastName", v)}
            placeholder="Nom"
          />
        </View>
      </View>

      {/* Hidden/Legacy Display Name for backward compatibility */}
      <View style={styles.legacyHidden}>
        <TextInput
          testID="input-display-name"
          value={state.firstName ? `${state.firstName} ${state.lastName}`.trim() : ""}
          onChangeText={(v) => {
            const parts = v.trim().split(" ");
            setField("firstName", parts[0] || "");
            setField("lastName", parts.slice(1).join(" ") || "");
          }}
        />
      </View>

      {/* Email */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>{t("email.label", { defaultValue: "Adresse e-mail *" })}</Text>
        <TextInput
          testID="input-email"
          style={styles.input}
          value={state.email}
          onChangeText={(v) => setField("email", v)}
          placeholder="nom@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Passwords */}
      <View style={styles.row}>
        <View style={styles.flexHalf}>
          <Text style={styles.label}>{t("email.passwordLabel", { defaultValue: "Mot de passe *" })}</Text>
          <TextInput
            testID="input-password"
            style={styles.input}
            value={state.password}
            onChangeText={(v) => setField("password", v)}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>
        <View style={styles.flexHalf}>
          <Text style={styles.label}>{t("email.confirmPassword", { defaultValue: "Confirmation *" })}</Text>
          <TextInput
            testID="input-register-password-confirm"
            style={styles.input}
            value={state.passwordConfirm}
            onChangeText={(v) => setField("passwordConfirm", v)}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>
      </View>

      {/* Region Selector */}
      <RegionSelector
        selectedRegion={state.region}
        onSelectRegion={(regId) => setField("region", regId)}
      />

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>{t("email.localityLabel", { defaultValue: "Localité (facultatif)" })}</Text>
        <TextInput
          testID="input-register-locality"
          style={styles.input}
          value={state.locality}
          onChangeText={(v) => setField("locality", v)}
          placeholder="Ville, quartier ou village"
        />
      </View>

      {/* Role specific fields */}
      {role === "caregiver" && (
        <CaregiverFields
          phone={state.phone}
          onChangePhone={(v) => setField("phone", v)}
          facility={state.facility}
          onChangeFacility={(v) => setField("facility", v)}
          specialty={state.specialty}
          onChangeSpecialty={(v) => setField("specialty", v)}
          orderNumber={state.orderNumber}
          onChangeOrderNumber={(v) => setField("orderNumber", v)}
        />
      )}

      {role === "field_agent" && (
        <View style={styles.roleBlock}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>{t("email.phoneRequired", { defaultValue: "Téléphone *" })}</Text>
            <TextInput
              testID="input-register-phone"
              style={styles.input}
              value={state.phone}
              onChangeText={(v) => setField("phone", v)}
              placeholder="+237 6..."
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>{t("email.organizationOptional", { defaultValue: "Structure / Organisation (facultatif)" })}</Text>
            <TextInput
              testID="input-register-organization"
              style={styles.input}
              value={state.organization}
              onChangeText={(v) => setField("organization", v)}
              placeholder="Ex : ONG Santé Communautaire"
            />
          </View>
        </View>
      )}

      {role === "parent" && (
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>{t("email.phoneOptional", { defaultValue: "Téléphone (facultatif)" })}</Text>
          <TextInput
            testID="input-register-phone"
            style={styles.input}
            value={state.phone}
            onChangeText={(v) => setField("phone", v)}
            placeholder="+237 6..."
            keyboardType="phone-pad"
          />
        </View>
      )}

      {/* Submit */}
      <Pressable
        testID="btn-email-continue"
        style={({ pressed }) => [
          styles.submitButton,
          loading && styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>
            {t("email.tabRegister", { defaultValue: "Créer un compte" })}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  flexHalf: {
    flex: 1,
  },
  fieldBlock: {
    width: "100%",
  },
  roleBlock: {
    width: "100%",
    gap: 12,
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.text,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  legacyHidden: {
    width: 0,
    height: 0,
    opacity: 0,
    position: "absolute",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
  submitText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.white,
  },
});
