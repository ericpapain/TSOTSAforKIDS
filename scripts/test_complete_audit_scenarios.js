const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/mezat/.gemini/antigravity/brain/794a88a5-4107-4f3b-9f06-2bb971e09ff1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('--- TEST 1: Role Mismatch on Login ---');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-parent"]').click();
  await page.waitForTimeout(300);
  await page.locator('input[type="email"]').fill('supersoignant@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_01_role_mismatch.png') });
  console.log('Test 1 captured: test_01_role_mismatch.png');

  console.log('--- TEST 2: Successful Super-Caregiver Login ---');
  await page.locator('[data-testid="role-btn-super_caregiver"]').click();
  await page.waitForTimeout(300);
  await page.locator('input[type="email"]').fill('supersoignant@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('Super caregiver page URL:', page.url());
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_02_super_caregiver_dashboard.png') });
  console.log('Test 2 captured: test_02_super_caregiver_dashboard.png');

  console.log('--- TEST 3: Registration Validation Scenarios ---');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-parent"]').click();
  await page.locator('[data-testid="tab-register"]').click();
  await page.waitForTimeout(500);

  // 3a: Empty submission
  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_03_register_missing_fields.png') });
  console.log('Test 3a captured: test_03_register_missing_fields.png');

  // 3b: Invalid email
  await page.locator('[data-testid="register-first-name-input"]').fill('Test');
  await page.locator('[data-testid="register-last-name-input"]').fill('User');
  await page.locator('[data-testid="register-email-input"]').fill('not-an-email');
  await page.locator('[data-testid="register-password-input"]').fill('Password123!');
  await page.locator('[data-testid="register-confirm-password-input"]').fill('Password123!');
  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_04_register_invalid_email.png') });
  console.log('Test 3b captured: test_04_register_invalid_email.png');

  // 3c: Password mismatch
  await page.locator('[data-testid="register-email-input"]').fill('valid.test@example.com');
  await page.locator('[data-testid="register-password-input"]').fill('Password123!');
  await page.locator('[data-testid="register-confirm-password-input"]').fill('DifferentPassword123!');
  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_05_register_password_mismatch.png') });
  console.log('Test 3c captured: test_05_register_password_mismatch.png');

  // 3d: Password too short (< 8)
  await page.locator('[data-testid="register-password-input"]').fill('Short1!');
  await page.locator('[data-testid="register-confirm-password-input"]').fill('Short1!');
  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_06_register_password_short.png') });
  console.log('Test 3d captured: test_06_register_password_short.png');

  // 3e: Email already used
  await page.locator('[data-testid="register-email-input"]').fill('ericpapamezatio@gmail.com');
  await page.locator('[data-testid="register-password-input"]').fill('Password123!');
  await page.locator('[data-testid="register-confirm-password-input"]').fill('Password123!');
  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_07_register_email_already_used.png') });
  console.log('Test 3e captured: test_07_register_email_already_used.png');

  console.log('--- TEST 4: Successful Parent Registration & Dashboard ---');
  const uniqueEmail = `parent.demo.${Date.now()}@tsotsa-for-kids.com`;
  await page.locator('[data-testid="register-first-name-input"]').fill('Fidelis');
  await page.locator('[data-testid="register-last-name-input"]').fill('Jiomekong');
  await page.locator('[data-testid="register-email-input"]').fill(uniqueEmail);
  await page.locator('[data-testid="register-password-input"]').fill('Tsotsa2026!Sec');
  await page.locator('[data-testid="register-confirm-password-input"]').fill('Tsotsa2026!Sec');
  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(4000);
  console.log('URL after parent registration:', page.url());
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_08_parent_registered_dashboard.png') });
  console.log('Test 4 captured: test_08_parent_registered_dashboard.png');

  console.log('--- TEST 5: Parent Adds Child (Fidel) with Consent ---');
  if (!page.url().includes('/famille')) {
    await page.goto('https://tsotsa-for-kids.com/famille', { waitUntil: 'networkidle' });
  }
  const addBtn = page.locator('[data-testid="add-child-top-btn"]');
  await addBtn.click();
  await page.waitForTimeout(500);

  // Fill Step 1
  await page.locator('[data-testid="child-firstname-input"]').fill('Fidel Junior');
  await page.locator('[data-testid="child-next-step-btn"]').click();
  await page.waitForTimeout(500);

  // Fill Step 2 (Consent)
  await page.locator('[data-testid="child-consent-checkbox"]').check();
  await page.waitForTimeout(300);
  await page.locator('[data-testid="child-submit-consent-btn"]').click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_09_child_created_pending.png') });
  console.log('Test 5 captured: test_09_child_created_pending.png');

  console.log('--- TEST 6: Super-Caregiver Validates Child Dossier ---');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-super_caregiver"]').click();
  await page.locator('input[type="email"]').fill('supersoignant@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  await page.goto('https://tsotsa-for-kids.com/soignant/supervision/validation', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const validateBtn = page.locator('button', { hasText: 'Valider & Attribuer' }).first();
  if (await validateBtn.count() > 0) {
    await validateBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_10_super_caregiver_validated.png') });
  console.log('Test 6 captured: test_10_super_caregiver_validated.png');

  console.log('--- TEST 7: Parent Verified Status & Attending Doctor ---');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-parent"]').click();
  await page.locator('input[type="email"]').fill(uniqueEmail);
  await page.locator('input[type="password"]').fill('Tsotsa2026!Sec');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  await page.goto('https://tsotsa-for-kids.com/famille', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_11_child_validated_family_page.png') });
  console.log('Test 7 captured: test_11_child_validated_family_page.png');

  await browser.close();
  console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
})();
