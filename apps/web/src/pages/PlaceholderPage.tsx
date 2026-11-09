import React from 'react';
import { AppShell } from '../components/AppShell';
import type { SpaceTheme, NavItem } from '../types';

interface PlaceholderPageProps {
  screenId: string;
  title: string;
  space: SpaceTheme;
  routePath: string;
}

const caregiverNavItems: NavItem[] = [
  { label: 'Tableau de bord', path: '/soignant', iconName: 'dashboard' },
  { label: 'Personnes suivies', path: '/soignant/personnes', iconName: 'patients', badge: 3 },
  { label: 'Notifications', path: '/soignant/notifications', iconName: 'notifications' },
  { label: 'Réglages', path: '/soignant/parametres/notifications', iconName: 'settings' },
];

const adminNavItems: NavItem[] = [
  { label: 'Vue d\'ensemble', path: '/', iconName: 'dashboard' },
  { label: 'Vérifications', path: '/verifications', iconName: 'verify', badge: 5 },
  { label: 'Comptes', path: '/comptes', iconName: 'accounts' },
  { label: 'Base aliments', path: '/base-aliments', iconName: 'foods' },
  { label: 'Produits de réf.', path: '/produits-reference', iconName: 'products' },
  { label: 'Prix par région', path: '/prix', iconName: 'prices' },
  { label: 'Optimisation', path: '/optimisation', iconName: 'optimize' },
  { label: 'Modules', path: '/modules', iconName: 'modules' },
  { label: 'Notifications', path: '/notifications', iconName: 'notifications' },
];

const userNavItems: NavItem[] = [
  { label: 'Produits & Équivalents', path: '/nutrition/produits/plumpy-nut', iconName: 'foods' },
];

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  screenId,
  title,
  space,
  routePath,
}) => {
  const isCaregiver = space === 'caregiver' || space === 'care';
  const isAdmin = space === 'admin';
  const navItems = isCaregiver
    ? caregiverNavItems
    : isAdmin
    ? adminNavItems
    : userNavItems;

  const defaultUserName = isCaregiver ? 'Prof. Félicité Ngeufack' : isAdmin ? 'Admin TSOTSA' : 'Hamadou N.';

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
          Écran {screenId} · {routePath}
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-4">{title}</h1>
        <p className="text-text-secondary text-sm">
          Cet écran sera implémenté lors de son étape dédiée dans TSOTSA Kids.
        </p>
      </div>
    </AppShell>
  );
};

export default PlaceholderPage;
