#!/usr/bin/env bash
# TSOTSA Kids - Préparation idempotente d'un serveur Ubuntu 24.04 LTS (OVH)
# Usage : sudo ./infra/scripts/preparer_serveur.sh [CLE_PUBLIQUE_SSH_DEPLOY]

set -euo pipefail

DEPLOY_USER="deploy"
APP_DIR="/opt/tsotsa-kids"
DEPLOY_SSH_KEY="${1:-}"

log() {
    echo "[TSOTSA INFRA] $*"
}

check_root() {
    if [[ "$(id -u)" -ne 0 ]]; then
        echo "Erreur : ce script doit être exécuté en tant que root (sudo)." >&2
        exit 1
    fi
}

setup_deploy_user() {
    log "1. Configuration de l'utilisateur ${DEPLOY_USER}..."
    if ! id "${DEPLOY_USER}" &>/dev/null; then
        useradd -m -s /bin/bash -G sudo,docker "${DEPLOY_USER}" 2>/dev/null || useradd -m -s /bin/bash -G sudo "${DEPLOY_USER}"
        log "Utilisateur ${DEPLOY_USER} créé."
    else
        log "Utilisateur ${DEPLOY_USER} déjà existant."
    fi

    # Configuration sudo sans mot de passe pour les déploiements automatisés
    echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-${DEPLOY_USER}"
    chmod 0440 "/etc/sudoers.d/90-${DEPLOY_USER}"

    # Clé SSH pour l'utilisateur deploy si fournie
    if [[ -n "${DEPLOY_SSH_KEY}" ]]; then
        local user_ssh_dir="/home/${DEPLOY_USER}/.ssh"
        mkdir -p "${user_ssh_dir}"
        echo "${DEPLOY_SSH_KEY}" > "${user_ssh_dir}/authorized_keys"
        chmod 0700 "${user_ssh_dir}"
        chmod 0600 "${user_ssh_dir}/authorized_keys"
        chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${user_ssh_dir}"
        log "Clé SSH autorisée configurée pour ${DEPLOY_USER}."
    fi
}

harden_ssh() {
    log "2. Durcissement de la configuration SSH..."
    local ssh_conf="/etc/ssh/sshd_config.d/99-tsotsa-hardening.conf"
    mkdir -p "/etc/ssh/sshd_config.d"
    cat << 'EOF' > "${ssh_conf}"
# Durcissement SSH TSOTSA Kids
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 4
EOF
    chmod 0644 "${ssh_conf}"
    systemctl reload sshd || systemctl reload ssh || true
}

configure_firewall() {
    log "3. Configuration du pare-feu UFW..."
    apt-get update -qq && apt-get install -y -qq ufw
    ufw default deny incoming
    ufw default allow outgoing
    ufw limit 22/tcp comment 'SSH rate-limited'
    ufw allow 80/tcp comment 'HTTP LetEncrypt / Nginx'
    ufw allow 443/tcp comment 'HTTPS Nginx'
    ufw --force enable
    log "Pare-feu UFW activé (ports 22, 80, 443)."
}

configure_auto_updates() {
    log "4. Mises à jour de sécurité automatiques..."
    apt-get install -y -qq unattended-upgrades update-notifier-common
    cat << 'EOF' > /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
    systemctl restart unattended-upgrades || true
}

install_docker() {
    log "5. Installation de Docker et Docker Compose..."
    if ! command -v docker &>/dev/null; then
        apt-get install -y -qq ca-certificates curl gnupg lsb-release
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
        chmod a+r /etc/apt/keyrings/docker.gpg

        local codename
        codename="$(lsb_release -cs)"
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          ${codename} stable" > /etc/apt/sources.list.d/docker.list

        apt-get update -qq
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        systemctl enable --now docker
        usermod -aG docker "${DEPLOY_USER}" || true
        log "Docker installé avec succès."
    else
        log "Docker est déjà installé."
    fi
}

install_nginx_and_certbot() {
    log "6. Installation de Nginx et Certbot..."
    apt-get install -y -qq nginx certbot python3-certbot-nginx
    systemctl enable --now nginx
    mkdir -p /var/www/certbot
    mkdir -p /var/www/tsotsa-kids/app
    mkdir -p /var/www/tsotsa-kids/admin
    chown -R "${DEPLOY_USER}:${DEPLOY_USER}" /var/www/tsotsa-kids
}

setup_app_directory() {
    log "7. Création de l'arborescence ${APP_DIR}..."
    mkdir -p "${APP_DIR}/secrets"
    mkdir -p "${APP_DIR}/backups"
    chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"
    chmod 0700 "${APP_DIR}/secrets"
    log "Arborescence prête."
}

main() {
    check_root
    setup_deploy_user
    harden_ssh
    configure_firewall
    configure_auto_updates
    install_docker
    install_nginx_and_certbot
    setup_app_directory
    log "Préparation du serveur terminée avec succès !"
}

main "$@"

