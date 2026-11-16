# Rapport d'audit de l'internationalisation (FR / EN) — TSOTSA Kids

Date de l'audit : 10 novembre 2026  
Branche : `chore/i18n-audit`  
Auteur : Antigravity (Pair Programming TSOTSA Kids)  
Référent médical : Prof. Félicité Ngeufack  

---

## 1. Vue d'ensemble et état des catalogues

La plateforme TSOTSA Kids (API FastAPI, Web React 18, Mobile Expo et package partagé `@tsotsa/i18n`) est entièrement internationalisée en français (langue de référence) et en anglais.

- **Nombre total de clés traduites** : 1 083 clés (1 083 en français, 1 083 en anglais).
- **Parité stricte** : 100 % des clés et des variables interpolées `{{var}}` sont identiques entre `fr` et `en` (validé par `scripts/check_i18n.ts`).
- **Règle ESLint `i18next/no-literal-string`** : active en mode `error` sur l'ensemble de `apps/web/src` et `apps/mobile/app`.

### Nombre de clés par namespace

| Namespace | Nombre de clés | Périmètre fonctionnel |
|---|---|---|
| `admin` | 298 | Administration, import ORKG, validation d'aliments, comptes, prix, modules |
| `auth` | 11 | Connexion, inscription, sélection de rôles, déconnexion |
| `caregiver` | 153 | Espace soignant, liste patients, dossiers, plans de prises, alertes |
| `common` | 73 | Composants d'interface génériques, en-tête, navigation, boutons, sélecteur de langue |
| `errors` | 34 | Codes d'erreur API normalisés et messages d'erreur génériques |
| `medical` | 33 | Notices de produits cliniques, seuils OMS, scores z-score, PB, œdèmes, diagnostics |
| `mobile` | 294 | Écrans mobiles M01 à M31, flux d'onboarding, consentements, rappels locaux |
| `notifications` | 40 | Centre de notifications, réglages des alertes, plages d'heures calmes |
| `nutrition` | 147 | Produits de référence, aliments équivalents, nutriments essentiels, détails nutritionnels |
| **Total** | **1 083** | **Couverture bilingue exhaustive** |

---

## 2. Écrans audités et vérifiés en anglais

