import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AdminFoodNewPage } from "../AdminFoodNewPage";
import { AdminImportPage } from "../AdminImportPage";
import { adminStore } from "../../../features/admin/adminStore";

describe("Admin Food New and Import Pages", () => {
  beforeEach(() => {
    adminStore.reset();
  });

  describe("AdminFoodNewPage (W14)", () => {
    it("affiche le formulaire de saisie manuelle et la composition", () => {
      render(
        <BrowserRouter>
          <AdminFoodNewPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Nouvel aliment · saisie manuelle")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Arachide")).toBeInTheDocument();
      expect(screen.getByText("Composition pour 100 g")).toBeInTheDocument();
      expect(screen.getByText("Contrôles : unités ✓ valeurs plausibles ✓ source ✓")).toBeInTheDocument();
      expect(screen.getByTestId("btn-draft-food")).toBeInTheDocument();
      expect(screen.getByTestId("btn-submit-food")).toBeInTheDocument();
    });

    it("permet d'ajouter et supprimer des nutriments", () => {
      render(
        <BrowserRouter>
          <AdminFoodNewPage />
        </BrowserRouter>
      );

      const addBtn = screen.getByTestId("btn-add-nutrient");
      fireEvent.click(addBtn);
      expect(screen.getByText("Zinc")).toBeInTheDocument();

      const removeBtn = screen.getByTestId("btn-remove-nutrient-1");
      fireEvent.click(removeBtn);
      expect(screen.queryByText("Énergie")).not.toBeInTheDocument();
    });

    it("soumet l'aliment à validation", () => {
      render(
        <BrowserRouter>
          <AdminFoodNewPage />
        </BrowserRouter>
      );

      const submitBtn = screen.getByTestId("btn-submit-food");
      fireEvent.click(submitBtn);

      const batches = adminStore.getState().batches;
      expect(batches.some((b) => b.source.includes("Arachide"))).toBe(true);
    });
  });

  describe("AdminImportPage (W15)", () => {
    it("affiche le wizard à l'étape 3 et les contrôles ligne par ligne", () => {
      render(
        <BrowserRouter>
          <AdminImportPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Importer un fichier (Excel ou CSV)")).toBeInTheDocument();
      expect(screen.getByTestId("badge-valid-count")).toHaveTextContent("Lignes valides : 3");
      expect(screen.getByTestId("badge-error-count")).toHaveTextContent("Erreurs : 1");
      expect(screen.getByTestId("badge-warning-count")).toHaveTextContent("Avertissements : 1");
      expect(screen.getByText("Soja")).toBeInTheDocument();
      expect(screen.getByText("✕ hors limites (max 100 g)")).toBeInTheDocument();
    });

    it("permet de corriger la correspondance des colonnes", () => {
      render(
        <BrowserRouter>
          <AdminImportPage />
        </BrowserRouter>
      );

      const correctColBtn = screen.getByTestId("btn-correct-columns");
      fireEvent.click(correctColBtn);

      expect(screen.getByTestId("select-column-mapping")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("btn-apply-column-fix"));

      // Après correction, la ligne Soja est valide
      expect(screen.getByTestId("badge-valid-count")).toHaveTextContent("Lignes valides : 4");
    });

    it("importe les lignes valides et permet la validation par le 2e lecteur", () => {
      render(
        <BrowserRouter>
          <AdminImportPage />
        </BrowserRouter>
      );

      // Importer les lignes valides pour passer à l'étape 4
      fireEvent.click(screen.getByTestId("btn-import-valid-lines"));

      expect(screen.getByText(/Étape 4 : Validation du lot/)).toBeInTheDocument();

      // Si Fidel essaie de valider, c'est refusé
      fireEvent.click(screen.getByTestId("btn-login-fidel"));
      fireEvent.click(screen.getByTestId("btn-publish-lot"));
      expect(screen.getByTestId("validation-error-notice")).toHaveTextContent("Interdiction de valider son propre lot");

      // Si Équipe TSOTSA valide, c'est accepté
      fireEvent.click(screen.getByTestId("btn-login-team"));
      fireEvent.click(screen.getByTestId("btn-publish-lot"));
      expect(screen.getByTestId("publish-success-notice")).toHaveTextContent("validé avec succès");
      expect(screen.getByTestId("btn-view-user-side")).toBeInTheDocument();
    });
  });
});
