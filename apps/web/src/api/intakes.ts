/**
 * API client methods for Intake Recording and History.
 */

import { getWebApiClient } from "./client";

export interface IntakeCreatePayload {
  person_id: string;
  item_type: "product" | "food";
  item_id: string;
  quantity: number;
  unit: string;
  consumption?: "all" | "half" | "refused";
  occurred_at?: string;
}

export interface IntakeReadItem {
  id: string;
  person_id: string;
  item_type: string;
  item_id: string;
  quantity: number;
  unit: string;
  consumption: string;
  occurred_at: string;
}

export async function recordIntake(payload: IntakeCreatePayload): Promise<IntakeReadItem> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: unknown }) => Promise<{ data: IntakeReadItem }>;
  }).POST("/v1/intakes", {
    body: {
      ...payload,
      occurred_at: payload.occurred_at || new Date().toISOString(),
      consumption: payload.consumption || "all",
    },
  });
  return res.data;
}

export async function listPersonIntakes(personId: string): Promise<IntakeReadItem[]> {
  try {
    const client = getWebApiClient().client;
    const res = await (client as unknown as {
      GET: (url: string) => Promise<{ data: IntakeReadItem[] }>;
    }).GET(`/v1/persons/${personId}/intakes`);
    return res.data || [];
  } catch {
    return [];
  }
}
