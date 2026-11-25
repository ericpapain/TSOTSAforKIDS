# Guide d'Accès et d'Administration de la Base de Données MySQL – TSOTSA for Kids

Ce document fournit le mode d'emploi exhaustif, simple et sécurisé pour accéder, consulter, modifier, sauvegarder et restaurer votre base de données de production **MySQL 8.0**.

---

## 1. Localisation et Architecture de votre Base

- **Serveur VPS** : OVHcloud VPS-3 (Ubuntu 24.04 LTS).
- **Adresse IP du VPS** : `51.89.148.92`
- **Moteur de base de données** : MySQL 8.0 Community Server en conteneur Docker isolé (`tsotsa-mysql-prod`).
- **Nom de la base de données** : `tsotsa_prod`
- **Nombre de tables de schéma** : 55 tables relationnelles (créées via les migrations Alembic 0001 à 0014).
- **Règle absolue de sécurité** : Le port MySQL (`3306`) n'est **jamais** exposé directement sur l'Internet public. Il est confiné en local (`127.0.0.1:3306`) sur le VPS pour interdire toute tentative d'intrusion par force brute.

---

## 2. Option 1 (Recommandée & Immédiate) : Accès Visuel Web (Adminer)

Vous n'avez **aucun logiciel à installer sur votre ordinateur**. Vous pouvez accéder à l'interface d'administration visuelle directement depuis votre navigateur (Google Chrome, Firefox, Edge, Safari).

### A. Adresse d'accès
Ouvrez votre navigateur et rendez-vous sur l'URL sécurisée en HTTPS :
👉 **`https://www.tsotsa-for-kids.com/db-admin/`**
*(ou `https://tsotsa-for-kids.com/db-admin/`)*

### B. Formulaire de connexion
Remplissez les champs exactement comme suit :

| Champ | Valeur exacte à saisir | Explication |
|---|---|---|
| **Système** | `MySQL` | Type de moteur de base de données |
| **Serveur** | `mysql` | Nom d'hôte interne du conteneur dans le réseau Docker |
| **Utilisateur** | `tsotsa_app` *(ou `root` pour les droits complets)* | Utilisateur applicatif ou super-administrateur |
| **Mot de passe** | `TsotsaApp2026SecurePass` *(ou `TsotsaKidsMySQL2026Root` pour root)* | Mot de passe sécurisé |
| **Base de données** | `tsotsa_prod` | Nom de votre base de données TSOTSA |

Cliquez ensuite sur le bouton **« Connexion »**.

### C. Ce que vous pouvez faire dans l'interface Web :
- **Voir la liste des 55 tables** : `users`, `user_identities`, `persons`, `foods`, `products`, `evaluations`, etc.
- **Consulter les enregistrements** : Cliquez sur le nom d'une table, puis sur **« Sélectionner les données »**.
- **Créer ou modifier une ligne** : Cliquez sur **« Nouvelle ligne »** ou sur le bouton **« Modifier »** à gauche d'un enregistrement.
- **Exécuter une requête SQL** : Cliquez sur **« Commande SQL »** en haut à gauche pour taper une commande directe (ex: `SELECT * FROM users;`).

---

## 3. Option 2 : Accès depuis votre Ordinateur avec DBeaver ou MySQL Workbench (Tunnel SSH)

Si vous préférez utiliser un logiciel de bureau professionnel sur votre ordinateur (Windows/Mac) pour manipuler de gros volumes de données ou afficher le diagramme relationnel (ERD) :

