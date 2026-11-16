# Documentation de l'API REST — Module Santé

Tous les endpoints sont préfixés par `/api/v1/health` et exigent une authentification JWT Bearer avec vérification des permissions RBAC.

---

## 1. Référentiel des Symptômes

### `GET /api/v1/health/symptoms`
Retourne le catalogue actif des symptômes classés par catégorie.
- **Permission** : Authentifié.
- **Réponse (200 OK)** :
```json
[
  {
    "id": "018d...",
    "code": "fever",
    "name_fr": "Fièvre",
    "name_en": "Fever",
    "category": "general",
    "severity_weight": 2,
    "is_danger_sign": false,
    "questions_schema": [
      { "id": "temp", "type": "number", "label_fr": "Température (°C)" }
    ]
  }
]
```

---

## 2. Événements de Santé de l'Enfant

### `POST /api/v1/health/events`
Crée un nouvel événement de santé pour un enfant.
- **Permission** : `patients.assess` ou parent rattaché à l'enfant.
- **Corps de requête** :
```json
{
  "person_id": "018d...",
  "occurred_at": "2026-11-16T14:30:00Z",
  "intake_log_id": null,
  "reporter_notes": "Enfant fébrile depuis ce matin",
  "treatments_given": "Paracétamol sirop 5ml",
  "symptoms": [
    {
      "symptom_id": "018d...",
      "severity_level": "moderate",
      "details": { "temp": 38.8 }
    }
  ]
}
```
- **Réponse (201 Created)** : L'événement créé avec calcul automatique de la sévérité et génération éventuelle d'une alerte.

### `GET /api/v1/health/persons/{person_id}/events`
Récupère la liste chronologique des événements d'un enfant.
- **Permission** : Soignant associé ou parent de l'enfant.

---

## 3. Évaluations et Décisions Médicales

### `POST /api/v1/health/events/{event_id}/assessments`
Enregistre un bilan clinique professionnel lié à un événement.
- **Permission** : `patients.assess` (Soignants et Super Soignants).
- **Corps de requête** :
```json
{
  "clinical_summary": "Paludisme simple probable",
  "suspected_diagnosis": "Accès palustre",
  "prescribed_tests": "TDR Paludisme",
  "medical_actions": "Artéméther-Luméfantrine si TDR positif",
  "emergency_referred": false
}
```

---

## 4. Gestion des Alertes Médicales

### `GET /api/v1/health/alerts`
Liste les alertes actives pour le soignant connecté.
- **Paramètres** : `status` (`active`, `acknowledged`, `resolved`), `severity` (`urgent`, `high`, `attention`).
- **Permission** : `patients.assess`.

### `PATCH /api/v1/health/alerts/{alert_id}/acknowledge`
Accuse réception d'une alerte médicale.

### `PATCH /api/v1/health/alerts/{alert_id}/resolve`
Clôture une alerte avec note de résolution.
