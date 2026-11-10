import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './api/authContext';
import { CatalogPage } from './pages/dev/CatalogPage';
import { LoginPage } from './pages/LoginPage';
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
import {
  AdminLayout,
  AdminDashboardPage,
  AdminVerifyPage,
  AdminAccountsPage,
  AdminFoodsPage,
  AdminFoodNewPage,
  AdminImportPage,
  AdminProductsPage,
  AdminPricesPage,
  AdminOptimPage,
  AdminModulesPage,
  AdminNotificationsPage,
} from './pages/admin';
import { NutritionPage } from './pages/user/NutritionPage';
import { FamilyPersonsPage } from './pages/user/FamilyPersonsPage';
import { IntakeHistoryPage } from './pages/user/IntakeHistoryPage';
import { CustomProductPage } from './pages/user/CustomProductPage';
import { UserSettingsPage } from './pages/user/UserSettingsPage';

export const routes = [
  { path: '/connexion', element: <LoginPage /> },
  { path: '/dev/catalog', element: <CatalogPage /> },
  // W01 & Espace Utilisateur (Web & Mobile)
  { path: '/nutrition', element: <Navigate to="/nutrition/produits/plumpy-nut" replace /> },
  {
    path: '/nutrition/produits/plumpy-nut',
    element: (
      <ProtectedRoute allowedRoles={['user', 'caregiver', 'admin']}>
        <NutritionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/famille',
    element: (
      <ProtectedRoute allowedRoles={['user', 'caregiver', 'admin']}>
        <FamilyPersonsPage />
      </ProtectedRoute>
    ),
  },
  { path: '/personnes', element: <Navigate to="/famille" replace /> },
  {
    path: '/historique',
    element: (
      <ProtectedRoute allowedRoles={['user', 'caregiver', 'admin']}>
        <IntakeHistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/mes-produits/nouveau',
    element: (
      <ProtectedRoute allowedRoles={['user', 'caregiver', 'admin']}>
        <CustomProductPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/parametres',
    element: (
      <ProtectedRoute allowedRoles={['user', 'caregiver', 'admin']}>
        <UserSettingsPage />
      </ProtectedRoute>
    ),
  },
  // W02 - W09 : Soignant
  {
    path: '/soignant',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout><DashboardPage /></CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  { path: '/soignant/dashboard', element: <Navigate to="/soignant" replace /> },
  {
    path: '/soignant/personnes',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout><FollowedPersonsPage /></CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/personnes/:personId',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout><PersonFilePage /></CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/personnes/:personId/evaluation',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout><NewEvaluationPage /></CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/personnes/:personId/plan',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout><IntakePlanPage /></CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/soignant/notifications',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout><NotificationsPage /></CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  { path: '/soignant/parametres', element: <Navigate to="/soignant/parametres/notifications" replace /> },
  {
    path: '/soignant/parametres/notifications',
    element: (
      <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
        <CaregiverLayout><NotificationSettingsPage /></CaregiverLayout>
      </ProtectedRoute>
    ),
  },
  // W10 - W20 : Administration
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminDashboardPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  { path: '/admin', element: <Navigate to="/" replace /> },
  {
    path: '/verifications',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminVerifyPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/comptes',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminAccountsPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/base-aliments',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminFoodsPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/base-aliments/nouveau',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminFoodNewPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/base-aliments/import',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminImportPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/produits-reference',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminProductsPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prix',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminPricesPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/optimisation',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminOptimPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/modules',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminModulesPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout><AdminNotificationsPage /></AdminLayout>
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <Navigate to="/dev/catalog" replace /> },
];

export const router = createBrowserRouter(routes);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
