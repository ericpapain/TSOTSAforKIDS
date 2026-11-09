import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppShell } from '../components/AppShell';
import type { SpaceTheme, NavItem } from '../types';

interface PlaceholderPageProps {
  screenId: string;
  title: string;
  space: SpaceTheme;
  routePath: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  screenId,
  title,
  space,
  routePath,
}) => {
  const { t } = useTranslation('common');
  const { t: tCaregiver } = useTranslation('caregiver');
  const { t: tAdmin } = useTranslation('admin');

  const caregiverNavItems: NavItem[] = [
    { label: tCaregiver('nav.dashboard'), path: '/soignant', iconName: 'dashboard' },
    { label: tCaregiver('nav.persons'), path: '/soignant/personnes', iconName: 'patients', badge: 3 },
    { label: tCaregiver('nav.notifications'), path: '/soignant/notifications', iconName: 'notifications' },
    { label: tCaregiver('nav.settings'), path: '/soignant/parametres/notifications', iconName: 'settings' },
  ];

  const adminNavItems: NavItem[] = [
    { label: tAdmin('nav.overview'), path: '/', iconName: 'dashboard' },
    { label: tAdmin('nav.verifications'), path: '/verifications', iconName: 'verify', badge: 5 },
    { label: tAdmin('nav.accounts'), path: '/comptes', iconName: 'accounts' },
    { label: tAdmin('nav.foods'), path: '/base-aliments', iconName: 'foods' },
    { label: tAdmin('nav.products'), path: '/produits-reference', iconName: 'products' },
    { label: tAdmin('nav.prices'), path: '/prix', iconName: 'prices' },
    { label: tAdmin('nav.optimization'), path: '/optimisation', iconName: 'optimize' },
    { label: tAdmin('nav.modules'), path: '/modules', iconName: 'modules' },
    { label: tAdmin('nav.notifications'), path: '/notifications', iconName: 'notifications' },
  ];

  const userNavItems: NavItem[] = [
    { label: t('dev.placeholder.userNavLabel'), path: '/nutrition/produits/plumpy-nut', iconName: 'foods' },
  ];

  const isCaregiver = space === 'caregiver' || space === 'care';
  const isAdmin = space === 'admin';
  const navItems = isCaregiver
    ? caregiverNavItems
    : isAdmin
    ? adminNavItems
    : userNavItems;

  const defaultUserName = isCaregiver
    ? 'Prof. Félicité Ngeufack'
    : isAdmin
    ? tAdmin('nav.teamName')
    : t('header.defaultUserName');

  return (
    <AppShell
      space={space}
      userName={defaultUserName}
      unreadNotifications={isCaregiver ? 3 : 0}
      navItems={navItems}
      activeNavPath={routePath}
    >
      <div className="bg-white border border-border rounded-card p-8">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
          {t('dev.placeholder.screenLabel', { screenId, routePath })}
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-4">{title}</h1>
        <p className="text-text-secondary text-sm">
          {t('dev.placeholder.message')}
        </p>
      </div>
    </AppShell>
  );
};

export default PlaceholderPage;

