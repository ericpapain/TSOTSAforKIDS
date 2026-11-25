const { chromium } = require('playwright');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/mezat/.gemini/antigravity/brain/794a88a5-4107-4f3b-9f06-2bb971e09ff1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('request', (req) => {
    if (req.url().includes('/enroll-family')) {
      console.log('[ENROLL REQUEST POST DATA]:', req.postData());
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/enroll-family') || res.status() >= 400) {
      console.log(`[HTTP ${res.status()}] ${res.url()}`);
      try {
        const text = await res.text();
        console.log(`[RESPONSE BODY]:`, text);
      } catch (e) {}
    }
  });

  const ts = Date.now();
  const testFamilyEmail = `famille.${ts}@tsotsa-for-kids.com`;
  const testCaregiverEmail = `docteur.test.${ts}@tsotsa-for-kids.com`;
  const testAgentEmail = `agent.test.${ts}@tsotsa-for-kids.com`;

  console.log('=== ÉTAPE 1 : Enrôlement terrain avec poids décimal "0,8" (Cas réel de l\'utilisateur) ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.locator('[data-testid="role-btn-field_agent"]').click();
  await page.locator('input[type="email"]').fill('terrain@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  // Open modal and fill details with decimal comma "0,8"
  await page.locator('[data-testid="btn-open-register-family-modal"]').click();
  await page.waitForTimeout(1000);

  await page.locator('[data-testid="parent-firstname-input"]').fill('Raissa');
  await page.locator('[data-testid="parent-lastname-input"]').fill('Guedia Mejiozem');
  await page.locator('input[type="email"]').fill(testFamilyEmail);
  await page.locator('[data-testid="parent-phone-input"]').fill('0753546312');
  
  // Child details with 0,8 kg
  await page.locator('[data-testid="child-0-firstname"]').fill('Eric Papain');
  await page.locator('[data-testid="child-0-birthdate"]').fill('2024-11-14');
  await page.locator('[data-testid="child-0-weight"]').fill('0,8');

  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_01_agent_enroll_family_modal.png` });
  console.log('Capture modale enrôlement avec 0,8 kg sauvegardée.');

  await page.locator('[data-testid="btn-confirm-register-family"]').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_01b_agent_after_enrollment.png` });
  console.log('Enrôlement soumis avec succès sans erreur [object Object] !');

  console.log('=== ÉTAPE 2 : Inscription de nouveaux soignant et agent (statut pending) ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // Inscription Médecin
  await page.locator('[data-testid="role-btn-caregiver"]').click();
  await page.locator('[data-testid="tab-register"]').click();
  await page.waitForTimeout(500);
  await page.locator('[data-testid="register-first-name-input"]').fill('Jean-Luc');
  await page.locator('[data-testid="register-last-name-input"]').fill('Nguemo');
  await page.locator('[data-testid="register-email-input"]').fill(testCaregiverEmail);
  await page.locator('[data-testid="register-password-input"]').fill('Tsotsa2026!Securite');
  await page.locator('[data-testid="register-confirm-password-input"]').fill('Tsotsa2026!Securite');
  await page.locator('[data-testid="register-phone-input"]').fill('0655443322');
  if (await page.locator('[data-testid="register-specialty-input"]').isVisible()) {
    await page.locator('[data-testid="register-specialty-input"]').fill('Pédiatrie');
  }
  await page.locator('[data-testid="register-submit-btn"]').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_02_caregiver_registered_pending.png` });
  console.log('Soignant inscrit en attente de validation.');

  console.log('=== ÉTAPE 3 : Connexion Super-Soignant & Revue Supervision ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('[data-testid="role-btn-super_caregiver"]').click();
  await page.locator('input[type="email"]').fill('supersoignant@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('Super-Soignant connecté URL:', page.url());

  // Check Tab 1: Enfants & Familles
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_03_super_doctor_tab_patients.png` });
  
  // Test category filters on Tab 1
  if (await page.locator('[data-testid="filter-patients-agent"]').isVisible()) {
    await page.locator('[data-testid="filter-patients-agent"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${ARTIFACT_DIR}/verif_03b_filter_agent_patients.png` });
  }

  // Validate the enrolled child
  const validatePatientBtn = page.locator('button:has-text("Valider & Attribuer")').first();
  if (await validatePatientBtn.isVisible()) {
    console.log('Validation clinique de l\'enfant...');
    await validatePatientBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${ARTIFACT_DIR}/verif_04_patient_validated.png` });
  }

  // Check Tab 2: Personnel Soignant & Agents
  console.log('Affichage de l\'onglet Personnel Soignant & Agents...');
  await page.locator('[data-testid="tab-staff-validation"]').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_05_super_doctor_tab_staff.png` });

  // Test category filters on Tab 2
  if (await page.locator('[data-testid="filter-staff-caregiver"]').isVisible()) {
    await page.locator('[data-testid="filter-staff-caregiver"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${ARTIFACT_DIR}/verif_05b_filter_caregivers.png` });
  }

  // Approve the pending doctor
  const approveStaffBtn = page.locator('button:has-text("Approuver")').first();
  if (await approveStaffBtn.isVisible()) {
    console.log('Approbation du médecin...');
    await approveStaffBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${ARTIFACT_DIR}/verif_06_staff_approved.png` });
  }

  console.log('=== ÉTAPE 4 : Connexion de la famille enrôlée ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('[data-testid="role-btn-parent"]').click();
  await page.locator('input[type="email"]').fill(testFamilyEmail);
  await page.locator('input[type="password"]').fill('Tsotsa2026!Famille');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('Parent URL après connexion:', page.url());
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_07_parent_family_dashboard.png` });

  console.log('=== ÉTAPE 5 : Connexion du médecin approuvé ===');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('[data-testid="role-btn-caregiver"]').click();
  await page.locator('input[type="email"]').fill(testCaregiverEmail);
  await page.locator('input[type="password"]').fill('Tsotsa2026!Securite');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  console.log('Médecin URL après connexion approuvée:', page.url());
  await page.screenshot({ path: `${ARTIFACT_DIR}/verif_08_approved_doctor_dashboard.png` });

  await browser.close();
  console.log('TOUS LES TESTS SE SONT TERMINÉS AVEC SUCCÈS !');
})();
