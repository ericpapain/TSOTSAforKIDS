# Modèle de Données — Module Santé et Bien-être de l'Enfant

**Date de création** : 16 novembre 2026  
**Référence** : Conception et implémentation du suivi longitudinal de santé dans TSOTSA for KIDS  

---

## 1. Principes et Architecture du Modèle

Le module **Santé et Bien-être de l'Enfant** introduit un suivi événementiel et longitudinal des symptômes et observations médicales, décorrélé mais pouvant s'associer à l'administration des repas nutritionnels (`intakes`).

### Règles d'Intégrité et de Traçabilité
1. **Identifiants immuables** : Clés primaires en UUID version 7 (`BINARY(16)` sous MySQL 8, avec représentation `String(36)` sous SQLite pour les suites de tests).
2. **Cloisonnement strict** : Les déclarations des familles (`health_events`, `health_event_symptoms`) sont distinctes des évaluations cliniques des soignants (`clinical_assessments`).
3. **Non-suppression physique** : Tout événement de santé fait partie intégrante de l'archive médicale de l'enfant et ne subit jamais de suppression en cascade lors d'opérations sur les comptes utilisateurs.
4. **Orientation non diagnostique** : Le système qualifie des priorités d'orientation et de surveillance sans jamais émettre de diagnostic médical automatisé.

---

## 2. Dictionnaire des Tables

### Table `symptom_catalog` (Référentiel des symptômes et critères)
Catalogue paramétrable des symptômes déclarables, de leurs questions conditionnelles et des drapeaux d'urgence vitale.

| Colonne | Type MySQL | Nullable | Description |
|---|---|:---:|---|
| `code` | `VARCHAR(50)` | Non (PK) | Identifiant unique du symptôme (`fever`, `cough`, `convulsions`...). |
| `category` | `VARCHAR(50)` | Non | Famille (`general`, `respiratory`, `digestive`, `skin`, `pain`, `danger_sign`). |
| `label_fr` | `VARCHAR(150)` | Non | Libellé en français rassurant et accessible aux familles. |
| `label_en` | `VARCHAR(150)` | Non | Libellé en anglais. |
| `is_danger_sign` | `BOOLEAN` | Non | Indicateur de signe de danger déclenchant l'alerte d'orientation d'urgence immédiate. |
| `conditional_questions` | `JSON` | Oui | Structure des précisions demandées (température, selles/jour, etc.). |
| `display_order` | `INT` | Non | Ordre d'affichage dans les interfaces. |
| `is_active` | `BOOLEAN` | Non | Activation du symptôme dans le catalogue. |
| `created_at` | `DATETIME(3)` | Non | Horodatage de création UTC. |

### Table `health_events` (Événements de santé longitudinaux)
Enregistrement principal de chaque signalement émis pour un enfant.

| Colonne | Type MySQL | Nullable | Description |
|---|---|:---:|---|
| `id` | `BINARY(16)` | Non (PK) | UUIDv7 de l'événement. |
| `person_id` | `BINARY(16)` | Non (FK) | Référence vers l'enfant suivi (`persons.id`). |
| `reported_by` | `BINARY(16)` | Non (FK) | Référence vers l'utilisateur déclarant (`users.id`). |
| `organization_id` | `BINARY(16)` | Oui (FK) | Établissement ou structure de rattachement (`organizations.id`). |
| `intake_id` | `BINARY(16)` | Oui (FK) | Référence optionnelle vers la prise alimentaire (`intakes.id`). |
| `declaration_context` | `VARCHAR(30)` | Non | Contexte d'émission (`standalone`, `during_meal`). |
| `status` | `VARCHAR(30)` | Non | Statut du suivi (`submitted`, `under_review`, `action_taken`, `closed`). |
| `priority` | `VARCHAR(20)` | Non | Priorité clinique (`normal`, `attention`, `high`, `urgent`). |
| `comment` | `VARCHAR(1000)`| Oui | Observations libres rédigées par l'auteur. |
| `created_at` | `DATETIME(3)` | Non | Date et heure de déclaration UTC. |
| `updated_at` | `DATETIME(3)` | Non | Date de dernière mise à jour UTC. |

### Table `health_event_symptoms` (Détail des symptômes rattachés)
Liaison entre un événement de santé et un ou plusieurs symptômes constatés avec durée et métriques.

| Colonne | Type MySQL | Nullable | Description |
|---|---|:---:|---|
| `id` | `BINARY(16)` | Non (PK) | UUIDv7 de la ligne de symptôme. |
| `health_event_id` | `BINARY(16)` | Non (FK) | Référence de l'événement (`health_events.id`). |
| `symptom_code` | `VARCHAR(50)` | Non (FK) | Code du symptôme (`symptom_catalog.code`). |
| `duration` | `VARCHAR(30)` | Non | Durée (`today`, `2_3_days`, `4_7_days`, `week_plus`, `weeks_plus`, `unknown`). |
| `duration_days` | `INT` | Oui | Nombre exact de jours si renseigné. |
| `recurrence_count` | `INT` | Oui | Nombre d'épisodes constatés. |
| `specific_metrics` | `JSON` | Oui | Valeurs numériques relevées (ex: `temp_value: 38.9`). |
| `created_at` | `DATETIME(3)` | Non | Horodatage de création UTC. |

### Table `clinical_assessments` (Évaluations professionnelles des soignants)
Dossier médical d'évaluation renseigné exclusivement par les médecins ou soignants autorisés.

| Colonne | Type MySQL | Nullable | Description |
|---|---|:---:|---|
| `id` | `BINARY(16)` | Non (PK) | UUIDv7 de l'évaluation médicale. |
| `health_event_id` | `BINARY(16)` | Non (FK) | Événement évalué (`health_events.id`). |
| `caregiver_id` | `BINARY(16)` | Non (FK) | Soignant ayant posé l'évaluation (`users.id`). |
| `clinical_notes` | `VARCHAR(2000)`| Non | Notes cliniques et observations médicales. |
| `suspected_condition`| `VARCHAR(100)`| Oui | Orientation clinique (ex: *Paludisme suspecté*, *Diarrhée aiguë*). |
| `requires_investigation`| `BOOLEAN` | Non | Drapeau signalant un besoin d'exploration (toux ou diarrhée > 14 jours). |
| `investigation_type`| `VARCHAR(100)`| Oui | Type d'investigation préconisé. |
| `assessed_at` | `DATETIME(3)` | Non | Horodatage de l'examen clinique UTC. |
| `created_at` | `DATETIME(3)` | Non | Horodatage d'enregistrement UTC. |

### Table `health_event_actions` (Journal des actions et clôtures)
Traçabilité complète des étapes opérationnelles et des orientations.

| Colonne | Type MySQL | Nullable | Description |
|---|---|:---:|---|
| `id` | `BINARY(16)` | Non (PK) | UUIDv7 de l'action. |
| `health_event_id` | `BINARY(16)` | Non (FK) | Événement concerné (`health_events.id`). |
| `actor_id` | `BINARY(16)` | Non (FK) | Utilisateur exécutant l'action (`users.id`). |
| `action_type` | `VARCHAR(50)` | Non | Nature de l'action (`note_added`, `clarification_requested`, `scheduled_control`, `referred_to_facility`, `care_recorded`, `closed`). |
| `details` | `VARCHAR(1000)`| Non | Détail explicatif de l'action menée. |
| `created_at` | `DATETIME(3)` | Non | Date et heure de l'action UTC. |
