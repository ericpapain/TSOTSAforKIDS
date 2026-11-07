import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  warningCard: {
    backgroundColor: colors.warning50,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  warningTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.warning900,
    marginBottom: 4,
  },
  warningBody: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.warning900,
    lineHeight: 20,
  },
  settingRow: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRowDisabled: {
    backgroundColor: colors.neutral100,
    opacity: 0.7,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  footerButton: {
    marginTop: 24,
  },
});
