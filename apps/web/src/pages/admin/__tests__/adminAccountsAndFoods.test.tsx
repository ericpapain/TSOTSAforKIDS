import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AdminAccountsPage } from "../AdminAccountsPage";
import { AdminFoodsPage } from "../AdminFoodsPage";
import { adminStore } from "../../../features/admin/adminStore";

describe("Admin Accounts and Foods Pages", () => {
  beforeEach(() => {
    adminStore.reset();
  });

  describe("AdminAccountsPage (W12)", () => {
    it("affiche le tableau des comptes et le formulaire", () => {
      render(
        <BrowserRouter>
          <AdminAccountsPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Comptes")).toBeInTheDocument();
      expect(screen.getByText("Créer un compte")).toBeInTheDocument();
      expect(screen.getByText("Compte parent (démo)")).toBeInTheDocument();
      expect(screen.getByText("parent2@exemple.com")).toBeInTheDocument();
    });

    it("filtre les comptes par statut ou rôle", () => {
      render(
        <BrowserRouter>
          <AdminAccountsPage />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId("filter-tab-Soignants"));
      expect(screen.getByText("Dr [Nom]")).toBeInTheDocument();
      expect(screen.queryByText("parent2@exemple.com")).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("filter-tab-Tous"));
      expect(screen.getByText("parent2@exemple.com")).toBeInTheDocument();
    });

    it("permet de créer un nouveau compte avec invitation", () => {
      render(
        <BrowserRouter>
          <AdminAccountsPage />
        </BrowserRouter>
      );

      const contactInput = screen.getByTestId("input-contact");
      fireEvent.change(contactInput, { target: { value: "nouveau.soignant@cma.cm" } });

      const createBtn = screen.getByTestId("btn-create-account");
      fireEvent.click(createBtn);

      expect(screen.getByTestId("account-feedback")).toHaveTextContent("créé et invitation préparée");
      expect(screen.getByText("nouveau.soignant@cma.cm")).toBeInTheDocument();
    });
  });

  describe("AdminFoodsPage (W13)", () => {
    it("affiche les lots et les contrôles", () => {
      render(
        <BrowserRouter>
          <AdminFoodsPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Base aliments (extraite d'ORKG)")).toBeInTheDocument();
      expect(screen.getByText("Lot 1")).toBeInTheDocument();
      expect(screen.getByText("Contrôles avant validation")).toBeInTheDocument();
      expect(screen.getByText("Dictionnaire des nutriments")).toBeInTheDocument();
    });

    it("interdit la validation par l'auteur du lot (Fidel)", () => {
      render(
        <BrowserRouter>
          <AdminFoodsPage />
        </BrowserRouter>
      );

      // Connecter Fidel (auteur de Lot 1)
      fireEvent.click(screen.getByTestId("switch-user-fidel"));

      // Tenter de valider Lot 1
      const validateBtn = screen.getByTestId("btn-validate-batch-lot-1");
      fireEvent.click(validateBtn);

      expect(screen.getByTestId("batch-feedback")).toHaveTextContent(
        "Interdiction de valider son propre lot"
      );
    });

    it("autorise la validation par un second lecteur (Équipe TSOTSA)", () => {
      render(
        <BrowserRouter>
          <AdminFoodsPage />
        </BrowserRouter>
      );

      // Connecter Équipe TSOTSA (second lecteur)
      fireEvent.click(screen.getByTestId("switch-user-team"));

      const validateBtn = screen.getByTestId("btn-validate-batch-lot-1");
      fireEvent.click(validateBtn);

      expect(screen.getByTestId("batch-feedback")).toHaveTextContent("validé avec succès");
      expect(screen.getByText("Publié")).toBeInTheDocument();
    });
  });
});
