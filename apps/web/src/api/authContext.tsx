import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole, UserSession } from "../types";
import { getWebApiClient } from "./client";

import { changeAppLanguage } from "../i18n/setup";
import { normalizeLocale } from "@tsotsa/i18n";

interface AuthContextType {
  session: UserSession | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  setSession: (session: UserSession | null, accessToken?: string, refreshToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Memory storage for tokens during session
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

  const setSession = (
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
      // Ignore storage errors in restrictive environments
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
  };

  const logout = () => {
    setSession(null);
  };

  useEffect(() => {
    // Keep apiClient in sync with token refresh events
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
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps): React.JSX.Element {
  const { session, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !session) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    // If authenticated but unauthorized for this space, redirect to their space
    if (session.role === "caregiver") {
      return <Navigate to="/soignant" replace />;
    }
    if (session.role === "admin") {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/nutrition/produits/plumpy-nut" replace />;
  }

  return <>{children}</>;
}

