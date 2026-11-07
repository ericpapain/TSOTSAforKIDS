/**
 * Synchronization service for offline recorded intakes.
 * Communicates with POST /v1/sync/intakes.
 */

import { API_BASE_URL } from "../api/client";
import { getStoredTokens } from "../api/storage";
import { getPendingIntakes, removeIntakes } from "./sqliteQueue";
import type { OfflineIntake, SyncResult } from "./types";

function buildSyncPayload(items: OfflineIntake[]) {
  return {
    intakes: items.map((it) => ({
      id: it.id,
      person_id: it.person_id,
      item_type: it.item_type,
      item_id: it.item_id,
      quantity: Number(it.quantity) || 1,
      unit: it.unit,
      taken_at: it.taken_at,
      consumption: it.consumption,
      origin: it.origin,
      schedule_time_id: it.schedule_time_id ?? null,
      notes: it.notes ?? null,
    })),
  };
}

async function sendSyncRequest(
  payload: ReturnType<typeof buildSyncPayload>
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const tokens = await getStoredTokens();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/v1/sync/intakes`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = (await response.json().catch(() => ({}))) as {
        detail?: string;
      };
      return {
        ok: false,
        status: response.status,
        error: errJson.detail || `HTTP ${response.status}`,
      };
    }

    return { ok: true, status: response.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur réseau";
    return { ok: false, status: 0, error: message };
  }
}

export async function syncPendingIntakes(): Promise<SyncResult> {
  const pending = await getPendingIntakes();
  if (pending.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const payload = buildSyncPayload(pending);
  const result = await sendSyncRequest(payload);

  if (result.ok) {
    const ids = pending.map((it) => it.id);
    await removeIntakes(ids);
    return { syncedCount: ids.length, failedCount: 0 };
  }

  return {
    syncedCount: 0,
    failedCount: pending.length,
    errors: [result.error || "Synchronisation impossible"],
  };
}

