import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AdminProductsPage } from "../AdminProductsPage";
import { AdminPricesPage } from "../AdminPricesPage";
import { AdminOptimPage } from "../AdminOptimPage";
import { AdminModulesPage } from "../AdminModulesPage";
import { AdminNotificationsPage } from "../AdminNotificationsPage";
import { adminStore } from "../../../features/admin/adminStore";

describe("Admin Products, Prices, Optim, Modules, and Notif Pages", () => {
  beforeEach(() => {
    adminStore.reset();
  });

  describe("AdminProductsPage (W16)", () => {
    it("affiche les produits de référence et le lien utilisateur", () => {
      render(
        <BrowserRouter>
          <AdminProductsPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Produits de référence")).toBeInTheDocument();
      expect(screen.getByText("F-75")).toBeInTheDocument();
      expect(screen.getByText("Plumpy'Nut")).toBeInTheDocument();
      expect(screen.getByTestId("link-user-view")).toHaveTextContent("Voir côté utilisateur ›");
    });
  });

  describe("AdminPricesPage (W17)", () => {
    it("affiche le tableau des prix par région avec statut à saisir", () => {
      render(
        <BrowserRouter>
          <AdminPricesPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Prix par région")).toBeInTheDocument();
      expect(screen.getAllByText("à saisir").length).toBeGreaterThan(0);
      expect(screen.getByText("Extrême-Nord")).toBeInTheDocument();
    });
  });

  describe("AdminOptimPage (W18)", () => {
    it("affiche le badge moteur phase 2 et le tableau des cibles", () => {
      render(
        <BrowserRouter>
          <AdminOptimPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Optimisation des rations · préparation")).toBeInTheDocument();
      expect(screen.getByTestId("badge-engine-status")).toHaveTextContent("Moteur : phase 2 (non activé)");
      expect(screen.getByTestId("btn-test-formulation")).toBeDisabled();
      expect(screen.getByText("Ce que le moteur calculera")).toBeInTheDocument();
    });
  });

  describe("AdminModulesPage (W19)", () => {
    it("affiche les modules et permet de basculer l'activation", () => {
      render(
        <BrowserRouter>
          <AdminModulesPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Nutrition infantile")).toBeInTheDocument();
      expect(screen.getByTestId("module-subtitle-nutrition")).toHaveTextContent("Actif · visible par tous");
      expect(screen.getByTestId("module-subtitle-hta")).toHaveTextContent("Inactif · affiché « bientôt »");

      // Basculer le module HTA
      const htaToggle = screen.getByTestId("toggle-module-hta");
      fireEvent.click(htaToggle);

      expect(screen.getByTestId("module-subtitle-hta")).toHaveTextContent("Actif · visible par tous");
    });
  });

  describe("AdminNotificationsPage (W20)", () => {
    it("affiche les canaux de notification et permet de basculer l'activation globale", () => {
      render(
        <BrowserRouter>
          <AdminNotificationsPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Notifications · réglages de la plateforme")).toBeInTheDocument();
      expect(screen.getByText("Téléphone (push)")).toBeInTheDocument();
      expect(screen.getByText("Règles par défaut")).toBeInTheDocument();

      const globalToggle = screen.getByTestId("toggle-platform-notifications");
      expect(globalToggle).toBeInTheDocument();
      fireEvent.click(globalToggle);
      expect(adminStore.getState().notificationsActive).toBe(false);
    });
  });
});
