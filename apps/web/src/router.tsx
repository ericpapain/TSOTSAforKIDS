import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './api/authContext';
import { CatalogPage } from './pages/dev/CatalogPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import {
  CaregiverLayout,
  DashboardPage,
  FollowedPersonsPage,
  PersonFilePage,
  NewEvaluationPage,
  IntakePlanPage,
  NotificationsPage,
  NotificationSettingsPage,
} from './pages/caregiver';

export const routes = [
  {
    path: '/connexion',
    element: <LoginPage />,
  },
  {
    path: '/dev/catalog',
    element: <CatalogPage />,
  },
  // W01 : Utilisateur web
  {
    path: '/nutrition/produits/plumpy-nut',
    element: (
      <ProtectedRoute allowedRoles={['user', 'caregiver', 'admin']}>
        <PlaceholderPage
          screenId="W01"
          title="Version web utilisateur"
          space="user"
          routePath="/nutrition/produits/plumpy-nut"
        />
      </ProtectedRoute>
    ),
  },
  // W02 - W09 : Soignant
  {
    path: '/soignant',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout>
          <DashboardPage />
        </CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/dashboard',
    element: <Navigate to="/soignant" replace />,
  },
  {
    path: '/soignant/personnes',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout>
          <FollowedPersonsPage />
        </CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/personnes/:personId',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout>
          <PersonFilePage />
        </CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/personnes/:personId/evaluation',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout>
          <NewEvaluationPage />
        </CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/personnes/:personId/plan',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout>
          <IntakePlanPage />
        </CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/notifications',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout>
          <NotificationsPage />
        </CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/parametres',
    element: <Navigate to="/soignant/parametres/notifications" replace />,
  },
  {
    path: '/soignant/parametres/notifications',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout>
          <NotificationSettingsPage />
        </CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  // W10 - W20 : Admin
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W10"
          title="Vue d'ensemble administration"
          space="admin"
          routePath="/"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/verifications',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W11"
          title="Vérifications soignants"
          space="admin"
          routePath="/verifications"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/comptes',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W12"
          title="Gestion des comptes"
          space="admin"
          routePath="/comptes"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/base-aliments',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W13"
          title="Base aliments ORKG"
          space="admin"
          routePath="/base-aliments"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/base-aliments/nouveau',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W14"
          title="Saisie d'un aliment"
          space="admin"
          routePath="/base-aliments/nouveau"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/base-aliments/import',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W15"
          title="Import d'un fichier d'aliments"
          space="admin"
          routePath="/base-aliments/import"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/produits-reference',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W16"
          title="Produits de référence"
          space="admin"
          routePath="/produits-reference"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/prix',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W17"
          title="Prix par région"
          space="admin"
          routePath="/prix"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/optimisation',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W18"
          title="Optimisation et solveur"
          space="admin"
          routePath="/optimisation"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/modules',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W19"
          title="Gestion des modules"
          space="admin"
          routePath="/modules"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PlaceholderPage
          screenId="W20"
          title="Notifications plateforme"
          space="admin"
          routePath="/notifications"
        />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dev/catalog" replace />,
  },
];

export const router = createBrowserRouter(routes);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;

