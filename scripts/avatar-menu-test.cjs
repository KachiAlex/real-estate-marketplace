const puppeteer = require('puppeteer');

(async () => {
  const base = process.argv[2] || 'https://propertyark.netlify.app/';
  const origin = new URL(base).origin;
  console.log('[avatar-test] base=%s', base);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    // Navigate to origin and set a mock logged-in user
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    const mockUser = {
      id: 'test_user_avatar',
      firstName: 'Test',
      lastName: 'Avatar',
      email: 'test.avatar@example.com',
      roles: ['buyer'],
      activeRole: 'buyer',
      photoURL: ''
    };
    await page.evaluate((u) => {
      localStorage.setItem('currentUser', JSON.stringify(u));
      localStorage.setItem('accessToken', 'fake-access-token');
      localStorage.setItem('refreshToken', 'fake-refresh-token');
    }, mockUser);

    // Reload so app picks up auth state
    await page.reload({ waitUntil: 'networkidle2' });

    // Wait for avatar button
    await page.waitForSelector('.user-menu-container button, .user-menu-container img, .user-menu-container .w-8', { timeout: 10000 });

    // Click avatar to open menu
    await page.evaluate(() => {
      const btn = document.querySelector('.user-menu-container button');
      if (btn) btn.click();
      else {
        const img = document.querySelector('.user-menu-container img');
        if (img) img.click();
      }
    });

    // Wait for menu dropdown
    await page.waitForSelector('.user-menu-dropdown', { timeout: 5000 });
    console.log('[avatar-test] user menu opened');

    // Click Dashboard link inside dropdown
    const clicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.user-menu-dropdown a, .user-menu-dropdown button'));
      for (const el of links) {
        const txt = (el.textContent || '').trim().toLowerCase();
        if (txt.includes('dashboard')){
          try{ el.click(); return true; }catch(e){ return false; }
        }
      }
      return false;
    });

    if (!clicked) {
      console.warn('[avatar-test] dashboard link not clickable or not found');
    }

    // Wait for navigation or route change
    try{ await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }); }catch(e){}
    const finalUrl = page.url();
    console.log('[avatar-test] finalUrl=', finalUrl);

    // Check for error indicators on page
    const errorDetected = await page.evaluate(() => {
      if (document.body.innerText.match(/(error|not found|stack trace|TypeError|ReferenceError)/i)) return true;
      const errEl = document.querySelector('.error, .error-page, .stacktrace');
      return !!errEl;
    });

    if (errorDetected) {
      console.error('[avatar-test] ERROR: page shows error after clicking avatar/menu');
      await browser.close();
      process.exit(2);
    }

    console.log('[avatar-test] SUCCESS: avatar/menu interaction did not produce an error');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('[avatar-test] ERROR:', err && err.stack || err.message);
    await browser.close();
    process.exit(3);
  }
})();
