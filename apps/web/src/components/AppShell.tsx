import React from 'react';
import { AppHeader } from './AppHeader';
import { Sidebar, type NavItem } from './Sidebar';
import type { SpaceTheme } from '../types';

export interface AppShellProps {
  space: SpaceTheme;
  userName?: string;
  unreadNotifications?: number;
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
        onLogout={onLogout}
      />
      <div className="flex flex-1 relative">
        <Sidebar
          space={space}
          items={navItems}
          activePath={activeNavPath}
          onNavigate={onNavigate}
        />
        <main className="flex-1 min-w-0 p-6 md:p-8 lg:p-10 ml-0 overflow-y-auto">
          <div className="max-w-[1155px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
