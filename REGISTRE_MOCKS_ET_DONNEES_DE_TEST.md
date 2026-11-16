# Registre des Données Factices (Mocks) et Données de Test

**Projet** : TSOTSA for KIDS  
**Règle contractuelle** : AGENTS.md - Règle 3 (Zéro Mock dans le code applicatif)  
**Date d'audit & assainissement** : 15 novembre 2026  

---

## 1. Inventaire des Mocks Détectés et Statut d'Élimination

| ID | Composant / Fichier | Donnée factice identifiée | Comportement trompeur | Action corrective appliquée | Statut |
|---|---|---|---|---|---|
| **MOCK-01** | `apps/mobile/app/u-google.tsx` | `"parent.demo@gmail.com"` & jeton codé en dur `"demo-google-id-token"` | L'application simulait un compte Google fictif qui échouait côté API avec l'erreur `Wrong number of segments in token`. | Suppression du compte démo. Branchement sur le SDK Google Sign-In natif avec vérification de configuration et lien de repli propre vers l'authentification e-mail / téléphone. | ✅ **ÉLIMINÉ** |
| **MOCK-02** | `apps/mobile/app/u-persons.tsx` | Enfant factice `"Amina"` (`demo-amina`, 23 mois, CMA de démo) et `"Moi-même"` (`demo-myself`) | Lorsque l'API renvoyait une liste vide `[]`, le mobile injectait ces deux faux profils dans l'interface au lieu d'afficher l'état vide réel. | Suppression de l'injection factice. Remplacement par un composant d'état vide conforme (`empty-persons-state`) invitant à ajouter le premier vrai enfant. | ✅ **ÉLIMINÉ** |
| **MOCK-03** | `apps/mobile/src/features/persons/personsService.ts` | Données de secours codées en dur dans `fetchFamilyMembers()` | En cas de déconnexion ou de base vide, le service retournait Amina au lieu d'un tableau vide `[]`. | Suppression totale du tableau de fallback factice. Retourne `[]` réel et laisse l'UI afficher l'état vide. | ✅ **ÉLIMINÉ** |
| **MOCK-04** | `apps/mobile/app/s-pending.tsx` | Libellé d'établissement `"CMA de démo ✓"` codé en dur | Faisait croire à un rattachement à un faux centre de santé dans l'espace soignant en attente. | Remplacement par le libellé institutionnel `"Structure de rattachement ✓"` en attendant la sélection de la vraie structure. | ✅ **ÉLIMINÉ** |
| **MOCK-05** | `apps/mobile/app/u-email.tsx` | Omission du champ obligatoire `display_name` | L'inscription e-mail envoyait un objet incomplet `{ email, password }` provoquant une erreur HTTP 422 `Request validation failed`. | Ajout du champ `Nom complet / Prénom` (`display_name`) conforme au schéma FastAPI `EmailRegisterRequest`. | ✅ **CORRIGÉ** |

---

## 2. Données de Test Autorisées (Confinement Strict aux Répertoires de Tests)

Conformément à la règle 3 d'AGENTS.md, aucune donnée de test ne subsiste dans `apps/mobile/app/` ni dans `apps/mobile/src/features/**/` hors des dossiers `__tests__/`.

Les seules données de test subsistantes sont confinées dans les suites de tests unitaires et d'intégration :
- `apps/mobile/src/features/auth/__tests__/EmailScreen.test.tsx` : `nouveau@tsotsa.org`, `Nouveau Parent`
- `apps/mobile/src/features/persons/__tests__/personsService.test.ts` : bouchons réseau `fetch` temporaires pour tests unitaires hors ligne
- `apps/api/tests/` : fixtures de test SQLite/MySQL temporaires isolées créées et détruites par pytest

---

## 3. Preuve de Persistance en Base MySQL de Production

À compter de ce déploiement :
1. La base MySQL `tsotsa_prod` hébergée sur le VPS `51.89.148.92` contient **0 utilisateur mocké**.
2. Tout compte créé depuis l'application Android est persisté directement dans la table MySQL `users` (avec son `id` UUID v7, son `display_name`, sa date de création UTC) et dans la table `user_identities` (avec son mot de passe haché par Bcrypt).
3. L'administrateur peut visualiser et vérifier immédiatement chaque enregistrement en temps réel sur `https://www.tsotsa-for-kids.com/db-admin/`.

