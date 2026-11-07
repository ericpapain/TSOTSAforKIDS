/**
 * Service for recording and retrieving intakes, bridging online API and SQLite offline queue.
 */

import { API_BASE_URL } from "../../api/client";
import { getStoredTokens } from "../../api/storage";
import {
  enqueueIntake,
  generateUUID,
  getPendingIntakes,
  isOnline,
  type OfflineIntake,
} from "../../offline";
import type { IntakeCreatePayload, IntakeItem } from "./types";

function buildOfflineItem(
  payload: IntakeCreatePayload,
  id: string
): OfflineIntake {
  const now = new Date().toISOString();
  return {
    id,
    person_id: payload.person_id,
    person_name: payload.person_name || "Amina",
    item_type: payload.item_type,
    item_id: payload.item_id,
    product_name: payload.product_name,
    quantity: payload.quantity,
    unit: payload.unit,
    taken_at: payload.taken_at || now,
    consumption: payload.consumption,
    origin: payload.origin || "app",
    schedule_time_id: payload.schedule_time_id ?? null,
    notes: payload.notes ?? null,
    created_at: now,
    status: "pending",
  };
}

async function tryPostIntake(payload: IntakeCreatePayload, id: string) {
  const tokens = await getStoredTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}/v1/intakes`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id,
      person_id: payload.person_id,
      item_type: payload.item_type,
      item_id: payload.item_id,
      quantity: Number(payload.quantity) || 1,
      unit: payload.unit,
      taken_at: payload.taken_at || new Date().toISOString(),
      consumption: payload.consumption,
      origin: payload.origin || "app",
      schedule_time_id: payload.schedule_time_id ?? null,
      notes: payload.notes ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as IntakeItem;
}

export async function recordIntake(
  payload: IntakeCreatePayload
): Promise<IntakeItem> {
  const id = payload.id || generateUUID();
  const offlineItem = buildOfflineItem(payload, id);

  if (!isOnline()) {
    await enqueueIntake(offlineItem);
    return { ...offlineItem, is_offline_pending: true };
  }

  try {
    const recorded = await tryPostIntake(payload, id);
    return { ...recorded, product_name: payload.product_name };
  } catch (_err) {
    // On network failure, persist to offline queue
    await enqueueIntake(offlineItem);
    return { ...offlineItem, is_offline_pending: true };
  }
}

export async function listPersonIntakes(
  personId: string
): Promise<IntakeItem[]> {
  const pending = await getPendingIntakes();
  const pendingForPerson: IntakeItem[] = pending
    .filter((p) => p.person_id === personId)
    .map((p) => ({
      ...p,
      is_offline_pending: true,
    }));

  try {
    const tokens = await getStoredTokens();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (tokens?.accessToken) {
      headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    const res = await fetch(`${API_BASE_URL}/v1/persons/${personId}/intakes`, {
      headers,
    });
    if (!res.ok) {
      return pendingForPerson;
    }
    const serverItems = (await res.json()) as IntakeItem[];
    const serverIds = new Set(serverItems.map((s) => s.id));
    const merged = [
      ...pendingForPerson.filter((p) => !serverIds.has(p.id)),
      ...serverItems,
    ];
    merged.sort(
      (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime()
    );
    return merged;
  } catch (_err) {
    return pendingForPerson;
  }
}

