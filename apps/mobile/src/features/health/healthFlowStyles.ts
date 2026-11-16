import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies, fontSizes } from "../../theme/typography";

export const flowStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  stepIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: "#A7D6C7",
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
  },
  dangerBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#DC2626",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  dangerBannerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: "#991B1B",
  },
  dangerBannerDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: "#7F1D1D",
    marginTop: 2,
    lineHeight: 16,
  },
  stepContainer: {
    gap: 16,
  },
  stepQuestion: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base16,
    color: colors.text,
  },
  symptomsList: {
    gap: 8,
  },
  symptomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F0FDF4",
  },
  dangerCardSelected: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  symptomLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.text,
  },
  symptomLabelSelected: {
    fontFamily: fontFamilies.bold,
    color: colors.text,
  },
  urgentBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentBadgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs11,
    color: "#991B1B",
    textTransform: "uppercase",
  },
  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: "#166534",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.white,
  },
  durationOptions: {
    gap: 8,
  },
  durationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.text,
  },
  fieldBox: {
    gap: 6,
    marginTop: 6,
  },
  fieldLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.text,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  checkboxLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    color: colors.text,
  },
  duringMealCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  duringMealCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#F0FDF4",
  },
  duringMealTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.text,
  },
  duringMealDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm13,
    color: colors.textMuted,
  },
  summaryVal: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    color: colors.text,
  },
  summaryNotes: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    color: colors.text,
    fontStyle: "italic",
    marginTop: 2,
  },
  outcomeIconCircle: {
    alignItems: "center",
    marginVertical: 12,
  },
  outcomeTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg21,
    color: colors.text,
    textAlign: "center",
  },
  guidanceBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  guidanceText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    color: "#166534",
    lineHeight: 20,
    textAlign: "center",
  },
});

