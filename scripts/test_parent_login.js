const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  p.on('console', m => console.log('CONSOLE:', m.type(), m.text()));
  await p.goto('https://tsotsa-for-kids.com/connexion');
  await p.locator('[data-testid="role-btn-parent"]').click();
  await p.locator('input[type="email"]').fill('famille.test.1795547471710@tsotsa-for-kids.com');
  await p.locator('input[type="password"]').fill('Tsotsa2026!Famille');
  await p.locator('button[type="submit"]').click();
  await p.waitForTimeout(4000);
  console.log('CURRENT URL:', p.url());
  const errorElem = await p.locator('[class*="red"]').first().textContent().catch(() => null);
  console.log('ALERT TEXT:', errorElem);
  await b.close();
})();
