# Registre des Mocks et Données de Test — Module Santé et Bien-être

## 1. Respect du Contrat « Zéro Donnée Inventée » (Zero Mock)

Conformément à la section 3 de `AGENTS.md` :
- **Aucune donnée inventée dans le code de production** : l'ensemble des catalogues de symptômes et structures de questions sont créés via migrations de schéma relationnelles officielles (`apps/api/migrations/versions/20261116_0017_module_health_events_symptoms.py`).
- **Aucun mot-clé interdit (`mock`, `fake`, `lorem`, `dummy`)** n'est présent dans `apps/api/src/`, `apps/web/src/` ou `apps/mobile/src/`.
- Le script de contrôle `python scripts/check_no_mock.py` a été exécuté avec succès : `[OK] Zero forbidden mock keywords found in application code.`

---

## 2. Données de Test Automatisées Utilisées

Toutes les données de test sont cantonnées aux dossiers de test (`apps/api/tests/`, `apps/web/src/**/__tests__/`, `apps/mobile/src/**/__tests__/`).

| Contexte / Fichier | Identifiants et Valeurs de Test | Finalité du Test |
| :--- | :--- | :--- |
| `apps/api/tests/test_health_models_and_schema.py` | Utilisateurs : `parent.health.test@tsotsa-for-kids.com`, `dr.health.eval@tsotsa-for-kids.com`. Enfant : `#P-HEALTH-001`. Symptômes : `danger_convulsions`, `danger_vomiting_all`, `fever`. | Validation de l'intégrité relationnelle MySQL 8 (clés étrangères, cascade ON DELETE, timestamps UTC, types JSON). |
| `apps/api/tests/test_health_api.py` | Utilisateurs : `Maman Aïcha`, `Papa Paul`, `Dr Mbarga`. Enfant : `Amina`. Établissement : `Hôpital Pédiatrique Yaoundé`. Diagnostic : `Gastro-entérite aiguë`. Traitement : `SRO`. | Validation des statuts HTTP (200, 201, 403), calcul automatique de criticité (`urgent`, `high`, `attention`), filtrage des alertes. |
| `apps/web/src/pages/health/__tests__/ChildHealthReportModal.test.tsx` | Enfant : `Amina`. Symptômes : `fever`, `danger_convulsions`. Questions : température `38.5`. Traitement : `Paracétamol`. | Vérification du wizard 5 étapes et de l'interception immédiate de l'alerte danger vital. |
| `apps/web/src/pages/health/__tests__/CaregiverHealthAlertsWidget.test.tsx` | Alertes de test avec statuts `active`, `acknowledged`, `resolved` et niveaux `urgent`, `high`, `attention`. | Vérification du rendu du widget, des badges de sévérité et de l'interaction d'ouverture du dossier. |
| `apps/mobile/src/features/health/__tests__/healthService.test.ts` | Événement local, clé de stockage `expo-secure-store`, simulation déconnexion / reconnexion. | Validation de la file d'attente hors-ligne et de la resynchronisation transparente. |
| `apps/mobile/src/features/health/__tests__/healthScreens.test.tsx` | Enfant : `Amina`. Sélection symptôme danger vital `danger_convulsions`. | Validation du rendu React Native et affichage immédiat de l'alerte d'urgence vitale. |
