import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme/colors";
import { fontFamilies, fontSizes } from "../theme/typography";

export interface AppBarProps {
  title: string;
  backgroundColor?: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  testID?: string;
}

export function AppBar({
  title,
  backgroundColor = colors.primary,
  onBack,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel = "Action",
  testID = "app-bar",
}: AppBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      testID={testID}
      style={[
        styles.wrapper,
        {
          backgroundColor,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.bar}>
        {/* Left Action (Back button 69 x 67) */}
        {onBack ? (
          <Pressable
            testID="app-bar-back-button"
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.touchArea,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <FontAwesome5 name="arrow-left" size={32} color={colors.white} />
          </Pressable>
        ) : (
          <View style={styles.touchArea} />
        )}

        {/* Centered Title */}
        <View style={styles.titleContainer}>
          <Text
            testID="app-bar-title"
            numberOfLines={1}
            style={styles.titleText}
          >
            {title}
          </Text>
        </View>

        {/* Right Action (Optional 69 x 67) */}
        {rightIcon && onRightPress ? (
          <Pressable
            testID="app-bar-right-button"
            accessibilityRole="button"
            accessibilityLabel={rightAccessibilityLabel}
            onPress={onRightPress}
            style={({ pressed }) => [
              styles.touchArea,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <FontAwesome5 name={rightIcon} size={32} color={colors.white} />
          </Pressable>
        ) : (
          <View style={styles.touchArea} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  bar: {
    height: 67,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  touchArea: {
    width: 69,
    height: 67,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: colors.white,
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: fontSizes.lg22,
    lineHeight: Math.round(fontSizes.lg22 * 1.2),
    textAlign: "center",
  },
});

