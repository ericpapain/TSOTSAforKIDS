import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const lockStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lockscreen,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  clockContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 32,
  },
  clockTime: {
    fontFamily: fontFamilies.bold,
    fontSize: 64,
    color: colors.white,
    letterSpacing: -1,
  },
  clockDate: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md18,
    color: colors.neutral200,
    marginTop: 4,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  brandTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs11,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  timeTag: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.textMuted,
  },
  cardTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
    marginBottom: 4,
  },
  cardBody: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral100,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonDestructive: {
    backgroundColor: colors.danger50,
  },
  actionTextPrimary: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.white,
  },
  actionTextSecondary: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.text,
  },
  actionTextDestructive: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.danger,
  },
  previousCard: {
    backgroundColor: colors.lockscreen2,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previousText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.neutral100,
  },
});
