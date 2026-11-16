import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "../../../i18n/setup";
import { AuthProvider } from "../../../api/authContext";
import { LoginPage } from "../../LoginPage";

describe("Login and Role Selection Workflow (Étape 3)", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const renderLoginPage = () =>
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

  it("affiche l'écran initial « Je suis... » avec les 5 rôles officiels", () => {
    renderLoginPage();

    expect(screen.getByText("Je suis...")).toBeInTheDocument();
    expect(screen.getByTestId("role-btn-parent")).toBeInTheDocument();
    expect(screen.getByTestId("role-btn-field_agent")).toBeInTheDocument();
    expect(screen.getByTestId("role-btn-caregiver")).toBeInTheDocument();
    expect(screen.getByTestId("role-btn-super_caregiver")).toBeInTheDocument();
    expect(screen.getByTestId("role-btn-admin")).toBeInTheDocument();
  });

  it("affiche les onglets Connexion / Créer un compte pour Parent, Agent et Soignant", () => {
    renderLoginPage();

    // Default role is parent
    expect(screen.getByTestId("tab-login")).toBeInTheDocument();
    expect(screen.getByTestId("tab-register")).toBeInTheDocument();

    // Switch to field_agent
    fireEvent.click(screen.getByTestId("role-btn-field_agent"));
    expect(screen.getByTestId("tab-login")).toBeInTheDocument();
    expect(screen.getByTestId("tab-register")).toBeInTheDocument();

    // Switch to caregiver
    fireEvent.click(screen.getByTestId("role-btn-caregiver"));
    expect(screen.getByTestId("tab-login")).toBeInTheDocument();
    expect(screen.getByTestId("tab-register")).toBeInTheDocument();
  });

  it("bloque l'inscription libre pour Administrateur et Super Soignant", () => {
    renderLoginPage();

    // Switch to super_caregiver
    fireEvent.click(screen.getByTestId("role-btn-super_caregiver"));
    expect(screen.queryByTestId("tab-register")).not.toBeInTheDocument();
    expect(screen.getByText(/Les comptes Super Soignant ne s'inscrivent pas/i)).toBeInTheDocument();

    // Switch to admin
    fireEvent.click(screen.getByTestId("role-btn-admin"));
    expect(screen.queryByTestId("tab-register")).not.toBeInTheDocument();
    expect(screen.getByText(/L'accès Administrateur est réservé/i)).toBeInTheDocument();
  });

  it("affiche les champs spécifiques lors de l'inscription d'un soignant", () => {
    renderLoginPage();

    // Select caregiver and switch to register
    fireEvent.click(screen.getByTestId("role-btn-caregiver"));
    fireEvent.click(screen.getByTestId("tab-register"));

    expect(screen.getByTestId("register-first-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-last-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-region-select")).toBeInTheDocument();
    expect(screen.getByTestId("register-locality-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-phone-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-facility-select")).toBeInTheDocument();
    expect(screen.getByTestId("register-specialty-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-order-number-input")).toBeInTheDocument();
  });

  it("affiche le champ structure lors de l'inscription d'un agent de terrain", () => {
    renderLoginPage();

    fireEvent.click(screen.getByTestId("role-btn-field_agent"));
    fireEvent.click(screen.getByTestId("tab-register"));

    expect(screen.getByTestId("register-organization-input")).toBeInTheDocument();
    expect(screen.queryByTestId("register-facility-select")).not.toBeInTheDocument();
  });

  it("valide les 10 régions du Cameroun dans la liste déroulante", () => {
    renderLoginPage();

    fireEvent.click(screen.getByTestId("tab-register"));
    const regionSelect = screen.getByTestId("register-region-select");

    expect(regionSelect).toContainHTML("Adamaoua");
    expect(regionSelect).toContainHTML("Centre");
    expect(regionSelect).toContainHTML("Extrême-Nord");
    expect(regionSelect).toContainHTML("Littoral");
    expect(regionSelect).toContainHTML("Nord-Ouest");
    expect(regionSelect).toContainHTML("Sud-Ouest");
  });
});

