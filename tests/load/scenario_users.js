/**
 * Scénario 1 : 2 000 utilisateurs simultanés pendant 10 minutes.
 * Parcours : connexion -> liste des personnes -> recherche d'équivalents -> confirmation de prise.
 * Environnement : RECETTE uniquement.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_CREDENTIALS, COMMON_THRESHOLDS, authHeaders, login } from './common.js';

export const options = {
  stages: [
    { duration: '1m', target: 2000 },  // Montée en charge progressive jusqu'à 2 000 VU
    { duration: '8m', target: 2000 },  // Palier soutenu de 8 minutes
    { duration: '1m', target: 0 },     // Descente progressive
  ],
  thresholds: COMMON_THRESHOLDS,
};

export function setup() {
  const token = login(TEST_CREDENTIALS.parent.email, TEST_CREDENTIALS.parent.password);
  return { sharedToken: token };
}

export default function (data) {
  const headers = authHeaders(data.sharedToken);

  // 1. Liste des personnes suivies
  const personsRes = http.get(`${BASE_URL}/v1/family/persons`, {
    headers,
    tags: { endpoint: 'standard', name: 'list_persons' },
  });
  check(personsRes, {
    'persons status 200': (r) => r.status === 200,
  });

  // 2. Recherche d'équivalents nutritionnels (seuil 500 ms)
  const productId = 'f75-unicef-2007';
  const equivRes = http.get(`${BASE_URL}/v1/products/${productId}/equivalents?region=Centre`, {
    headers,
    tags: { endpoint: 'equivalence', name: 'search_equivalents' },
  });
  check(equivRes, {
    'equivalence status 200': (r) => r.status === 200,
    'equivalents array returned': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.equivalents);
      } catch (e) {
        return false;
      }
    },
  });

  // 3. Confirmation d'une prise nutritionnelle
  const intakePayload = JSON.stringify({
    person_id: '018f3a2b-4c5d-7e8f-9a0b-1c2d3e4f5a6b',
    item_type: 'product',
    product_id: 'f75-unicef-2007',
    quantity: 150.0,
    unit: 'ml',
    consumption: 'all',
    origin: 'app',
    taken_at: new Date().toISOString(),
  });
  const intakeRes = http.post(`${BASE_URL}/v1/intakes`, intakePayload, {
    headers,
    tags: { endpoint: 'standard', name: 'confirm_intake' },
  });
  check(intakeRes, {
    'intake recorded 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}

