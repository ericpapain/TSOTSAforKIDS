# Politique de Persistance, Traçabilité et Sauvegardes – TSOTSA for KIDS

**Date de création** : 15 novembre 2026  
**Document de référence contractuel** : Intégrité des données, cycle de vie et résilience  

---

## 1. Principes Absolus de Non-Suppression Physique

Dans TSOTSA for KIDS, les données de santé et les identités professionnelles ne sont **jamais effacées physiquement** de la base de données :

1. **Suppression logique systématique (Soft Delete)** :
   - Tables dotées de `deleted_at: DATETIME(3) UTC` et `deleted_by: BINARY(16)`.
   - Tout enregistrement « supprimé » est exclu des requêtes applicatives normales (`is_active = FALSE` ou `deleted_at IS NULL`), mais reste intégralement archivé pour des raisons médico-légales et d'audit.
2. **Interdiction de `ON DELETE CASCADE` vers des données de santé** :
   - La suppression d'un compte utilisateur, d'un soignant ou d'un établissement ne supprime JAMAIS en cascade les dossiers enfants (`persons`), les prises alimentaires (`intake_logs`), les évaluations ou les consentements.
3. **Immutabilité des associations et délégations** :
   - Chaque association patient ↔ soignant (`patient_caregiver_assignments`) et chaque attribution de droit (`permission_grants`) possède une période de validité (`valid_from`, `valid_to`).
   - Pour retirer un droit ou changer de soignant référent, on horodate `valid_to` et on crée une nouvelle ligne. L'historique n'est jamais écrasé.

---

## 2. Ce qui se passe à chaque action de suppression ou suspension

| Action utilisateur | Effet en base de données | Impact fonctionnel | Mesures de protection |
|---|---|---|---|
| **Suspension d'un soignant** | `users.status = 'suspended'` | Le soignant est immédiatement déconnecté. Toute tentative d'accès API renvoie HTTP 403 `account_suspended`. | Ses patients associés sont automatiquement placés dans la file « À associer » du Super Soignant. |
| **Suppression d'un soignant** | `users.status = 'deleted'`, `users.deleted_at = NOW()` | Compte archivé. Interdiction de reconnexion. | Ses évaluations passées restent signées sous son identifiant. Ses patients actifs sont réassignés sans rupture de prise en charge. |
| **Suppression d'un patient / enfant** | `persons.status = 'archived'`, `persons.deleted_at = NOW()` | Disparaît de la liste active des patients. | Dossier historique conservé avec motif d'archivage (ex: guérison, déménagement, décès). |
| **Révocation d'un droit délégué** | `permission_grants.valid_to = NOW()` | Le droit cesse d'être reconnu côté serveur à la seconde même. | Trace conservée : qui a révoqué, date et heure, motif de révocation. |

---

## 3. Journal d'Audit Immuable (`audit_log`)

Toute opération sensible fait l'objet d'un enregistrement en ajout seul (`append-only`) :
- **Champs** : `id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `before_state` (JSON), `after_state` (JSON), `ip_address`, `user_agent`, `created_at`.
- **Événements tracés** :
  - Création, modification, suspension, suppression de compte.
  - Validation et refus de soignants ou d'agents de terrain.
  - Attribution et révocation de permissions.
  - Association de patient à un soignant.
  - Activation du mode « Voir comme » (`caregivers.view_as`).
  - Connexions réussies et échecs répétés des rôles professionnels.

---

## 4. Sauvegardes OVH et Procédure de Restauration

### A. Volume Persistant Docker sur le VPS
- Les données MySQL vivent dans le volume monté `/opt/tsotsa-kids/data/mysql`.
- Redémarrer le conteneur (`docker compose down` puis `docker compose up`) conserve 100 % des données.

### B. Sauvegarde Automatique Quotidienne (mysqldump)
- Script automatisé via tâche cron quotidienne à 02h00 UTC :
  ```bash
  docker exec tsotsa-mysql-prod mysqldump -u tsotsa_readonly -p"$MYSQL_READONLY_PASSWORD" \
    --single-transaction --quick --routines --triggers tsotsa_prod | gzip > /opt/tsotsa-kids/backups/tsotsa_prod_$(date +%Y%m%d_%H%M%S).sql.gz
  ```
- Rétention : 30 jours glissants sur le VPS, archivage distant sécurisé vers OVHcloud Object Storage.

### C. Procédure de Restauration d'Urgence
1. Stopper l'API pour éviter les écritures concurrentes :
   ```bash
   docker stop tsotsa-api-prod
   ```
2. Décompresser et restaurer le dump SQL :
   ```bash
   gunzip < /opt/tsotsa-kids/backups/tsotsa_prod_YYYYMMDD_HHMMSS.sql.gz | docker exec -i tsotsa-mysql-prod mysql -u root -p"$MYSQL_ROOT_PASSWORD" tsotsa_prod
   ```
3. Exécuter les migrations de contrôle :
   ```bash
   docker run --rm --network tsotsa-kids_default tsotsa-kids-api alembic upgrade head
   ```
4. Relancer l'API et vérifier le statut de santé :
   ```bash
   docker start tsotsa-api-prod
   curl https://www.tsotsa-for-kids.com/api/health
   ```

---

## 5. Validation du Test de Persistance Docker (`docker compose down` / `docker compose up`)

### A. Déclaration Contractuelle du Volume
Le fichier d'orchestration `docker-compose.yml` déclare explicitement un volume nommé persistant `mysql_data` rattaché au chemin de stockage interne MySQL `/var/lib/mysql` :
```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: tsotsa-mysql
    volumes:
      - mysql_data:/var/lib/mysql
volumes:
  mysql_data:
```

### B. Cycle de Vie et Préservation des Données
- Lors de l'arrêt des conteneurs via la commande standard :
  ```bash
  docker compose down
  ```
  Le conteneur applicatif est arrêté et retiré, mais le volume nommé `mysql_data` reste **strictement conservé** sur l'hôte (seule l'option destructive `-v` détruirait le volume, formellement interdite).
- Lors de la relance :
  ```bash
  docker compose up -d
  ```
  Le conteneur MySQL remonte instantanément les données existantes contenues dans `/var/lib/mysql`. L'intégralité des tables, comptes, profils soignants et dossiers enfants est immédiatement disponible sans altération.

### C. Script Automatisé de Vérification
Le script [`scripts/test_docker_persistence.py`](../../scripts/test_docker_persistence.py) permet de vérifier automatiquement l'intégrité de cette configuration et d'exécuter un test de cycle complet de persistance.


