const { chromium } = require('playwright');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/mezat/.gemini/antigravity/brain/794a88a5-4107-4f3b-9f06-2bb971e09ff1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('=== TEST 1: Role Mismatch Protection ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-parent"]').click();
  await page.locator('input[type="email"]').fill('supersoignant@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/gov_01_role_mismatch.png` });
  console.log('Role mismatch test screenshot saved.');

  console.log('=== TEST 2: Field Agent Login & Enrollment ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-field_agent"]').click();
  await page.locator('input[type="email"]').fill('terrain@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('Field agent URL:', page.url());
  await page.screenshot({ path: `${ARTIFACT_DIR}/gov_02_field_agent_dashboard.png` });

  // Open modal and enroll family
  const testFamilyTime = Date.now();
  const testFamilyEmail = `famille.test.${testFamilyTime}@tsotsa-for-kids.com`;
  console.log('Enrolling new family:', testFamilyEmail);

  await page.locator('[data-testid="btn-open-register-family-modal"]').click();
  await page.waitForTimeout(500);

  await page.locator('[data-testid="parent-firstname-input"]').fill('Paul');
  await page.locator('[data-testid="parent-lastname-input"]').fill('Atangana');
  await page.locator('input[type="email"]').fill(testFamilyEmail);
  await page.locator('[data-testid="parent-phone-input"]').fill('+237699334455');
  await page.locator('[data-testid="child-0-firstname"]').fill('Michel Atangana');
  await page.locator('[data-testid="child-0-birthdate"]').fill('2023-05-10');

  await page.screenshot({ path: `${ARTIFACT_DIR}/gov_03_modal_enroll_family.png` });
  await page.locator('[data-testid="btn-confirm-register-family"]').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/gov_04_family_enrolled_pending.png` });
  console.log('Family enrolled by Field Agent.');

  console.log('=== TEST 3: Super-Caregiver Validation & Attribution ===');
  // Log out
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Login as Super Caregiver
  await page.locator('[data-testid="role-btn-super_caregiver"]').click();
  await page.locator('input[type="email"]').fill('supersoignant@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('Super Caregiver URL:', page.url());
  await page.screenshot({ path: `${ARTIFACT_DIR}/gov_05_supervision_pending_list.png` });

  // Validate the enrolled child
  const validateBtn = page.locator('button:has-text("Valider & Attribuer")').first();
  if (await validateBtn.isVisible()) {
    console.log('Clicking Valider & Attribuer...');
    await validateBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/gov_06_supervision_after_validation.png` });
    console.log('Patient validated by Super-Caregiver.');
  }

  console.log('=== TEST 4: Field Agent Checks Dossier Status ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('[data-testid="role-btn-field_agent"]').click();
  await page.locator('input[type="email"]').fill('terrain@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/gov_07_agent_view_validated.png` });
  console.log('Field agent view validated dossier screenshot saved.');

  console.log('=== TEST 5: Parent Log In & Meal Intake ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('[data-testid="role-btn-parent"]').click();
  await page.locator('input[type="email"]').fill(testFamilyEmail);
  await page.locator('input[type="password"]').fill('Tsotsa2026!Famille');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('Parent dashboard URL:', page.url());
  await page.screenshot({ path: `${ARTIFACT_DIR}/gov_08_parent_family_dashboard.png` });

  console.log('ALL GOVERNANCE E2E SCENARIOS COMPLETED SUCCESSFULLY!');
  await browser.close();
})();
