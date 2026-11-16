import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const historyStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  topInfo: {
    gap: 4,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg21,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  emptyDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dateCol: {
    gap: 4,
  },
  eventDate: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.text,
  },
  mealBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mealBadgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs11,
    color: "#92400E",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusOpen: {
    backgroundColor: "#E0F2FE",
  },
  statusResolved: {
    backgroundColor: "#DCFCE7",
  },
  statusPillText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs11,
  },
  statusTextOpen: {
    color: "#0369A1",
  },
  statusTextResolved: {
    color: "#15803D",
  },
  symptomsBox: {
    gap: 4,
    backgroundColor: colors.surface2,
    padding: 10,
    borderRadius: 8,
  },
  symptomText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.text,
  },
  guidanceBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  guidanceText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: "#166534",
    lineHeight: 16,
  },
  newReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 8,
  },
  newReportText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.white,
  },
});

