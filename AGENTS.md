# Contrat d'Agent – Projet TSOTSA Kids

Ce document définit les règles absolues, l'architecture, les normes de qualité et la procédure d'exécution pour tout agent ou développeur travaillant sur le projet **TSOTSA Kids**.
Ce contrat doit être **relu au début de CHAQUE étape**.

---

## 1. Architecture

- **Monorepo** : structuré en dossiers racine clairs :
  - `apps/api` : serveur backend FastAPI (Python).
  - `apps/mobile` : application mobile native Expo (React Native + TypeScript).
  - `apps/web` : application web React 18 + Vite + TypeScript (Tailwind CSS).
  - `packages/api-client` : client API partagé en TypeScript (généré à partir d'OpenAPI).
  - `data` : gabarits de données, exports bruts ORKG, registres et dictionnaires.
  - `infra` : scripts et configuration de déploiement (Docker, Nginx).
  - `scripts` : scripts utilitaires de vérification qualité et maintenance.
  - `docs` : documentation technique, spécifications, références et modèles de données.

- **Serveur API (monolithe modulaire)** :
  - Un dossier par module métier dans `apps/api/src/modules/<module>/`.
  - Chaque module est strictement découpé en sous-couches :
    - `router` : endpoints HTTP FastAPI, injection de dépendances.
    - `service` : logique métier et orchestrations.
    - `repository` : accès aux données SQLAlchemy 2 (requêtes SQL/ORM).
    - `models` : modèles SQLAlchemy (tables MySQL).
    - `schemas` : modèles Pydantic pour validation des requêtes et réponses.
  - **Règle stricte d'isolation** : Un module n'importe **JAMAIS** le repository ou les modèles d'un autre module. Il communique **uniquement** via le service public de cet autre module.

---

## 2. Taille des fichiers et des fonctions

- **500 lignes MAXIMUM par fichier de code** (règle bloquante en CI).
- **Cible : 300 lignes maximum**. Si un fichier approche 300 lignes, le découper AVANT de continuer.
- **Une fonction : 50 lignes maximum**. Découper les fonctions longues en sous-fonctions explicites.
- **Exclusion** : Seuls les fichiers générés automatiquement (`packages/api-client/src/generated/*`) sont exclus de ce contrôle.

---

## 3. Zéro donnée inventée (Zero Mock)

- **Aucune donnée codée en dur dans le code applicatif** : pas de faux patients, de faux aliments, ni de faux prix.
- **Mots interdits** : `mock`, `fake`, `lorem`, `dummy` sont strictement interdits dans tout le code hors des dossiers de tests.
- **Localisation des données de test** : les données de test vivent uniquement dans les répertoires `tests/`, `__tests__/`, `e2e/`, ou dans des fichiers `.test.*` / `.spec.*`.
- **Répertoire officiel** : toute donnée de test ajoutée doit être explicitement documentée dans [`docs/DONNEES_DE_TEST.md`](file:///docs/DONNEES_DE_TEST.md).

---

## 4. Tests obligatoires à chaque étape

- **Serveur (`apps/api`)** :
  - `pytest` avec couverture globale et unitaire ≥ 80 % par module.
  - Couverture **100 % obligatoire** pour :
    - Le moteur d'équivalence nutritionnelle.
    - Le calcul des scores cliniques et z-scores OMS.
- **Web (`apps/web`)** :
  - Tests unitaires et composants : `Vitest` + `Testing Library`.
  - Tests de parcours bout en bout : `Playwright`.
- **Mobile (`apps/mobile`)** :
  - Tests unitaires et composants : `jest-expo` + `Testing Library React Native`.
  - Tests de parcours : `Maestro`.

---

## 5. Interfaces utilisateur

- Reproduire **à l'identique et au pixel près** :
  - Les prompts d'écrans `M00` à `M29` (mobile) et `W00` à `W16` (web) définis dans [`docs/TSOTSA_Kids_Prompts_Interfaces.md`](file:///docs/TSOTSA_Kids_Prompts_Interfaces.md).
  - Les images de référence disponibles dans `docs/references/mobile/` et `docs/references/web/`.
- **Aucune réinterprétation, aucun ajout créatif, aucune modification de palette ou d'espacement**.
- Respecter scrupuleusement la charte de couleurs, la police Carlito, et les composants réutilisables du système de design (prompt M00/W00).

---

## 6. Procédure de fin de tâche (OBLIGATOIRE à chaque étape)

À la fin de chaque étape, exécuter impérativement les actions suivantes dans l'ordre :

1. **Exécution des contrôles** :
   Exécuter `make check` et coller la sortie intégrale dans la réponse / PR.
2. **Correction des erreurs** :
   Si un contrôle échoue, corriger immédiatement et relancer `make check` jusqu'à obtenir un statut 100 % vert.
3. **Rédaction du rapport court** :
   - Fichiers créés ou modifiés (avec leur nombre exact de lignes).
   - Tests ajoutés (nombre, ce qu'ils vérifient).
   - Couverture mesurée.
   - Points spécifiques à faire valider par le Tech Lead.
   - Données de test ajoutées (et enregistrées dans `docs/DONNEES_DE_TEST.md`).
4. **Intégrité absolue des tests** :
   Ne JAMAIS écrire « terminé » si un test échoue, est sauté (`skip`) ou n'a pas été exécuté. Ne jamais désactiver ou affaiblir un test pour le faire passer.
5. **Gestion Git et Pull Request** :
   - Chaque étape est réalisée sur sa propre branche nommée `etape/<code>-<sujet>`.
   - Rédiger des commits atomiques et explicites.
   - Une fois `make check` vert, pousser la branche vers `origin`.
   - Ouvrir la pull request vers `main` avec GitHub CLI (`gh pr create` : titre = nom de l'étape, corps = rapport de fin de tâche).
   - Surveiller la CI avec `gh pr checks --watch` et attendre qu'elle soit verte.
   - **Interdiction formelle de pousser directement sur `main` ou de merger soi-même sa PR** : la revue et le merge sont effectués exclusivement par le Tech Lead.

---

## 7. Sécurité et protection des données de santé

- **Zéro secret dans Git** :
  - Fichiers `.env` non versionnés, ajoutés au `.gitignore`.
  - Fichiers `.env.example` versionnés avec variables présentes et valeurs vides.
- **Données de santé à caractère personnel** :
  - Consentement explicite obligatoire (horodaté et versionné dans la table `consents`).
  - Pseudonymisation systématique des personnes suivies (identifiants courts type `#A-014`).
  - Journal d'audit complet (`audit_log`) pour tout accès ou modification de données médicales.
  - Chiffrement TLS obligatoire pour toutes les connexions MySQL et HTTPS pour le web et l'API.

---

## 8. Langue et conventions de nommage

- **Code source et noms techniques en anglais** :
  - Variables, fonctions, classes, tables, colonnes, endpoints d'API, commits Git.
- **Textes utilisateur et documentation en français** :
  - Interfaces utilisateurs (mobile et web), messages d'erreur affichés, e-mails, SMS, documentation technique sous `docs/`.

---

## 9. Référentiel du modèle de données

- Le document de référence est [`docs/TSOTSA_Kids_Modele_Donnees.md`](file:///docs/TSOTSA_Kids_Modele_Donnees.md).
- Noms de tables, noms de colonnes, types MySQL 8 (`BINARY(16)` pour UUID v7, `DATETIME(3)` UTC, valeurs nutritionnelles en `DECIMAL(12,4)` pour 100 g).
- Versions et traçabilité (`version`, `is_current`, `deleted_at`).
- Tout écart ou évolution doit être formellement proposé et validé par le Tech Lead avant d'être codé.

---

## 10. Référentiel de configuration

- Le document de référence est [`docs/TSOTSA_Kids_Configuration.md`](file:///docs/TSOTSA_Kids_Configuration.md).
- Domaines officiels : `*.tsotsa-for-kids.com`.
- Noms exacts des variables d'environnement (API, Web, Mobile).
- Séparation stricte des privilèges MySQL :
  - `tsotsa_app` : accès applicatif standard (DML : SELECT, INSERT, UPDATE, DELETE).
  - `tsotsa_migrator` : migrations de schéma (DDL + DML).
  - `tsotsa_readonly` : requêtes en lecture seule pour reporting et audits.
- TLS obligatoire vers la base de données avec vérification du certificat CA OVH.
