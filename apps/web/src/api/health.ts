/**
 * API client methods for Child Health & Well-being module.
 */

import { getWebApiClient } from "./client";

export interface SymptomCatalogItem {
  code: string;
  category: string;
  label_fr: string;
  label_en: string;
  is_danger_sign: boolean;
  conditional_questions?: Array<{
    key: string;
    label_fr: string;
    type: "boolean" | "number" | "text";
  }>;
  display_order: number;
}

export interface HealthEventSymptomInput {
  symptom_code: string;
  duration?: string;
  duration_days?: number;
  recurrence_count?: number;
  specific_metrics?: Record<string, unknown>;
}

export interface HealthEventCreatePayload {
  person_id: string;
  intake_id?: string | null;
  declaration_context?: "standalone" | "during_meal";
  meal_interrupted?: boolean;
  intake_quantity_consumed?: string;
  symptoms: HealthEventSymptomInput[];
  temperature_celsius?: number;
  stools_frequency_per_day?: number;
  vomiting_frequency_per_day?: number;
  comment?: string;
}

export interface HealthEventItem {
  id: string;
  person_id: string;
  reported_by: string;
  created_at: string;
  declaration_context: string;
  status: "open" | "under_review" | "resolved" | "submitted";
  priority: "normal" | "attention" | "high" | "urgent";
  has_danger_sign: boolean;
  parent_guidance_message: string;
  comment?: string | null;
  intake_id?: string | null;
  symptoms: Array<{
    id: string;
    symptom_code: string;
    duration: string;
    duration_days?: number | null;
    specific_metrics?: Record<string, unknown>;
  }>;
  caregiver_guidance_notes?: string[];
  suggested_conditions?: string[];
  assessments?: Array<{
    id: string;
    caregiver_id: string;
    clinical_notes: string;
    suspected_condition?: string;
    requires_investigation: boolean;
    investigation_type?: string;
    created_at: string;
  }>;
  actions?: Array<{
    id: string;
    actor_id: string;
    action_type: string;
    details: string;
    created_at: string;
  }>;
}

export interface HealthAlertItem {
  event_id: string;
  person_id: string;
  person_code?: string;
  created_at: string;
  priority: "normal" | "attention" | "high" | "urgent";
  status: string;
  symptoms_summary: string[];
  has_danger_sign: boolean;
  requires_urgent_transfer: boolean;
}

export async function getSymptomCatalog(): Promise<SymptomCatalogItem[]> {
  try {
    const client = getWebApiClient().client;
    const res = await (client as unknown as { GET: (url: string) => Promise<{ data: SymptomCatalogItem[] }> })
      .GET("/v1/health/symptoms/catalog");
    return res.data || [];
  } catch {
    return [];
  }
}

export async function createHealthEvent(
  payload: HealthEventCreatePayload
): Promise<HealthEventItem> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: HealthEventCreatePayload }) => Promise<{ data: HealthEventItem }>;
  }).POST("/v1/health/events", { body: payload });
  return res.data;
}

export async function listHealthEventsForPerson(
  personId: string,
  status?: string,
  priority?: string
): Promise<HealthEventItem[]> {
  try {
    const client = getWebApiClient().client;
    const query: Record<string, string> = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const res = await (client as unknown as {
      GET: (url: string, opts?: { params: { query: Record<string, string> } }) => Promise<{ data: HealthEventItem[] }>;
    }).GET(`/v1/health/events/person/${personId}`, { params: { query } });
    return res.data || [];
  } catch {
    return [];
  }
}

export async function addClinicalAssessment(
  eventId: string,
  payload: {
    clinical_notes: string;
    suspected_condition?: string;
    requires_investigation?: boolean;
    investigation_type?: string;
  }
): Promise<HealthEventItem> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: unknown }) => Promise<{ data: HealthEventItem }>;
  }).POST(`/v1/health/events/${eventId}/assessments`, { body: payload });
  return res.data;
}

export async function addHealthAction(
  eventId: string,
  payload: {
    action_type: string;
    details: string;
  }
): Promise<HealthEventItem> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: unknown }) => Promise<{ data: HealthEventItem }>;
  }).POST(`/v1/health/events/${eventId}/actions`, { body: payload });
  return res.data;
}

export async function listHealthAlerts(minPriority?: string): Promise<HealthAlertItem[]> {
  try {
    const client = getWebApiClient().client;
    const query: Record<string, string> = {};
    if (minPriority) query.min_priority = minPriority;

    const res = await (client as unknown as {
      GET: (url: string, opts?: { params: { query: Record<string, string> } }) => Promise<{ data: HealthAlertItem[] }>;
    }).GET("/v1/health/alerts", { params: { query } });
    return res.data || [];
  } catch {
    return [];
  }
}
