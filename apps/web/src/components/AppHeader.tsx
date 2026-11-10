import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBell } from "react-icons/fa";
import "../i18n/setup";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { initialNotifications } from "../features/caregiver/caregiverData";
import type { SpaceTheme } from "../types";

export interface AppHeaderProps {
  spaceTheme?: SpaceTheme;
  space?: SpaceTheme;
  userName?: string;
  spaceTitle?: string;
  notificationCount?: number;
  unreadNotifications?: number;
  onNotificationClick?: () => void;
  onLogout?: () => void;
  testID?: string;
}

const themeStyles: Record<
  string,
  { bg: string; titleKey: "header.space.user" | "header.space.caregiver" | "header.space.admin" }
> = {
  primary: {
    bg: "bg-primary",
    titleKey: "header.space.user",
  },
  user: {
    bg: "bg-primary",
    titleKey: "header.space.user",
  },
  care: {
    bg: "bg-care",
    titleKey: "header.space.caregiver",
  },
  caregiver: {
    bg: "bg-care",
    titleKey: "header.space.caregiver",
  },
  admin: {
    bg: "bg-admin",
    titleKey: "header.space.admin",
  },
};

export function AppHeader({
  spaceTheme,
  space = "primary",
  userName,
  spaceTitle,
  notificationCount,
  unreadNotifications,
  onNotificationClick,
  onLogout,
  testID = "app-header",
}: AppHeaderProps): React.JSX.Element {
  const { t, i18n } = useTranslation("common");
  const { t: tNotif } = useTranslation("notifications");
  const { t: tMedical } = useTranslation("medical");
  const currentSpace = spaceTheme ?? space;
  const config = themeStyles[currentSpace] || themeStyles.primary;
  const title = spaceTitle ?? t(config.titleKey);
  const defaultName =
    i18n.language === "fr" || i18n.language === "en"
      ? t("header.defaultUserName")
      : "Compte démo · Hamadou";
  const displayUserName =
    userName === "Compte démo · Hamadou" || userName === undefined
      ? defaultName
      : userName;
  const isCaregiver = currentSpace === "care" || currentSpace === "caregiver";
  const count = unreadNotifications ?? notificationCount ?? 0;
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleBellClick = () => {
    setIsNotifOpen((prev) => !prev);
    onNotificationClick?.();
  };

  const notificationsLabel = t("header.notificationsUnread", { count });

  const getNotifTitle = (id: string, fallback: string): string => {
    if (id === "notif-1") return tMedical("alerts.missedIntakeEveningTitle");
    if (id === "notif-2") return tMedical("alerts.weightStagnationTitle");
    if (id === "notif-3") return tNotif("caregiverPage.items.notif-3.title");
    if (id === "notif-4") return tNotif("caregiverPage.items.notif-4.title");
    if (id === "notif-5") return tNotif("caregiverPage.items.notif-5.title");
    return fallback;
  };

  const getNotifMessage = (id: string, fallback: string): string => {
    if (id === "notif-1") return tMedical("alerts.missedIntakeNotifMessage");
    if (id === "notif-2") return tMedical("alerts.weightStagnationNotifMessage");
    if (id === "notif-3") return tNotif("caregiverPage.items.notif-3.message");
    if (id === "notif-4") return tNotif("caregiverPage.items.notif-4.message");
    if (id === "notif-5") return tNotif("caregiverPage.items.notif-5.message");
    return fallback;
  };

  return (
    <header
      data-testid={testID}
      className={`sticky top-0 z-50 w-full h-[63px] ${config.bg} flex items-center justify-between px-[29px] select-none text-white shrink-0 shadow-sm`}
    >
      {/* Left: BrandLogo dark + Space Title */}
      <div className="flex items-center space-x-3">
        <BrandLogo size={34} variant="dark" mode="full" testID="header-brand-logo" />
        <span
          data-testid="header-space-title"
          className="text-22 font-bold text-white tracking-normal"
        >
          {`· ${title}`}
        </span>
      </div>

      {/* Right: Bell (for caregiver) + LanguageSwitcher + User Name */}
      <div className="flex items-center space-x-5">
        {isCaregiver && (
          <div className="relative">
            <button
              type="button"
              data-testid="header-notification-btn"
              aria-expanded={isNotifOpen}
              onClick={handleBellClick}
              className="relative cursor-pointer hover:opacity-90 active:opacity-85 text-white flex items-center justify-center"
              aria-label={notificationsLabel}
            >
              <FaBell size={21} />
              {count > 0 && (
                <span
                  data-testid="header-notification-badge"
                  className="absolute -top-1.5 -right-2 w-[23px] h-[23px] bg-badge text-white font-bold text-13 rounded-full flex items-center justify-center leading-none"
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div
                data-testid="header-notification-popover"
                className="absolute right-0 top-[38px] z-50 w-[340px] rounded-[9px] border border-[#D5DEDA] bg-white text-[#17302A] shadow-xl overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-[#F7F9F8] border-b border-[#E5ECE9] flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[#17302A]">
                    {notificationsLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[12px] font-bold text-[#5B6B66] hover:text-[#17302A]"
                  >
                    {t("header.close")}
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#E5ECE9]">
                  {initialNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setIsNotifOpen(false);
                        onNotificationClick?.();
                      }}
                      className={`px-4 py-3 cursor-pointer hover:bg-[#EDF5F2] transition-colors ${
                        notif.isRead ? "bg-white" : "bg-[#FFF9F2]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-[#17302A]">
                          {getNotifTitle(notif.id, notif.title)}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#F08A24] shrink-0" />
                        )}
                      </div>
                      <div className="text-[12px] font-bold text-[#1B4D7E] mt-0.5">
                        {`${notif.personName} (${notif.personCode})`}
                      </div>
                      <p className="text-[12px] text-[#5B6B66] mt-0.5 line-clamp-2">
                        {getNotifMessage(notif.id, notif.message)}
                      </p>
                      <span className="text-[11px] text-[#5B6B66] mt-1 block">
                        {notif.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <LanguageSwitcher />

        <div className="flex items-center gap-3">
          <span
            data-testid="header-username"
            className="text-17 font-bold text-white"
          >
            {displayUserName}
          </span>
          {onLogout && (
            <button
              type="button"
              data-testid="header-logout-btn"
              onClick={onLogout}
              className="text-13 underline text-white opacity-80 hover:opacity-100 cursor-pointer"
            >
              {t("header.logout")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
