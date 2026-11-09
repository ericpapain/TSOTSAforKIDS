import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AdminDashboardPage } from "../AdminDashboardPage";
import { AdminVerifyPage } from "../AdminVerifyPage";
import { adminStore } from "../../../features/admin/adminStore";

describe("Admin Dashboard and Verify Pages", () => {
  beforeEach(() => {
    adminStore.reset();
  });

  describe("AdminDashboardPage (W10)", () => {
    it("affiche le titre et les 4 cartes KPI", () => {
      render(
        <BrowserRouter>
          <AdminDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Vue d'ensemble")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-caregiver")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-product")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-lots")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-prices")).toBeInTheDocument();
      expect(screen.getByText("Santé de la plateforme")).toBeInTheDocument();
      expect(screen.getByText("Comptes utilisateurs")).toBeInTheDocument();
    });
  });

  describe("AdminVerifyPage (W11)", () => {
    it("affiche les soignants en attente et les produits utilisateurs", () => {
      render(
        <BrowserRouter>
          <AdminVerifyPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Vérifications")).toBeInTheDocument();
      expect(screen.getByText("Soignants en attente")).toBeInTheDocument();
      expect(screen.getByText(/Dr \[Nom\]/)).toBeInTheDocument();
      expect(screen.getByText(/Farine infantile enrichie/)).toBeInTheDocument();
      expect(screen.getByTestId("btn-validate-caregiver-cg-01")).toBeInTheDocument();
      expect(screen.getByTestId("btn-reject-caregiver-cg-01")).toBeInTheDocument();
    });

    it("valide un soignant et met à jour l'état", () => {
      render(
        <BrowserRouter>
          <AdminVerifyPage />
        </BrowserRouter>
      );

      const validateBtn = screen.getByTestId("btn-validate-caregiver-cg-01");
      fireEvent.click(validateBtn);

      expect(screen.getByTestId("verify-feedback")).toHaveTextContent("a été validé");
      expect(screen.queryByTestId("caregiver-card-cg-01")).not.toBeInTheDocument();
    });

    it("valide un produit utilisateur et affiche la confirmation", () => {
      render(
        <BrowserRouter>
          <AdminVerifyPage />
        </BrowserRouter>
      );

      const validateProdBtn = screen.getByTestId("btn-validate-product-prod-user-01");
      fireEvent.click(validateProdBtn);

      expect(screen.getByTestId("verify-feedback")).toHaveTextContent("rendu public");
      expect(screen.queryByTestId("user-product-card-prod-user-01")).not.toBeInTheDocument();
    });
  });
});
