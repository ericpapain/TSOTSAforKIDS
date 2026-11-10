import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScreenDef {
  code: string;
  name: string;
  role: "user" | "caregiver" | "admin";
  url: string;
}

const SCREENS: ScreenDef[] = [
  { code: "W01", name: "W01_w_nutrition_en.png", role: "user", url: "/nutrition/produits/plumpy-nut" },
  { code: "W02", name: "W02_s_dashboard_en.png", role: "caregiver", url: "/soignant" },
  { code: "W03", name: "W03_s_list_en.png", role: "caregiver", url: "/soignant/personnes" },
  { code: "W04", name: "W04_s_file_en.png", role: "caregiver", url: "/soignant/personnes/A-014" },
  { code: "W05", name: "W05_s_eval_en.png", role: "caregiver", url: "/soignant/personnes/A-014/evaluation" },
  { code: "W06", name: "W06_s_file_updated_en.png", role: "caregiver", url: "/soignant/personnes/A-014?updated=true" },
  { code: "W07", name: "W07_s_plan_en.png", role: "caregiver", url: "/soignant/personnes/A-014/plan" },
  { code: "W08", name: "W08_s_notif_en.png", role: "caregiver", url: "/soignant/notifications" },
  { code: "W09", name: "W09_s_notif_settings_en.png", role: "caregiver", url: "/soignant/parametres/notifications" },
  { code: "W10", name: "W10_a_dashboard_en.png", role: "admin", url: "/" },
  { code: "W11", name: "W11_a_verify_en.png", role: "admin", url: "/verifications" },
  { code: "W12", name: "W12_a_accounts_en.png", role: "admin", url: "/comptes" },
  { code: "W13", name: "W13_a_import_en.png", role: "admin", url: "/base-aliments" },
  { code: "W14", name: "W14_a_food_new_en.png", role: "admin", url: "/base-aliments/nouveau" },
  { code: "W15", name: "W15_a_import_preview_en.png", role: "admin", url: "/base-aliments/import" },
  { code: "W16", name: "W16_a_products_en.png", role: "admin", url: "/produits-reference" },
  { code: "W17", name: "W17_a_prices_en.png", role: "admin", url: "/prix" },
  { code: "W18", name: "W18_a_optim_en.png", role: "admin", url: "/optimisation" },
  { code: "W19", name: "W19_a_modules_en.png", role: "admin", url: "/modules" },
  { code: "W20", name: "W20_a_notif_en.png", role: "admin", url: "/notifications" },
];

async function loginAsRole(page: any, role: "user" | "caregiver" | "admin") {
  await page.goto("/connexion");
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

  const langEnBtn = page.getByTestId("lang-btn-en");
  if (await langEnBtn.isVisible()) {
    await langEnBtn.click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  }
}

test.describe("Étape I-6 : Captures d'écran en anglais W01–W20", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const outDir = path.resolve(rootDir, "docs/i18n/captures");

  test.beforeAll(() => {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  });

  test("Capture des 20 écrans en anglais à 1440 px pour relecture humaine", async ({ page }) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width: 1440, height: 900 });

    let currentRole: string | null = null;

    for (const screen of SCREENS) {
      if (currentRole !== screen.role) {
        await loginAsRole(page, screen.role);
        currentRole = screen.role;
      }

      await page.goto(screen.url);
      await page.waitForLoadState("networkidle");

      // Verify page is in English
      const langEnBtn = page.getByTestId("lang-btn-en");
      if (await langEnBtn.isVisible()) {
        const htmlLang = await page.locator("html").getAttribute("lang");
        if (htmlLang !== "en") {
          await langEnBtn.click();
          await page.waitForLoadState("networkidle");
        }
      }

      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);

      const targetPath = path.join(outDir, screen.name);
      await page.screenshot({ path: targetPath, fullPage: false });
      expect(fs.existsSync(targetPath)).toBe(true);
    }
  });
});
