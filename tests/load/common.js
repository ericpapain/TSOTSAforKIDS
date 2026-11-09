/**
 * Configuration partagée et utilitaires pour les scénarios de charge k6.
 * Environnement cible : RECETTE UNIQUEMENT (jamais en production).
 */

import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.TARGET_URL || 'http://127.0.0.1:8000';

export const TEST_CREDENTIALS = {
  parent: {
    email: __ENV.LOAD_PARENT_EMAIL || 'load.parent.001@tsotsa-for-kids.com',
    password: __ENV.LOAD_PARENT_PASSWORD || 'SecurePassword123!',
  },
  caregiver: {
    email: __ENV.LOAD_CAREGIVER_EMAIL || 'load.caregiver.001@tsotsa-for-kids.com',
    password: __ENV.LOAD_CAREGIVER_PASSWORD || 'SecurePassword123!',
  },
};

export const COMMON_THRESHOLDS = {
  http_req_failed: ['rate<0.001'],
  'http_req_duration{endpoint:standard}': ['p(95)<300'],
  'http_req_duration{endpoint:equivalence}': ['p(95)<500'],
};

export function login(email, password) {
  const url = `${BASE_URL}/v1/auth/email/login`;
  const payload = JSON.stringify({ email, password });
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'standard', name: 'login' },
  };

  const res = http.post(url, payload, params);
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns access_token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.access_token === 'string';
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    return null;
  }
  return JSON.parse(res.body).access_token;
}

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

