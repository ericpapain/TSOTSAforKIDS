import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { requestPhoneOtp, verifyPhoneOtp } from "../src/features/auth/authService";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function OtpVerificationScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("mobile");
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone || "+237 6XX XX XX XX";

  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(42);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async (): Promise<void> => {
    if (countdown > 0) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await requestPhoneOtp(phone);
      if (res.success) {
        setCountdown(60);
      } else {
        setErrorMessage(res.error || t("otp.resendFailed", { defaultValue: "Impossible de renvoyer le code." }));
      }
    } catch {
      setErrorMessage(t("otp.connError", { defaultValue: "Erreur de connexion." }));
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (): Promise<void> => {
    if (code.length < 6) {
      setErrorMessage(t("otp.enterFullCode", { defaultValue: "Veuillez saisir le code complet à 6 chiffres." }));
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await verifyPhoneOtp(phone, code);
      if (res.success) {
        if (res.role === "caregiver") {
          router.replace("/s-pending");
        } else {
          router.replace("/u-modules");
        }
      } else {
        setErrorMessage(res.error || t("otp.invalidCode", { defaultValue: "Code invalide ou expiré." }));
      }
    } catch {
      setErrorMessage(t("otp.networkError", { defaultValue: "Erreur réseau. Veuillez réessayer." }));
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <AppBar
        title={t("otp.title", { defaultValue: "Vérification" })}
        onBack={() => router.replace("/u-signup")}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Instruction text */}
        <Text style={styles.instructionText}>
          {t("otp.instruction", {
            phone,
            defaultValue: `Entrez le code reçu par SMS au ${phone}`,
          })}
        </Text>

        {/* 6 OTP Boxes */}
        <Pressable
          testID="btn-focus-otp"
          style={styles.boxesRow}
          onPress={() => inputRef.current?.focus()}
        >
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const hasDigit = index < code.length;
            return (
              <View
                key={index}
                testID={`otp-box-${index}`}
                style={[
                  styles.otpBox,
                  hasDigit ? styles.otpBoxFilled : styles.otpBoxEmpty,
                ]}
              >
                <Text style={styles.digitText}>{hasDigit ? "•" : ""}</Text>
              </View>
            );
          })}
        </Pressable>

        {/* Hidden TextInput for native keyboard */}
        <TextInput
          ref={inputRef}
          testID="input-otp-code"
          value={code}
          onChangeText={(text) => {
            const numeric = text.replace(/[^0-9]/g, "").slice(0, 6);
            setCode(numeric);
            if (errorMessage) setErrorMessage(null);
          }}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.hiddenInput}
          autoFocus={true}
        />

        {/* Error message */}
        {errorMessage && (
          <Text testID="otp-error-text" style={styles.errorText}>
            {errorMessage}
          </Text>
        )}

        {/* Resend code */}
        <Pressable
          testID="btn-resend-code"
          onPress={handleResend}
          disabled={countdown > 0 || loading}
          style={styles.resendPressable}
        >
          <Text style={[styles.resendText, countdown === 0 && styles.resendActive]}>
            {countdown > 0
              ? t("otp.resendCountdown", {
                  time: formatCountdown(countdown),
                  defaultValue: `Renvoyer le code (${formatCountdown(countdown)})`,
                })
              : t("otp.resend", { defaultValue: "Renvoyer le code" })}
          </Text>
        </Pressable>

        {/* Validate button */}
        <Pressable
          testID="btn-otp-validate"
          style={({ pressed }) => [
            styles.validateButton,
            pressed && styles.pressed,
          ]}
          onPress={handleValidate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.validateButtonText}>
              {t("otp.submit", { defaultValue: "Valider" })}
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
    paddingTop: 41,
    paddingBottom: 32,
    alignItems: "center",
  },
  instructionText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md19,
    color: colors.text,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 29,
    paddingHorizontal: 10,
  },
  boxesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 35,
  },
  otpBox: {
    width: 48,
    height: 63,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  otpBoxFilled: {
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  otpBoxEmpty: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  digitText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.h2_32,
    color: colors.primary,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.danger,
    marginBottom: 16,
    textAlign: "center",
  },
  resendPressable: {
    paddingVertical: 8,
    marginBottom: 63,
  },
  resendText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
  },
  resendActive: {
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  validateButton: {
    width: "100%",
    height: 69,
    backgroundColor: colors.primary,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  validateButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg22,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
