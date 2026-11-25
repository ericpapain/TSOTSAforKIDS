const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text()));

  page.on('request', req => {
    if (req.url().includes('/auth/email/login')) {
      console.log('>>> LOGIN REQUEST URL:', req.url());
      console.log('>>> LOGIN REQUEST POST DATA:', req.postData());
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/auth/email/login')) {
      console.log('<<< LOGIN RESPONSE STATUS:', res.status());
      try {
        const text = await res.text();
        console.log('<<< LOGIN RESPONSE BODY:', text);
      } catch (e) {
        console.log('<<< ERROR READING BODY:', e.message);
      }
    }
  });

  console.log('Navigating to https://tsotsa-for-kids.com/connexion ...');
  await page.goto('https://tsotsa-for-kids.com/connexion', { waitUntil: 'networkidle' });
  
  // Select 'Super soignant'
  console.log('Selecting role Super soignant...');
  await page.locator('[data-testid="role-btn-super_caregiver"]').click();
  await page.waitForTimeout(500);

  // Fill credentials
  console.log('Filling form...');
  await page.locator('input[type="email"]').fill('supersoignant@tsotsa-for-kids.com');
  await page.locator('input[type="password"]').fill('Tsotsa2026!Demo');

  // Submit
  console.log('Submitting form...');
  await page.locator('button[type="submit"]').click();

  await page.waitForTimeout(4000);
  console.log('CURRENT URL AFTER LOGIN:', page.url());
  await page.screenshot({ path: 'C:/Users/mezat/.gemini/antigravity/brain/794a88a5-4107-4f3b-9f06-2bb971e09ff1/debug_login_result.png' });
  await browser.close();
})();