### Application Web (W01–W20)
Tous les écrans web ont été vérifiés via les tests Playwright (`apps/web/e2e/capture-i18n-en.spec.ts`) avec des captures plein écran générées dans [`docs/i18n/captures/`](file:///docs/i18n/captures/) :

| Code | Écran | Fichier capture généré | Statut |
|---|---|---|---|
| **W01** | Nutrition & Équivalents locaux | `W01_w_nutrition_en.png` | Conforme |
| **W02** | Tableau de bord soignant | `W02_s_dashboard_en.png` | Conforme |
| **W03** | Liste des personnes suivies | `W03_s_list_en.png` | Conforme |
| **W04** | Fiche personne suivie | `W04_s_file_en.png` | Conforme |
| **W05** | Nouvelle évaluation nutritionnelle | `W05_s_eval_en.png` | Conforme |
| **W06** | Fiche mise à jour | `W06_s_file_updated_en.png` | Conforme |
| **W07** | Plan de prises nutritionnelles | `W07_s_plan_en.png` | Conforme |
| **W08** | Centre de notifications soignant | `W08_s_notif_en.png` | Conforme |
| **W09** | Réglages des notifications soignant | `W09_s_notif_settings_en.png` | Conforme |
| **W10** | Tableau de bord administrateur | `W10_a_dashboard_en.png` | Conforme |
| **W11** | Validation des professionnels | `W11_a_verify_en.png` | Conforme |
| **W12** | Gestion des comptes | `W12_a_accounts_en.png` | Conforme |
| **W13** | Base d'aliments et import | `W13_a_import_en.png` | Conforme |
| **W14** | Création manuelle d'aliment | `W14_a_food_new_en.png` | Conforme |
| **W15** | Prévisualisation d'import CSV/Excel | `W15_a_import_preview_en.png` | Conforme |
| **W16** | Produits nutritionnels de référence | `W16_a_products_en.png` | Conforme |
| **W17** | Gestion des prix régionaux | `W17_a_prices_en.png` | Conforme |
| **W18** | Optimisation et pondérations | `W18_a_optim_en.png` | Conforme |
| **W19** | Gestion des modules | `W19_a_modules_en.png` | Conforme |
| **W20** | Centre d'alertes administrateur | `W20_a_notif_en.png` | Conforme |

### Application Mobile (M01–M31)
Les 31 écrans mobiles sont couverts par la suite Jest dédiée (`screens_auth_persons_en.test.tsx`, `screens_products_en.test.tsx`, `screens_actions_settings_en.test.tsx`) :
- Aucune régression visuelle ou débordement sur les gabarits d'écrans de largeur 390 px.
- Gestion du sélecteur de langue (FR \| EN) dans l'accueil M01 et les réglages M28.
- Notifications locales hors ligne générées dans la langue de l'utilisateur avec actions traduites (`Given / Later / Not given`).

---

## 3. Clés médicales soumises à validation clinique

Les 33 clés du namespace `medical` sont répertoriées dans [`docs/i18n/relecture_medicale.md`](file:///docs/i18n/relecture_medicale.md).
Elles regroupent les éléments critiques à faire relire formellement par le référent médical avant mise en production publique :

1. **Notices des produits thérapeutiques** :
   - F-75 : *Stabilization therapeutic milk, administered in hospital under medical supervision.*
   - F-100 : *Rehabilitation therapeutic milk, administered under medical supervision.*
   - Plumpy'Nut : *Indicative nutritional equivalence. Does not replace a prescribed treatment.*
   - Plumpy'Sup : *Ready-to-use nutritional supplement. Does not replace medical follow-up.*
2. **Scores et seuils anthropométriques OMS** :
   - Périmètre brachial (MUAC) : seuils 115 mm et 125 mm.
   - Z-score poids-pour-taille / taille-pour-âge : seuils −2 et −3.
   - Suivi du gain pondéral quotidien : repère cible ≥ 5 g/kg/j.
3. **Classifications diagnostiques** :
   - Malnutrition aiguë sévère (MAS / SAM).
   - Malnutrition aiguë modérée (MAM).
   - Suivi post-MAS (Post-SAM follow-up).
4. **Alertes cliniques et décrochage de prise** :
   - Stagnation pondérale (+100 g sur 14 jours).
   - Prise thérapeutique sautée après 3 rappels consécutifs.

---

## 4. Respect du glossaire bilingue

L'audit a confirmé le respect intégral des conventions fixées dans [`packages/i18n/GLOSSAIRE.md`](file:///packages/i18n/GLOSSAIRE.md) :
- Le terme « prise » est systématiquement traduit par **« intake »** (ex: *intake plan*, *confirm an intake*, *missed intake*).
- « Soignant » est systématiquement rendu par **« caregiver »** (et non *health worker* ou *nurse*).
- « Évaluation » est traduit par **« assessment »**.
- Le terme « recette » au sens environnement technique est banni et transcrit par **« staging »**.
- Les acronymes internationaux standardisés MAS/SAM et MAM sont rigoureusement employés.

---

## 5. Limites connues et choix délibérés

1. **Noms des produits thérapeutiques sous licence** :
   - Les marques et dénominations standardisées (*F-75, F-100, Plumpy'Nut, Plumpy'Sup*) ne sont pas traduites, conformément aux protocoles OMS/UNICEF.
2. **Plats traditionnels et ingrédients indigènes** :
   - Les appellations locales camerounaises (*Gari digari, Condrès, Foléré, Ndolè, Koki...*) sont conservées à l'identique dans les catalogues anglais pour éviter toute confusion lors de la préparation familiale.
3. **Noms scientifiques et botaniques** :
   - Les taxons (*Arachis hypogaea, Moringa oleifera...*) restent en nomenclature latine internationale standardisée.
4. **Modèles de fichiers d'import (CSV / Excel)** :
   - Les identifiants techniques des colonnes attendues par le parseur backend (ex: `nom`, `categorie`, `energie_kcal_100g`) demeurent stables pour assurer la compatibilité ascendante avec les exports de données ORKG. Les infobulles, aides à la saisie et messages d'erreurs ligne par ligne sont en revanche intégralement bilingues.
5. **Langues nationales camerounaises** :
   - Les langues locales (Ewondo, Duala, Fulfulde...) ne sont pas encore intégrées à cette étape et feront l'objet d'extensions spécifiques lors des déploiements régionaux sur le terrain.

