import { test, expect } from "@playwright/test";

test.describe("Internationalisation (i18n FR/EN) — Écrans W10 à W20", () => {
  test("W10 (Vue d'ensemble), W11 (Vérifications), W12 (Comptes), W13 (Base aliments), W14 (Nouvel aliment), W15 (Import) en anglais avec rechargement", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.getByTestId("role-btn-admin").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/$/);

    // W10 : Vue d'ensemble
    await page.getByTestId("lang-btn-en").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Platform health")).toBeVisible();
    await expect(page.getByText("caregiver to verify")).toBeVisible();
    await expect(page.getByText("Santé de la plateforme")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Platform health")).toBeVisible();

    // W11 : Vérifications
    await page.goto("/verifications");
    await expect(page.getByText("Caregivers pending verification")).toBeVisible();
    await expect(page.getByText("User-submitted products")).toBeVisible();
    await expect(page.getByText("Soignants en attente")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Caregivers pending verification")).toBeVisible();

    // W12 : Comptes
    await page.goto("/comptes");
    await expect(page.getByText("Create an account")).toBeVisible();
    await expect(page.getByTestId("btn-create-account")).toContainText("Create and invite");
    await expect(page.getByText("Créer un compte")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Create an account")).toBeVisible();

    // W13 : Base aliments
    await page.goto("/base-aliments");
    await expect(page.getByText("Food database (extracted from ORKG)")).toBeVisible();
    await expect(page.getByText("Pre-approval checks")).toBeVisible();
    await expect(page.getByText("Base aliments (extraite d'ORKG)")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Food database (extracted from ORKG)")).toBeVisible();

    // W14 : Nouvel aliment · saisie manuelle
    await page.goto("/base-aliments/nouveau");
    await expect(page.getByText("New food · manual entry")).toBeVisible();
    await expect(page.getByText("Composition per 100 g")).toBeVisible();
    await expect(page.getByText("Nouvel aliment · saisie manuelle")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("New food · manual entry")).toBeVisible();

    // W15 : Import Excel/CSV (aperçu + erreurs par codes + double validation)
    await page.goto("/base-aliments/import");
    await expect(page.getByText("Import a file (Excel or CSV)")).toBeVisible();
    await expect(page.getByTestId("link-download-template")).toContainText(
      "Download empty template ›"
    );
    await expect(page.getByTestId("import-row-2")).toContainText("✕ out of bounds (max 100 g)");
    await expect(page.getByTestId("import-row-4")).toContainText("⚠ missing unit");
    await expect(page.getByText("Importer un fichier (Excel ou CSV)")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Import a file (Excel or CSV)")).toBeVisible();
    await page.getByTestId("btn-import-valid-lines").click();
    await expect(
      page.getByText("Step 4: Two-step approval by a second reviewer")
    ).toBeVisible();
  });

  test("W16 (Produits de réf.), W17 (Prix), W18 (Optimisation), W19 (Modules), W20 (Notifications) en anglais avec rechargement", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.getByTestId("role-btn-admin").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByTestId("lang-btn-en").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // W16 : Produits de référence
    await page.goto("/produits-reference");
    await expect(page.getByRole("heading", { name: "Reference products" })).toBeVisible();
    await expect(page.getByTestId("btn-add-ref-product")).toContainText("+ Add a product");
    await expect(page.getByRole("heading", { name: "Produits de référence" })).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Reference products" })).toBeVisible();

    // W17 : Prix par région
    await page.goto("/prix");
    await expect(page.getByRole("heading", { name: "Regional prices" })).toBeVisible();
    await expect(page.getByTestId("btn-add-price")).toContainText("+ Add a price record");
    await expect(page.getByRole("heading", { name: "Prix par région" })).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Regional prices" })).toBeVisible();

    // W18 : Optimisation des rations
    await page.goto("/optimisation");
    await expect(page.getByText("Ration optimization · preparation")).toBeVisible();
    await expect(page.getByText("What the engine will compute")).toBeVisible();
    await expect(page.getByText("Optimisation des rations · préparation")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Ration optimization · preparation")).toBeVisible();

    // W19 : Modules
    await page.goto("/modules");
    await expect(page.getByText("Child nutrition")).toBeVisible();
    await expect(page.getByTestId("btn-see-user-modules")).toContainText(
      "View effect on user portal"
    );
    await expect(page.getByText("Nutrition infantile")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Child nutrition")).toBeVisible();

    // W20 : Notifications · réglages de la plateforme
    await page.goto("/notifications");
    await expect(page.getByText("Notifications · platform settings")).toBeVisible();
    await expect(page.getByText("Message templates (FR / EN)")).toBeVisible();
    await expect(page.getByText("Default rules")).toBeVisible();
    await expect(page.getByText("Notifications · réglages de la plateforme")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Notifications · platform settings")).toBeVisible();
  });
});

