import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "../../../i18n/setup";
import { AuthProvider, useAuth } from "../../../api/authContext";
import { CaregiverLayout } from "../CaregiverLayout";
import { ViewAsBanner } from "../ViewAsBanner";
import React, { useEffect } from "react";

const TestCaregiverSessionSetter: React.FC<{
  permissions: string[];
  role?: "caregiver" | "super_caregiver";
  viewAsId?: string | null;
  viewAsName?: string | null;
}> = ({ permissions, role = "caregiver", viewAsId, viewAsName }) => {
  const { setSession } = useAuth();

  useEffect(() => {
    setSession({
      id: "usr-cg-test",
      name: "Dr Test Soignant",
      role,
      permissions,
      viewAsCaregiverId: viewAsId ?? null,
      viewAsCaregiverName: viewAsName ?? null,
    });
  }, [setSession, permissions, role, viewAsId, viewAsName]);

  return <div>Session initialisée</div>;
};

describe("Super Caregiver & Delegation Features (Étape 3)", () => {
  it("affiche les onglets de supervision pour un soignant avec droits délégués", () => {
    render(
      <AuthProvider>
        <TestCaregiverSessionSetter
          role="caregiver"
          permissions={["patients.read_all", "patients.assign", "staff.validate", "permissions.manage"]}
        />
        <BrowserRouter>
          <CaregiverLayout>
            <div>Page de test</div>
          </CaregiverLayout>
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Tous les patients")).toBeInTheDocument();
    expect(screen.getByText("Association")).toBeInTheDocument();
    expect(screen.getByText("Supervision & Validations")).toBeInTheDocument();
    expect(screen.getByText("Gestion des droits")).toBeInTheDocument();
  });

  it("masque les onglets de supervision si le soignant n'a pas de droits délégués", () => {
    render(
      <AuthProvider>
        <TestCaregiverSessionSetter role="caregiver" permissions={[]} />
        <BrowserRouter>
          <CaregiverLayout>
            <div>Page de test</div>
          </CaregiverLayout>
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.queryByText("Tous les patients")).not.toBeInTheDocument();
    expect(screen.queryByText("Association")).not.toBeInTheDocument();
    expect(screen.queryByText("Validation soignants")).not.toBeInTheDocument();
    expect(screen.queryByText("Gestion des droits")).not.toBeInTheDocument();
  });

  it("affiche le bandeau jaune de consultation en lecture seule lors de la vue soignant", () => {
    render(
      <AuthProvider>
        <TestCaregiverSessionSetter
          role="super_caregiver"
          permissions={["caregivers.view_as"]}
          viewAsId="doc-confrere"
          viewAsName="Dr Confrère"
        />
        <BrowserRouter>
          <ViewAsBanner />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByTestId("view-as-banner")).toBeInTheDocument();
    expect(screen.getByText(/Consultation du compte de Dr Confrère/i)).toBeInTheDocument();
    expect(screen.getByTestId("exit-view-as-btn")).toBeInTheDocument();

    // Click exit
    fireEvent.click(screen.getByTestId("exit-view-as-btn"));
  });
});

