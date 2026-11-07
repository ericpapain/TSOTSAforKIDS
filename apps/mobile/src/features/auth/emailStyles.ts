import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const emailStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 32,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 23,
  },
  tabButton: {
    flex: 1,
    height: 46,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md18,
  },
  tabTextActive: {
    fontFamily: fontFamilies.bold,
    fontWeight: "700",
    color: colors.white,
  },
  tabTextInactive: {
    color: colors.text,
  },
  successBox: {
    backgroundColor: colors.primary50,
    padding: 12,
    borderRadius: 7,
    marginBottom: 16,
  },
  successText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.primary,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: colors.danger50,
    padding: 12,
    borderRadius: 7,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.danger,
    textAlign: "center",
  },
  fieldBlock: {
    marginBottom: 16,
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
  passwordHintsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 28,
  },
  hintText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
  },
  forgotText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.primary,
  },
  continueButton: {
    height: 63,
    backgroundColor: colors.primary,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 23,
  },
  continueButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg21,
    color: colors.white,
  },
  caregiverButton: {
    paddingVertical: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  caregiverText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.care,
  },
  securityBox: {
    backgroundColor: colors.neutral100,
    borderRadius: 9,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  lockIconCol: {
    width: 32,
    marginRight: 14,
    alignItems: "center",
  },
  securityText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
