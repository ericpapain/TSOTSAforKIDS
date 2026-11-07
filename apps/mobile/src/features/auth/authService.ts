/**
 * Authentication service orchestration for the TSOTSA Kids mobile application.
 * Manages API calls for Google, Phone OTP, and Email authentication flows.
 */

import { API_BASE_URL, getApiClient } from "../../api/client";
import { clearStoredTokens, saveStoredTokens } from "../../api/storage";
import type { AuthResult, PhoneOtpResult, UserRole } from "./types";

interface ApiErrorResponse {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
}

function parseErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message.includes("Network request failed") || err.message.includes("Failed to fetch")) {
      return "Erreur réseau. Vérifiez votre connexion Internet.";
    }
    return err.message;
  }
  return fallback;
}

async function postAuthRequest<T>(endpoint: string, body: unknown): Promise<{ data?: T; error?: string }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = (await response.json()) as T & ApiErrorResponse;

    if (!response.ok) {
      let msg = "Une erreur est survenue.";
      if (typeof json.detail === "string") {
        msg = json.detail;
      } else if (Array.isArray(json.detail) && json.detail[0]?.msg) {
        msg = json.detail[0].msg;
      } else if (json.message) {
        msg = json.message;
      }
      return { error: msg };
    }

    return { data: json as T };
  } catch (e) {
    return { error: parseErrorMessage(e, "Erreur de connexion au serveur.") };
  }
}

interface RawTokenResponse {
  access_token: string;
  refresh_token?: string;
  role?: string;
}

async function handleTokenSuccess(raw: RawTokenResponse): Promise<AuthResult> {
  const role = (raw.role || "user") as UserRole;
  await saveStoredTokens(
    {
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token,
    },
    role
  );
  getApiClient().setTokens({
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
  });
  return { success: true, role };
}

export async function requestPhoneOtp(phone: string): Promise<PhoneOtpResult> {
  const cleaned = phone.replace(/\s+/g, "");
  const res = await postAuthRequest<{ expires_in?: number; message?: string }>("/v1/auth/phone/request", {
    phone_e164: cleaned,
  });

  if (res.error) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    expiresIn: res.data?.expires_in ?? 300,
    message: res.data?.message,
  };
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<AuthResult> {
  const cleanedPhone = phone.replace(/\s+/g, "");
  const res = await postAuthRequest<RawTokenResponse>("/v1/auth/phone/verify", {
    phone_e164: cleanedPhone,
    code,
  });

  if (res.error) {
    return { success: false, error: res.error };
  }
  if (!res.data?.access_token) {
    return { success: false, error: "Jeton d'authentification manquant." };
  }
  return handleTokenSuccess(res.data);
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  const res = await postAuthRequest<RawTokenResponse>("/v1/auth/email/login", {
    email: email.trim().toLowerCase(),
    password,
  });

  if (res.error) {
    return { success: false, error: res.error };
  }
  if (!res.data?.access_token) {
    return { success: false, error: "Jeton d'authentification manquant." };
  }
  return handleTokenSuccess(res.data);
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  const res = await postAuthRequest<{ message?: string }>("/v1/auth/email/register", {
    email: email.trim().toLowerCase(),
    password,
    display_name: displayName,
  });

  if (res.error) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    message: res.data?.message || "Compte créé avec succès. Vérifiez vos e-mails.",
  };
}

export async function authenticateWithGoogle(idToken: string): Promise<AuthResult> {
  const res = await postAuthRequest<RawTokenResponse>("/v1/auth/google", {
    id_token: idToken,
  });

  if (res.error) {
    return { success: false, error: res.error };
  }
  if (!res.data?.access_token) {
    return { success: false, error: "Jeton d'authentification manquant." };
  }
  return handleTokenSuccess(res.data);
}

export async function logout(): Promise<void> {
  await clearStoredTokens();
  getApiClient().clearTokens();
}

