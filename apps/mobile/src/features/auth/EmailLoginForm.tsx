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

interface EmailLoginFormProps {
  email: string;
  onChangeEmail: (text: string) => void;
  password: string;
  onChangePassword: (text: string) => void;
  loading: boolean;
  onSubmit: () => void;
  onCaregiverClick?: () => void;
}

export function EmailLoginForm({
  email,
  onChangeEmail,
  password,
  onChangePassword,
  loading,
  onSubmit,
  onCaregiverClick,
}: EmailLoginFormProps): React.JSX.Element {
  const { t } = useTranslation("mobile");

  return (
    <View style={styles.container}>
      {/* Email */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>
          {t("email.label", { defaultValue: "Adresse e-mail" })}
        </Text>
        <TextInput
          testID="input-email"
          style={styles.input}
          value={email}
          onChangeText={onChangeEmail}
          placeholder="nom@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Password */}
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>
          {t("email.passwordLabel", { defaultValue: "Mot de passe" })}
        </Text>
        <TextInput
          testID="input-password"
          style={styles.input}
          value={password}
          onChangeText={onChangePassword}
          placeholder="••••••••••"
          secureTextEntry
        />
        <View style={styles.passwordMetaRow}>
          <Text style={styles.metaText}>
            {t("email.minChars", { defaultValue: "8 caractères minimum" })}
          </Text>
          <Text style={styles.metaLink}>
            {t("email.forgotPassword", { defaultValue: "Mot de passe oublié ?" })}
          </Text>
        </View>
      </View>

      {/* Submit button */}
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
            {t("email.submit", { defaultValue: "Continuer" })}
          </Text>
        )}
      </Pressable>

      {/* Caregiver link */}
      {onCaregiverClick && (
        <Pressable
          testID="btn-email-caregiver"
          style={styles.caregiverRow}
          onPress={onCaregiverClick}
        >
          <Text style={styles.caregiverText}>
            {t("email.caregiverLink", { defaultValue: "Je suis soignant ›" })}
          </Text>
        </Pressable>
      )}

      {/* Security notice */}
      <Text style={styles.securityNote}>
        {t("email.securityNote", {
          defaultValue:
            "Votre mot de passe est chiffré : personne, même notre équipe, ne peut le lire.",
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
  },
  fieldBlock: {
    width: "100%",
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.text,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  metaText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.textMuted,
  },
  metaLink: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
  caregiverRow: {
    alignItems: "center",
    paddingVertical: 6,
  },
  caregiverText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.care,
  },
  securityNote: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
});
