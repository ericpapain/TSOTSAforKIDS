import React from 'react';
import { AppHeader } from './AppHeader';
import { Sidebar, type NavItem } from './Sidebar';
import type { SpaceTheme } from '../types';

export interface AppShellProps {
  space: SpaceTheme;
  userName?: string;
  unreadNotifications?: number;
  onNotificationClick?: () => void;
  navItems: NavItem[];
  activeNavPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  space,
  userName,
  unreadNotifications = 0,
  onNotificationClick,
  navItems,
  activeNavPath,
  onNavigate,
  onLogout,
  children,
}) => {
  return (
    <div className="min-h-screen bg-canvas text-text flex flex-col font-sans">
      <AppHeader
        space={space}
        userName={userName}
        unreadNotifications={unreadNotifications}
        onNotificationClick={onNotificationClick}
        onLogout={onLogout}
      />
      <div className="flex flex-1 relative">
        <Sidebar
          space={space}
          items={navItems}
          activePath={activeNavPath}
          onNavigate={onNavigate}
        />
        <main className="flex-1 min-w-0 px-[23px] py-[20px] overflow-y-auto">
          <div className="max-w-[1155px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
