/**
 * API client methods for Followed Persons, Family Links, and Patient Validation.
 */

import { getWebApiClient } from "./client";

export interface ApiPerson {
  id: string;
  pseudonym: string;
  first_name: string;
  birth_date: string;
  sex: "M" | "F";
  region_id?: string | null;
  relation?: string | null;
  is_primary?: boolean | null;
  status: "pending" | "validated" | "refused" | "archived";
  doctor_id?: string | null;
  doctor_name?: string | null;
  created_at: string;
}

export interface CreatePersonPayload {
  first_name: string;
  birth_date: string;
  sex: "M" | "F";
  region_id?: string | null;
  relation?: "self" | "child" | "relative";
}

export interface PendingPatient {
  id: string;
  pseudonym: string;
  first_name: string;
  birth_date: string;
  sex: string;
  region_id?: string | null;
  status: string;
  created_at: string;
  validated_at?: string | null;
  refusal_reason?: string | null;
  registered_by_name?: string | null;
  registered_by_role?: string | null;
}

export interface PendingStaffUser {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  locality?: string | null;
  preferred_locale: string;
  status: string;
  roles: string[];
  permissions: string[];
  is_verified_caregiver: boolean;
}

export async function listFamilyMembers(): Promise<ApiPerson[]> {
  try {
    const client = getWebApiClient().client;
    const res = await (client as unknown as { GET: (url: string) => Promise<{ data: ApiPerson[] }> })
      .GET("/v1/family/members");
    return res.data || [];
  } catch {
    return [];
  }
}

export async function createFamilyMember(payload: CreatePersonPayload): Promise<ApiPerson> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: CreatePersonPayload }) => Promise<{ data: ApiPerson }>;
  }).POST("/v1/family/members", { body: payload });
  return res.data;
}

export async function deleteFamilyMember(personId: string): Promise<void> {
  const client = getWebApiClient().client;
  await (client as unknown as { DELETE: (url: string) => Promise<void> })
    .DELETE(`/v1/family/members/${personId}`);
}

export async function listPendingPatients(): Promise<PendingPatient[]> {
  try {
    const client = getWebApiClient().client;
    const res = await (client as unknown as { GET: (url: string) => Promise<{ data: PendingPatient[] }> })
      .GET("/v1/patients/pending");
    return res.data || [];
  } catch {
    return [];
  }
}

export async function validatePatient(
  personId: string,
  decision: "validated" | "refused",
  refusalReason?: string
): Promise<PendingPatient> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: { decision: string; refusal_reason?: string } }) => Promise<{ data: PendingPatient }>;
  }).POST(`/v1/patients/${personId}/validate`, {
    body: { decision, refusal_reason: refusalReason },
  });
  return res.data;
}

export async function assignPatientCaregiver(
  personId: string,
  caregiverId: string,
  organizationId: string,
  reason?: string
): Promise<{ status: string }> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: unknown }) => Promise<{ data: { status: string } }>;
  }).POST(`/v1/patients/${personId}/assign`, {
    body: { caregiver_id: caregiverId, organization_id: organizationId, reason },
  });
  return res.data;
}

export async function deletePatientByStaff(personId: string, reason: string): Promise<{ status: string }> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    DELETE: (url: string, opts: { body: { reason: string } }) => Promise<{ data: { status: string } }>;
  }).DELETE(`/v1/patients/${personId}`, {
    body: { reason },
  });
  return res.data;
}

export async function promoteSuperCaregiver(caregiverId: string): Promise<{ message: string }> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: { caregiver_id: string } }) => Promise<{ data: { message: string } }>;
  }).POST("/v1/staff/promote-super-caregiver", {
    body: { caregiver_id: caregiverId },
  });
  return res.data;
}

export async function validateAndAssignPatient(
  personId: string,
  payload: {
    decision: "validated" | "refused";
    doctor_id?: string;
    field_agent_id?: string;
    notes?: string;
  }
): Promise<PendingPatient> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: unknown }) => Promise<{ data: PendingPatient }>;
  }).POST(`/v1/patients/${personId}/validate-and-assign`, {
    body: payload,
  });
  return res.data;
}

export async function listPendingStaff(): Promise<PendingStaffUser[]> {
  try {
    const client = getWebApiClient().client;
    const res = await (client as unknown as { GET: (url: string) => Promise<{ data: PendingStaffUser[] }> })
      .GET("/v1/staff/pending");
    return res.data || [];
  } catch {
    return [];
  }
}

export async function validateStaff(
  userId: string,
  decision: "approved" | "rejected",
  refusalReason?: string
): Promise<{ message: string }> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string, opts: { body: { decision: string; refusal_reason?: string } }) => Promise<{ data: { message: string } }>;
  }).POST(`/v1/staff/${userId}/validate`, {
    body: { decision, refusal_reason: refusalReason },
  });
  return res.data;
}

export async function suspendStaff(userId: string): Promise<{ message: string }> {
  const client = getWebApiClient().client;
  const res = await (client as unknown as {
    POST: (url: string) => Promise<{ data: { message: string } }>;
  }).POST(`/v1/staff/${userId}/suspend`);
  return res.data;
}

export interface NetworkPatient {
  id: string;
  code: string;
  first_name: string;
  birth_date: string;
  age: string;
  gender: string;
  region: string;
  facility: string;
  status: string;
  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
}

export interface DoctorUser {
  id: string;
  name: string;
  email: string;
  facility: string;
  specialty: string;
  is_super_caregiver: boolean;
  canReadAll: boolean;
  canAssign: boolean;
  canValidateStaff: boolean;
}

export async function listAllNetworkPatients(): Promise<NetworkPatient[]> {
  try {
    const client = getWebApiClient().client;
    const res = await (client as unknown as { GET: (url: string) => Promise<{ data: NetworkPatient[] }> })
      .GET("/v1/patients/all");
    return res.data || [];
  } catch {
    return [];
  }
}

export async function listActiveDoctors(): Promise<DoctorUser[]> {
  try {
    const client = getWebApiClient().client;
    const res = await (client as unknown as { GET: (url: string) => Promise<{ data: DoctorUser[] }> })
      .GET("/v1/staff/doctors");
    return res.data || [];
  } catch {
    return [];
  }
}

export async function grantPermission(targetUserId: string, permissionCode: string): Promise<void> {
  const client = getWebApiClient().client;
  await (client as unknown as {
    POST: (url: string, opts: { body: { target_user_id: string; permission_code: string } }) => Promise<unknown>;
  }).POST("/v1/permissions/grant", {
    body: { target_user_id: targetUserId, permission_code: permissionCode },
  });
}

export async function revokePermission(targetUserId: string, permissionCode: string): Promise<void> {
  const client = getWebApiClient().client;
  await (client as unknown as {
    POST: (url: string, opts: { body: { target_user_id: string; permission_code: string } }) => Promise<unknown>;
  }).POST("/v1/permissions/revoke", {
    body: { target_user_id: targetUserId, permission_code: permissionCode },
  });
}



