import { Navigate, type RouteObject } from "react-router-dom";
import { ProtectedRoute } from "./api/authContext";
import { CatalogPage } from "./pages/dev/CatalogPage";
import { LoginPage } from "./pages/LoginPage";
import {
  CaregiverLayout,
  DashboardPage,
  FollowedPersonsPage,
  PersonFilePage,
  NewEvaluationPage,
  IntakePlanPage,
  NotificationsPage,
  NotificationSettingsPage,
  SupervisionPatientsPage,
  SupervisionAssociationPage,
  SupervisionValidationPage,
  SupervisionDelegationsPage,
} from "./pages/caregiver";
import {
  FieldAgentLayout,
  FieldAgentFamiliesPage,
  FieldAgentValidationPage,
  FieldAgentProfilePage,
} from "./pages/field_agent";
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
} from "./pages/admin";
import { NutritionPage } from "./pages/user/NutritionPage";
import { FamilyPersonsPage } from "./pages/user/FamilyPersonsPage";
import { IntakeHistoryPage } from "./pages/user/IntakeHistoryPage";
import { CustomProductPage } from "./pages/user/CustomProductPage";
import { UserSettingsPage } from "./pages/user/UserSettingsPage";

export const routes: RouteObject[] = [
  { path: "/connexion", element: <LoginPage /> },
  { path: "/dev/catalog", element: <CatalogPage /> },

  // Espace Parent (Famille)
  { path: "/nutrition", element: <Navigate to="/nutrition/produits/plumpy-nut" replace /> },
  {
    path: "/nutrition/produits/plumpy-nut",
    element: <ProtectedRoute allowedRoles={["parent", "user", "admin", "caregiver", "super_caregiver", "field_agent"]}><NutritionPage /></ProtectedRoute>,
  },
  {
    path: "/famille",
    element: <ProtectedRoute allowedRoles={["parent", "user"]}><FamilyPersonsPage /></ProtectedRoute>,
  },
  { path: "/personnes", element: <Navigate to="/famille" replace /> },
  {
    path: "/historique",
    element: <ProtectedRoute allowedRoles={["parent", "user"]}><IntakeHistoryPage /></ProtectedRoute>,
  },
  {
    path: "/mes-produits/nouveau",
    element: <ProtectedRoute allowedRoles={["parent", "user"]}><CustomProductPage /></ProtectedRoute>,
  },
  {
    path: "/parametres",
    element: <ProtectedRoute allowedRoles={["parent", "user"]}><UserSettingsPage /></ProtectedRoute>,
  },

  // Espace Agent de Terrain (pas d'accès aux dossiers médicaux ni association)
  { path: "/agent", element: <Navigate to="/agent/familles" replace /> },
  {
    path: "/agent/familles",
    element: <ProtectedRoute allowedRoles={["field_agent"]}><FieldAgentLayout><FieldAgentFamiliesPage /></FieldAgentLayout></ProtectedRoute>,
  },
  {
    path: "/agent/validation",
    element: <ProtectedRoute allowedRoles={["field_agent"]}><FieldAgentLayout><FieldAgentValidationPage /></FieldAgentLayout></ProtectedRoute>,
  },
  {
    path: "/agent/profil",
    element: <ProtectedRoute allowedRoles={["field_agent"]}><FieldAgentLayout><FieldAgentProfilePage /></FieldAgentLayout></ProtectedRoute>,
  },

  // Espace Soignant & Super Soignant (l'admin n'a PAS accès aux dossiers médicaux)
  {
    path: "/soignant",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]}><CaregiverLayout><DashboardPage /></CaregiverLayout></ProtectedRoute>,
  },
  { path: "/soignant/dashboard", element: <Navigate to="/soignant" replace /> },
  {
    path: "/soignant/personnes",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]}><CaregiverLayout><FollowedPersonsPage /></CaregiverLayout></ProtectedRoute>,
  },
  {
    path: "/soignant/personnes/:personId",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]}><CaregiverLayout><PersonFilePage /></CaregiverLayout></ProtectedRoute>,
  },
  {
    path: "/soignant/personnes/:personId/evaluation",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]}><CaregiverLayout><NewEvaluationPage /></CaregiverLayout></ProtectedRoute>,
  },
  {
    path: "/soignant/personnes/:personId/plan",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]}><CaregiverLayout><IntakePlanPage /></CaregiverLayout></ProtectedRoute>,
  },
  {
    path: "/soignant/notifications",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]}><CaregiverLayout><NotificationsPage /></CaregiverLayout></ProtectedRoute>,
  },
  { path: "/soignant/parametres", element: <Navigate to="/soignant/parametres/notifications" replace /> },
  {
    path: "/soignant/parametres/notifications",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]}><CaregiverLayout><NotificationSettingsPage /></CaregiverLayout></ProtectedRoute>,
  },

  // Supervision Super Soignant & Droits délégués
  {
    path: "/soignant/supervision/patients",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]} requiredPermission="patients.read_all"><CaregiverLayout><SupervisionPatientsPage /></CaregiverLayout></ProtectedRoute>,
  },
  {
    path: "/soignant/supervision/association",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]} requiredPermission="patients.assign"><CaregiverLayout><SupervisionAssociationPage /></CaregiverLayout></ProtectedRoute>,
  },
  {
    path: "/soignant/supervision/validation",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]} requiredPermission="staff.validate"><CaregiverLayout><SupervisionValidationPage /></CaregiverLayout></ProtectedRoute>,
  },
  {
    path: "/soignant/supervision/delegations",
    element: <ProtectedRoute allowedRoles={["caregiver", "super_caregiver"]} requiredPermission="permissions.manage"><CaregiverLayout><SupervisionDelegationsPage /></CaregiverLayout></ProtectedRoute>,
  },

  // Administration (Zéro donnée médicale)
  {
    path: "/",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminDashboardPage /></AdminLayout></ProtectedRoute>,
  },
  { path: "/admin", element: <Navigate to="/" replace /> },
  {
    path: "/verifications",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminVerifyPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/comptes",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminAccountsPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/base-aliments",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminFoodsPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/base-aliments/nouveau",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminFoodNewPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/base-aliments/import",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminImportPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/produits-reference",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminProductsPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/prix",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminPricesPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/optimisation",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminOptimPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/modules",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminModulesPage /></AdminLayout></ProtectedRoute>,
  },
  {
    path: "/notifications",
    element: <ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminNotificationsPage /></AdminLayout></ProtectedRoute>,
  },
  { path: "*", element: <Navigate to="/dev/catalog" replace /> },
];
