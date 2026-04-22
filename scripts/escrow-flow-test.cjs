const puppeteer = require('puppeteer');

(async () => {
  const base = process.argv[2] || 'http://localhost:3000/';
  console.log('[test] starting escrow-flow-test for', base);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'], defaultViewport: { width: 1280, height: 900 } });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));
  page.on('pageerror', err => logs.push({type: 'pageerror', text: err.stack || err.message}));

  try {
    // Load base page (use DOMContentLoaded for SPA readiness then wait for property link)
    console.log('[test] goto base', base);
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log('[test] base loaded, url=%s', page.url());

    // Open the properties listing page directly (more reliable than homepage selectors)
    const origin = new URL(base).origin;
    const propertiesUrl = origin + '/properties';
    console.log('[test] goto properties', propertiesUrl);
    await page.goto(propertiesUrl, { waitUntil: 'networkidle2', timeout: 120000 });
    console.log('[test] properties loaded, url=%s', page.url());

    // Dump first anchors for debugging
    try {
      const anchors = await page.evaluate(() => Array.from(document.querySelectorAll('a')).slice(0,30).map(a => ({ href: a.href, text: (a.textContent || '').trim() })));
      console.log('[test] sample anchors:', JSON.stringify(anchors, null, 2));
    } catch (e) {
      console.warn('[test] failed to collect anchors', e && e.message);
    }
    // Wait for a property link to appear then click it. If none, fall back to a known mock property id.
    try {
      console.log('[test] waiting for property links');
      await page.waitForSelector('a', { timeout: 60000 });

      // Try to find a 'View Details' link or first property detail href
      // Try to click an element with 'View Details' text first (some builds render buttons)
      const clicked = await page.evaluate(() => {
        const matchText = (t) => {
          if (!t) return false;
          return /View Details|View details|Details|View/i.test(t.trim());
        };
        const all = Array.from(document.querySelectorAll('*'));
        for (const el of all) {
          try {
            if (matchText(el.textContent)) {
              el.scrollIntoView();
              el.click();
              return true;
            }
          } catch (e) {
            // ignore
          }
        }
        return false;
      });

      if (clicked) {
        console.log('[test] clicked element with details text');
      }

      const href = await page.evaluate(() => {
        const linkTexts = ['View Details', 'View details', 'View Details →', 'Details', 'View'];
        const anchors = Array.from(document.querySelectorAll('a'));
        for (const a of anchors) {
          const txt = (a.textContent || '').trim();
          if (linkTexts.some(t => txt.includes(t))) return a.href;
        }
        // fallback: any anchor with '/property' in href
        const prop = anchors.find(a => a.href && a.href.includes('/property'));
        if (prop) return prop.href;
        return null;
      });

      // If no href found, try slugifying visible property titles and attempt known detail paths
      if (!href) {
        try {
          const titles = await page.evaluate(() => Array.from(document.querySelectorAll('h2,h3,h4')).map(h => (h.textContent||'').trim()).filter(Boolean).slice(0,6));
          const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
          const origin = window.location.origin;
          for (const t of titles) {
            const s = slugify(t);
            const candidates = [`${origin}/property/${s}`, `${origin}/properties/${s}`, `${origin}/property/${s}-1`];
            for (const c of candidates) {
              try {
                // attempt to navigate and check for buy button quickly
                // Note: this navigation happens in the page context, but we only signal candidate back to Node
              } catch (e) {}
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (href) {
        console.log('[test] navigating to property href', href);
        await page.goto(href, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('[test] navigated to property detail, url=', page.url());
      } else if (!clicked) {
        throw new Error('No property detail link or details element found');
      }
    } catch (e) {
      // Fallback to a mock property known to exist in dev data
      const fallback = origin + '/property/prop_001';
      try {
        console.log('[test] fallback to', fallback);
        await page.goto(fallback, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('[test] fallback loaded, url=%s', page.url());
      } catch (err) {
        // swallow - we'll continue and let later checks fail with better logs
        console.error('[test] fallback goto error', err && err.message);
      }
    }
    // SPA navigation: wait for property detail UI to render by waiting for the Buy button text to appear
    console.log('[test] waiting for Buy button');
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Buy with Escrow Protection'));
    }, { timeout: 120000 });
    console.log('[test] Buy button appears');

    // Click Buy with Escrow Protection button
    const buttons = await page.$$('button');
    let buyBtn = null;
    for (const b of buttons) {
      const txt = await (await b.getProperty('textContent')).jsonValue();
      if ((txt || '').includes('Buy with Escrow Protection')) { buyBtn = b; break; }
    }
    if (!buyBtn) {
      throw new Error('Buy with Escrow Protection button not found on property detail');
    }
    const urlBeforeClick = page.url();
    console.log('[test] url before click', urlBeforeClick);
    await buyBtn.click();

    // Wait for SPA URL change or navigation (up to 30s)
    try {
      await page.waitForFunction((prev) => window.location.href !== prev, { timeout: 30000 }, urlBeforeClick);
    } catch (e) {
      // If URL didn't change, allow some time for modal flows
      console.warn('[test] wait for url change timed out, continuing');
      await page.waitForTimeout(3000);
    }
    const urlAfterClick = page.url();
    console.log('[test] url after click', urlAfterClick);

    // Check whether navigated to register
    const navigatedToRegister = urlAfterClick.includes('/auth/register');

    // Check sessionStorage authRedirect
    const authRedirect = await page.evaluate(() => sessionStorage.getItem('authRedirect'));

    // If we reached register and have authRedirect, simulate successful registration
    let finalUrl = urlAfterClick;
    if (navigatedToRegister && authRedirect) {
      // Simulate successful registration by setting localStorage (mock user)
      const mockUser = {
        id: 'test_sim_user',
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
      }, mockUser);

      // Navigate to the redirect (use DOMContentLoaded for SPA)
      await page.goto(authRedirect, { waitUntil: 'domcontentloaded', timeout: 30000 });
      finalUrl = page.url();
    }

    console.log('--- Test Result ---');
    console.log('initialUrl:', base);
    console.log('urlAfterBuyClick:', urlAfterClick);
    console.log('navigatedToRegister:', navigatedToRegister);
    console.log('authRedirect:', authRedirect);
    console.log('finalUrl:', finalUrl);

    console.log('--- Console / Errors ---');
    logs.forEach((m, i) => console.log(`${i+1}. [${m.type}] ${m.text}`));

    // Determine success: finalUrl should include /escrow
    if (finalUrl.includes('/escrow')) {
      console.log('ESCROW_FLOW_TEST: SUCCESS');
      await browser.close();
      process.exit(0);
    } else {
      console.error('ESCROW_FLOW_TEST: FAILED - finalUrl did not include /escrow');
      await browser.close();
      process.exit(2);
    }
  } catch (err) {
    console.error('ESCROW_FLOW_TEST ERROR:', err.stack || err.message);
    console.log('--- Console / Errors ---');
    logs.forEach((m, i) => console.log(`${i+1}. [${m.type}] ${m.text}`));
    await browser.close();
    process.exit(3);
  }
})();
