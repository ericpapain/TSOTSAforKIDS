import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { fontFamilies } from "../theme/typography";

export interface BrandLogoProps {
  /** Height h of the symbol in px (default: 44) */
  size?: number;
  /** Variant: "light" (dark text on light bg) or "dark" (white text on dark bg) */
  variant?: "light" | "dark";
  /** Display mode: full (default), symbol only, word only, or full image */
  mode?: "full" | "symbol" | "word" | "image";
  /** Optional testID for automation and testing */
  testID?: string;
}

export function BrandLogo({
  size = 44,
  variant = "light",
  mode = "full",
  testID = "brand-logo",
}: BrandLogoProps): React.JSX.Element {
  const h = size;
  const isDark = variant === "dark";

  // Bleu Nuit #092D73 for TSOTSA and KIDS, Orange #F38B1F for 'for'
  const textColor = isDark ? colors.white : colors.bleuNuit;
  const forColor = isDark ? colors.white : colors.brand;

  // Proportions according to specification
  const symbolGap = Math.round(0.45 * h);
  const wordFontSize = Math.round(0.6 * h);
  const diskSize = Math.round(1.24 * h);

  if (mode === "image") {
    const imgWidth = Math.round(h * (800 / 854));
    return (
      <View style={styles.container} testID={testID} accessibilityRole="image">
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: imgWidth, height: h }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const showSymbol = mode === "full" || mode === "symbol";
  const showWord = mode === "full" || mode === "word";

  return (
    <View style={styles.container} testID={testID} accessibilityRole="image">
      {/* Symbol */}
      {showSymbol && (
        <View
          testID="brand-logo-symbol"
          style={[styles.symbolContainer, { width: diskSize, height: diskSize }]}
        >
          {isDark && (
            <View
              testID="brand-logo-dark-disk"
              style={[
                styles.whiteDisk,
                {
                  width: diskSize,
                  height: diskSize,
                  borderRadius: diskSize / 2,
                },
              ]}
            />
          )}
          <Image
            source={require("../../assets/logo_symbol.png")}
            style={{ width: h, height: h }}
            resizeMode="contain"
          />
        </View>
      )}

      {/* TSOTSA for Kids */}
      {showWord && (
        <View
          testID="brand-logo-wordmark"
          style={[
            styles.wordRow,
            { marginLeft: showSymbol ? symbolGap - Math.max(0, Math.round((diskSize - h) / 2)) : 0 },
          ]}
        >
          <Text
            testID="brand-logo-text"
            style={[
              styles.brandWord,
              {
                color: textColor,
                fontSize: wordFontSize,
                lineHeight: Math.round(wordFontSize * 1.2),
                letterSpacing: wordFontSize * 0.04,
              },
            ]}
          >
            TSOTSA
          </Text>
          <Text
            testID="brand-logo-for"
            style={[
              styles.forWord,
              {
                color: forColor,
                fontSize: Math.round(wordFontSize * 0.88),
                lineHeight: Math.round(wordFontSize * 1.2),
                marginHorizontal: Math.round(wordFontSize * 0.22),
              },
            ]}
          >
            for
          </Text>
          <Text
            testID="brand-logo-kids"
            style={[
              styles.kidsWord,
              {
                color: textColor,
                fontSize: wordFontSize,
                lineHeight: Math.round(wordFontSize * 1.2),
                letterSpacing: wordFontSize * 0.04,
              },
            ]}
          >
            KIDS
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  symbolContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  whiteDisk: {
    position: "absolute",
    backgroundColor: colors.white,
  },
  brandWord: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
  },
  forWord: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
  },
  kidsWord: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
  },
});

