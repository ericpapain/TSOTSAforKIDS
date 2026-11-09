/**
 * Scénario 2 : 200 soignants simultanés sur le tableau de bord soignant.
 * Parcours : consultation tableau de bord -> alertes actives -> cohorte des suivis.
 * Environnement : RECETTE uniquement.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_CREDENTIALS, authHeaders, login } from './common.js';

export const options = {
  stages: [
    { duration: '30s', target: 200 }, // Montée progressive vers 200 soignants
    { duration: '5m', target: 200 },  // Palier de 5 minutes
    { duration: '30s', target: 0 },   // Descente
  ],
  thresholds: {
    http_req_failed: ['rate<0.001'],
    'http_req_duration{endpoint:standard}': ['p(95)<300'],
  },
};

export function setup() {
  const token = login(TEST_CREDENTIALS.caregiver.email, TEST_CREDENTIALS.caregiver.password);
  return { sharedToken: token };
}

export default function (data) {
  const headers = authHeaders(data.sharedToken);

  // 1. Tableau de bord soignant (statistiques et résumés)
  const dashRes = http.get(`${BASE_URL}/v1/caregiver/dashboard`, {
    headers,
    tags: { endpoint: 'standard', name: 'caregiver_dashboard' },
  });
  check(dashRes, {
    'dashboard status 200': (r) => r.status === 200,
  });

  // 2. Alertes cliniques en cours
  const alertsRes = http.get(`${BASE_URL}/v1/alerts`, {
    headers,
    tags: { endpoint: 'standard', name: 'caregiver_alerts' },
  });
  check(alertsRes, {
    'alerts status 200': (r) => r.status === 200,
  });

  // 3. Liste de la cohorte des personnes suivies
  const personsRes = http.get(`${BASE_URL}/v1/caregiver/persons`, {
    headers,
    tags: { endpoint: 'standard', name: 'caregiver_cohort' },
  });
  check(personsRes, {
    'cohort status 200': (r) => r.status === 200,
  });

  sleep(1);
}

