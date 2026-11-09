#!/usr/bin/env bash
# Sauvegarde nommée de la base de données MySQL
# Usage: ./infra/backup.sh [nom_de_sauvegarde]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Charger .env si présent et si les variables ne sont pas déjà définies
if [ -f "${ROOT_DIR}/.env" ]; then
    set -a
    # shellcheck source=/dev/null
    source "${ROOT_DIR}/.env"
    set +a
fi

DB_NAME="${MYSQL_DATABASE:-${DATABASE_NAME:-tsotsa_recette}}"
DB_USER="${MYSQL_USER:-tsotsa_migrator}"
DB_PASSWORD="${MYSQL_PASSWORD:-}"
DB_HOST="${MYSQL_HOST:-127.0.0.1}"
DB_PORT="${MYSQL_PORT:-3306}"
SSL_CA="${MYSQL_SSL_CA:-/opt/tsotsa-kids/secrets/ovh-mysql-ca.pem}"

BACKUP_LABEL="${1:-manual}"
TIMESTAMP="$(date -u +%Y%m%d_%H%M%SZ)"
BACKUP_DIR="${ROOT_DIR}/backups"

mkdir -p "${BACKUP_DIR}"
chmod 0700 "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${BACKUP_LABEL}_${TIMESTAMP}.sql.gz"

echo "==> Sauvegarde MySQL pour '${DB_NAME}' vers '${BACKUP_FILE}'..."

SSL_OPTS=()
if [ -f "${SSL_CA}" ]; then
    SSL_OPTS+=(--ssl-ca="${SSL_CA}" --ssl-mode=REQUIRED)
fi

export MYSQL_PWD="${DB_PASSWORD}"

mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    "${SSL_OPTS[@]}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

unset MYSQL_PWD

if [ ! -s "${BACKUP_FILE}" ]; then
    echo "!! ERREUR : Le fichier de sauvegarde est vide !" >&2
    rm -f "${BACKUP_FILE}"
    exit 1
fi

FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "==> Sauvegarde réussie (${FILE_SIZE}) : ${BACKUP_FILE}"

