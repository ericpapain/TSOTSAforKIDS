import { test, expect } from "@playwright/test";

test.describe("Internationalisation (i18n FR/EN) — Écrans W01 à W09", () => {
  test("W01 (Nutrition) : bascule EN, textes anglais présents, textes français absents, persistance au rechargement", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.getByTestId("role-btn-user").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/nutrition\/produits\/plumpy-nut/);

    // Bascule en anglais
    await page.getByTestId("lang-btn-en").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // Texte anglais présent, texte français absent
    await expect(page.getByText("Equivalent local foods")).toBeVisible();
    await expect(page.getByText("Confirm an intake ›")).toBeVisible();
    await expect(page.getByText("Aliments locaux équivalents")).toHaveCount(0);

    // Rechargement et persistance
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Equivalent local foods")).toBeVisible();
    await expect(page.getByText("Aliments locaux équivalents")).toHaveCount(0);
  });

  test("W02 (Dashboard), W03 (Liste), W04 (Dossier), W05 (Évaluation), W06 (Dossier mis à jour), W07 (Plan), W08 (Notifs), W09 (Réglages) en anglais avec rechargement", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.getByTestId("role-btn-caregiver").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/soignant/);

    // W02 : Tableau de bord soignant
    await page.getByTestId("lang-btn-en").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Dashboard — Caregiver portal")).toBeVisible();
    await expect(page.getByText("Tableau de bord — Espace soignant")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Dashboard — Caregiver portal")).toBeVisible();

    // W03 : Liste des personnes suivies
    await page.goto("/soignant/personnes");
    await expect(page.getByText("Followed persons (4)")).toBeVisible();
    await expect(page.getByText("Personnes suivies (4)")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Followed persons (4)")).toBeVisible();

    // W04 : Fiche patient
    await page.goto("/soignant/personnes/A-014");
    await expect(page.getByText("Identity & Record")).toBeVisible();
    await expect(page.getByText("Weight-for-length WHO growth chart (2006)")).toBeVisible();
    await expect(page.getByText("Identité & Dossier")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Identity & Record")).toBeVisible();

    // W05 : Nouvelle évaluation clinique
    await page.goto("/soignant/personnes/A-014/evaluation");
    await expect(page.getByText("New clinical assessment — Hamadou (#A-014)")).toBeVisible();
    await expect(page.getByTestId("proposed-classification")).toContainText(
      "moderate acute malnutrition"
    );
    await expect(page.getByText("Nouvelle évaluation clinique — Hamadou (#A-014)")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("New clinical assessment — Hamadou (#A-014)")).toBeVisible();

    // W06 : Fiche patient mise à jour
    await page.goto("/soignant/personnes/A-014?updated=true");
    await expect(page.getByTestId("evaluation-saved-notice")).toContainText("Assessment saved");
    await expect(page.getByTestId("back-to-dashboard-btn")).toContainText("Back to dashboard");
    await expect(page.getByText("Évaluation enregistrée")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByTestId("evaluation-saved-notice")).toContainText("Assessment saved");

    // W07 : Plan de prises
    await page.goto("/soignant/personnes/A-014/plan");
    await expect(
      page.getByText("Intake plan and reminders — Hamadou (#A-014)")
    ).toBeVisible();
    await expect(
      page.getByText("Plan de prises et rappels — Hamadou (#A-014)")
    ).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByText("Intake plan and reminders — Hamadou (#A-014)")
    ).toBeVisible();

    // W08 : Notifications soignant
    await page.goto("/soignant/notifications");
    await expect(page.getByText("Caregiver notifications")).toBeVisible();
    await expect(page.getByTestId("mark-all-read-btn")).toContainText("Mark all as read");
    await expect(page.getByText("Notifications soignant")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Caregiver notifications")).toBeVisible();

    // W09 : Réglages des notifications
    await page.goto("/soignant/parametres/notifications");
    await expect(page.getByText("Caregiver notification settings")).toBeVisible();
    await expect(page.getByText("Quiet hours window")).toBeVisible();
    await expect(page.getByText("Réglages des notifications soignant")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Caregiver notification settings")).toBeVisible();
  });
});

