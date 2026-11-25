# Audit Global de l'Application — TSOTSA for KIDS
**Date** : 23 Novembre 2026  
**Statut** : Audit en lecture seule (Phase 1 & Phase 2) — Zéro modification de code

---

## 1. Architecture Réellement Présente

- **Serveur API (`apps/api`)** : Monolithe modulaire FastAPI (Python 3.12/3.13), SQLAlchemy 2.0 asynchrone (`asyncmy`), migrations Alembic, validation Pydantic v2.
  - Découpage strict par domaine : `router`, `service`, `repository`, `models`, `schemas`.
  - 38 routeurs API enregistrés sous le préfixe `/v1`.
- **Application Web (`apps/web`)** : React 18, Vite 6, TypeScript, Tailwind CSS, i18next (FR/EN), React Router v6.
- **Application Mobile (`apps/mobile`)** : Expo SDK 52 (React Native), Expo Router, TypeScript, i18next.
- **Base de données** : MySQL 8.0 en conteneur Docker isolé sur VPS OVH (`51.89.148.92`), base `tsotsa_prod`, 58 tables créées.
- **Infrastructure de production** : Nginx reverse-proxy SSL (`*.tsotsa-for-kids.com`), conteneurs Docker `tsotsa-web-prod`, `tsotsa-api-prod`, `tsotsa-mysql-prod`.

---

## 2. Inventaire des Écrans et Pages

- **Application Web** : 32 pages et vues spécialisées :
  - *Authentification* : `/connexion` (Login + Inscription 5 profils).
  - *Espace Famille (Parent)* : `/famille` (Mes enfants), `/nutrition/produits/:id` (Calculateur d'équivalents), `/nutrition/historique` (Historique des repas), `/nutrition/mon-produit` (Produit perso), `/reglages` (Paramètres notifications).
  - *Espace Soignant* : `/soignant/tableau-de-bord`, `/soignant/patients`, `/soignant/admissions`, `/soignant/dossier/:id`, `/soignant/evaluations/nouvelle`, `/soignant/plans-de-prises`, `/soignant/alertes`, `/soignant/notifications`, `/soignant/reglages`.
  - *Espace Super-Soignant* : `/soignant/supervision/validations`, `/soignant/supervision/patients`, `/soignant/supervision/delegations`, `/soignant/supervision/associations`.
  - *Espace Agent de Terrain* : `/agent/familles`, `/agent/validations`, `/agent/profil`.
  - *Espace Administrateur* : `/admin/tableau-de-bord`, `/admin/comptes`, `/admin/aliments`, `/admin/produits`, `/admin/prix`, `/admin/import`, `/admin/optimisation`, `/admin/modules`, `/admin/notifications`, `/admin/audit`.
- **Application Mobile Android** : 36 écrans Expo Router sous `apps/mobile/app/`.

---

## 3. Synthèse des Boutons et Interactions (184 recensés)

- **Web** : 112 éléments interactifs (boutons d'action, formulaires, sélecteurs, modales).
- **Android** : 72 éléments interactifs (onglets de navigation, formulaires de saisie, sélecteurs de symptômes, boutons d'action rapide).

---

## 4. Diagnostic de Découplage Frontend vs Base de Données

| Fonctionnalité | Écran | Comportement Actuel | Risque / Diagnostic |
| :--- | :--- | :--- | :--- |
| **Ajout d'enfant** | `AddChildModal.tsx` | Enregistré dans `localStorage` (`userStore`) | ❌ Données perdues si cache vidé ou changement d'appareil. Non visible par le Super-Soignant. |
| **Validation enfant** | `SupervisionValidationPage.tsx` | Liste locale en mémoire | ❌ N'interroge pas `GET /v1/patients/pending`. |
| **Donner une prise (Repas)** | `ConfirmIntakeModal.tsx` | Enregistré dans `localStorage` | ❌ N'appelle pas `POST /v1/nutrition/intakes`. |
| **Signalement Santé** | `ChildHealthReportModal.tsx` | **100% Connecté à l'API & MySQL** | ✅ Enregistré dans `health_events` et `audit_log`, triage PCIME actif. |
| **Équivalences nutritionnelles** | `NutritionPage.tsx` | **100% Connecté à l'API** | ✅ Moteur d'optimisation backend actif. |
| **Connexion multi-profils** | `LoginPage.tsx` | **100% Connecté à l'API** | ✅ Sessions JWT, RBAC et redirection par profil. |

---

## 5. Données de Démonstration Identifiées

- **Dans le code frontend (`apps/web/src/features/user/userStore.ts`)** :
  - Enfants par défaut : `child-amina` et `child-hamadou`.
  - Prises de repas par défaut : `intake-1`, `intake-2`, `intake-3`.
- **Dans la base MySQL** :
  - Référentiels réels : 19 symptômes PCIME (`symptom_catalog`), 10 régions officielles du Cameroun (`regions`), 5 organisations sanitaires réelles (`organizations`).
  - Comptes utilisateurs réels de démonstration fonctionnelle : `parent@tsotsa-for-kids.com`, `soignant@tsotsa-for-kids.com`, `supersoignant@tsotsa-for-kids.com`, `agent@tsotsa-for-kids.com`, `admin@tsotsa-for-kids.com`.
