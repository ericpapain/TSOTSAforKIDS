#!/usr/bin/env bash
# Exécution automatisée des scénarios de test de charge k6
# Environnement : RECETTE UNIQUEMENT (jamais en production).
# Usage : ./tests/load/run_load_tests.sh <URL_CIBLE> [SCENARIO: 1|2|3|all]

set -euo pipefail

TARGET_URL="${1:?usage: $0 <TARGET_URL> [scenario: 1|2|3|all]}"
SCENARIO="${2:-all}"

# Protection absolue : refus d'exécution sur le domaine de production
if [[ "${TARGET_URL}" =~ (api|app|admin)\.tsotsa-for-kids\.com ]] && [[ ! "${TARGET_URL}" =~ \.recette\. ]]; then
    echo "!! ERREUR DE SÉCURITÉ : Exécution formellement interdite en production !" >&2
    echo "!! Les tests de charge doivent être exécutés exclusivement sur l'environnement de RECETTE." >&2
    exit 1
fi

echo "=========================================================="
echo " TSOTSA Kids - Tests de charge k6"
echo " Cible : ${TARGET_URL}"
echo " Date  : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=========================================================="

run_k6() {
    local script="$1"
    echo "==> Exécution du scénario : ${script}"
    docker run --rm -i \
        -v "$(pwd)/tests/load:/scripts" \
        -e TARGET_URL="${TARGET_URL}" \
        grafana/k6:latest run "/scripts/${script}"
}

case "${SCENARIO}" in
    1)
        run_k6 "scenario_users.js"
        ;;
    2)
        run_k6 "scenario_caregivers.js"
        ;;
    3)
        python tests/load/scenario_scheduler.py
        ;;
    all)
        echo "--> Lancement du Scénario 1 : 2 000 utilisateurs simultanés..."
        run_k6 "scenario_users.js"

        echo "--> Lancement du Scénario 2 : 200 soignants simultanés..."
        run_k6 "scenario_caregivers.js"

        echo "--> Lancement du Scénario 3 : 50 000 rappels planifiés..."
        python tests/load/scenario_scheduler.py
        ;;
    *)
        echo "Scénario inconnu : ${SCENARIO}. Utilisez 1, 2, 3 ou all." >&2
        exit 1
        ;;
esac

echo "=========================================================="
echo " Tests de charge terminés avec succès."
echo "=========================================================="

