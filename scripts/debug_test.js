const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  p.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  p.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await p.goto('https://tsotsa-for-kids.com/connexion');
  await p.waitForTimeout(4000);
  const html = await p.content();
  console.log('HTML SNIPPET:', html.slice(0, 500));
  await b.close();
})();
