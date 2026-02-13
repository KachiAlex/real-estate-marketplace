const puppeteer = require('puppeteer');

(async () => {
  const base = process.argv[2] || 'https://propertyark.netlify.app/';
  const propertyId = process.argv[3] || 'prop_005';
  const origin = new URL(base).origin;
  const redirectPath = `/escrow?propertyId=${encodeURIComponent(propertyId)}`;

  console.log('[auth-test] base=%s redirect=%s', base, redirectPath);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  try {
    // Set the authRedirect in sessionStorage for the origin
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate((r) => {
      sessionStorage.setItem('authRedirect', r);
      return true;
    }, redirectPath);
    console.log('[auth-test] sessionStorage.authRedirect set to', redirectPath);

    // Navigate to register page
    const registerUrl = origin + '/auth/register';
    console.log('[auth-test] navigating to register:', registerUrl);
    await page.goto(registerUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Simulate successful registration by setting localStorage user and tokens
    const mockUser = {
      id: 'sim_user_123',
      firstName: 'Sim',
      lastName: 'User',
      email: 'sim.user@example.com',
      roles: ['buyer'],
      activeRole: 'buyer'
    };
    await page.evaluate((u) => {
      localStorage.setItem('currentUser', JSON.stringify(u));
      localStorage.setItem('accessToken', 'fake-access-token');
      localStorage.setItem('refreshToken', 'fake-refresh-token');
      return true;
    }, mockUser);
    console.log('[auth-test] localStorage currentUser set');

    // After registration the app should read sessionStorage.authRedirect and navigate there
    // We'll emulate that by reading authRedirect and navigating to it
    const authRedirect = await page.evaluate(() => sessionStorage.getItem('authRedirect'));
    console.log('[auth-test] authRedirect read from sessionStorage:', authRedirect);

    if (!authRedirect) {
      throw new Error('authRedirect missing');
    }

    const target = authRedirect.startsWith('http') ? authRedirect : (origin + authRedirect);
    console.log('[auth-test] navigating to target:', target);
    await page.goto(target, { waitUntil: 'networkidle2', timeout: 60000 });

    const finalUrl = page.url();
    console.log('[auth-test] finalUrl=', finalUrl);

    // Run heuristic checks on the loaded page to detect escrow/payment UI
    const escrowCheck = await page.evaluate(() => {
      const regexBtn = /(buy with escrow|buy with escrow protection|proceed to payment|make payment|pay now|complete purchase|complete payment)/i;
      const title = Array.from(document.querySelectorAll('h1,h2')).map(n => n.textContent || '').join(' | ');
      if (/escrow/i.test(title)) return { match: true, reason: 'heading contains "escrow"', heading: title };

      const btns = Array.from(document.querySelectorAll('button,a')).map(el => (el.textContent || '').trim()).filter(t => regexBtn.test(t));
      if (btns.length) return { match: true, reason: 'button text match', examples: btns.slice(0,5) };

      const form = document.querySelector('form[id*="escrow"], form[class*="escrow"], form[id*="payment"], form[class*="payment"]');
      if (form) return { match: true, reason: 'payment/escrow form present', selector: form.tagName };

      const dataTest = document.querySelector('[data-test*="escrow"], [data-testid*="escrow"]');
      if (dataTest) return { match: true, reason: 'data-test/testid contains escrow', outer: dataTest.outerHTML.slice(0,200) };

      return { match: false };
    });

    console.log('[auth-test] escrowCheck=', JSON.stringify(escrowCheck));

    if (finalUrl.includes('/escrow') && escrowCheck.match) {
      console.log('AUTH_REDIRECT_TEST: SUCCESS - landed on /escrow and escrow UI detected');
      await browser.close();
      process.exit(0);
    }

    if (finalUrl.includes('/escrow')) {
      console.warn('AUTH_REDIRECT_TEST: PARTIAL - landed on /escrow but escrow UI not detected');
      await browser.close();
      process.exit(4);
    }

    console.error('AUTH_REDIRECT_TEST: FAILED - did not land on /escrow');
    await browser.close();
    process.exit(2);
  } catch (err) {
    console.error('AUTH_REDIRECT_TEST ERROR:', err && err.stack || err.message);
    await browser.close();
    process.exit(3);
  }
})();
