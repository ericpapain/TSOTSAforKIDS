#!/usr/bin/env bash
# Test de restauration sur une base temporaire pour vérifier l'intégrité de la sauvegarde
# Usage: ./infra/restore_test.sh <chemin_sauvegarde.sql.gz> [base_temporaire]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKUP_FILE="${1:?usage: $0 <backup_file.sql.gz> [temp_database_name]}"
TEMP_DB="${2:-tsotsa_test_restore}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "!! Erreur : Le fichier '${BACKUP_FILE}' est introuvable." >&2
    exit 1
fi

if [ -f "${ROOT_DIR}/.env" ]; then
    set -a
    # shellcheck source=/dev/null
    source "${ROOT_DIR}/.env"
    set +a
fi

DB_USER="${MYSQL_USER:-tsotsa_migrator}"
DB_PASSWORD="${MYSQL_PASSWORD:-}"
DB_HOST="${MYSQL_HOST:-127.0.0.1}"
DB_PORT="${MYSQL_PORT:-3306}"
SSL_CA="${MYSQL_SSL_CA:-/opt/tsotsa-kids/secrets/ovh-mysql-ca.pem}"

SSL_OPTS=()
if [ -f "${SSL_CA}" ]; then
    SSL_OPTS+=(--ssl-ca="${SSL_CA}" --ssl-mode=REQUIRED)
fi

export MYSQL_PWD="${DB_PASSWORD}"

echo "==> 1. Recréation de la base temporaire '${TEMP_DB}'..."
mysql --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_USER}" "${SSL_OPTS[@]}" \
    -e "DROP DATABASE IF EXISTS \`${TEMP_DB}\`; CREATE DATABASE \`${TEMP_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

echo "==> 2. Décompression et restauration du fichier '${BACKUP_FILE}'..."
gzip -dc "${BACKUP_FILE}" | mysql --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_USER}" "${SSL_OPTS[@]}" "${TEMP_DB}"

echo "==> 3. Vérification des tables et du comptage des lignes clés..."
mysql --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_USER}" "${SSL_OPTS[@]}" "${TEMP_DB}" << 'EOF'
SELECT 'users' AS table_name, COUNT(*) AS total FROM users
UNION ALL
SELECT 'nutrients', COUNT(*) FROM nutrients
UNION ALL
SELECT 'food_items', COUNT(*) FROM food_items
UNION ALL
SELECT 'persons', COUNT(*) FROM persons;
EOF

echo "==> 4. Nettoyage de la base temporaire '${TEMP_DB}'..."
mysql --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_USER}" "${SSL_OPTS[@]}" \
    -e "DROP DATABASE IF EXISTS \`${TEMP_DB}\`;"

unset MYSQL_PWD
echo "==> Test de restauration validé avec succès !"

