import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const offlineStyles = StyleSheet.create({
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
  warningCard: {
    width: "100%",
    minHeight: 69,
    backgroundColor: colors.warning50,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  warningIconCol: {
    width: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  warningText: {
    flex: 1,
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.warning900,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md19,
    color: colors.text,
    marginBottom: 12,
  },
  pendingCard: {
    width: "100%",
    minHeight: 69,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  pendingIconCol: {
    width: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  pendingInfoCol: {
    flex: 1,
    justifyContent: "center",
  },
  pendingTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    color: colors.text,
  },
  pendingSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.textMuted,
    marginTop: 2,
  },
  autoSyncText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  btnRetry: {
    width: "100%",
    height: 63,
    backgroundColor: colors.primary,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  btnRetryText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg21,
    color: colors.white,
  },
});

