import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../theme/colors";
import { radii } from "../theme/spacing";
import { fontFamilies, fontSizes } from "../theme/typography";

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  badge?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export function ListItem({
  title,
  subtitle,
  icon,
  iconColor = colors.primary,
  badge,
  onPress,
  style,
  testID = "list-item",
}: ListItemProps): React.JSX.Element {
  const content = (
    <View style={[styles.card, style]}>
      {/* Icon 32 px at 14 px from left */}
      {icon && (
        <View style={styles.iconContainer}>
          <FontAwesome5 name={icon} size={32} color={iconColor} />
        </View>
      )}

      {/* Title & Subtitle */}
      <View style={styles.textContainer}>
        <Text testID="list-item-title" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text testID="list-item-subtitle" numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Optional Top-Right Badge */}
      {badge && <View style={styles.badgeContainer}>{badge}</View>}

      {/* Chevron if pressable */}
      {onPress && (
        <View style={styles.chevronContainer}>
          <Text testID="list-item-chevron" style={styles.chevron}>
            ›
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View testID={testID}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.listItem,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    fontSize: fontSizes.md18,
    lineHeight: Math.round(fontSizes.md18 * 1.2),
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    lineHeight: Math.round(fontSizes.sm14 * 1.2),
    marginTop: 2,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  chevronContainer: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  chevron: {
    color: colors.textSubtle,
    fontSize: fontSizes.xl25,
    lineHeight: fontSizes.xl25,
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
  },
});

