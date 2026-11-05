# TSOTSA Kids : configuration du domaine, des serveurs et de la base de données

Version 1.0 · 5 novembre 2026 · domaine **tsotsa-for-kids.com** (enregistré chez OVH)

Ce document fixe **toutes les adresses, tous les réglages et tous les noms de variables** de la plateforme. Antigravity doit s'y conformer : il est placé dans `docs/` et cité dans `AGENTS.md`.

**Règle absolue :** aucun mot de passe, aucune clé ni aucun jeton dans ce document ou dans le dépôt Git. Ils vont uniquement :
- dans les fichiers `.env` des serveurs (non versionnés) ;
- dans les secrets GitHub ;
- dans le gestionnaire de mots de passe de l'équipe.

---

## 1. Plan des adresses (sous-domaines)

| Adresse | Rôle | Hébergement |
|---|---|---|
| `tsotsa-for-kids.com` et `www.tsotsa-for-kids.com` | Site public de présentation (aujourd'hui : page « en construction » d'OVH) | À décider : hébergement web OVH actuel, ou page statique servie par Nginx |
| `app.tsotsa-for-kids.com` | Application web : espace utilisateur et espace soignant | Serveur de **production** (Nginx) |
| `admin.tsotsa-for-kids.com` | Administration | Serveur de production (Nginx), accès restreint |
| `api.tsotsa-for-kids.com` | API FastAPI (web et mobile) | Serveur de production |
| `app.recette.tsotsa-for-kids.com` | Application web de **recette** | Serveur de recette |
| `admin.recette.tsotsa-for-kids.com` | Administration de recette | Serveur de recette |
| `api.recette.tsotsa-for-kids.com` | API de recette | Serveur de recette |

**Adresses e-mail :**
- `no-reply@tsotsa-for-kids.com` envoie les e-mails automatiques (vérification d'adresse, mot de passe oublié, invitations, résumés) ;
- `contact@tsotsa-for-kids.com` reçoit les demandes.

---

## 2. Zone DNS chez OVH

Dans l'espace client OVH : **Web Cloud**, puis **Noms de domaine**, puis `tsotsa-for-kids.com`, puis l'onglet **Zone DNS**.

| Sous-domaine | Type | Cible | Remarque |
|---|---|---|---|
| `app` | A | adresse IPv4 du serveur de production | |
| `admin` | A | adresse IPv4 du serveur de production | |
| `api` | A | adresse IPv4 du serveur de production | |
| `app.recette` | A | adresse IPv4 du serveur de recette | |
| `admin.recette` | A | adresse IPv4 du serveur de recette | |
| `api.recette` | A | adresse IPv4 du serveur de recette | |
| *(vide)* et `www` | Inchangés pour l'instant | Hébergement OVH actuel | À modifier quand le site public sera prêt |
| *(vide)* | TXT | `google-site-verification=…` | Fourni par Google Search Console : prouve que le domaine t'appartient (nécessaire pour l'écran de consentement Google) |
| *(vide)* | TXT | `v=spf1 include:<service d'envoi> ~all` | SPF : autorise le service d'envoi d'e-mails |
| `<sélecteur>._domainkey` | TXT ou CNAME | Fourni par le service d'envoi | DKIM : signature des e-mails |
| `_dmarc` | TXT | `v=DMARC1; p=quarantine; rua=mailto:contact@tsotsa-for-kids.com` | DMARC : protège contre l'usurpation |
| *(vide)* | CAA | `0 issue "letsencrypt.org"` | Seul Let's Encrypt peut délivrer les certificats HTTPS |

La propagation DNS prend de quelques minutes à quelques heures. Pour vérifier, tape `nslookup api.tsotsa-for-kids.com`.

---

## 3. Serveurs

