import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";

export const profileStyles = StyleSheet.create({
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
    fontSize: 22,
    fontFamily: fontFamilies.bold,
    color: colors.white,
    textAlign: "center",
    maxWidth: 220,
  },
  content: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    padding: 17,
    marginBottom: 18,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarCircle: {
    width: 71,
    height: 71,
    borderRadius: 35.5,
    backgroundColor: colors.primary50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  personName: {
    fontSize: 24,
    fontFamily: fontFamilies.bold,
    color: colors.text,
  },
  demoBadge: {
    backgroundColor: colors.accent50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  demoBadgeText: {
    fontSize: 13,
    fontFamily: fontFamilies.bold,
    color: colors.accent,
  },
  personSub: {
    fontSize: 16,
    fontFamily: fontFamilies.regular,
    color: colors.textMuted,
  },
  statusPill: {
    backgroundColor: colors.warning50,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusPillText: {
    fontSize: 16,
    fontFamily: fontFamilies.bold,
    color: colors.warning,
  },
  lastVisitText: {
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: colors.textMuted,
  },
  appointmentBox: {
    backgroundColor: colors.primary50,
    borderRadius: 9,
    paddingHorizontal: 17,
    paddingVertical: 20,
    marginBottom: 23,
  },
  appointmentText: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  btnGiveProduct: {
    height: 86,
    backgroundColor: colors.primary,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },
  btnGiveProductText: {
    color: colors.white,
    fontSize: 24,
    fontFamily: fontFamilies.bold,
  },
  btnHistory: {
    height: 69,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },
  btnHistoryText: {
    color: colors.primary,
    fontSize: 21,
    fontFamily: fontFamilies.bold,
  },
  btnSchedule: {
    height: 63,
    backgroundColor: colors.primary50,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  btnScheduleText: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: fontFamilies.bold,
  },
});

