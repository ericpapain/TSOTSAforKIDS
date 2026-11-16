import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole, UserSession } from "../types";
import { getWebApiClient } from "./client";
import { changeAppLanguage } from "../i18n/setup";
import { normalizeLocale } from "@tsotsa/i18n";

const PROFESSIONAL_ROLES: UserRole[] = ["admin", "super_caregiver", "caregiver", "field_agent"];
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function hasPermission(session: UserSession | null, perm: string): boolean {
  if (!session) return false;
  if (session.permissions?.includes(perm)) return true;
  const role = session.role;
  if (role === "admin") {
    if (perm === "records.follow") return false;
    return [
      "accounts.create",
      "accounts.update",
      "accounts.delete",
      "staff.validate",
      "facilities.manage",
      "permissions.manage",
    ].includes(perm);
  }
  if (role === "super_caregiver") {
    return [
      "staff.validate",
      "permissions.manage",
      "patients.register",
      "patients.validate",
      "patients.assign",
      "patients.read_all",
      "caregivers.view_as",
      "records.follow",
    ].includes(perm);
  }
  if (role === "caregiver") {
    return ["patients.register", "records.follow"].includes(perm);
  }
  if (role === "field_agent") {
    return ["patients.register", "patients.validate"].includes(perm);
  }
  if (role === "parent" || role === "user") {
    return ["patients.register"].includes(perm);
  }
  return false;
}

interface AuthContextType {
  session: UserSession | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  setSession: (session: UserSession | null, accessToken?: string, refreshToken?: string) => void;
  logout: () => void;
  hasPerm: (perm: string) => boolean;
  viewAsCaregiver: (caregiverId: string | null, caregiverName?: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [session, setSessionState] = useState<UserSession | null>(() => {
    try {
      const stored = typeof window !== "undefined" ? window.sessionStorage.getItem("tsotsa_session") : null;
      return stored ? (JSON.parse(stored) as UserSession) : null;
    } catch {
      return null;
    }
  });

  const setSession = useCallback((
    newSession: UserSession | null,
    accessToken?: string,
    refreshToken?: string
  ) => {
    inMemoryAccessToken = accessToken ?? null;
    inMemoryRefreshToken = refreshToken ?? null;

    try {
      if (newSession) {
        window.sessionStorage.setItem("tsotsa_session", JSON.stringify(newSession));
      } else {
        window.sessionStorage.removeItem("tsotsa_session");
      }
    } catch {
      // Storage errors ignored
    }

    const apiClient = getWebApiClient();
    if (accessToken) {
      apiClient.setTokens({
        accessToken,
        refreshToken: inMemoryRefreshToken || undefined,
      });
    } else {
      apiClient.clearTokens();
    }

    if (newSession?.preferred_locale) {
      const norm = normalizeLocale(newSession.preferred_locale);
      if (norm) {
        void changeAppLanguage(norm, { syncProfile: false });
      }
    }

    setSessionState(newSession);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const hasPerm = useCallback((perm: string): boolean => {
    return hasPermission(session, perm);
  }, [session]);

  const viewAsCaregiver = useCallback((caregiverId: string | null, caregiverName?: string | null) => {
    if (!session) return;
    const updated: UserSession = {
      ...session,
      viewAsCaregiverId: caregiverId,
      viewAsCaregiverName: caregiverName ?? null,
    };
    setSession(updated, inMemoryAccessToken || undefined, inMemoryRefreshToken || undefined);
  }, [session, setSession]);

  // Inactivity tracking for professional accounts (30 min)
  useEffect(() => {
    if (!session || !PROFESSIONAL_ROLES.includes(session.role)) {
      return;
    }

    let lastActivity = Date.now();
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    const timer = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
        logout();
      }
    }, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(timer);
    };
  }, [session, logout]);

  useEffect(() => {
    const apiClient = getWebApiClient();
    apiClient.setTokens({
      accessToken: inMemoryAccessToken || "",
      refreshToken: inMemoryRefreshToken || undefined,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        role: session?.role ?? null,
        isAuthenticated: !!session,
        setSession,
        logout,
        hasPerm,
        viewAsCaregiver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useOptionalAuth(): AuthContextType | undefined {
  return useContext(AuthContext);
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
}: ProtectedRouteProps): React.JSX.Element {
  const { session, isAuthenticated, hasPerm } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !session) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Normalize parent and legacy user
  const currentRole = session.role === "user" ? "parent" : session.role;
  const normalizedAllowed = allowedRoles?.map((r) => (r === "user" ? "parent" : r));

  if (normalizedAllowed && !normalizedAllowed.includes(currentRole)) {
    if (currentRole === "super_caregiver" || currentRole === "caregiver") {
      return <Navigate to="/soignant" replace />;
    }
    if (currentRole === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (currentRole === "field_agent") {
      return <Navigate to="/agent/familles" replace />;
    }
    return <Navigate to="/nutrition/produits/plumpy-nut" replace />;
  }

  if (requiredPermission && !hasPerm(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
