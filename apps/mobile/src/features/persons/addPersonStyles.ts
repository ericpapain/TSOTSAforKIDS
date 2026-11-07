import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const addPersonStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.text,
    marginBottom: 8,
  },
  relationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  relationButton: {
    flex: 1,
    height: 41,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  relationActive: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  relationInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationText: {
    fontSize: fontSizes.base16,
  },
  relationTextActive: {
    fontFamily: fontFamilies.bold,
    color: colors.white,
  },
  relationTextInactive: {
    fontFamily: fontFamilies.regular,
    color: colors.text,
  },
  errorText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.danger,
    marginBottom: 10,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    height: 25,
  },
  inputContainer: {
    height: 44,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  input: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md18,
    color: colors.text,
    padding: 0,
  },
  twoColRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  colLeft: {
    flex: 1.4,
  },
  colRight: {
    flex: 1,
  },
  colHalf: {
    flex: 1,
  },
  selectContainer: {
    height: 44,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  selectText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md18,
    color: colors.text,
  },
  noteText: {
    fontFamily: fontFamilies.regular,
    fontStyle: "italic",
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 24,
  },
  continueButton: {
    height: 63,
    backgroundColor: colors.primary,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg21,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});

