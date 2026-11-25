import { getWebApiClient } from "./client";

export interface EnrolledChild {
  id: string;
  pseudonym: string;
  first_name: string;
  birth_date: string;
  sex: "M" | "F";
  status: "pending" | "validated" | "refused" | "archived";
  created_at: string;
  parent_name?: string | null;
  parent_email?: string | null;
  parent_phone?: string | null;
  assigned_doctor_name?: string | null;
}

export interface EnrollFamilyPayload {
  parent_first_name: string;
  parent_last_name: string;
  parent_email?: string;
  parent_phone: string;
  parent_password?: string;
  region_id?: string;
  locality?: string;
  children: Array<{
    first_name: string;
    birth_date: string;
    sex: "M" | "F";
    weight_kg?: number;
    height_cm?: number;
    muac_mm?: number;
    edema?: boolean;
  }>;
}

export async function listEnrolledFamilies(): Promise<EnrolledChild[]> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    GET: (url: string) => Promise<{ data?: EnrolledChild[]; error?: unknown }>;
  }).GET("/v1/field-agent/families");
  if (res.error) throw res.error;
  return res.data || [];
}

export async function enrollFamily(payload: EnrollFamilyPayload): Promise<void> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: unknown }) => Promise<{ data?: unknown; error?: unknown }>;
  }).POST("/v1/field-agent/enroll-family", {
    body: payload,
  });
  if (res.error) throw res.error;
}

export async function updateEnrolledChild(
  personId: string,
  payload: { first_name: string; birth_date: string; sex: "M" | "F" }
): Promise<void> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    PUT: (url: string, opts: { body: unknown }) => Promise<{ data?: unknown; error?: unknown }>;
  }).PUT(`/v1/field-agent/children/${personId}`, {
    body: payload,
  });
  if (res.error) throw res.error;
}

export async function deleteEnrolledChild(personId: string): Promise<void> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    DELETE: (url: string) => Promise<{ data?: unknown; error?: unknown }>;
  }).DELETE(`/v1/field-agent/children/${personId}`);
  if (res.error) throw res.error;
}
