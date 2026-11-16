import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { clearStoredTokens } from "../../api/storage";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";
import type { CanonicalRole } from "./types";

interface RoleSelectorProps {
  selectedRole: CanonicalRole;
  onSelectRole: (role: CanonicalRole) => void;
}

const ROLES: { id: CanonicalRole; labelKey: string; defaultLabel: string }[] = [
  { id: "parent", labelKey: "roles.parent", defaultLabel: "Parent" },
  { id: "field_agent", labelKey: "roles.field_agent", defaultLabel: "Agent de terrain" },
  { id: "caregiver", labelKey: "roles.caregiver", defaultLabel: "Soignant" },
  { id: "super_caregiver", labelKey: "roles.super_caregiver", defaultLabel: "Super soignant" },
  { id: "admin", labelKey: "roles.admin", defaultLabel: "Administrateur" },
];

export function RoleSelector({
  selectedRole,
  onSelectRole,
}: RoleSelectorProps): React.JSX.Element {
  const { t } = useTranslation("mobile");

  const handlePress = (role: CanonicalRole): void => {
    if (role !== selectedRole) {
      void clearStoredTokens();
      onSelectRole(role);
    }
  };

  return (
    <View style={styles.container} testID="role-selector">
      <Text style={styles.heading}>
        {t("roles.selectorPrompt", { defaultValue: "Je suis…" })}
      </Text>
      <View style={styles.chipsContainer}>
        {ROLES.map((r) => {
          const isSelected = selectedRole === r.id;
          return (
            <Pressable
              key={r.id}
              testID={`role-btn-${r.id}`}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
              onPress={() => handlePress(r.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {t(r.labelKey, { defaultValue: r.defaultLabel })}
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
    marginBottom: 20,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
    marginBottom: 10,
    textAlign: "center",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  chipText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
  },
  chipTextSelected: {
    color: colors.white,
  },
  chipTextUnselected: {
    color: colors.text,
  },
});

