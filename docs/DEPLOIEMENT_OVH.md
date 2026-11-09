# Guide Pas à Pas de Déploiement OVH – TSOTSA Kids

Ce guide détaille chaque action manuelle à réaliser dans l'espace client OVH et sur vos serveurs pour mettre en service l'infrastructure de TSOTSA Kids.
Ce document est rédigé pour être suivi pas à pas, sans prérequis avancé.

---

## Étape 1 : Configuration de la Zone DNS (OVH)

Dans votre espace client OVHcloud :
1. Rendez-vous dans le menu **Web Cloud**, puis **Noms de domaine**.
2. Cliquez sur **`tsotsa-for-kids.com`**, puis ouvrez l'onglet **Zone DNS**.
3. Cliquez sur le bouton **Ajouter une entrée** pour configurer les sous-domaines suivants :

| Sous-domaine | Type | Cible (Valeur) | Rôle |
| :--- | :---: | :--- | :--- |
| `app` | **A** | *IPv4 de votre serveur de production* | Application Web utilisateurs |
| `admin` | **A** | *IPv4 de votre serveur de production* | Espace d'administration |
| `api` | **A** | *IPv4 de votre serveur de production* | Backend FastAPI production |
| `app.recette` | **A** | *IPv4 de votre serveur de recette* | Espace de recette utilisateurs |
| `admin.recette` | **A** | *IPv4 de votre serveur de recette* | Espace de recette administration |
| `api.recette` | **A** | *IPv4 de votre serveur de recette* | Backend FastAPI recette |
| *(laisser vide)* | **CAA** | `0 issue "letsencrypt.org"` | Autorisation SSL Let's Encrypt |
| `_dmarc` | **TXT** | `v=DMARC1; p=quarantine; rua=mailto:contact@tsotsa-for-kids.com` | Protection anti-usurpation email |

*Test de validation depuis votre ordinateur :*
```bash
nslookup api.recette.tsotsa-for-kids.com
```

---

## Étape 2 : Base de Données Managée MySQL (OVH)

Dans l'espace client OVHcloud :
1. Rendez-vous dans **Public Cloud**, puis **Databases** > **Databases for MySQL** (v8.0).
2. **Créer les bases de données** :
   - Onglet **Bases de données** > Bouton **Créer une base** : nommez-la `tsotsa_recette`.
   - Répétez l'opération pour créer la base `tsotsa_prod`.
