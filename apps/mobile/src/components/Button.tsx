import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { colors } from "../theme/colors";
import { radii } from "../theme/spacing";
import { fontFamilies, fontSizes } from "../theme/typography";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "solid" | "outline";
  color?: string;
  height?: number;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = "solid",
  color = colors.primary,
  height = 63,
  disabled = false,
  loading = false,
  style,
  testID = "button",
}: ButtonProps): React.JSX.Element {
  const isSolid = variant === "solid";
  const effectiveBg = isSolid ? color : colors.white;
  const effectiveText = isSolid ? colors.white : color;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: effectiveBg,
          borderColor: isSolid ? "transparent" : color,
          borderWidth: isSolid ? 0 : 1,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={effectiveText} testID="button-loader" />
      ) : (
        <Text
          testID="button-title"
          style={[
            styles.title,
            {
              color: effectiveText,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    width: "100%",
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: fontSizes.md18,
    lineHeight: Math.round(fontSizes.md18 * 1.2),
    textAlign: "center",
  },
});

