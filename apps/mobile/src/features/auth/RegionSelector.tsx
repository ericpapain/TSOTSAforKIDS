import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";
import { CAMEROON_REGIONS } from "../reference/cameroonRegions";

interface RegionSelectorProps {
  selectedRegion: string;
  onSelectRegion: (regionId: string) => void;
}

export function RegionSelector({
  selectedRegion,
  onSelectRegion,
}: RegionSelectorProps): React.JSX.Element {
  const { t } = useTranslation("mobile");

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>
        {t("email.regionLabel", { defaultValue: "Localisation (région) *" })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.regionList}
      >
        {CAMEROON_REGIONS.map((reg) => {
          const isSelected = selectedRegion === reg.id;
          return (
            <Pressable
              key={reg.id}
              testID={`region-chip-${reg.id}`}
              style={[styles.regionChip, isSelected && styles.regionChipActive]}
              onPress={() => onSelectRegion(reg.id)}
            >
              <Text
                style={[
                  styles.regionChipText,
                  isSelected && styles.regionChipTextActive,
                ]}
              >
                {reg.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    width: "100%",
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.text,
    marginBottom: 4,
  },
  regionList: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  regionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  regionChipText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs11,
    color: colors.text,
  },
  regionChipTextActive: {
    color: colors.white,
  },
});

