#!/usr/bin/env bash
# Déploiement sur un serveur OVH, appelé par GitHub Actions : ./infra/deploy.sh <sha_du_commit>
# Étapes : sauvegarde de la base, nouvelles images, migrations, redémarrage, vérification, retour arrière si échec.
set -euo pipefail
SHA="${1:?usage: deploy.sh <sha>}"
cd "$(dirname "$0")/.."
PREV="$(cat .deployed_sha 2>/dev/null || echo '')"

echo "== 1. Sauvegarde de la base avant migration"
./infra/backup.sh "before-${SHA:0:7}"

echo "== 2. Récupération du code et des images ${SHA:0:7}"
git fetch --quiet origin && git checkout --quiet "$SHA"
export IMAGE_TAG="$SHA"
docker compose -f docker-compose.prod.yml pull

echo "== 3. Migrations de la base"
docker compose -f docker-compose.prod.yml run --rm api alembic upgrade head

echo "== 4. Redémarrage des services"
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "== 5. Vérification de santé"
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null; then
    echo "$SHA" > .deployed_sha; echo "Déploiement réussi à la tentative ${attempt} : ${SHA:0:7}"; exit 0
  fi
  sleep 2
done

echo "!! Échec de la vérification de santé : retour à la version précédente ${PREV:0:7}"
if [ -n "$PREV" ]; then
  git checkout --quiet "$PREV"; export IMAGE_TAG="$PREV"
  docker compose -f docker-compose.prod.yml up -d --remove-orphans
fi
echo "!! Si une migration a modifié la base, restaurer la sauvegarde 'before-${SHA:0:7}' (voir docs/DEPLOIEMENT_OVH.md)."
exit 1
