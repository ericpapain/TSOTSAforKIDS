import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScreenDef {
  code: string;
  refName: string;
  role: "user" | "caregiver" | "admin";
  url: string;
}

const SCREENS: ScreenDef[] = [
  { code: "W01", refName: "w_nutrition.png", role: "user", url: "/nutrition/produits/plumpy-nut" },
  { code: "W02", refName: "s_dashboard.png", role: "caregiver", url: "/soignant" },
  { code: "W03", refName: "s_list.png", role: "caregiver", url: "/soignant/personnes" },
  { code: "W04", refName: "s_file.png", role: "caregiver", url: "/soignant/personnes/A-014" },
  { code: "W05", refName: "s_eval.png", role: "caregiver", url: "/soignant/personnes/A-014/evaluation" },
  { code: "W06", refName: "s_file_updated.png", role: "caregiver", url: "/soignant/personnes/A-014?updated=true" },
  { code: "W07", refName: "s_plan.png", role: "caregiver", url: "/soignant/personnes/A-014/plan" },
  { code: "W08", refName: "s_notif.png", role: "caregiver", url: "/soignant/notifications" },
  { code: "W09", refName: "s_notif_settings.png", role: "caregiver", url: "/soignant/parametres/notifications" },
  { code: "W10", refName: "a_dashboard.png", role: "admin", url: "/" },
  { code: "W11", refName: "a_verify.png", role: "admin", url: "/verifications" },
  { code: "W12", refName: "a_accounts.png", role: "admin", url: "/comptes" },
  { code: "W13", refName: "a_import.png", role: "admin", url: "/base-aliments" },
  { code: "W14", refName: "a_food_new.png", role: "admin", url: "/base-aliments/nouveau" },
  { code: "W15", refName: "a_import_preview.png", role: "admin", url: "/base-aliments/import" },
  { code: "W16", refName: "a_products.png", role: "admin", url: "/produits-reference" },
  { code: "W17", refName: "a_prices.png", role: "admin", url: "/prix" },
  { code: "W18", refName: "a_optim.png", role: "admin", url: "/optimisation" },
  { code: "W19", refName: "a_modules.png", role: "admin", url: "/modules" },
  { code: "W20", refName: "a_notif.png", role: "admin", url: "/notifications" },
];

async function loginAsRole(page: any, role: "user" | "caregiver" | "admin") {
  try {
    await page.goto("/connexion");
  } catch {
    await page.waitForTimeout(500);
    await page.goto("/connexion");
  }
  if (role === "admin") {
    await page.getByTestId("role-btn-admin").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL("/");
  } else if (role === "caregiver") {
    await page.getByTestId("role-btn-caregiver").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/soignant/);
  } else {
    await page.getByTestId("role-btn-user").click();
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/nutrition/);
  }
  await page.waitForLoadState("networkidle");
}

test.describe("Étape W-E : Captures 1440 px et Responsive 1280 px / 1024 px", () => {
  const screenshotsDir = path.resolve(__dirname, "screenshots");

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test("Capture des 20 pages à 1440 px de large", async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1440, height: 673 });

    let currentRole: string | null = null;

    for (const screen of SCREENS) {
      if (currentRole !== screen.role) {
        await loginAsRole(page, screen.role);
        currentRole = screen.role;
      }

      await page.goto(screen.url);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);

      const outPath = path.join(screenshotsDir, screen.refName);
      await page.screenshot({ path: outPath, fullPage: false });
      expect(fs.existsSync(outPath)).toBe(true);
    }
  });

  test("Affichage responsive à 1280 px (tableaux défilants et adaptation fluide)", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Soignant
    await loginAsRole(page, "caregiver");
    await page.goto("/soignant/personnes");
    await page.waitForLoadState("networkidle");
    const caregiverTable = page.getByTestId("followed-persons-table");
    await expect(caregiverTable).toBeVisible();

    // 2. Admin
    await loginAsRole(page, "admin");
    await page.goto("/base-aliments");
    await page.waitForLoadState("networkidle");
    const adminTable = page.getByTestId("foods-table");
    await expect(adminTable).toBeVisible();

    // 3. User
    await loginAsRole(page, "user");
    await expect(page.getByTestId("ranked-foods-table")).toBeVisible();
  });

  test("Affichage responsive à 1024 px (menu réduit 72 px, libellés masqués, tableaux défilants)", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1024, height: 768 });

    // Connexion admin
    await loginAsRole(page, "admin");
    await page.goto("/base-aliments");
    await page.waitForLoadState("networkidle");

    // Vérification du menu réduit
    const sidebar = page.getByTestId("sidebar-nav");
    await expect(sidebar).toBeVisible();
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(Math.round(box.width)).toBe(72);
    }

    // Vérification que les libellés texte du menu sont masqués
    const sidebarLabel = page.getByTestId("sidebar-label-/base-aliments");
    await expect(sidebarLabel).toBeHidden();

    // Vérification que le tableau est défilant (overflow-x-auto)
    const tableContainer = page.getByTestId("foods-table");
    await expect(tableContainer).toBeVisible();
    const overflowX = await tableContainer.evaluate((el) => window.getComputedStyle(el).overflowX);
    expect(["auto", "scroll"]).toContain(overflowX);
  });

  test("Vérification géométrique pixel-près à 1440 px (écarts <= 2 px sur en-tête, menu, zone de contenu)", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 673 });

    await loginAsRole(page, "admin");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 1. AppHeader : hauteur 63 px (±2 px)
    const header = page.getByTestId("app-header");
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    if (headerBox) {
      expect(Math.abs(headerBox.height - 63)).toBeLessThanOrEqual(2);
    }

    // 2. BrandLogo : position x = 29 px (±2 px), conteneur symbole 42 px (1,24 * 34)
    const logo = page.getByTestId("header-brand-logo");
    const logoBox = await logo.boundingBox();
    expect(logoBox).not.toBeNull();
    if (logoBox) {
      expect(Math.abs(logoBox.x - 29)).toBeLessThanOrEqual(2);
      expect(Math.abs(logoBox.height - 42)).toBeLessThanOrEqual(2);
    }

    // 3. Sidebar : largeur fixe 262 px (±2 px)
    const sidebar = page.getByTestId("sidebar-nav");
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox).not.toBeNull();
    if (sidebarBox) {
      expect(Math.abs(sidebarBox.width - 262)).toBeLessThanOrEqual(2);
    }

    // 4. KpiCard : hauteur 114 px (±2 px)
    const kpi = page.getByTestId("kpi-caregiver");
    const kpiBox = await kpi.boundingBox();
    expect(kpiBox).not.toBeNull();
    if (kpiBox) {
      expect(Math.abs(kpiBox.height - 114)).toBeLessThanOrEqual(2);
    }
  });
});
