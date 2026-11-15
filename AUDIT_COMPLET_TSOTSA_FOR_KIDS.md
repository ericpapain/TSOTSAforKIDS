# Rapport d'Audit Complet – TSOTSA for KIDS

**Date de réalisation** : 15 novembre 2026  
**Auditeur** : Responsable Technique & Architecture Système  
**Projet** : TSOTSA for KIDS (Système d'évaluation nutritionnelle pédiatrique & suivi de la malnutrition aiguë)  
**Version analysée** : Branche `chore/i18n-audit` (commit `0fcf9df`)  
**Statut de l'infrastructure** : Serveur VPS de production actif (`51.89.148.92`), domaine `https://www.tsotsa-for-kids.com`

---

## 1. Architecture Réellement Présente

L'architecture actuelle n'est pas une architecture distribuée complexe en microservices, mais un **monorepo modulaire conteneurisé** déployé sur un serveur VPS unique.

```
+-----------------------------------------------------------------------------------+
|                            CLIENTS UTILISATEURS                                  |
|                                                                                   |
|   [ Application Android Expo/RN ]           [ Application Web React/Vite ]       |
|      (apps/mobile, SDK 52)                     (apps/web, SPA React 18)          |
+------------------------------------+----------------------------------------------+
                                     |
                                     | HTTPS / TLS 1.3 (port 443)
                                     v
+-----------------------------------------------------------------------------------+
|                        SERVEUR VPS OVH (51.89.148.92)                            |
|                                                                                   |
|  [ Reverse Proxy Nginx Hôte ]                                                     |
|    - Certificat SSL Let's Encrypt (www.tsotsa-for-kids.com & tsotsa-for-kids.com) |
|    - Routage /api/ -> 127.0.0.1:8000 (FastAPI)                                    |
|    - Routage /db-admin/ -> 127.0.0.1:8080 (Adminer)                               |
|    - Routage / -> 127.0.0.1:3000 (Web SPA)                                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                   RÉSEAU DOCKER INTERNE (tsotsa-kids_default)               |  |
|  |                                                                             |  |
|  |  [ tsotsa-api-prod ]             [ tsotsa-mysql-prod ]   [ tsotsa-db-admin] |  |
|  |  FastAPI (Python 3.12)  ------>  MySQL 8.0 Community     Adminer 6.3.0      |  |
|  |  Port 8000 (interne)             Base: tsotsa_prod       Port 8080 (interne)|  |
|  |                                  55 tables réelles                          |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### A. Technologies et composants réels
- **Backend API (`apps/api`)** : Framework **FastAPI (Python 3.12)** avec SQLAlchemy 2 (mode asynchrone `asyncmy`), validation Pydantic v2. Architecture modulaire découpée en 4 domaines :
  - `identity` : authentification, utilisateurs, identités multiples, tokens JWT (access + refresh).
  - `nutrition` : référentiel nutritionnel, équivalences Plumpy'Nut/F-75/F-100, aliments locaux du Cameroun, intégration ORKG.
  - `persons` : dossiers enfants, consentements légaux horodatés, relations familiales, assignations soignants/médecins.
  - `notifications` : templates multilingues, rappels d'alimentation.
- **Frontend Web (`apps/web`)** : **React 18 + Vite + TypeScript + Tailwind CSS**. 3 espaces distincts : Famille (W01-W05), Soignant (W06-W11), Administrateur (W12-W16).
- **Application Mobile (`apps/mobile`)** : **Expo SDK 52 (React Native 0.76.7 + TypeScript)** avec Expo Router v4.
- **Client partagé (`packages/api-client`)** : Client typé OpenAPI (`openapi-fetch`) partagé entre Web et Mobile.
- **Base de données (`tsotsa-mysql-prod`)** : **MySQL 8.0.46**, volume persistant monté dans `/opt/tsotsa-kids/data/mysql`. 55 tables relationnelles créées par les 14 migrations Alembic.

---

## 2. Audit des Comptes et de l'Authentification

### A. Constat sur les données en base de données (MySQL)
L'interrogation directe de la table `users` et `user_identities` sur le serveur de production révèle :
- `SELECT COUNT(*) FROM users;` = **0 compte**.
- `SELECT COUNT(*) FROM user_identities;` = **0 identité**.
- **Conclusion** : La base de données en production ne contient **aucun compte fictif ni aucun faux utilisateur**. Elle est totalement vierge et prête à recevoir les vrais utilisateurs.

### B. Origine des faux comptes constatés sur smartphone
Si la base est vide, pourquoi l'application mobile affichait-elle des comptes et enfants factices ?
1. **Écran Google (`apps/mobile/app/u-google.tsx`)** :
   - L'écran affichait un bouton codé en dur : `Compte Google de démo (parent.demo@gmail.com)`.
   - Le clic appelait `authenticateWithGoogle("demo-google-id-token")`.
   - **Preuve Capture 4** : Ce faux token est rejeté par le serveur : `Wrong number of segments in token: b'demo-google-id-token'`.
2. **Écran Dossier Enfants (`apps/mobile/src/features/persons/personsService.ts:128-148` & `apps/mobile/app/u-persons.tsx:32-40`)** :
   - Présence d'un mécanisme de secours (« fallback ») : lorsque la requête vers le serveur renvoie une liste vide `[]` (ce qui est le cas normal pour un compte nouvellement créé), le code mobile injectait automatiquement deux faux enfants : `Amina` (`demo-amina`, badge "Démo", `CMA de démo`) et `Moi-même` (`demo-myself`).
3. **Écran Soignant en attente (`apps/mobile/app/s-pending.tsx:68`)** :
   - Le texte affichait en dur `CMA de démo ✓` au lieu de lire la structure sanitaire rattachée dans MySQL.

### C. Pourquoi l'inscription par E-mail a échoué (Preuve Capture 5)
Sur l'écran d'inscription e-mail mobile :
- L'utilisateur a saisi `ericpapainmezatio@gmail.com` et un mot de passe.
- L'écran a envoyé : `{ email: "...", password: "..." }`.
- Or, le schéma de validation backend `EmailRegisterRequest` (`apps/api/.../identity/schemas.py:74`) déclare :
  ```python
  display_name: Annotated[str, Field(min_length=2, max_length=150)]
  ```
  Ce champ est **obligatoire**. L'écran mobile ne demandait pas le nom et envoyait `undefined`.
- Le backend a renvoyé l'erreur HTTP 422 : `Field required: display_name`, affichée sur le smartphone sous le libellé brut `Request validation failed`.

### D. Piège des tests unitaires mobiles existants
L'audit du répertoire `apps/mobile/src/features/**/__tests__/` met en évidence une anomalie méthodologique majeure : plusieurs tests unitaires existants vérifiaient expressément la présence de ces faux textes (ex: `expect(getByText("CMA de démo ✓")).toBeTruthy()`, `expect(getByText("Demo Google account")).toBeTruthy()`, `expect(members[0].first_name).toBe("Amina")`).
Pour assainir l'application et supprimer définitivement les données factices en production, ces tests doivent être mis à jour pour valider les comportements réels (données issues de l'API et affichage de l'état vide `empty-persons-state`).

---

## 3. Audit du Chemin Android -> API -> MySQL

| Étape du flux | Fichier / Composant | Statut | Observations & Preuves |
|---|---|---|---|
| **1. Mobile UI** | `apps/mobile/app/u-email.tsx` | ⚠️ Incomplet | Manque le champ `Nom complet`. |
| **2. Envoi HTTP** | `apps/mobile/src/features/auth/authService.ts` | ✅ Connecté | Envoie la requête POST en HTTPS vers `https://www.tsotsa-for-kids.com/api`. |
| **3. Réseau & SSL** | Nginx VPS (`51.89.148.92:443`) | ✅ Opérationnel | Certificat SSL valide (Let's Encrypt), transmission au conteneur API. |
| **4. Validation API** | `tsotsa_api/modules/identity/router.py` | ✅ Actif | Pydantic intercepte la requête et bloque les requêtes non conformes. |
| **5. Hachage Bcrypt** | `tsotsa_api/core/security.py` | ✅ Conforme | Hachage sécurisé Bcrypt (12 rounds) avec sel unique. |
| **6. Écriture MySQL** | `tsotsa_api/modules/identity/repository.py` | ✅ Conforme | Requête SQL INSERT transactionnelle dans `users` et `user_identities`. |
| **7. Persistance** | Table MySQL `tsotsa_prod.users` | ✅ Prêt | Volume Docker persistant, intégrité référentielle par clés étrangères. |

---

## 4. Audit de l'Infrastructure VPS OVH

- **Hôte** : VPS OVHcloud VPS-3 (51.89.148.92), Ubuntu 24.04 LTS.
- **Accès SSH** : Clé privée ED25519 (`~/.ssh/id_ed25519`), utilisateur `ubuntu`, port 22.
- **Reverse Proxy** : Nginx 1.28.3 gérant le SSL/TLS 1.3 avec Let's Encrypt.
- **Conteneurs Docker actifs** :
  1. `tsotsa-mysql-prod` : MySQL 8.0, port `127.0.0.1:3306` (accès externe interdit).
  2. `tsotsa-api-prod` : FastAPI Uvicorn, port `127.0.0.1:8000`.
  3. `tsotsa-web-prod` : Nginx statique SPA Web, port `127.0.0.1:3000`.
  4. `tsotsa-db-admin-prod` : Adminer 6.3.0, port `127.0.0.1:8080`, exposé sur `https://www.tsotsa-for-kids.com/db-admin/`.
- **Sauvegardes** : Volume local `/opt/tsotsa-kids/data/mysql` persistant, script de dump exportable.

---

## 5. Tableau de Vérité des Fonctionnalités

| Fonctionnalité | Écran (Mobile / Web) | Backend API | MySQL | Test Réel | Statut |
|---|---|---|---|---|---|
| **Inscription E-mail** | Mobile `u-email.tsx` / Web `/inscription` | `/v1/auth/email/register` | Table `users` + `user_identities` | Échoué (manque `display_name`) | **PARTIELLEMENT FONCTIONNEL** |
| **Connexion E-mail** | Mobile `u-email.tsx` / Web `/connexion` | `/v1/auth/email/login` | Vérification Bcrypt en base | Validé par tests d'intégration | **FONCTIONNEL ET TESTÉ** |
| **Authentification Google** | Mobile `u-google.tsx` | `/v1/auth/google` | Table `user_identities` (provider=google) | Faux token envoyé | **SIMULÉ / MOCK** |
| **Authentification Téléphone (SMS)** | Mobile `u-phone.tsx` | `/v1/auth/phone/request` | Table `otp_codes` | Code en log serveur | **PARTIELLEMENT FONCTIONNEL** |
| **Déconnexion** | Mobile Drawer / Web Header | `/v1/auth/logout` | Révocation table `refresh_tokens` | Validé | **FONCTIONNEL ET TESTÉ** |
| **Accès Base de Données** | Web `https://www.tsotsa-for-kids.com/db-admin/` | Direct MySQL 3306 | Base `tsotsa_prod` (55 tables) | Validé en direct | **FONCTIONNEL ET TESTÉ** |
| **Catalogue Aliments Locaux** | Web `/nutrition` / Mobile `u-dropdown` | `/v1/nutrition/foods` | Tables `foods`, `food_nutrient_values` | Validé | **FONCTIONNEL ET TESTÉ** |
| **Produits Thérapeutiques (F-75, F-100, Plumpy)** | Web `/produits` / Mobile `u-f75` | `/v1/nutrition/products` | Tables `products`, `product_nutrient_values`| Validé | **FONCTIONNEL ET TESTÉ** |
| **Moteur d'Équivalence Nutritionnelle** | Web `/nutrition` / API module | `/v1/nutrition/equivalences` | Calcul Z-scores et composition | 100% couverture de tests | **FONCTIONNEL ET TESTÉ** |
| **Dossier Enfants (Liste)** | Mobile `u-persons.tsx` / Web `/soignant/patients` | `/v1/family/members` | Tables `persons`, `person_links` | Fallback mock sur mobile | **PARTIELLEMENT FONCTIONNEL** |
| **Nouvelle Admission Enfant** | Web Modal `NewAdmissionModal` | `/v1/persons/admissions` | Table `persons` + `evaluations` | Validé Web (8 tests) | **FONCTIONNEL ET TESTÉ** |
| **Calcul Scores OMS (Z-scores)** | Web / Mobile / API | `/v1/evaluations/calculate` | Tables `growth_references` (OMS) | Validé (100% couverture) | **FONCTIONNEL ET TESTÉ** |
| **Accréditation Soignant** | Mobile `s-pending.tsx` | `/v1/caregivers/verify` | Tables `caregiver_profiles` | Écran statique "CMA de démo" | **SIMULÉ / MOCK** |

---

## 6. Plan d'Action Immédiat (Assainissement & Connexion Réelle)

1. **Suppression définitive des mocks dans l'application mobile** :
   - Retirer le fallback vers `Amina` et `Moi-même` dans `personsService.ts` et `u-persons.tsx`. Remplacer par un écran vide élégant avec bouton « Ajouter un enfant ».
   - Retirer le bouton factice `parent.demo@gmail.com` et l'envoi de `"demo-google-id-token"`.
   - Retirer le texte statique `CMA de démo ✓` dans l'écran soignant.
2. **Alignement du formulaire d'inscription mobile (`u-email.tsx`)** :
   - Ajouter le champ obligatoire `Nom complet / Prénom` (`display_name`) sur l'écran d'inscription.
   - Transmettre ce champ à l'API `/v1/auth/email/register`.
3. **Génération d'un nouvel APK et validation de bout en bout** :
   - Recompiler l'application Android avec EAS Build.
   - Vous installez la mise à jour, vous créez votre compte réel avec votre e-mail `ericpapainmezatio@gmail.com` et votre nom.
   - Vous ouvrez [https://www.tsotsa-for-kids.com/db-admin/](https://www.tsotsa-for-kids.com/db-admin/) et vous voyez immédiatement votre compte apparaître en direct dans la table `users`.
