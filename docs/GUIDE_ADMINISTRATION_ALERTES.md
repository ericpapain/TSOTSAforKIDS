# Guide d'Administration — Moteur d'Alertes et Règles Cliniques

Ce guide décrit le paramétrage, les seuils de sévérité et les protocoles de routage des alertes de santé dans TSOTSA for KIDS.

---

## 1. Algorithme de Calcul de Sévérité

Le niveau de gravité d'un événement de santé est calculé par la méthode `calculate_severity` du service backend :

| Critères d'entrée | Niveau de Sévérité | Statut de l'Alerte | Priorité d'Action |
| :--- | :--- | :--- | :--- |
| Présence d'au moins 1 symptôme avec `is_danger_sign = True` | `urgent` | `active` | Notification immédiate + Alerte rouge |
| Somme cumulée des sévérités $\ge 5$ ou symptôme `severe` | `high` | `active` | Notification soignant sous 2 heures |
| Somme cumulée des sévérités entre $2$ et $4$ | `attention` | `active` | Revue lors de la tournée / consultation |
| Somme cumulée des sévérités $< 2$ | `low` | Aucune alerte générée | Enregistrement pour historique |

---

## 2. Catalogue des Symptômes et Signes de Danger

Le catalogue est initialisé via la migration Alembic `20261116_0017_module_health_events_symptoms.py` :
- **Signes de danger vital (`is_danger_sign = True`, sévérité `urgent`)** :
  - `danger_convulsions` : Convulsions / spasmes répétés.
  - `danger_lethargy` : Enfant léthargique, inconscient ou somnolent.
  - `danger_respiratory_distress` : Détresse respiratoire aiguë (tirage, geignement, battement des ailes du nez).
  - `danger_cannot_drink` : Incapable de boire ou de téter.
  - `danger_vomits_everything` : Vomit absolument tout ce qu'il ingère.
- **Symptômes fréquents** :
  - `fever` (Fièvre)
  - `diarrhea` (Diarrhée)
  - `vomiting` (Vomissements)
  - `cough` (Toux)
  - `fatigue` (Faiblesse / Léthargie modérée)
  - `skin_rash` (Éruptions / Lésions de la peau)
  - `anorexia` (Refus d'alimentation)

---

## 3. Rôles et Droits d'Administration

- **Soignants (`caregiver`)** : Peuvent consulter, acquitter et résoudre les alertes relatives aux patients qui leur sont assignés.
- **Super Soignants (`super_caregiver`)** : Accès global à toutes les alertes de l'établissement ou de la zone sanitaire, réassignation possible.
- **Administrateurs (`admin`)** : Gestion technique du catalogue de symptômes, consultation des journaux d'audit, sans accès direct aux dossiers médicaux individuels.