### A. Télécharger le logiciel
Téléchargez gratuitement le logiciel **DBeaver Community** :
👉 [https://dbeaver.io/download/](https://dbeaver.io/download/)

### B. Configuration de la connexion dans DBeaver
1. Ouvrez DBeaver, cliquez sur **Nouvelle connexion** (icône prise électrique en haut à gauche) et sélectionnez **MySQL**.
2. **Onglet Principal (Main)** :
   - **Hôte (Host)** : `127.0.0.1` *(car la connexion sera tunnelisée)*
   - **Port** : `3306`
   - **Base de données** : `tsotsa_prod`
   - **Nom d'utilisateur** : `tsotsa_app` *(ou `root`)*
   - **Mot de passe** : `TsotsaApp2026SecurePass` *(ou `TsotsaKidsMySQL2026Root`)*
3. **Onglet Tunnel SSH** :
   - Cochez **« Utiliser un tunnel SSH »**.
   - **Hôte SSH (Host)** : `51.89.148.92`
   - **Port SSH** : `22`
   - **Nom d'utilisateur SSH** : `ubuntu`
   - **Méthode d'authentification** : `Clé publique (Public Key)`
   - **Fichier de clé privée** : `C:\Users\mezat\.ssh\id_ed25519`
4. Cliquez sur **« Tester la connexion »** puis sur **« Terminer »**.

Vous avez désormais accès à l'intégralité de la base de données avec autocomplétion, diagrammes relationnels et filtres visuels.

---

## 4. Consultation des Tables Essentielles

| Table | Rôle métier | Données stockées |
|---|---|---|
| `users` | Comptes utilisateurs | ID unique (`BINARY(16)` UUID v7), nom complet (`display_name`), langue, date de création. |
| `user_identities` | Identifiants et sécurité | E-mail, téléphone, mot de passe haché par Bcrypt (`password_hash`), fournisseur (`email`, `phone`, `google`). |
| `persons` | Personnes et enfants suivis | Enfants suivis, date de naissance, sexe, consentements légaux rattachés. |
| `foods` & `food_nutrient_values` | Aliments locaux | Référentiel des aliments camerounais (nom, région, composition pour 100g). |
| `products` & `product_nutrient_values` | Produits thérapeutiques | Plumpy'Nut, F-75, F-100 et leurs compositions de référence OMS. |
| `evaluations` & `evaluation_scores` | Évaluations cliniques | Mesures anthropométriques réelles (Poids, Taille, PB/MUAC, scores Z OMS). |
| `audit_log` | Traçabilité légale | Journal immuable de chaque lecture et modification de données de santé. |

---

## 5. Comment Importer des Données (Aliments locaux, Registres)

### Méthode A : Via l'interface Web (Adminer)
1. Rendez-vous sur `https://www.tsotsa-for-kids.com/db-admin/`.
2. Connectez-vous à la base `tsotsa_prod`.
3. Cliquez sur **« Importation »** dans le menu de gauche.
4. Sélectionnez votre fichier `.sql` ou `.csv` sur votre ordinateur.
5. Cliquez sur **« Exécuter »**.

### Méthode B : En ligne de commande sur le VPS
Si vous avez un fichier SQL volumineux à importer :
```bash
# 1. Copier le fichier SQL vers le VPS
scp -i ~/.ssh/id_ed25519 mes_donnees.sql ubuntu@51.89.148.92:/tmp/

# 2. Injecter le fichier dans MySQL en production
ssh -i ~/.ssh/id_ed25519 ubuntu@51.89.148.92 "docker exec -i tsotsa-mysql-prod mysql -u root -p'TsotsaKidsMySQL2026Root' tsotsa_prod < /tmp/mes_donnees.sql"
```

---

## 6. Procédure de Sauvegarde (Backup)

### A. Sauvegarde manuelle immédiate
Pour créer une sauvegarde complète horodatée de votre base `tsotsa_prod` :

```powershell
# Exécuter depuis votre terminal PowerShell local :
ssh -i C:\Users\mezat\.ssh\id_ed25519 ubuntu@51.89.148.92 "docker exec tsotsa-mysql-prod mysqldump -u root -p'TsotsaKidsMySQL2026Root' --single-transaction --quick tsotsa_prod | gzip" > backup_tsotsa_prod.sql.gz
```
Le fichier compressé `.sql.gz` sera automatiquement téléchargé et stocké en sécurité sur votre ordinateur personnel.

---

## 7. Procédure de Restauration (Disaster Recovery)

En cas de mauvaise manipulation ou de sinistre, pour restaurer une sauvegarde :

```bash
# 1. Envoyer le fichier de sauvegarde sur le VPS
scp -i C:\Users\mezat\.ssh\id_ed25519 mon_fichier_backup.sql.gz ubuntu@51.89.148.92:/tmp/

# 2. Restaurer la base
ssh -i C:\Users\mezat\.ssh\id_ed25519 ubuntu@51.89.148.92 "gunzip < /tmp/mon_fichier_backup.sql.gz | docker exec -i tsotsa-mysql-prod mysql -u root -p'TsotsaKidsMySQL2026Root' tsotsa_prod"
```

---

## 8. Résumé des Identifiants & Accès Directs

| Rôle | URL / Serveur | Utilisateur | Mot de passe | Base de données |
|---|---|---|---|---|
| **Accès Web Visuel** | `https://www.tsotsa-for-kids.com/db-admin/` | `tsotsa_app` | `TsotsaApp2026SecurePass` | `tsotsa_prod` |
| **Super-Admin Web** | `https://www.tsotsa-for-kids.com/db-admin/` | `root` | `TsotsaKidsMySQL2026Root` | `tsotsa_prod` |
| **Logiciel Bureau (DBeaver)** | `127.0.0.1:3306` via SSH `51.89.148.92` | `tsotsa_app` | `TsotsaApp2026SecurePass` | `tsotsa_prod` |

