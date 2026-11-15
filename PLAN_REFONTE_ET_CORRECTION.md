# Plan de Refonte, Assainissement et Validation – TSOTSA for KIDS

**Date d'élaboration** : 15 novembre 2026  
**Responsable** : Architecte Logiciel Senior & Lead Dev  
**Objectif** : Transition complète d'un prototype contenant des simulations vers une plateforme médicale pédiatrique 100 % opérationnelle, vérifiable et sécurisée.

---

## 1. Diagnostic Initial et Causes Racines

| Problème constaté | Diagnostic technique | Cause racine |
|---|---|---|
| Échec d'inscription e-mail | Code HTTP 422 `Request validation failed` sur mobile | Désynchronisation de schéma : FastAPI exigeait `display_name`, l'écran mobile ne demandait et n'envoyait que `email` et `password`. |
| Échec de connexion Google | Erreur `Wrong number of segments in token: b'demo-google-id-token'` | Présence d'un mock résiduel dans `apps/mobile/app/u-google.tsx` envoyant une chaîne statique au lieu d'un vrai JWT Google. |
| Affichage d'enfants factices (« Amina », « CMA de démo ») | Faux dossiers affichés sur un compte neuf | Présence d'un fallback dans `apps/mobile/app/u-persons.tsx` et `personsService.ts` générant ces profils dès que l'API renvoyait une liste vide `[]`. |
| Flou d'administration de la base MySQL | L'administrateur ne pouvait pas auditer les données | Base MySQL isolée dans le réseau privé Docker sans interface graphique d'inspection. |

---

## 2. Phases d'Exécution et Calendrier de Réalisation

### Phase 1 : Visibilité Totale et Audit Racine (Statut : ✅ TERMINÉ)
- Déploiement du conteneur sécurisé `tsotsa-db-admin-prod` (Adminer) sur le réseau Docker interne.
- Exposition sous HTTPS avec reverse proxy Nginx (`https://www.tsotsa-for-kids.com/db-admin/`).
- Rédaction de l'[Audit Complet](file:///c:/Users/mezat/Desktop/Famillle/Eric/Fidel/tsotsa_kids/AUDIT_COMPLET_TSOTSA_FOR_KIDS.md) et du [Guide d'Accès MySQL](file:///c:/Users/mezat/Desktop/Famillle/Eric/Fidel/tsotsa_kids/GUIDE_ACCES_BASE_DE_DONNEES_MYSQL.md).
- Constat partagé avec le porteur de projet : la base de données contient 0 faux compte.

### Phase 2 : Éradication Totale des Mocks et Réalignement API (Statut : ✅ TERMINÉ)
- Alignement du schéma d'inscription mobile avec FastAPI (`display_name` obligatoire ajouté).
- Suppression de l'envoi de faux jetons Google et bascule sur le SDK natif.
- Remplacement des enfants factices par un écran d'accueil vide explicite (`empty-persons-state`).
- Réécriture des tests unitaires et d'intégration mobiles : 36 suites sur 36 validées à 100 %.
- Rédaction du [Registre des Mocks et Données de Test](file:///c:/Users/mezat/Desktop/Famillle/Eric/Fidel/tsotsa_kids/REGISTRE_MOCKS_ET_DONNEES_DE_TEST.md).

### Phase 3 : Compilation et Validation Bout en Bout Android (Statut : ✅ TERMINÉ)
- Résolution du problème de bundling Hermes (`query-string` rétrogradé en version 7.1.3 sans drapeaux RegExp ES2024 non supportés).
- Compilation réussie du paquet Android APK sur EAS Build (Build `#f3d99c7a`).
- Rédaction du [Guide d'Utilisation Android](file:///c:/Users/mezat/Desktop/Famillle/Eric/Fidel/tsotsa_kids/GUIDE_UTILISATION_APPLICATION_ANDROID.md).

### Phase 4 : Parcours Cliniques et Module Nutritionnel (Statut : EN COURS)
- Test en direct de la création du premier dossier enfant réel par l'administrateur.
- Calcul en direct des équivalences nutritionnelles (Plumpy'Nut vs bouillies enrichies locales).
- Vérification du calcul des Z-scores OMS directement en base de données.
