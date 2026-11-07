import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../theme/colors";
import { radii } from "../theme/spacing";
import { fontFamilies, fontSizes } from "../theme/typography";

export interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

export function Field({
  label,
  error,
  containerStyle,
  style,
  placeholder,
  testID = "field",
  ...textInputProps
}: FieldProps): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label 14 px bold text-muted, height 25 px */}
      <View style={styles.labelWrapper}>
        <Text testID="field-label" style={styles.label}>
          {label}
        </Text>
      </View>

      {/* Input zone: 44 px height, background surface-2, border, radius 7 px, text 18 px, padding 14 px */}
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
        ]}
      >
        <TextInput
          testID={testID}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, style]}
          {...textInputProps}
        />
      </View>

      {/* Optional error message */}
      {error ? (
        <Text testID="field-error" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 12,
  },
  labelWrapper: {
    height: 25,
    justifyContent: "center",
  },
  label: {
    color: colors.textMuted,
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: fontSizes.sm14,
    lineHeight: Math.round(fontSizes.sm14 * 1.2),
  },
  inputContainer: {
    height: 44,
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.field,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    color: colors.text,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md18,
    paddingVertical: 0,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    marginTop: 4,
  },
});

