import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { colors } from "../theme/colors";
import { radii } from "../theme/spacing";

export interface CardProps extends ViewProps {
  children?: React.ReactNode;
  testID?: string;
}

export function Card({
  children,
  style,
  testID = "card",
  ...props
}: CardProps): React.JSX.Element {
  return (
    <View testID={testID} style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: 14,
  },
});

