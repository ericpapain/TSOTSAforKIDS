import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAPTURES_DIR = path.resolve(__dirname, "../../../docs/roles/captures");

test.describe("Étape 5 : Captures Playwright des Rôles et Interfaces", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(CAPTURES_DIR)) {
      fs.mkdirSync(CAPTURES_DIR, { recursive: true });
    }
  });

  test("01 - Écran de connexion avec sélecteur « Je suis… »", async ({ page }) => {
    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("role-selector")).toBeVisible();

    const capturePath = path.join(CAPTURES_DIR, "01_connexion_role_selector.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  test("02 - Formulaire d'inscription avec table des 10 régions du Cameroun", async ({ page }) => {
    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("role-btn-caregiver").click();
    const registerTab = page.getByTestId("tab-register");
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }

    await expect(page.getByTestId("register-region-select")).toBeVisible();
    const capturePath = path.join(CAPTURES_DIR, "02_inscription_regions_cameroun.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  test("03 - Écran d'attente de validation d'un compte professionnel", async ({ page }) => {
    await page.route("**/v1/auth/email/register", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Account created pending validation", status: "pending" }),
      });
    });

    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("role-btn-field_agent").click();
    const registerTab = page.getByTestId("tab-register");
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }

    await page.getByTestId("register-first-name-input").fill("Amadou");
    await page.getByTestId("register-last-name-input").fill("Ousmanou");
    await page.getByTestId("register-email-input").fill("agent.terrain.test@tsotsa-kids.com");
    await page.getByTestId("register-password-input").fill("Password123!");
    await page.getByTestId("register-confirm-password-input").fill("Password123!");
    await page.getByTestId("register-region-select").selectOption("EN");
    await page.getByTestId("register-phone-input").fill("+237699112233");
    await page.getByTestId("register-submit-btn").click();

    await expect(page.getByTestId("pending-account-notice")).toBeVisible();
    const capturePath = path.join(CAPTURES_DIR, "03_compte_en_attente_validation.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  test("04 - Espace Parent Web (nutrition et équivalents locaux)", async ({ page }) => {
    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("role-btn-parent").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/nutrition/);
    await page.waitForLoadState("networkidle");

    const capturePath = path.join(CAPTURES_DIR, "04_espace_parent_web.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  test("05 - Espace Agent de Terrain (inscriptions et statut des familles)", async ({ page }) => {
    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("role-btn-field_agent").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/agent/);
    await page.waitForLoadState("networkidle");

    const capturePath = path.join(CAPTURES_DIR, "05_espace_agent_de_terrain.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  test("06 - Espace Super Soignant (réassignation médecin référent)", async ({ page }) => {
    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("role-btn-super_caregiver").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/soignant/);

    await page.goto("/soignant/personnes");
    await page.waitForLoadState("networkidle");

    const capturePath = path.join(CAPTURES_DIR, "06_super_soignant_reassignation.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });

  test("07 - Mode Supervision « Voir en tant que » (lecture seule)", async ({ page }) => {
    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("role-btn-super_caregiver").click();
    await page.getByTestId("login-submit-btn").click();
    await page.goto("/soignant?viewAs=Dr+Kamga");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("view-as-banner")).toBeVisible();
    const capturePath = path.join(CAPTURES_DIR, "07_supervision_mode_voir_comme.png");
    await page.screenshot({ path: capturePath, fullPage: true });
    expect(fs.existsSync(capturePath)).toBe(true);
  });
});
