import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { normalizeLocale, type SupportedLocale } from "@tsotsa/i18n";
import { colors } from "../theme/colors";
import { fontFamilies, fontSizes } from "../theme/typography";
import { changeMobileLanguage } from "../i18n/setup";

export interface LanguageSelectorProps {
  mode?: "pills" | "compact" | "button";
  testID?: string;
  style?: ViewStyle;
}

export function LanguageSelector({
  mode = "pills",
  testID = "language-switcher",
  style,
}: LanguageSelectorProps): React.JSX.Element {
  const { i18n, t } = useTranslation(["common", "mobile"]);
  const activeLocale: SupportedLocale = normalizeLocale(i18n.language) || "fr";

  const handleSelect = async (locale: SupportedLocale) => {
    if (locale !== activeLocale) {
      await changeMobileLanguage(locale);
    }
  };

  if (mode === "button") {
    const isFr = activeLocale === "fr";
    const nextLocale: SupportedLocale = isFr ? "en" : "fr";
    const displayText = isFr ? "Français ▾" : "English ▾";

    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={t("common:language.switcherAria", {
          defaultValue: "Choisir la langue",
        })}
        onPress={() => handleSelect(nextLocale)}
        style={({ pressed }) => [
          styles.buttonWrapper,
          pressed && styles.pressed,
          style,
        ]}
      >
        <Text style={styles.buttonText}>{displayText}</Text>
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[styles.container, style]}>
      <Pressable
        testID="btn-lang-fr"
        accessibilityRole="button"
        accessibilityLabel={t("common:language.switchToFr", {
          defaultValue: "Passer l'interface en français",
        })}
        onPress={() => handleSelect("fr")}
        style={({ pressed }) => [
          styles.pill,
          activeLocale === "fr" ? styles.activePill : styles.inactivePill,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            activeLocale === "fr" ? styles.activePillText : styles.inactivePillText,
          ]}
        >
          FR
        </Text>
      </Pressable>

      <Text style={styles.separator}>|</Text>

      <Pressable
        testID="btn-lang-en"
        accessibilityRole="button"
        accessibilityLabel={t("common:language.switchToEn", {
          defaultValue: "Passer l'interface en anglais",
        })}
        onPress={() => handleSelect("en")}
        style={({ pressed }) => [
          styles.pill,
          activeLocale === "en" ? styles.activePill : styles.inactivePill,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            activeLocale === "en" ? styles.activePillText : styles.inactivePillText,
          ]}
        >
          EN
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  activePill: {
    backgroundColor: colors.primary,
  },
  inactivePill: {
    backgroundColor: "transparent",
  },
  pillText: {
    fontSize: fontSizes.sm13,
    fontFamily: fontFamilies.bold,
  },
  activePillText: {
    color: colors.white,
  },
  inactivePillText: {
    color: colors.textMuted,
  },
  separator: {
    marginHorizontal: 4,
    color: colors.border,
    fontSize: fontSizes.sm14,
  },
  buttonWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.85,
  },
});

