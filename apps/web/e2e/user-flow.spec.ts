import { test, expect } from "@playwright/test";

test.describe("Parcours Utilisateur Web TSOTSA Kids (W01)", () => {
  test.beforeEach(async ({ page }) => {
    // Connexion en tant qu'utilisateur (parent démo)
    await page.goto("/connexion");
    await page.getByTestId("role-btn-user").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/nutrition\/produits\/plumpy-nut/);
  });

  test("Parcours Utilisateur : consultation des équivalents → filtre région → détail aliment", async ({
    page,
  }) => {
    // 1. En-tête et cartes principales
    await expect(page.getByText("Espace utilisateur (web)")).toBeVisible();
    await expect(page.getByText("Compte démo · Hamadou")).toBeVisible();
    await expect(page.getByTestId("product-card")).toBeVisible();
    await expect(page.getByTestId("equivalents-card")).toBeVisible();

    // 2. Vérification des nutriments clés de Plumpy'Nut
    await expect(page.getByText("520 – 550 kcal")).toBeVisible();
    await expect(page.getByText("Protéines ★")).toBeVisible();
    await expect(page.getByText("Lipides ★")).toBeVisible();
    await expect(page.getByText("Fer ★")).toBeVisible();

    // 3. Vérification des 7 équivalents classés
    await expect(page.getByText("Graines de courge")).toBeVisible();
    await expect(page.getByText("Sésame")).toBeVisible();
    await expect(page.getByText("Arachide")).toBeVisible();
    await expect(page.getByText("Soja")).toBeVisible();
    await expect(page.getByText("Niébé")).toBeVisible();
    await expect(page.getByText("Lait entier en poudre")).toBeVisible();
    await expect(page.getByText("Feuilles de moringa")).toBeVisible();

    // 4. Filtrage par région Ouest
    const regionFilterBtn = page.getByTestId("region-filter-btn");
    await expect(regionFilterBtn).toContainText("Toutes régions ▾");
    await regionFilterBtn.click();
    await page.getByTestId("region-option-west").click();
    await expect(regionFilterBtn).toContainText("Région Ouest ▾");

    // Sésame n'est pas disponible pour l'Ouest, Arachide oui
    await expect(page.getByText("Sésame")).not.toBeVisible();
    await expect(page.getByText("Arachide")).toBeVisible();

    // Réinitialiser le filtre
    await regionFilterBtn.click();
    await page.getByTestId("region-option-all").click();
    await expect(regionFilterBtn).toContainText("Toutes régions ▾");
    await expect(page.getByText("Sésame")).toBeVisible();

    // 5. Clic sur Arachide pour afficher le détail de l'aliment
    await page.getByText("Arachide").click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(page.getByRole("heading", { name: "Arachide" })).toBeVisible();
    await expect(page.getByText("567 kcal")).toBeVisible();

    // Fermeture de la modale
    await page.getByTestId("modal-close-btn").click();
    await expect(modal).not.toBeVisible();

    // 6. Clic sur Version mobile
    await page.getByTestId("mobile-version-btn").click();
    await expect(page.getByTestId("mobile-toast")).toBeVisible();
  });
});
