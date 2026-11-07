import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme/colors";
import { fontFamilies, fontSizes } from "../theme/typography";

export type BottomNavTab = "modules" | "persons" | "products" | "intakes";

export interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabPress: (tab: BottomNavTab) => void;
  testID?: string;
}

interface TabConfig {
  id: BottomNavTab;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: "modules", label: "Modules", icon: "home" },
  { id: "persons", label: "Personnes", icon: "users" },
  { id: "products", label: "Produits", icon: "apple-alt" },
  { id: "intakes", label: "Prises", icon: "history" },
];

export function BottomNav({
  activeTab,
  onTabPress,
  testID = "bottom-nav",
}: BottomNavProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const color = isActive ? colors.primary : colors.textSubtle;

          return (
            <Pressable
              key={tab.id}
              testID={`bottom-nav-tab-${tab.id}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              onPress={() => onTabPress(tab.id)}
              style={({ pressed }) => [
                styles.tabItem,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <FontAwesome5
                name={tab.icon}
                size={23}
                color={color}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color,
                    fontFamily: isActive ? fontFamilies.bold : fontFamilies.regular,
                    fontWeight: isActive ? "700" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: colors.surface2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bar: {
    height: 57,
    flexDirection: "row",
    alignItems: "stretch",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 6,
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: fontSizes.sm13,
    lineHeight: Math.round(fontSizes.sm13 * 1.2),
  },
});

