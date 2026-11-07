import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { radii } from "../theme/spacing";
import { fontFamilies, fontSizes } from "../theme/typography";

export interface NoticeProps {
  message: string;
  style?: ViewStyle;
  testID?: string;
}

export function Notice({
  message,
  style,
  testID = "notice",
}: NoticeProps): React.JSX.Element {
  return (
    <View testID={testID} style={[styles.container, style]}>
      <Text testID="notice-text" style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning50,
    borderRadius: radii.notice,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: "100%",
  },
  text: {
    color: colors.warning900,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    lineHeight: Math.round(fontSizes.sm13 * 1.2),
  },
});

