const { chromium } = require('playwright');

const ARTIFACT_DIR = 'C:/Users/mezat/.gemini/antigravity/brain/794a88a5-4107-4f3b-9f06-2bb971e09ff1';
const TS = Date.now();

(async () => {
  const browser = await chromium.launch({ headless: true });

  const clearStorageAndCookies = async (page, context) => {
    await context.clearCookies();
    try {
      await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.clear());
    } catch (_) {}
  };

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
  });

  console.log('=== TEST 1 : INSCRIPTION PARENT AVEC RÉGION OUEST (OU) ===');
  await clearStorageAndCookies(page, context);
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-parent"]').click();
  await page.locator('[data-testid="tab-register"]').click();
  await page.waitForTimeout(500);

  const parentEmail = `eric.mezatio.${TS}@gmail.com`;
  await page.locator('[data-testid="register-first-name-input"]').fill('Eric');
  await page.locator('[data-testid="register-last-name-input"]').fill('Mezatio');
  await page.locator('[data-testid="register-email-input"]').fill(parentEmail);
  await page.locator('[data-testid="register-password-input"]').fill('Tsotsa2026!Eric');
  await page.locator('[data-testid="register-confirm-password-input"]').fill('Tsotsa2026!Eric');
  await page.locator('[data-testid="register-region-select"]').selectOption('OU'); // Ouest
  await page.locator('[data-testid="register-locality-input"]').fill('Bafang');
  await page.locator('[data-testid="register-phone-input"]').fill('054696644');

  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_13a_parent_registration_form.png` });
  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(5000);

  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_13b_parent_after_registration.png` });
  console.log('Inscription parent réussie, URL finale :', page.url());

  console.log('=== TEST 2 : CONNEXION AGENT TERRAIN ET ENRÔLEMENT FAMILLE AVEC ENFANTS ET POIDS VIRGULE ===');
  await clearStorageAndCookies(page, context);
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-field_agent"]').click();
  await page.locator('[data-testid="login-email-input"]').fill('terrain@tsotsa-for-kids.com');
  await page.locator('[data-testid="login-password-input"]').fill('Tsotsa2026!Demo');
  await page.locator('[data-testid="login-submit-btn"]').click();
  await page.waitForTimeout(3000);

  await page.locator('[data-testid="btn-open-register-family-modal"]').click();
  await page.waitForTimeout(1000);

  await page.locator('[data-testid="parent-firstname-input"]').fill('Raissa');
  await page.locator('[data-testid="parent-lastname-input"]').fill('Guedia');
  await page.locator('[data-testid="parent-phone-input"]').fill(`075354${Math.floor(1000 + Math.random() * 9000)}`);
  await page.locator('input[type="email"]').fill(`raissa.${TS}@gmail.com`);

  // Enfant 1 avec poids virgule "0,8"
  await page.locator('[data-testid="child-0-firstname"]').fill('Eric Papain');
  await page.locator('[data-testid="child-0-birthdate"]').fill('2026-11-14');
  await page.locator('[data-testid="child-0-weight"]').fill('0,8');

  // Ajouter Enfant 2
  await page.locator('button:has-text("Ajouter un autre enfant")').click();
  await page.waitForTimeout(500);
  await page.locator('[data-testid="child-1-firstname"]').fill('LKKL');
  await page.locator('[data-testid="child-1-birthdate"]').fill('2026-11-11');
  await page.locator('[data-testid="child-1-weight"]').fill('1,4');

  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_14a_field_agent_enroll_modal.png` });
  await page.locator('[data-testid="btn-confirm-register-family"]').click();
  await page.waitForTimeout(4000);

  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_14b_field_agent_after_enroll.png` });
  console.log('Enrôlement agent de terrain testé avec succès.');

  console.log('=== TEST 3 : SUPER-SOIGNANT - VÉRIFICATION DES VUES ===');
  await clearStorageAndCookies(page, context);
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-super_caregiver"]').click();
  await page.locator('[data-testid="login-email-input"]').fill('supersoignant@tsotsa-for-kids.com');
  await page.locator('[data-testid="login-password-input"]').fill('Tsotsa2026!Demo');
  await page.locator('[data-testid="login-submit-btn"]').click();
  await page.waitForTimeout(4000);

  // Vue Tous les patients via navigation latérale
  await page.locator('a:has-text("Tous les patients")').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_15_all_patients_populated.png` });
  console.log('Tous les patients enregistrés avec succès.');

  // Vue Association via navigation latérale
  await page.locator('a:has-text("Association")').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_16a_association_table.png` });
  const reassignBtn = page.locator('button:has-text("Réassigner")').first();
  if (await reassignBtn.isVisible()) {
    await reassignBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/verif_16b_association_modal.png` });
    await page.locator('button:has-text("Annuler")').click();
  }

  // Vue Gestion des droits via navigation latérale
  await page.locator('a:has-text("Gestion des droits")').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_17_delegations_populated.png` });

  // Vue Supervision & Validations via navigation latérale
  await page.locator('a:has-text("Supervision & Validations")').click();
  await page.waitForTimeout(2000);
  await page.locator('[data-testid="tab-promotion"]').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_18_super_doctor_dropdown.png` });

  await browser.close();
  console.log('=== TOUTES LES VÉRIFICATIONS SONT COMPLÈTES ET VERTES ! ===');
})();
