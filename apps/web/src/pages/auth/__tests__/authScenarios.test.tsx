import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "../../../i18n/setup";
import { AuthProvider, ProtectedRoute } from "../../../api/authContext";
import { AuthLoginForm } from "../AuthLoginForm";
import { getWebApiClient } from "../../../api/client";

const TestDashboard = () => <div>Tableau de bord Administrateur</div>;

const TestApp = ({ initialEntry = "/connexion" }: { initialEntry?: string }) => (
  <AuthProvider>
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/connexion" element={<AuthLoginForm role="admin" />} />
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TestDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/private"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <div>Page Secrète</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  </AuthProvider>
);

describe("Authentication Workflow & Security Scenarios", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("bloque la soumission si les champs obligatoires sont vides", async () => {
    render(<TestApp />);
    const submitBtn = screen.getByTestId("login-submit-btn");

    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("Veuillez renseigner tous les champs obligatoires.")
    ).toBeInTheDocument();
  });

  it("affiche un message de validation si le format d'email est invalide", async () => {
    render(<TestApp />);
    const emailInput = screen.getByTestId("login-email-input");
    const passwordInput = screen.getByTestId("login-password-input");
    const submitBtn = screen.getByTestId("login-submit-btn");

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("Veuillez saisir une adresse e-mail valide.")
    ).toBeInTheDocument();
  });

  it("affiche le message d'erreur approprié en cas de mot de passe incorrect (401)", async () => {
    const apiClient = getWebApiClient();
    vi.spyOn(apiClient.client, "POST").mockResolvedValueOnce({
      error: { code: "UNAUTHORIZED", detail: "Bad password" },
      response: { status: 401 } as Response,
    } as never);

    render(<TestApp />);
    fireEvent.change(screen.getByTestId("login-email-input"), {
      target: { value: "admin@tsotsa-for-kids.com" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "WrongPass" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    expect(
      await screen.findByText("Adresse e-mail ou mot de passe incorrect.")
    ).toBeInTheDocument();
  });

  it("gère l'utilisateur inexistant de manière identique sans fuite d'informations (401)", async () => {
    const apiClient = getWebApiClient();
    vi.spyOn(apiClient.client, "POST").mockResolvedValueOnce({
      error: { code: "UNAUTHORIZED", detail: "User not found" },
      response: { status: 401 } as Response,
    } as never);

    render(<TestApp />);
    fireEvent.change(screen.getByTestId("login-email-input"), {
      target: { value: "nonexistent@tsotsa-for-kids.com" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "AnyPassword123" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    expect(
      await screen.findByText("Adresse e-mail ou mot de passe incorrect.")
    ).toBeInTheDocument();
  });

  it("gère une erreur réseau avec un message clair et compréhensible", async () => {
    const apiClient = getWebApiClient();
    vi.spyOn(apiClient.client, "POST").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    render(<TestApp />);
    fireEvent.change(screen.getByTestId("login-email-input"), {
      target: { value: "admin@tsotsa-for-kids.com" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "SecurePass123" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    expect(
      await screen.findByText(
        "Impossible de joindre le serveur. Vérifiez votre connexion réseau."
      )
    ).toBeInTheDocument();
  });

  it("gère une erreur serveur 500 proprement", async () => {
    const apiClient = getWebApiClient();
    vi.spyOn(apiClient.client, "POST").mockResolvedValueOnce({
      error: { code: "INTERNAL_SERVER_ERROR", detail: "Database crash" },
      response: { status: 500 } as Response,
    } as never);

    render(<TestApp />);
    fireEvent.change(screen.getByTestId("login-email-input"), {
      target: { value: "admin@tsotsa-for-kids.com" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "SecurePass123" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    expect(
      await screen.findByText(
        "Une erreur serveur est survenue. Veuillez réessayer ultérieurement."
      )
    ).toBeInTheDocument();
  });

  it("empêche les soumissions multiples lors d'un double clic rapide", async () => {
    const apiClient = getWebApiClient();
    let resolveLogin: (val: unknown) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    const postSpy = vi
      .spyOn(apiClient.client, "POST")
      .mockReturnValueOnce(pendingPromise as never);

    render(<TestApp />);
    fireEvent.change(screen.getByTestId("login-email-input"), {
      target: { value: "admin@tsotsa-for-kids.com" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "Tsotsa2026!Demo" },
    });

    const submitBtn = screen.getByTestId("login-submit-btn");
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    expect(postSpy).toHaveBeenCalledTimes(1);

    resolveLogin({
      data: {
        access_token: "test-token",
        refresh_token: "test-refresh",
        user: { id: "1", roles: ["admin"], permissions: [] },
      },
      response: { status: 200 } as Response,
    });
  });

  it("redirige vers le tableau de bord avec des identifiants valides", async () => {
    const apiClient = getWebApiClient();
    vi.spyOn(apiClient.client, "POST").mockResolvedValueOnce({
      data: {
        access_token: "valid-jwt-token",
        refresh_token: "valid-refresh-token",
        user: {
          id: "01a1f09e-d05a-7916-af4a-04f532a63115",
          display_name: "Admin TSOTSA",
          roles: ["admin"],
          permissions: ["accounts.create"],
          status: "active",
        },
      },
      response: { status: 200 } as Response,
    } as never);

    render(<TestApp />);
    fireEvent.change(screen.getByTestId("login-email-input"), {
      target: { value: "admin@tsotsa-for-kids.com" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "Tsotsa2026!Demo" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    expect(
      await screen.findByText("Tableau de bord Administrateur")
    ).toBeInTheDocument();

    const storedTokens = JSON.parse(
      sessionStorage.getItem("tsotsa_auth_tokens") || "{}"
    );
    expect(storedTokens.accessToken).toBe("valid-jwt-token");
    expect(storedTokens.refreshToken).toBe("valid-refresh-token");
  });

  it("redirige les utilisateurs non connectés vers /connexion lors de l'accès à une page privée", () => {
    render(<TestApp initialEntry="/private" />);
    expect(screen.getByTestId("login-submit-btn")).toBeInTheDocument();
    expect(screen.queryByText("Page Secrète")).not.toBeInTheDocument();
  });
});
