# Guide de Déploiement Direct en Production (Contournement GitHub Actions)

Ce guide permet de déployer l'application **TSOTSA for Kids** directement sur le serveur VPS OVH sans dépendre des quotas ou des exécutions de GitHub Actions.

---

## 1. Prérequis

- Avoir accès SSH au serveur OVH :
  ```bash
  ssh root@<IP_DU_SERVEUR>
  # ou
  ssh deploy@<IP_DU_SERVEUR>
  ```
- Le dossier de l'application est situé dans `/opt/tsotsa-kids`.

---

## 2. Déploiement en Une Seule Commande

Connectez-vous au serveur et lancez le script autonome :

```bash
cd /opt/tsotsa-kids
chmod +x infra/deploy_direct.sh
./infra/deploy_direct.sh etape/L01-nouveau-logo-tsotsa
```

*(Remplacez `etape/L01-nouveau-logo-tsotsa` par `main` une fois la PR fusionnée).*

---

## 3. Détail des étapes exécutées par le script

Le script effectue automatiquement les 7 opérations suivantes :

1. **Synchronisation Git** : Récupère la dernière version du code (`git fetch` + `git checkout` + `git pull`).
2. **Sauvegarde MySQL** : Crée un export compressé de la base de données dans `/opt/tsotsa-kids/backups/`.
3. **Construction locale des images Docker** :
   - Image API (`ghcr.io/ericpapain/tsotsa-kids-api:latest`).
   - Image Web (`ghcr.io/ericpapain/tsotsa-kids-web:latest`).
4. **Migrations Alembic** : Met à jour le schéma de la base de données (`alembic upgrade head`).
5. **Redémarrage des services** : Relance les conteneurs (`docker compose up -d`).
6. **Contrôle de santé** : Vérifie que l'endpoint `/health` répond en HTTP 200.
7. **Rechargement Nginx** : Applique les configurations Nginx sans coupure de service.

---

## 4. Commandes de Vérification

Une fois le script terminé :

```bash
# Vérifier l'état des conteneurs
docker compose -f docker-compose.prod.yml ps

# Vérifier les logs de l'API
docker compose -f docker-compose.prod.yml logs --tail=50 api

# Tester l'accès HTTP
curl -fsS http://127.0.0.1:8000/health
```

---

## 5. Application Mobile Android

Pour générer le binaire Android (APK) sans passer par GitHub Actions :

```bash
# Depuis votre machine locale dans le dépôt :
pnpm --filter @tsotsa/mobile exec eas build -p android --profile preview
```

