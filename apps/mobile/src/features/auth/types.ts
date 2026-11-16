export type CanonicalRole =
  | "parent"
  | "field_agent"
  | "caregiver"
  | "super_caregiver"
  | "admin";

export type UserRole = CanonicalRole | "user";

export type AccountStatus = "pending" | "active" | "refused" | "suspended" | "deleted";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  role?: UserRole;
  status?: AccountStatus;
}

export interface AuthResult {
  success: boolean;
  role?: UserRole;
  status?: AccountStatus;
  error?: string;
  message?: string;
}

export interface PhoneOtpResult {
  success: boolean;
  expiresIn?: number;
  message?: string;
  error?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm?: string;
  role: CanonicalRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  region?: string;
  locality?: string;
  facility_id?: string;
  facility_name?: string;
  specialty?: string;
  order_number?: string;
  organization?: string;
}
