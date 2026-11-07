import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const givenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  circleIcon: {
    width: 149,
    height: 149,
    borderRadius: 75,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 29,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md19,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 24,
  },
  noticeBox: {
    width: "100%",
    minHeight: 63,
    backgroundColor: colors.primary50,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 28,
  },
  noticeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.primary,
    textAlign: "center",
    lineHeight: 24,
  },
  btnPrimary: {
    width: "100%",
    height: 63,
    backgroundColor: colors.primary,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  btnPrimaryText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg21,
    color: colors.white,
  },
  btnCare: {
    width: "100%",
    height: 57,
    backgroundColor: colors.care,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  btnCareText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md19,
    color: colors.white,
  },
});

