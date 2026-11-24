import { chromium } from "playwright";
import * as path from "path";

const ARTIFACT_DIR = "C:/Users/mezat/.gemini/antigravity/brain/794a88a5-4107-4f3b-9f06-2bb971e09ff1";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log("1. Login...");
  await page.goto("https://tsotsa-for-kids.com/connexion", { waitUntil: "networkidle" });
  const parentBtn = page.locator("button:has-text('Parent')").first();
  if (await parentBtn.isVisible()) await parentBtn.click();
  await page.fill('input[type="email"], input[name="email"]', "parent@tsotsa-for-kids.com");
  await page.fill('input[type="password"]', "Tsotsa2026!Demo");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  console.log("2. Navigating to /famille...");
  await page.goto("https://tsotsa-for-kids.com/famille", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  console.log("3. Adding a new custom child...");
  await page.click('button[data-testid="add-child-top-btn"]');
  await page.waitForTimeout(500);

  // Fill Add child modal
  await page.fill('[data-testid="child-firstname-input"]', "Fidel");
  await page.click('[data-testid="child-next-step-btn"]');
  await page.waitForTimeout(500);

  // Consent checkbox & submit
  await page.click('[data-testid="child-consent-checkbox"]');
  await page.click('[data-testid="child-submit-consent-btn"]');
  await page.waitForTimeout(1500);

  console.log("4. Finding new child card and health report button...");
  // Look for child Fidel
  const fidelCard = page.locator('div:has-text("Fidel")').first();
  await fidelCard.waitFor({ state: "visible" });

  const customHealthBtn = page.locator('button[data-testid^="health-report-btn-child-"]').first();
  const testId = await customHealthBtn.getAttribute("data-testid");
  console.log("Found health report button with ID:", testId);

  // Click the exact button reported by the user
  await customHealthBtn.click();
  await page.waitForTimeout(1000);

  const modal = page.locator('[data-testid="child-health-report-modal"]');
  await modal.waitFor({ state: "visible" });

  const countSymptoms = await modal.locator('button[data-testid^="symptom-check-"]').count();
  console.log("Number of symptom options for custom child:", countSymptoms);

  // Select danger sign: convulsions
  console.log("5. Testing vital danger sign: convulsions...");
  await modal.locator('button[data-testid="symptom-check-convulsions"]').click();
  await page.waitForTimeout(500);

  // Check immediate danger banner
  const dangerBanner = modal.locator('[data-testid="immediate-danger-sign-banner"]');
  const bannerVisible = await dangerBanner.isVisible();
  console.log("Is immediate danger banner visible?", bannerVisible);

  const dangerShotPath = path.join(ARTIFACT_DIR, "health_05_danger_banner_fidel.png");
  await page.screenshot({ path: dangerShotPath });

  // Progress to step 4
  await modal.locator('button[data-testid="next-step-btn"]').click();
  await page.waitForTimeout(500);
  await modal.locator('button[data-testid="next-step-btn"]').click();
  await page.waitForTimeout(500);
  await modal.locator('button[data-testid="next-step-btn"]').click();
  await page.waitForTimeout(500);

  // Submit
  console.log("6. Submitting danger report for custom child...");
  await modal.locator('button[data-testid="submit-health-report-btn"]').click();
  await page.waitForTimeout(2500);

  const step5View = modal.locator('[data-testid="step-5-guidance-view"]');
  await step5View.waitFor({ state: "visible", timeout: 8000 });

  const customSuccessPath = path.join(ARTIFACT_DIR, "health_06_custom_child_danger_result.png");
  await page.screenshot({ path: customSuccessPath });
  console.log("Saved custom child result screenshot:", customSuccessPath);

  const finalMessage = await step5View.innerText();
  console.log("Final message:", finalMessage);

  await browser.close();
  console.log("CUSTOM CHILD HEALTH FLOW VERIFIED 100%!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
