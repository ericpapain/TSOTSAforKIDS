import { test, expect } from "@playwright/test";

test.describe("Parcours Administration TSOTSA Kids", () => {
  test.beforeEach(async ({ page }) => {
    // Connexion en tant qu'administrateur
    await page.goto("/connexion");
    await page.getByTestId("role-btn-admin").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL("/");
  });

  test("Parcours 1 : Import fichier → Correction colonnes → Relecture 2e compte → Publication → Vue utilisateur", async ({
    page,
  }) => {
    // 1. Dashboard administration (W10)
    await expect(page.getByTestId("admin-dashboard-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();

    // 2. Navigation vers la Base aliments (W13)
    const foodsNav = page.getByTestId("sidebar-item-/base-aliments");
    await expect(foodsNav).toBeVisible();
    await foodsNav.click();
    await expect(page).toHaveURL(/\/base-aliments/);
    await expect(page.getByTestId("admin-foods-page")).toBeVisible();

    // 3. Clic sur "Importer un fichier" (W15)
    const importBtn = page.getByTestId("btn-import-file");
    await expect(importBtn).toBeVisible();
    await importBtn.click();
    await expect(page).toHaveURL(/\/base-aliments\/import/);
    await expect(page.getByTestId("admin-import-page")).toBeVisible();

    // Vérification des contrôles ligne par ligne
    await expect(page.getByTestId("badge-valid-count")).toContainText("Lignes valides : 3");
    await expect(page.getByTestId("badge-error-count")).toContainText("Erreurs : 1");

    // 4. Correction de la correspondance des colonnes
    const correctColsBtn = page.getByTestId("btn-correct-columns");
    await correctColsBtn.click();
    await page.getByTestId("btn-apply-column-fix").click();
    await expect(page.getByTestId("badge-valid-count")).toContainText("Lignes valides : 4");

    // 5. Importer les lignes valides pour passer à l'étape 4
    const importValidBtn = page.getByTestId("btn-import-valid-lines");
    await importValidBtn.click();
    await expect(page.getByTestId("validation-step-card")).toBeVisible();

    // Test de l'interdiction de valider son propre lot
    await page.getByTestId("btn-login-fidel").click();
    await page.getByTestId("btn-publish-lot").click();
    await expect(page.getByTestId("validation-error-notice")).toBeVisible();
    await expect(page.getByTestId("validation-error-notice")).toContainText(
      "Interdiction de valider son propre lot"
    );

    // Relecture et validation par un second compte
    await page.getByTestId("btn-login-team").click();
    await page.getByTestId("btn-publish-lot").click();
    await expect(page.getByTestId("publish-success-notice")).toBeVisible();

    // 6. Publication et vérification de la visibilité côté utilisateur
    const userViewBtn = page.getByTestId("btn-view-user-side");
    await expect(userViewBtn).toBeVisible();
    await userViewBtn.click();
    await expect(page).toHaveURL(/\/nutrition\/produits\/plumpy-nut/);
  });

  test("Parcours 2 : Saisie manuelle → Validation → Publication", async ({ page }) => {
    // 1. Navigation vers Base aliments (W13)
    const foodsNav = page.getByTestId("sidebar-item-/base-aliments");
    await foodsNav.click();
    await expect(page.getByTestId("admin-foods-page")).toBeVisible();

    // Saisie effectuée par Fidel (auteur)
    await page.getByTestId("switch-user-fidel").click();

    // 2. Accès à la saisie manuelle (W14)
    const manualBtn = page.getByTestId("btn-manual-food");
    await manualBtn.click();
    await expect(page).toHaveURL(/\/base-aliments\/nouveau/);
    await expect(page.getByTestId("admin-food-new-page")).toBeVisible();

    // 3. Modification du nom et ajout de nutriment
    const nameInput = page.getByTestId("input-food-name");
    await nameInput.fill("Arachide locale");
    await page.getByTestId("btn-add-nutrient").click();

    // 4. Soumission à validation
    const submitBtn = page.getByTestId("btn-submit-food");
    await submitBtn.click();
    await expect(page).toHaveURL(/\/base-aliments/);

    // 5. Validation par un second lecteur (Équipe TSOTSA) et publication
    await page.getByTestId("switch-user-team").click();
    const validateBatchBtn = page.locator("button:has-text('Valider la 2ᵉ relecture')").first();
    await expect(validateBatchBtn).toBeVisible();
    await validateBatchBtn.click();
    await expect(page.getByTestId("batch-feedback")).toContainText("validé avec succès");
  });
});
