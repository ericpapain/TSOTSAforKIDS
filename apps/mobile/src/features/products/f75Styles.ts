import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const f75Styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  appBar: {
    height: 67,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  touchIcon: {
    width: 69,
    height: 67,
    justifyContent: "center",
    alignItems: "center",
  },
  appBarTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg22,
    color: colors.white,
    textAlign: "center",
    flex: 1,
  },
  content: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 24,
  },
  dangerBanner: {
    width: 356,
    height: 80,
    backgroundColor: colors.danger50,
    borderRadius: 9,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 17,
  },
  dangerBannerText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.danger,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md19,
    color: colors.text,
    marginBottom: 7,
  },
  tableRow: {
    width: 356,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: colors.surface2,
  },
  tableRowAlt: {
    width: 356,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  nutrientLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  nutrientValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  sourceText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    fontStyle: "italic",
    color: colors.textMuted,
    marginTop: 14,
    lineHeight: 18,
    marginBottom: 16,
  },
  btnChooseOther: {
    width: 356,
    height: 52,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  btnChooseOtherText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.primary,
  },
});

