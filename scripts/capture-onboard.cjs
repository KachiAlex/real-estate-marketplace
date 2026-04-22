const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const fixturesPath = path.join(__dirname, '..', 'cypress', 'fixtures', 'test-image.jpg');
  const base = process.env.BASE_URL || 'http://localhost:3050';
  const url = `${base}/onboard-vendor`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  page.on('console', msg => console.log('PAGE_CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE_ERROR:', err.message));
  page.on('requestfailed', req => console.warn('REQUEST_FAILED:', req.url(), req.failure() && req.failure().errorText));

  try {
    // Load root first (fallback if direct path returns 404 from dev server)
    let resp = null;
    try {
      resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 });
    } catch (e) {
      // fallback: open root then navigate client-side
      await page.goto(base, { waitUntil: 'networkidle2' });
      await page.evaluate((p) => { window.history.pushState({}, '', p); }, '/onboard-vendor');
      await page.waitForTimeout(500);
    }

    console.log('Initial PATHNAME:', await page.evaluate(() => location.pathname + location.search + location.hash));

    // Wait for onboarding form to render
    await page.waitForSelector('input[name="businessName"]');

    // Fill step 1
    await page.type('input[name="businessName"]', 'Automated Vendor Ltd');
    await page.type('input[name="businessType"]', 'Real Estate Agent');
    await page.type('input[name="licenseNumber"]', 'REA-AUTO-001');
    await page.type('input[name="contactEmail"]', 'vendor-contact@example.com');
    await page.type('input[name="contactPhone"]', '+2348000000000');

    // Next
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Next');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Upload KYC
    const input = await page.$('input[type="file"]');
    if (!input) throw new Error('File input not found');
    await input.uploadFile(fixturesPath);
    await page.waitForTimeout(300);

    // Next -> Review
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Next');
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);

    // Submit (Register as Vendor)
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Register as Vendor' || b.textContent.trim() === 'Submit');
      if (btn) btn.click();
    });

    // Wait for possible navigation or state change
    await page.waitForTimeout(1500);

    const finalPath = await page.evaluate(() => location.pathname + location.search + location.hash);
    console.log('FINAL PATHNAME:', finalPath);

    // Dump localStorage keys of interest
    const ls = await page.evaluate(() => ({
      onboardedVendor: localStorage.getItem('onboardedVendor'),
      currentUser: localStorage.getItem('currentUser'),
      accessToken: localStorage.getItem('accessToken'),
      token: localStorage.getItem('token')
    }));
    console.log('LOCALSTORAGE SNAPSHOT:', ls);

    // Capture whether vendor dashboard content is visible
    const dashboardVisible = await page.evaluate(() => !!document.querySelector('h1') && /Dashboard Overview|Properties|Earnings/i.test(document.querySelector('h1')?.innerText || ''));
    console.log('DASHBOARD_VISIBLE:', dashboardVisible);

  } catch (err) {
    console.error('SCRIPT_ERROR:', err);
  } finally {
    await browser.close();
  }
})();