| Élément | Recette | Production |
|---|---|---|
| Machine | VPS OVH (2 vCPU, 4 Go de RAM) | VPS OVH ou Public Cloud (4 vCPU, 8 Go de RAM), localisation **France** (Gravelines ou Strasbourg) |
| Système | Ubuntu 24.04 LTS, mises à jour de sécurité automatiques | idem |
| Accès | SSH par clé uniquement, connexion root désactivée, utilisateur `deploy` | idem |
| Pare-feu | Ports 22 (SSH, limité), 80 et 443 uniquement | idem |
| Logiciels | Docker + Docker Compose, Nginx, Certbot (Let's Encrypt) | idem |
| Dossier de l'application | `/opt/tsotsa-kids` (clone du dépôt) + `.env` | idem |
| Conteneurs | `api` (FastAPI, plusieurs processus), `scheduler` (rappels et alertes), `web` (fichiers statiques) | idem |

**Nginx** :
- un bloc par sous-domaine ;
- HTTPS obligatoire (redirection automatique 80 vers 443, HSTS) ;
- compression ;
- en-têtes de sécurité ;
- taille d'envoi limitée à 10 Mo (imports Excel) ;
- `admin.` peut être restreint par adresse IP si tu le souhaites.

Les sauvegardes de la base sont faites par OVH. Il reste à **tester au moins une restauration** avant le pilote (étape X-A).

---

## 4. Base de données MySQL managée OVH

### 4.1 Le service

- **Offre** : OVHcloud Public Cloud **Databases for MySQL** (version 8), dans la même région que les serveurs.
- **Deux bases séparées** :
  - `tsotsa_recette` ;
  - `tsotsa_prod`.

  Pour le pilote, un seul service OVH peut héberger les deux bases. Pour la production réelle, il vaut mieux deux services distincts.
- **Réseau** : dans la liste des adresses IP autorisées du service, n'ajoute **que** les adresses IP des serveurs. Ton poste n'y figure que temporairement, pour un dépannage.
- **Chiffrement** : connexion TLS obligatoire. Télécharge le **certificat d'autorité (CA)** depuis l'espace client OVH et dépose-le sur chaque serveur : `/opt/tsotsa-kids/secrets/ovh-mysql-ca.pem`. Ce dossier est monté en lecture seule dans les conteneurs sous `/run/secrets/` (c'est le chemin utilisé dans les variables de la section 5).
- **Sauvegardes** : vérifie dans ton offre la fréquence des sauvegardes automatiques, leur durée de conservation et la restauration à un instant précis.

### 4.2 Comptes de base de données (moindre privilège)

| Compte | Droits | Utilisé par |
|---|---|---|
| `tsotsa_app` | SELECT, INSERT, UPDATE, DELETE sur sa base uniquement | Le serveur FastAPI et le planificateur, en fonctionnement normal |
| `tsotsa_migrator` | Droits de structure (CREATE, ALTER, INDEX, DROP, REFERENCES) + ceux de `tsotsa_app` | Uniquement les migrations Alembic, au moment du déploiement |
| `tsotsa_readonly` | SELECT | Exports, statistiques, dépannage |

Il faut un compte de chaque type **par base**, recette et production, chacun avec son propre mot de passe long, généré automatiquement.

```sql
-- Exemple pour la production (à exécuter une fois, mots de passe générés et gardés hors du dépôt)
CREATE DATABASE tsotsa_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'tsotsa_app'@'%' IDENTIFIED BY '<généré>' REQUIRE SSL;
GRANT SELECT, INSERT, UPDATE, DELETE ON tsotsa_prod.* TO 'tsotsa_app'@'%';
CREATE USER 'tsotsa_migrator'@'%' IDENTIFIED BY '<généré>' REQUIRE SSL;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON tsotsa_prod.* TO 'tsotsa_migrator'@'%';
CREATE USER 'tsotsa_readonly'@'%' IDENTIFIED BY '<généré>' REQUIRE SSL;
GRANT SELECT ON tsotsa_prod.* TO 'tsotsa_readonly'@'%';
```

Selon l'offre OVH, les comptes peuvent aussi se créer depuis l'espace client (onglet **Utilisateurs**). L'important est de garder trois comptes séparés.

### 4.3 Réglages de connexion côté application

| Réglage | Valeur | Pourquoi |
|---|---|---|
| Pilote | `asyncmy` (SQLAlchemy 2 asynchrone) | Ne bloque pas le serveur |
| Jeu de caractères | `utf8mb4` | Noms locaux, accents |
| Fuseau de la session | `+00:00` (UTC) | Toutes les dates en UTC dans la base |
| Mode SQL | `STRICT_TRANS_TABLES` (mode strict) | Refuse les données invalides au lieu de les tronquer |
| TLS | Obligatoire, certificat CA d'OVH vérifié | Données de santé |
| Pool de connexions | `pool_size=10`, `max_overflow=10`, `pool_pre_ping=True`, `pool_recycle=1800` | Évite les connexions coupées par le serveur MySQL |
| Délai de connexion | 10 s | Échec rapide plutôt que blocage |

### 4.4 Base locale et base de test

| Base | Où | Rôle |
|---|---|---|
| `tsotsa_dev` | Docker sur ton poste (port 3306) | Développement |
| `tsotsa_test` | Docker sur ton poste (port 3307) et dans la CI GitHub | Tests automatiques, vidée à chaque test |

Ces bases n'utilisent jamais les mots de passe de recette ou de production.

---

## 5. Variables de configuration (noms officiels)

Les fichiers `.env.example` du dépôt reprennent **exactement** ces noms, avec des valeurs vides. Les vraies valeurs sont dans le `.env` de chaque serveur.

### 5.1 Serveur (`apps/api/.env`)

```dotenv
APP_ENV=production                 # development | test | staging | production
APP_TIMEZONE_DEFAULT=Africa/Douala
API_BASE_URL=https://api.tsotsa-for-kids.com
WEB_APP_URL=https://app.tsotsa-for-kids.com
ADMIN_APP_URL=https://admin.tsotsa-for-kids.com
CORS_ALLOWED_ORIGINS=https://app.tsotsa-for-kids.com,https://admin.tsotsa-for-kids.com

DATABASE_URL=mysql+asyncmy://tsotsa_app:<secret>@<hôte OVH>:<port OVH>/tsotsa_prod
DATABASE_MIGRATIONS_URL=mysql+asyncmy://tsotsa_migrator:<secret>@<hôte OVH>:<port OVH>/tsotsa_prod
DATABASE_SSL_CA_PATH=/run/secrets/ovh-mysql-ca.pem
DATABASE_POOL_SIZE=10

JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private.pem   # clés RS256, différentes par environnement
JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public.pem
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=30
BCRYPT_ROUNDS=12

GOOGLE_CLIENT_IDS=<id web>,<id android>,<id ios>     # audiences acceptées pour les jetons Google

OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
SMS_PROVIDER=console               # console (dev uniquement) | <agrégateur choisi>
SMS_API_KEY=<secret>
SMS_SENDER_NAME=TSOTSA

EMAIL_PROVIDER=<service choisi>
EMAIL_API_KEY=<secret>
EMAIL_FROM=TSOTSA Kids <no-reply@tsotsa-for-kids.com>

EXPO_ACCESS_TOKEN=<secret>         # envoi des notifications push via le service d'Expo
NOTIFICATION_REMINDER_DELAY_MINUTES=30
NOTIFICATION_QUIET_HOURS=21:00-06:00

UPLOAD_MAX_MB=10
LOG_LEVEL=INFO
SENTRY_DSN=                        # facultatif : suivi des erreurs
```

### 5.2 Web (`apps/web/.env`, lu au moment de la construction)

```dotenv
VITE_API_URL=https://api.tsotsa-for-kids.com
VITE_GOOGLE_CLIENT_ID=<id client web Google>
VITE_APP_ENV=production
```

### 5.3 Mobile (`apps/mobile`, profils EAS dans `eas.json`)

```dotenv
EXPO_PUBLIC_API_URL=https://api.tsotsa-for-kids.com          # recette : https://api.recette.tsotsa-for-kids.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<id client web Google>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<id client iOS Google>
```

- **Identifiant de l'application** : `com.tsotsaforkids.app` (Android et iOS). Il ne pourra plus changer après la publication.
- **Liens qui ouvrent l'application** (invitations, vérification d'e-mail) : publier `https://app.tsotsa-for-kids.com/.well-known/assetlinks.json` (Android) et `apple-app-site-association` (iOS).

---

## 6. Comptes et services externes à créer

| Service | À configurer |
|---|---|
| **Google Cloud Console** | Un projet « TSOTSA Kids ». Écran de consentement OAuth : nom, logo, `https://www.tsotsa-for-kids.com` et domaine vérifié. Identifiants OAuth : **Web** (origines autorisées `https://app.tsotsa-for-kids.com`, `https://admin.tsotsa-for-kids.com` et leurs équivalents de recette), **Android** (paquet `com.tsotsaforkids.app` + empreinte SHA-1 fournie par EAS) et **iOS**. |
| **Expo / EAS** | Compte, projet `tsotsa-kids`, jeton d'accès (`EXPO_TOKEN` pour GitHub), identifiants Firebase (FCM) déposés dans EAS pour les notifications Android. |
| **Firebase** | Projet lié, uniquement pour les notifications Android (FCM). |
| **Service d'envoi d'e-mails** | Domaine `tsotsa-for-kids.com` vérifié (SPF, DKIM, DMARC), expéditeur `no-reply@`. |
| **Agrégateur SMS** | Compte, nom d'expéditeur « TSOTSA », couverture des opérateurs du Cameroun (MTN, Orange). Coût par SMS à budgéter. |
| **GitHub** | Voir section 7. |

---

## 7. GitHub : secrets et variables

**Settings > Secrets and variables > Actions**

| Nom | Type | Valeur |
|---|---|---|
| `OVH_SSH_KEY` | Secret | Clé privée SSH de l'utilisateur `deploy` |
| `OVH_SSH_USER` | Secret | `deploy` |
| `OVH_STAGING_HOST` | Secret | Adresse IP du serveur de recette |
| `OVH_PROD_HOST` | Secret | Adresse IP du serveur de production |
| `EXPO_TOKEN` | Secret | Jeton Expo |
| `STAGING_URL` | Variable | `https://api.recette.tsotsa-for-kids.com` |
| `PRODUCTION_URL` | Variable | `https://api.tsotsa-for-kids.com` |
| `DEPLOY_ENABLED` | Variable | `false` jusqu'à l'étape X-B, puis `true` |

**Environments** : `staging` et `production`. Une approbation manuelle sur `production` est facultative.

---

## 8. Ordre de mise en place (le moment venu, étapes X-A et X-B)

1. Commander les deux serveurs et le service MySQL managé.
2. Créer les bases et les comptes (section 4), puis autoriser les adresses IP des serveurs.
3. Créer les enregistrements DNS (section 2) et attendre la propagation.
4. Préparer les serveurs : utilisateur `deploy`, Docker, Nginx, certificats HTTPS avec Certbot.
5. Déposer les fichiers `.env` et le certificat CA sur chaque serveur.
6. Créer les services externes (section 6) et les secrets GitHub (section 7).
7. Faire un premier déploiement en recette, tester une restauration de sauvegarde, puis passer `DEPLOY_ENABLED` à `true`.
