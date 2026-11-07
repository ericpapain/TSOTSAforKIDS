import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const historyStyles = StyleSheet.create({
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  historyCard: {
    width: "100%",
    minHeight: 73,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  historyCardUnconfirmed: {
    backgroundColor: colors.danger50,
    borderColor: colors.danger200,
  },
  iconCol: {
    width: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
  },
  timeTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    marginTop: 2,
  },
  subtitleUnconfirmed: {
    color: colors.danger,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    marginTop: 2,
  },
  btnConfirmLate: {
    width: 92,
    height: 37,
    backgroundColor: colors.danger,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  btnConfirmLateText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.white,
  },
  recapText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
});

