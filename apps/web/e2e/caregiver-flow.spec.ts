import { test, expect } from "@playwright/test";

test.describe("Parcours Soignant TSOTSA Kids", () => {
  test.beforeEach(async ({ page }) => {
    // Connexion en tant que soignant
    await page.goto("/connexion");
    await page.getByTestId("role-btn-caregiver").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/soignant/);
  });

  test("Parcours 1 : Tableau de bord → Alerte Amina → Nouvelle évaluation → Dossier mis à jour", async ({
    page,
  }) => {
    // 1. Vérification du tableau de bord (W02)
    await expect(page.getByTestId("caregiver-dashboard-page")).toBeVisible();
    await expect(page.getByText("Tableau de bord — Espace soignant")).toBeVisible();
    await expect(page.getByTestId("kpi-active-alerts")).toBeVisible();

    // 2. Clic sur l'alerte Hamadou pour ouvrir son dossier (W04)
    const openFileBtn = page.getByTestId("open-file-btn-A-014");
    await expect(openFileBtn).toBeVisible();
    await openFileBtn.click();
    await expect(page).toHaveURL(/\/soignant\/personnes\/A-014/);
    await expect(page.getByTestId("person-file-page")).toBeVisible();
    await expect(page.getByText("Hamadou (#A-014)")).toBeVisible();

    // 3. Clic sur "Nouvelle évaluation" (W05)
    const newEvalBtn = page.getByTestId("new-evaluation-btn");
    await expect(newEvalBtn).toBeVisible();
    await newEvalBtn.click();
    await expect(page).toHaveURL(/\/soignant\/personnes\/A-014\/evaluation/);
    await expect(page.getByTestId("new-evaluation-page")).toBeVisible();

    // Vérification des calculs cliniques en direct
    await expect(page.getByTestId("clinical-calc-results")).toBeVisible();
    await expect(page.getByTestId("proposed-classification")).toContainText(
      "malnutrition aiguë modérée"
    );

    // 4. Enregistrement de l'évaluation → Redirection vers dossier mis à jour (W06)
    const submitBtn = page.getByTestId("submit-evaluation-btn");
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page).toHaveURL(/\/soignant\/personnes\/A-014\?updated=true/);
    await expect(page.getByTestId("evaluation-saved-notice")).toBeVisible();
    await expect(page.getByTestId("eval-row-12-11")).toBeVisible();
    await expect(page.getByTestId("back-to-dashboard-btn")).toBeVisible();
  });

  test("Parcours 2 : Notifications → Dossier", async ({ page }) => {
    // 1. Accès aux notifications soignant via la navigation latérale (W08)
    const notifNav = page.getByTestId("sidebar-item-/soignant/notifications");
    await expect(notifNav).toBeVisible();
    await notifNav.click();
    await expect(page).toHaveURL(/\/soignant\/notifications/);
    await expect(page.getByTestId("caregiver-notifications-page")).toBeVisible();
    await expect(page.getByText("Notifications soignant")).toBeVisible();

    // 2. Clic sur le bouton "Ouvrir le dossier ›" de la première notification
    const openFromNotifBtn = page.getByTestId("open-file-from-notif-notif-1");
    await expect(openFromNotifBtn).toBeVisible();
    await openFromNotifBtn.click();

    // 3. Vérification de l'arrivée sur le dossier d'Hamadou (W04)
    await expect(page).toHaveURL(/\/soignant\/personnes\/A-014/);
    await expect(page.getByTestId("person-file-page")).toBeVisible();
    await expect(page.getByText("Hamadou (#A-014)")).toBeVisible();
  });
});