3. **Créer les comptes utilisateurs (principe du moindre privilège)** :
   - Onglet **Utilisateurs** > **Ajouter un utilisateur** :
     - `tsotsa_app` : accès en lecture/écriture (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
     - `tsotsa_migrator` : accès administrateur (`ALL PRIVILEGES` pour les migrations Alembic).
     - `tsotsa_readonly` : accès en lecture seule (`SELECT`).
4. **Restreindre les accès réseau (IP)** :
   - Onglet **Adresses IP autorisées** > **Ajouter une adresse IP** :
     - Ajoutez l'adresse IP de votre serveur de recette.
     - Ajoutez l'adresse IP de votre serveur de production.
     - *(Aucune autre IP extérieure ne doit être autorisée).*
5. **Télécharger le certificat CA** :
   - Onglet **Informations générales**, téléchargez le certificat SSL CA (`ovh-mysql-ca.pem`).

---

## Étape 3 : Préparation des Serveurs (Recette & Production)

Connectez-vous en SSH à votre serveur en tant que `root` :
```bash
ssh root@<IP_DU_SERVEUR>
```

1. **Cloner le dépôt dans `/opt/tsotsa-kids`** :
   ```bash
   git clone https://github.com/ericpapain/TSOTSAforKIDS.git /opt/tsotsa-kids
   cd /opt/tsotsa-kids
   ```
2. **Exécuter le script de durcissement et d'installation** :
   ```bash
   chmod +x infra/scripts/preparer_serveur.sh
   ./infra/scripts/preparer_serveur.sh
   ```
   Ce script configure automatiquement :
   - L'utilisateur non-root `deploy` avec les droits Docker.
   - Le pare-feu UFW (ports 22, 80, 443 autorisés, le reste bloqué).
   - Les mises à jour de sécurité automatiques (`unattended-upgrades`).
   - Le durcissement SSH (authentification par clé publique uniquement).
   - L'installation de Docker Engine, Docker Compose, Nginx et Certbot.

3. **Déposer le certificat CA et le fichier `.env`** :
   - Copiez `ovh-mysql-ca.pem` dans `/opt/tsotsa-kids/secrets/ovh-mysql-ca.pem` :
     ```bash
     chmod 0600 /opt/tsotsa-kids/secrets/ovh-mysql-ca.pem
     ```
   - Créez `/opt/tsotsa-kids/.env` en copiant le modèle :
     - Sur la recette : `cp infra/.env.recette.example /opt/tsotsa-kids/.env`
     - Sur la production : `cp infra/.env.production.example /opt/tsotsa-kids/.env`
     - Renseignez les mots de passe et secrets dans ce fichier (permissions `0600`).

4. **Générer les certificats SSL Let's Encrypt avec Certbot** :
   Sur le serveur de recette :
   ```bash
   certbot --nginx -d api.recette.tsotsa-for-kids.com -d app.recette.tsotsa-for-kids.com -d admin.recette.tsotsa-for-kids.com
   ```
   Sur le serveur de production :
   ```bash
   certbot --nginx -d api.tsotsa-for-kids.com -d app.tsotsa-for-kids.com -d admin.tsotsa-for-kids.com
   ```

5. **Déployer les configurations Nginx** :
   ```bash
   cp infra/nginx/security_headers.conf /etc/nginx/snippets/
   cp infra/nginx/*.recette.conf /etc/nginx/conf.d/  # (ou *.conf sans .recette sur prod)
   nginx -t && systemctl reload nginx
   ```

---

## Étape 4 : Configuration des Secrets GitHub Actions

Sur votre dépôt GitHub (`https://github.com/ericpapain/TSOTSAforKIDS`) :
Rendez-vous dans **Settings** > **Secrets and variables** > **Actions** :

### 1. Variables globales (Repository variables)
- `DEPLOY_ENABLED` : valeur `"false"` (puis `"true"` après validation du premier test).

### 2. Environnement `staging` (Recette)
Créez l'environnement **`staging`** avec les variables et secrets :
- Secret `OVH_SSH_KEY` : Clé privée SSH de l'utilisateur `deploy` pour le serveur de recette.
- Secret `OVH_SSH_USER` : `deploy`
- Secret `OVH_STAGING_HOST` : Adresse IP du serveur de recette.
- Variable `STAGING_URL` : `https://api.recette.tsotsa-for-kids.com`

### 3. Environnement `production`
Créez l'environnement **`production`** :
- Secret `OVH_SSH_KEY` : Clé privée SSH de l'utilisateur `deploy` pour le serveur de production.
- Secret `OVH_SSH_USER` : `deploy`
- Secret `OVH_PROD_HOST` : Adresse IP du serveur de production.
- Variable `PRODUCTION_URL` : `https://api.tsotsa-for-kids.com`

---

## Étape 5 : Lancement du Premier Déploiement

1. Une fois les étapes ci-dessus complétées, passez la variable GitHub `DEPLOY_ENABLED` à `true`.
2. Lors de la fusion d'une Pull Request sur `main` :
   - Le workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) compile les images Docker sur GHCR.
   - Il se connecte en SSH au serveur de recette et exécute `./infra/deploy.sh <commit_sha>`.
   - Il applique les migrations Alembic et relance les conteneurs.
   - Il valide le déploiement avec `make smoke URL=...`.
   - Si les tests de fumée sont validés, il déploie automatiquement sur la production.

