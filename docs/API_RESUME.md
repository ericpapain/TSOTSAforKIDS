# Répertoire des Endpoints de l'API – TSOTSA Kids

Ce document recense l'intégralité des endpoints HTTP exposés par le serveur FastAPI (`apps/api`),
leur méthode, chemin d'accès, rôle requis et module métier associé.

**Nombre total d'endpoints** : 124

| Méthode | Chemin | Rôle Requis | Description | Module |
|---|---|---|---|---|
| `GET` | `/health` | Public | Health Check | `System` |
| `GET` | `/v1/` | Public | V1 Root | `Root` |
| `GET` | `/v1/admin/alert-rules` | Public | List Alert Rules | `Admin - Alert Rules` |
| `PATCH` | `/v1/admin/alert-rules/{rule_id}` | Public | Update Alert Rule | `Admin - Alert Rules` |
| `GET` | `/v1/admin/audit-logs` | Public | List Audit Logs | `Admin - Audit Logs` |
| `GET` | `/v1/admin/caregivers` | Public | Lister les soignants | `Administration` |
| `POST` | `/v1/admin/caregivers/{user_id}/approve` | Public | Approuver un soignant | `Administration` |
| `POST` | `/v1/admin/caregivers/{user_id}/reject` | Public | Refuser un soignant | `Administration` |
| `POST` | `/v1/admin/caregivers/{user_id}/request-document` | Public | Demander un document | `Administration` |
| `POST` | `/v1/admin/consents/text` | Public | Publish Consent Text | `Admin - Consents` |
| `GET` | `/v1/admin/custom-products` | Public | List Admin Custom Products | `admin-custom-products` |
| `POST` | `/v1/admin/custom-products/{product_id}/review` | Public | Review Custom Product | `admin-custom-products` |
| `POST` | `/v1/admin/food-imports` | Public | Upload Food Import File | `Admin - Food Imports` |
| `GET` | `/v1/admin/food-imports/template` | Public | Download Import Template | `Admin - Food Imports` |
| `POST` | `/v1/admin/food-imports/{batch_id}/execute` | Public | Execute Batch Import | `Admin - Food Imports` |
| `PUT` | `/v1/admin/food-imports/{batch_id}/mapping` | Public | Update Column Mapping | `Admin - Food Imports` |
| `POST` | `/v1/admin/food-imports/{batch_id}/review` | Public | Review Import Batch | `Admin - Food Imports` |
| `POST` | `/v1/admin/food-imports/{batch_id}/validate` | Public | Validate Batch Dry Run | `Admin - Food Imports` |
| `POST` | `/v1/admin/foods` | Public | Create Manual Food | `Admin - Food Imports` |
| `GET` | `/v1/admin/health-metrics` | Public | Indicateurs de santé globale de la plateforme | `Administration` |
| `POST` | `/v1/admin/modules` | Public | Create Platform Module | `Admin - Modules & Settings` |
| `PUT` | `/v1/admin/modules/{code}` | Public | Update Platform Module | `Admin - Modules & Settings` |
| `GET` | `/v1/admin/notification-templates` | Public | Lister les gabarits de messages | `Notifications` |
| `PATCH` | `/v1/admin/notification-templates/{id}` | Public | Mettre à jour un gabarit de message | `Notifications` |
| `GET` | `/v1/admin/notifications/log` | Public | Journal d'envoi des notifications | `Notifications` |
| `GET` | `/v1/admin/notifications/settings` | Public | Réglages globaux des notifications | `Administration` |
| `PUT` | `/v1/admin/notifications/settings` | Public | Mettre à jour les réglages globaux des notifications | `Administration` |
| `GET` | `/v1/admin/notifications/stats` | Public | Compteurs d'envois de notifications | `Notifications` |
| `GET` | `/v1/admin/notifications/templates` | Public | Lister les modèles de messages FR/EN | `Administration` |
| `PATCH` | `/v1/admin/notifications/templates/{template_id}` | Public | Mettre à jour un modèle de message | `Administration` |
| `POST` | `/v1/admin/organizations` | Public | Admin Create Organization | `Admin - Organizations & Regions` |
| `PUT` | `/v1/admin/organizations/{org_id}` | Public | Admin Update Organization | `Admin - Organizations & Regions` |
| `POST` | `/v1/admin/organizations/{org_id}/caregivers` | Public | Admin Attach Caregiver To Organization | `Admin - Organizations & Regions` |
| `GET` | `/v1/admin/orkg/comparisons` | Public | List Orkg Comparisons | `Admin - ORKG Sync` |
| `GET` | `/v1/admin/orkg/snapshots` | Public | List Orkg Snapshots | `Admin - ORKG Sync` |
| `POST` | `/v1/admin/orkg/sync` | Public | Trigger Orkg Sync | `Admin - ORKG Sync` |
| `GET` | `/v1/admin/pricing/records` | Public | List Price Records | `Admin - Pricing` |
| `POST` | `/v1/admin/pricing/records` | Public | Create Price Record | `Admin - Pricing` |
| `GET` | `/v1/admin/pricing/records/{record_id}` | Public | Get Price Record | `Admin - Pricing` |
| `GET` | `/v1/admin/reference-products` | Public | List Admin Reference Products | `admin-reference-products` |
| `POST` | `/v1/admin/reference-products` | Public | Create Reference Product | `admin-reference-products` |
| `PUT` | `/v1/admin/reference-products/{product_id}` | Public | Update Reference Product | `admin-reference-products` |
| `POST` | `/v1/admin/reference-products/{product_id}/status` | Public | Update Reference Product Status | `admin-reference-products` |
| `POST` | `/v1/admin/regions` | Public | Admin Create Region | `Admin - Organizations & Regions` |
| `PUT` | `/v1/admin/regions/{region_id}` | Public | Admin Update Region | `Admin - Organizations & Regions` |
| `GET` | `/v1/admin/settings` | Public | List Application Settings | `Admin - Modules & Settings` |
| `PUT` | `/v1/admin/settings/{key}` | Public | Update Application Setting | `Admin - Modules & Settings` |
| `GET` | `/v1/admin/users` | Public | Lister les comptes | `Administration` |
| `POST` | `/v1/admin/users` | Public | Créer directement un compte avec invitation | `Administration` |
| `POST` | `/v1/admin/users/{user_id}/reactivate` | Public | Réactiver un compte | `Administration` |
| `POST` | `/v1/admin/users/{user_id}/suspend` | Public | Suspendre un compte | `Administration` |
| `GET` | `/v1/alerts` | Public | List Alerts | `Clinical Alerts` |
| `POST` | `/v1/alerts/{alert_id}/handle` | Public | Handle Alert | `Clinical Alerts` |
| `POST` | `/v1/auth/email/login` | Public | Connexion par e-mail et mot de passe | `auth` |
| `POST` | `/v1/auth/email/register` | Public | Inscription par e-mail et mot de passe | `auth` |
| `POST` | `/v1/auth/email/verify` | Public | Vérification de l'adresse e-mail | `auth` |
| `POST` | `/v1/auth/google` | Public | Connexion Google Identity | `auth` |
| `POST` | `/v1/auth/invitations/accept` | Public | Accept Invitation | `Authentification - Invitations` |
| `GET` | `/v1/auth/invitations/verify` | Public | Verify Invitation | `Authentification - Invitations` |
| `POST` | `/v1/auth/logout` | Public | Déconnexion | `auth` |
| `GET` | `/v1/auth/me` | Public | Profil de l'utilisateur connecté | `auth` |
| `POST` | `/v1/auth/password/forgot` | Public | Demande de réinitialisation de mot de passe | `auth` |
| `POST` | `/v1/auth/password/reset` | Public | Réinitialisation du mot de passe | `auth` |
| `POST` | `/v1/auth/phone/request` | Public | Demande de code OTP par SMS | `auth` |
| `POST` | `/v1/auth/phone/verify` | Public | Validation du code OTP par SMS | `auth` |
| `POST` | `/v1/auth/refresh` | Public | Rafraîchissement des jetons | `auth` |
| `GET` | `/v1/caregiver/organizations/{org_id}/persons` | Public | List Caregiver Establishment Persons | `Caregiver - Followed Persons` |
| `GET` | `/v1/caregiver/organizations/{org_id}/persons/{person_id}` | Public | Get Caregiver Establishment Person | `Caregiver - Followed Persons` |
| `GET` | `/v1/consents/text` | Public | Get Active Consent Text | `Consents` |
| `POST` | `/v1/custom-products` | Public | Create Custom Product | `custom-products` |
| `GET` | `/v1/dashboard/metrics` | Public | Get Dashboard Metrics | `Caregiver Dashboard` |
| `GET` | `/v1/dashboard/persons` | Public | List Dashboard Persons | `Caregiver Dashboard` |
| `GET` | `/v1/dashboard/scheduled-evaluations` | Public | List Scheduled Evaluations | `Caregiver Dashboard` |
| `POST` | `/v1/device-tokens` | Public | Enregistrer un jeton push de téléphone | `Notifications` |
| `DELETE` | `/v1/device-tokens/{token}` | Public | Révoquer un jeton push | `Notifications` |
| `GET` | `/v1/family/members` | Public | List My Family Members | `Family - Followed Persons` |
| `POST` | `/v1/family/members` | Public | Create Family Member | `Family - Followed Persons` |
| `POST` | `/v1/family/members/invitations/accept` | Public | Accept Second Parent Invitation | `Family - Followed Persons` |
| `DELETE` | `/v1/family/members/{person_id}` | Public | Remove My Family Member | `Family - Followed Persons` |
| `GET` | `/v1/family/members/{person_id}` | Public | Get My Family Member | `Family - Followed Persons` |
| `PUT` | `/v1/family/members/{person_id}` | Public | Update My Family Member | `Family - Followed Persons` |
| `POST` | `/v1/family/members/{person_id}/care` | Public | Attach Person To Establishment | `Family - Followed Persons` |
| `POST` | `/v1/family/members/{person_id}/invite` | Public | Invite Second Parent | `Family - Followed Persons` |
| `GET` | `/v1/foods` | Public | Search Published Foods | `Foods` |
| `GET` | `/v1/foods/{food_id}` | Public | Get Published Food Detail | `Foods` |
| `GET` | `/v1/in-app-notifications` | Public | Centre de notifications de l'utilisateur | `Notifications` |
| `POST` | `/v1/in-app-notifications/{id}/read` | Public | Marquer une notification comme lue | `Notifications` |
| `POST` | `/v1/in-app-notifications/{id}/snooze` | Public | Reporter un rappel ('Plus tard' : +15 minutes) | `Notifications` |
| `POST` | `/v1/intakes` | Public | Record Intake | `Intakes` |
| `GET` | `/v1/modules` | Public | List Platform Modules | `Modules Registry` |
| `GET` | `/v1/notification-preferences` | Public | Récupérer ses préférences de notification | `Notifications` |
| `POST` | `/v1/notification-preferences` | Public | Configurer une préférence de notification | `Notifications` |
| `GET` | `/v1/nutrients` | Public | List Nutrients | `Nutrients` |
| `GET` | `/v1/nutrients/{code}` | Public | Get Nutrient | `Nutrients` |
| `POST` | `/v1/optimization/solve` | Public | Solve Ration Optimization | `Nutrition - Optimization (Futur)` |
| `GET` | `/v1/organizations` | Public | List Active Organizations | `Organizations` |
| `GET` | `/v1/organizations/{org_id}` | Public | Get Organization Detail | `Organizations` |
| `GET` | `/v1/organizations/{org_id}/persons` | Public | List Establishment Persons | `Organizations` |
| `POST` | `/v1/organizations/{org_id}/persons` | Public | Register Person In Establishment | `Organizations` |
| `GET` | `/v1/organizations/{org_id}/persons/{person_id}` | Public | Get Establishment Person | `Organizations` |
| `GET` | `/v1/persons/{person_id}/consent` | Public | Get Person Consent Status | `Person Consents` |
| `POST` | `/v1/persons/{person_id}/consent` | Public | Give Consent For Person | `Person Consents` |
| `POST` | `/v1/persons/{person_id}/consent/withdraw` | Public | Withdraw Consent For Person | `Person Consents` |
| `GET` | `/v1/persons/{person_id}/evaluations` | Public | List Person Evaluations | `Clinical - Evaluations` |
| `POST` | `/v1/persons/{person_id}/evaluations` | Public | Create Evaluation | `Clinical - Evaluations` |
| `GET` | `/v1/persons/{person_id}/evaluations/curves` | Public | Get Person Growth Curves | `Clinical - Evaluations` |
| `GET` | `/v1/persons/{person_id}/evaluations/latest` | Public | Get Latest Person Evaluation | `Clinical - Evaluations` |
| `GET` | `/v1/persons/{person_id}/intakes` | Public | List Person Intakes | `Intakes` |
| `GET` | `/v1/persons/{person_id}/intakes/compliance-rate` | Public | Get Intakes Compliance Rate | `Intakes` |
| `GET` | `/v1/persons/{person_id}/schedules` | Public | Lister les plans de prises d'un enfant | `Plans de prises` |
| `GET` | `/v1/pricing/foods/{food_id}/latest` | Public | Get Latest Food Price | `Pricing` |
| `GET` | `/v1/pricing/latest` | Public | Get Latest Price | `Pricing` |
| `GET` | `/v1/pricing/products/{product_id}/latest` | Public | Get Latest Product Price | `Pricing` |
| `GET` | `/v1/products` | Public (Produits publiés) | List Products | `products` |
| `GET` | `/v1/products/{id}/equivalents` | Public (Produits publiés) | Get Product Equivalents | `Nutrition - Equivalence` |
| `GET` | `/v1/products/{product_id}` | Public (Produits publiés) | Get Product | `products` |
| `GET` | `/v1/regions` | Public | List All Regions | `Regions` |
| `POST` | `/v1/schedules` | Public | Prescrire un plan de prises | `Plans de prises` |
| `DELETE` | `/v1/schedules/{id}` | Public | Annuler un plan de prises | `Plans de prises` |
| `GET` | `/v1/schedules/{id}` | Public | Détail d'un plan de prises | `Plans de prises` |
| `PATCH` | `/v1/schedules/{id}` | Public | Modifier un plan de prises | `Plans de prises` |
| `POST` | `/v1/sync/intakes` | Public | Sync Offline Intakes | `Intakes` |
| `GET` | `/v1/users/me/region` | Public | Get My Preferred Region | `User Preferences` |
| `PUT` | `/v1/users/me/region` | Public | Update My Preferred Region | `User Preferences` |
