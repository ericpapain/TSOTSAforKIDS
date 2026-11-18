#!/usr/bin/env bash
# Déploiement direct autonome sur le serveur OVH (contournement GitHub Actions)
# Usage: ./infra/deploy_direct.sh [branch_ou_tag]
set -euo pipefail

cd "$(dirname "$0")/.."
BRANCH="${1:-main}"

echo "=========================================================="
echo "  TSOTSA for Kids - Déploiement Direct en Production     "
echo "=========================================================="

echo "== 1. Récupération du code le plus récent (${BRANCH})..."
git fetch origin
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

SHA="$(git rev-parse --short HEAD)"
export IMAGE_TAG="latest"

echo "== 2. Vérification du fichier .env et des secrets..."
if [ ! -f ".env" ]; then
  echo "Fichier .env absent : copie depuis infra/.env.production.example"
  cp infra/.env.production.example .env
fi

mkdir -p secrets
if [ ! -f "secrets/jwt_private.pem" ] || [ ! -f "secrets/jwt_public.pem" ]; then
  echo "Génération automatique des clés RSA JWT..."
  openssl genrsa -out secrets/jwt_private.pem 2048 2>/dev/null
  openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem 2>/dev/null
  chmod 600 secrets/jwt_private.pem
  chmod 644 secrets/jwt_public.pem
fi

# S'assurer que les chemins JWT sont configurés dans .env
if grep -q "JWT_PRIVATE_KEY_PATH=$" .env 2>/dev/null || ! grep -q "JWT_PRIVATE_KEY_PATH=" .env 2>/dev/null; then
  sed -i 's|^JWT_PRIVATE_KEY_PATH=.*|JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private.pem|' .env 2>/dev/null || echo "JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private.pem" >> .env
fi
if grep -q "JWT_PUBLIC_KEY_PATH=$" .env 2>/dev/null || ! grep -q "JWT_PUBLIC_KEY_PATH=" .env 2>/dev/null; then
  sed -i 's|^JWT_PUBLIC_KEY_PATH=.*|JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public.pem|' .env 2>/dev/null || echo "JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public.pem" >> .env
fi

echo "== 3. Sauvegarde de la base de données..."
if [ -f "./infra/backup.sh" ]; then
  chmod +x ./infra/backup.sh 2>/dev/null || true
  ./infra/backup.sh "before-${SHA}" || echo "Sauvegarde ignorée."
fi

echo "== 4. Construction des images Docker locales..."
echo "--> Image API..."
docker build -f infra/docker/api.Dockerfile -t ghcr.io/ericpapain/tsotsa-kids-api:latest .

echo "--> Image Web..."
docker build -f infra/docker/web.Dockerfile -t ghcr.io/ericpapain/tsotsa-kids-web:latest .

echo "== 5. Démarrage de la base de données MySQL..."
docker compose -f docker-compose.prod.yml up -d mysql

echo "Attente de l'initialisation de MySQL..."
for attempt in $(seq 1 30); do
  status="$(docker inspect --format='{{json .State.Health.Status}}' tsotsa-mysql-prod 2>/dev/null || echo 'starting')"
  if [ "$status" = '"healthy"' ]; then
    echo "MySQL est opérationnel (tentative ${attempt}/30) !"
    break
  fi
  sleep 2
done

echo "== 6. Application des migrations Alembic..."
docker compose -f docker-compose.prod.yml exec -T mysql mysql -uroot -pTsotsaProd2026RootSecret! tsotsa_prod -e "CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(128) NOT NULL PRIMARY KEY); ALTER TABLE alembic_version MODIFY version_num VARCHAR(128) NOT NULL;" 2>/dev/null || true
docker compose -f docker-compose.prod.yml run --rm api alembic upgrade head

echo "== 7. Démarrage des conteneurs de production..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "== 8. Vérification de santé de l'API..."
HEALTHY=false
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "Succès : API opérationnelle (tentative ${attempt}/30) !"
    HEALTHY=true
    break
  fi
  sleep 2
done

if [ "$HEALTHY" = false ]; then
  echo "Erreur : L'API ne répond pas sur http://127.0.0.1:8000/health."
  docker compose -f docker-compose.prod.yml logs --tail=50 api
  exit 1
fi

echo "== 9. Rechargement de Nginx..."
if command -v nginx >/dev/null 2>&1; then
  nginx -t && systemctl reload nginx || true
fi

echo "=========================================================="
echo "  Déploiement terminé avec succès (commit ${SHA}) !       "
echo "  API: http://127.0.0.1:8000/health                       "
echo "  Web: http://127.0.0.1:3000                              "
echo "=========================================================="
