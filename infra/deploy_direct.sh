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

echo "== 2. Sauvegarde de la base de données..."
if [ -f "./infra/backup.sh" ]; then
  ./infra/backup.sh "before-${SHA}" || echo "Sauvegarde ignorée."
fi

echo "== 3. Construction des images Docker locales..."
echo "--> Image API..."
docker build -f infra/docker/api.Dockerfile -t ghcr.io/ericpapain/tsotsa-kids-api:latest .

echo "--> Image Web..."
docker build -f infra/docker/web.Dockerfile -t ghcr.io/ericpapain/tsotsa-kids-web:latest .

echo "== 4. Migrations Alembic..."
docker compose -f docker-compose.prod.yml run --rm api alembic upgrade head

echo "== 5. Redémarrage des conteneurs..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "== 6. Vérification de santé..."
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

echo "== 7. Rechargement de Nginx..."
if command -v nginx >/dev/null 2>&1; then
  nginx -t && systemctl reload nginx || true
fi

echo "=========================================================="
echo "  Déploiement terminé avec succès (commit ${SHA}) !       "
echo "=========================================================="
