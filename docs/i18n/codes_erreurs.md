# Référentiel des Codes d'Erreurs API TSOTSA Kids

Ce document répertorie tous les codes d'erreurs standardisés renvoyés par l'API FastAPI (`apps/api`), leur statut HTTP associé, les paramètres éventuels renvoyés et leurs traductions françaises et anglaises gérées par le namespace `errors` (`packages/i18n/locales/{fr,en}/errors.json`).

---

## 1. Structure du format d'erreur JSON

Toutes les réponses d'erreur de l'API suivent une structure normalisée contenant :
- `code` : identifiant hiérarchique stable pour l'internationalisation (`auth.*`, `common.*`, `food.*`, `region.*`).
- `params` : dictionnaire de variables contextuelles (ex. `{"field": "preferred_locale"}`).
- `detail` : libellé technique en français à destination exclusive des journaux d'audit et logs serveur.
- `error` : enveloppe de compatibilité ascendante pour les clients et tests existants.

```json
{
  "code": "auth.otp_expired",
  "params": {},
  "detail": "Code de confirmation invalide ou expiré.",
  "error": {
    "code": "UNAUTHORIZED",
    "i18n_code": "auth.otp_expired",
    "params": {},
    "message": "Code de confirmation invalide ou expiré.",
    "detail": "Code de confirmation invalide ou expiré.",
    "details": { "reason": "otp_expired_or_absent" }
  }
}
```

---

## 2. Catalogue des codes d'erreur

| Code d'erreur API | Statut HTTP | Paramètres | Traduction FR | Traduction EN |
|---|---|---|---|---|
| `auth.otp_expired` | 401 | `{}` | Le code de confirmation a expiré ou est introuvable. Veuillez en demander un nouveau. | The confirmation code has expired or was not found. Please request a new one. |
| `auth.otp_invalid` | 401 | `{}` | Le code de confirmation saisi est incorrect. | The confirmation code entered is incorrect. |
| `auth.otp_max_attempts` | 400 | `{}` | Nombre maximal de tentatives dépassé. Veuillez demander un nouveau code. | Maximum number of attempts exceeded. Please request a new code. |
| `auth.email_already_exists` | 409 | `{}` | Cette adresse e-mail est déjà associée à un compte. | This email address is already associated with an account. |
| `auth.account_already_exists` | 409 | `{}` | Un compte avec ces coordonnées existe déjà. | An account with these details already exists. |
| `auth.caregiver_not_verified` | 403 | `{}` | Votre profil soignant n'est pas encore vérifié par l'administration. | Your caregiver profile has not yet been verified by administration. |
| `auth.rate_limit_exceeded` | 429 | `{}` | Trop de tentatives. Veuillez patienter avant de réessayer. | Too many attempts. Please wait before trying again. |
| `auth.unauthorized` | 401 | `{}` | Authentification requise pour accéder à cette ressource. | Authentication is required to access this resource. |
| `auth.forbidden` | 403 | `{}` | Vous n'avez pas les autorisations nécessaires pour cette action. | You do not have the required permissions for this action. |
| `auth.invalid_credentials` | 401 | `{}` | Identifiants incorrects. Veuillez vérifier votre saisie. | Incorrect credentials. Please verify your input. |
| `auth.invalid_google_token` | 401 | `{}` | Jeton Google invalide ou expiré. | Invalid or expired Google token. |
| `auth.unverified_google_email` | 401 | `{}` | Votre adresse e-mail Google doit être vérifiée. | Your Google email address must be verified. |
| `auth.inactive_user` | 401 | `{}` | Ce compte est inactif ou suspendu. | This account is inactive or suspended. |
| `auth.invalid_token` | 404 | `{}` | Le lien ou jeton est invalide ou expiré. | The link or token is invalid or expired. |
| `auth.invitation_expired` | 422 | `{}` | Cette invitation a expiré. | This invitation has expired. |
| `common.not_found` | 404 | `{}` | La ressource demandée est introuvable. | The requested resource could not be found. |
| `common.validation_error` | 422 | `{"field": "..."}` | Les données envoyées sont invalides ou incomplètes. | The submitted data is invalid or incomplete. |
| `common.service_unavailable` | 503 | `{}` | Le service est temporairement indisponible. Veuillez réessayer plus tard. | The service is temporarily unavailable. Please try again later. |
| `common.internal_error` | 500 | `{}` | Une erreur interne est survenue sur le serveur. | An internal server error occurred. |
| `food.missing_source` | 422 | `{}` | Une source bibliographique ou ORKG est obligatoire. | A bibliographic or ORKG source is required. |
| `food.self_review_forbidden` | 403 | `{}` | Interdiction de valider son propre lot : une relecture par une autre personne est requise. | Cannot approve your own batch: a review by a second person is required. |
| `region.already_exists` | 409 | `{}` | Cette région existe déjà dans le système. | This region already exists in the system. |
| `generic` | Tout | `{}` | Une erreur inattendue est survenue. Veuillez réessayer. | An unexpected error occurred. Please try again. |

---

## 3. Règle de repli côté client Web

Si l'API renvoie un code inconnu ou non répertorié dans `packages/i18n/locales/<locale>/errors.json`, l'application web utilise automatiquement la clé générique `errors:generic`.

