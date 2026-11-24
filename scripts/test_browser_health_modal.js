import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const ARTIFACT_DIR = "C:/Users/mezat/.gemini/antigravity/brain/794a88a5-4107-4f3b-9f06-2bb971e09ff1";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log("1. Navigating to login page...");
  await page.goto("https://tsotsa-for-kids.com/connexion", { waitUntil: "networkidle" });

  console.log("2. Logging in as parent...");
  // Click Parent profile tab
  const parentBtn = page.locator("button:has-text('Parent')").first();
  if (await parentBtn.isVisible()) {
    await parentBtn.click();
  }

  // Fill credentials
  await page.fill('input[type="email"], input[name="email"]', "parent@tsotsa-for-kids.com");
  await page.fill('input[type="password"]', "Tsotsa2026!Demo");
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log("Current URL after login:", page.url());

  // Navigate to /famille
  console.log("3. Navigating to /famille...");
  await page.goto("https://tsotsa-for-kids.com/famille", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Take screenshot of family page
  const famPath = path.join(ARTIFACT_DIR, "health_01_famille_page.png");
  await page.screenshot({ path: famPath, fullPage: true });
  console.log("Saved family page screenshot:", famPath);

  // Find health button
  console.log("4. Looking for health report button...");
  const healthBtn = page.locator('button[data-testid^="health-report-btn-"]').first();
  const btnCount = await page.locator('button[data-testid^="health-report-btn-"]').count();
  console.log("Found health report buttons:", btnCount);

  if (btnCount === 0) {
    throw new Error("No health report buttons found on /famille");
  }

  await healthBtn.click();
  await page.waitForTimeout(1500);

  // Verify modal is open
  const modal = page.locator('[data-testid="child-health-report-modal"]');
  await modal.waitFor({ state: "visible", timeout: 5000 });

  // Take screenshot of Step 1 with symptoms list
  const step1Path = path.join(ARTIFACT_DIR, "health_02_modal_symptomes.png");
  await page.screenshot({ path: step1Path });
  console.log("Saved modal symptoms screenshot:", step1Path);

  // Count visible symptom items
  const symptomBtns = modal.locator('button[data-testid^="symptom-check-"]');
  const countSymptoms = await symptomBtns.count();
  console.log("Number of symptom options rendered:", countSymptoms);

  if (countSymptoms === 0) {
    throw new Error("Symptom catalog is still empty in the modal!");
  }

  // Select a symptom: 'fever'
  console.log("5. Selecting 'fever' symptom...");
  const feverBtn = modal.locator('button[data-testid="symptom-check-fever"]');
  await feverBtn.click();
  await page.waitForTimeout(500);

  // Verify Continue button is enabled
  const nextBtn = modal.locator('button[data-testid="next-step-btn"]');
  const isDisabled = await nextBtn.isDisabled();
  console.log("Is continue button disabled?", isDisabled);
  if (isDisabled) {
    throw new Error("Continue button is still disabled after selecting a symptom!");
  }

  // Click continue to Step 2
  await nextBtn.click();
  await page.waitForTimeout(800);

  // Fill Step 2 details
  const step2View = modal.locator('[data-testid="step-2-view"]');
  await step2View.waitFor({ state: "visible" });
  console.log("Step 2 visible, entering temperature...");
  const tempInput = modal.locator('input[type="number"]');
  if (await tempInput.isVisible()) {
    await tempInput.fill("38.8");
  }

  // Step 2 -> Step 3
  await modal.locator('button[data-testid="next-step-btn"]').click();
  await page.waitForTimeout(800);

  // Step 3 -> Step 4
  console.log("Step 3 visible, entering comment...");
  const step3View = modal.locator('[data-testid="step-3-view"]');
  await step3View.waitFor({ state: "visible" });
  await modal.locator("textarea").fill("Test de santé enfant - fièvre modérée");
  await modal.locator('button[data-testid="next-step-btn"]').click();
  await page.waitForTimeout(800);

  // Step 4: Summary
  console.log("Step 4 visible (Summary), submitting...");
  const step4View = modal.locator('[data-testid="step-4-view"]');
  await step4View.waitFor({ state: "visible" });

  const step4Path = path.join(ARTIFACT_DIR, "health_03_recapitulatif.png");
  await page.screenshot({ path: step4Path });

  // Submit health report
  await modal.locator('button[data-testid="submit-health-report-btn"]').click();
  await page.waitForTimeout(3000);

  // Step 5: Result & Guidance
  console.log("Step 5 visible (Guidance & Feedback)...");
  const step5View = modal.locator('[data-testid="step-5-guidance-view"]');
  await step5View.waitFor({ state: "visible", timeout: 8000 });

  const step5Path = path.join(ARTIFACT_DIR, "health_04_confirmation_guidance.png");
  await page.screenshot({ path: step5Path });
  console.log("Saved confirmation screenshot:", step5Path);

  const feedbackText = await step5View.innerText();
  console.log("Guidance text displayed:", feedbackText);

  await browser.close();
  console.log("TEST COMPLETED WITH SUCCESS!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
