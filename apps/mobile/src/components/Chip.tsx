import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { fontFamilies, fontSizes } from "../theme/typography";

export interface ChipProps {
  label: string;
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  style?: ViewStyle;
  testID?: string;
}

export function Chip({
  label,
  backgroundColor = colors.primary50,
  textColor = colors.primary,
  height = 28,
  style,
  testID = "chip",
}: ChipProps): React.JSX.Element {
  return (
    <View
      testID={testID}
      style={[
        styles.chip,
        {
          backgroundColor,
          height,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Text
        testID="chip-label"
        style={[
          styles.label,
          {
            color: textColor,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: fontSizes.sm13,
    lineHeight: Math.round(fontSizes.sm13 * 1.2),
  },
});

