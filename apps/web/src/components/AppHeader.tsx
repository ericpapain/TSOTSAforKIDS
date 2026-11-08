import React from "react";
import { FaBell } from "react-icons/fa";
import { BrandLogo } from "./BrandLogo";
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
  { bg: string; defaultTitle: string }
> = {
  primary: {
    bg: "bg-primary",
    defaultTitle: "Espace utilisateur (web)",
  },
  user: {
    bg: "bg-primary",
    defaultTitle: "Espace utilisateur (web)",
  },
  care: {
    bg: "bg-care",
    defaultTitle: "Espace soignant",
  },
  caregiver: {
    bg: "bg-care",
    defaultTitle: "Espace soignant",
  },
  admin: {
    bg: "bg-admin",
    defaultTitle: "Espace administration",
  },
};

export function AppHeader({
  spaceTheme,
  space = "primary",
  userName = "Compte démo · Amina",
  spaceTitle,
  notificationCount,
  unreadNotifications,
  onNotificationClick,
  onLogout,
  testID = "app-header",
}: AppHeaderProps): React.JSX.Element {
  const currentSpace = spaceTheme ?? space;
  const config = themeStyles[currentSpace] || themeStyles.primary;
  const title = spaceTitle ?? config.defaultTitle;
  const isCaregiver = currentSpace === "care" || currentSpace === "caregiver";
  const count = unreadNotifications ?? notificationCount ?? 0;

  return (
    <header
      data-testid={testID}
      className={`w-full h-[63px] ${config.bg} flex items-center justify-between px-[29px] select-none text-white z-30 shrink-0`}
    >
      {/* Left: BrandLogo dark + Space Title */}
      <div className="flex items-center space-x-3">
        <BrandLogo size={34} variant="dark" mode="full" testID="header-brand-logo" />
        <span
          data-testid="header-space-title"
          className="text-22 font-bold text-white tracking-normal"
        >
          · {title}
        </span>
      </div>

      {/* Right: Bell (for caregiver) + User Name */}
      <div className="flex items-center space-x-6">
        {isCaregiver && (
          <button
            type="button"
            data-testid="header-notification-btn"
            onClick={onNotificationClick}
            className="relative cursor-pointer hover:opacity-90 active:opacity-85 text-white flex items-center justify-center"
            aria-label={`Notifications (${count} non lues)`}
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
        )}

        <div className="flex items-center gap-3">
          <span
            data-testid="header-username"
            className="text-17 font-bold text-white"
          >
            {userName}
          </span>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-13 underline text-white opacity-80 hover:opacity-100"
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
