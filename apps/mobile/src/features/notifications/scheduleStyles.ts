import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const scheduleStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  prescribedCard: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  prescribedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  prescribedTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.primary,
  },
  prescribedDetails: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  prescribedDates: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.textMuted,
  },
  slotsList: {
    gap: 10,
    marginBottom: 20,
  },
  slotCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timeBox: {
    backgroundColor: colors.neutral100,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  timeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  slotInfo: {
    justifyContent: "center",
  },
  periodLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
    marginBottom: 2,
  },
  productLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
  },
  addPersonalReminderBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    backgroundColor: colors.white,
    marginBottom: 24,
  },
  addPersonalReminderText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.primary,
  },
  bottomActionContainer: {
    marginTop: "auto",
  },
});
