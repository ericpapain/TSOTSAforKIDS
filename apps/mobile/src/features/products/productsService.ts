/**
 * Products, Equivalence, Foods and Custom Products API service.
 */

import { API_BASE_URL } from "../../api/client";
import { getStoredTokens } from "../../api/storage";
import type {
  CustomProductCreatePayload,
  EquivalenceResponse,
  FoodDetail,
  ProductDetail,
  ProductSummary,
} from "./types";

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
      const errJson = await res.json().catch(() => ({}));
      return {
        error:
          (errJson as { detail?: string }).detail ??
          `Erreur serveur (${res.status})`,
      };
    }

    const data = (await res.json()) as T;
    return { data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur réseau";
    return { error: message };
  }
}

export async function listProducts(): Promise<ProductSummary[]> {
  const res = await authFetch<ProductSummary[]>("/v1/products");
  return res.data ?? [];
}

export async function getProduct(productId: string): Promise<ProductDetail | null> {
  const res = await authFetch<ProductDetail>(`/v1/products/${productId}`);
  return res.data ?? null;
}

export interface EquivalenceOptions {
  nutrients?: string[];
  region?: string;
  strict?: boolean;
  thresholdPct?: number;
}

export function buildEquivalentsQuery(options?: EquivalenceOptions): string {
  const params = new URLSearchParams();
  if (options?.nutrients && options.nutrients.length > 0) {
    params.set("nutrients", options.nutrients.join(","));
  }
  if (options?.region) {
    params.set("region", options.region);
  }
  if (options?.strict !== undefined) {
    params.set("strict", String(options.strict));
  }
  if (options?.thresholdPct !== undefined) {
    params.set("threshold_pct", String(options.thresholdPct));
  }
  const queryStr = params.toString();
  return queryStr ? `?${queryStr}` : "";
}

export async function getProductEquivalents(
  productId: string,
  options?: EquivalenceOptions
): Promise<EquivalenceResponse | null> {
  const query = buildEquivalentsQuery(options);
  const res = await authFetch<EquivalenceResponse>(
    `/v1/products/${productId}/equivalents${query}`
  );
  return res.data ?? null;
}

export async function getFoodDetail(foodId: string): Promise<FoodDetail | null> {
  const res = await authFetch<FoodDetail>(`/v1/foods/${foodId}`);
  return res.data ?? null;
}

export async function createCustomProduct(
  payload: CustomProductCreatePayload
): Promise<{ data?: ProductDetail; error?: string }> {
  return authFetch<ProductDetail>("/v1/custom-products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProductPrice(
  productId: string,
  region?: string
): Promise<{ price?: number; currency?: string; display?: string } | null> {
  const q = region ? `?region=${encodeURIComponent(region)}` : "";
  const res = await authFetch<{
    amount?: number;
    currency?: string;
  }>(`/v1/pricing/products/${productId}/latest${q}`);

  if (res.data?.amount) {
    return {
      price: res.data.amount,
      currency: res.data.currency ?? "FCFA",
      display: `${res.data.amount} ${res.data.currency ?? "FCFA"}`,
    };
  }
  return null;
}

export async function getUserPreferredRegion(): Promise<string> {
  const res = await authFetch<{
    region_name?: string;
    region_code?: string;
    region?: string;
  }>("/v1/users/me/region");
  return res.data?.region_name || res.data?.region || "Ouest";
}

