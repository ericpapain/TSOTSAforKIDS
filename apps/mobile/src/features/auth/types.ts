export type UserRole = "user" | "caregiver" | "admin";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  role?: UserRole;
}

export interface AuthResult {
  success: boolean;
  role?: UserRole;
  error?: string;
  message?: string;
}

export interface PhoneOtpResult {
  success: boolean;
  expiresIn?: number;
  message?: string;
  error?: string;
}

