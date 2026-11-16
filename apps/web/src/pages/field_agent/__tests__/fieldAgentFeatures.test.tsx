import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "../../../i18n/setup";
import { AuthProvider } from "../../../api/authContext";
import {
  FieldAgentLayout,
  FieldAgentFamiliesPage,
  FieldAgentValidationPage,
  FieldAgentProfilePage,
} from "../index";

describe("Field Agent Features (Étape 3)", () => {
  it("affiche la barre de navigation spécifique de l'agent de terrain", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <FieldAgentLayout>
            <div>Contenu agent</div>
          </FieldAgentLayout>
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Familles inscrites")).toBeInTheDocument();
    expect(screen.getByText("Patients à valider")).toBeInTheDocument();
    expect(screen.getByText("Mon profil")).toBeInTheDocument();
    expect(screen.queryByText("Tableau de bord")).not.toBeInTheDocument();
  });

  it("permet à l'agent d'enregistrer une famille avec validation immédiate", () => {
    render(
      <BrowserRouter>
        <FieldAgentFamiliesPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Familles inscrites")).toBeInTheDocument();
    const openModalBtn = screen.getByTestId("btn-open-register-family-modal");
    fireEvent.click(openModalBtn);

    expect(screen.getByText("Inscrire une nouvelle famille")).toBeInTheDocument();
  });

  it("affiche la page de validation des patients et le dialogue de refus avec motif", () => {
    render(
      <BrowserRouter>
        <FieldAgentValidationPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Patients à valider")).toBeInTheDocument();
    expect(screen.getByTestId("empty-validation-notice")).toBeInTheDocument();
  });

  it("affiche le profil de l'agent de terrain", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <FieldAgentProfilePage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Mon profil agent")).toBeInTheDocument();
    expect(screen.getByText("Agent de terrain")).toBeInTheDocument();
  });
});

