import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBar } from "../src/components/AppBar";
import { colors } from "../src/theme/colors";
import { fontFamilies, fontSizes } from "../src/theme/typography";

export default function ScreenM06(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <AppBar
        title="Modules"
        
      />
      <View style={styles.content} testID="screen-m06">
        <Text style={styles.codeText}>M06</Text>
        <Text style={styles.titleText}>Modules</Text>
        <Text style={styles.descText}>
          Écran de fondation (M06). L interface complète sera intégrée lors de l étape dédiée.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    padding: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  codeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl24,
    color: colors.primary,
    marginBottom: 8,
  },
  titleText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg22,
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  descText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 300,
  },
});
