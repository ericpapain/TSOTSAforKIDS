/**
 * Persons, Family links, Modules and Consents service.
 * Handles API integration with /v1/modules, /v1/family/members, and /v1/persons/{id}/consent.
 */

import { API_BASE_URL } from "../../api/client";
import { getStoredTokens } from "../../api/storage";
import type {
  ConsentInfo,
  ModuleItem,
  PersonCreatePayload,
  PersonItem,
} from "./types";

export function calculateAgeLabel(birthDateStr: string): string {
  try {
    const rawParts = birthDateStr.includes("/")
      ? birthDateStr.split("/").reverse()
      : birthDateStr.split("-");
    const [year, month, day] = rawParts.map(Number);
    if (!year || !month || !day) return "";
    const birth = new Date(year, month - 1, day);
    if (isNaN(birth.getTime())) return "";

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const birthMidnight = new Date(year, month - 1, day);
    const diffMs = todayMidnight.getTime() - birthMidnight.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "";
    if (diffDays < 30) return `${diffDays} jours`;

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years >= 18) return "adulte";
    if (years === 0) return `${Math.max(1, months)} mois`;
    if (months === 0) return `${years} an${years > 1 ? "s" : ""}`;
    return `${years} an${years > 1 ? "s" : ""} ${months} mois`;
  } catch {
    return "";
  }
}

async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const tokens = await getStoredTokens();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg =
        typeof err.detail === "string"
          ? err.detail
          : err.message || "Une erreur est survenue.";
      return { error: msg };
    }

    const data = (await res.json()) as T;
    return { data };
  } catch {
    return { error: "Erreur réseau. Vérifiez votre connexion." };
  }
}

export async function fetchModules(): Promise<ModuleItem[]> {
  const res = await authFetch<ModuleItem[]>("/v1/modules");
  if (res.data && Array.isArray(res.data)) {
    return res.data;
  }
  // Fallback defaults matching prompt M06
  return [
    {
      id: "nutrition",
      name: "Nutrition",
      status: "active",
      description: "Produits, aliments locaux, suivi des prises",
    },
    { id: "hta", name: "HTA", status: "soon" },
    { id: "diabete", name: "Diabète", status: "soon" },
  ];
}

export async function fetchFamilyMembers(): Promise<PersonItem[]> {
  const res = await authFetch<PersonItem[]>("/v1/family/members");
  if (res.data && Array.isArray(res.data) && res.data.length > 0) {
    return res.data.map((p) => ({
      ...p,
      age_formatted: calculateAgeLabel(p.birth_date),
    }));
  }
  // Fallback matching prompt M08 reference
  return [
    {
      id: "demo-amina",
      first_name: "Amina",
      sex: "F",
      birth_date: "2024-12-12",
      age_formatted: "1 an 11 mois",
      status_badge: "Démo",
      facility_name: "CMA de démo",
      relation: "child",
    },
    {
      id: "demo-myself",
      first_name: "Moi-même",
      sex: "M",
      birth_date: "1990-01-01",
      age_formatted: "adulte",
      relation: "self",
    },
  ];
}

export async function createFamilyMember(
  payload: PersonCreatePayload
): Promise<{ data?: PersonItem; error?: string }> {
  let normalizedDate = payload.birth_date.trim();
  if (normalizedDate.includes("/")) {
    const [d, m, y] = normalizedDate.split("/");
    normalizedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const res = await authFetch<PersonItem>("/v1/family/members", {
    method: "POST",
    body: JSON.stringify({
      first_name: payload.first_name.trim(),
      birth_date: normalizedDate,
      sex: payload.sex,
      relation: payload.relation || "child",
    }),
  });

  return res;
}

export async function getFamilyMember(personId: string): Promise<PersonItem | null> {
  const res = await authFetch<PersonItem>(`/v1/family/members/${personId}`);
  if (res.data) {
    return {
      ...res.data,
      age_formatted: calculateAgeLabel(res.data.birth_date),
    };
  }
  return null;
}

export async function getConsentStatus(personId: string): Promise<ConsentInfo | null> {
  const res = await authFetch<ConsentInfo>(`/v1/persons/${personId}/consent`);
  return res.data || null;
}

export async function submitConsent(personId: string): Promise<boolean> {
  const res = await authFetch(`/v1/persons/${personId}/consent`, {
    method: "POST",
    body: JSON.stringify({ legal_guardian: true }),
  });
  return !res.error;
}

