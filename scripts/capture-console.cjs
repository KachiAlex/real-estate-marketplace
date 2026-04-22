const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('PAGE_CONSOLE:', msg.type(), msg.text());
  });

  page.on('pageerror', err => {
    console.error('PAGE_ERROR:', err.message);
  });

  page.on('error', err => {
    console.error('PAGE_FATAL_ERROR:', err.message);
  });

  try {
    // Ensure no authenticated user (simulate unauthenticated onboarding)
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('onboardedVendor');
    });

    // Navigate to onboarding page
    await page.goto('http://localhost:3001/onboard-vendor', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Opened /onboard-vendor — starting automated fill...');

    // Fill form (step 1)
    await page.type('input[name="businessName"]', 'Test Properties Ltd');
    await page.type('input[name="businessType"]', 'Real Estate Agent');
    await page.type('input[name="licenseNumber"]', 'REA123456');
    await page.type('input[name="contactEmail"]', 'vendor-contact@example.com');
    await page.type('input[name="contactPhone"]', '+2348000000000');

    // Click Next to go to KYC
    await page.click('button:has-text("Next")').catch(()=>{});
    await page.waitForTimeout(500);

    // Attach KYC file
    const input = await page.$('input[type=file]');
    if (input) {
      const filePath = require('path').resolve(__dirname, '..', 'cypress', 'fixtures', 'test-image.jpg');
      await input.uploadFile(filePath);
      console.log('Uploaded test image for KYC');
    } else {
      console.log('KYC file input not found');
    }

    // Proceed to Review & Submit
    await page.click('button:has-text("Next")').catch(()=>{});
    await page.waitForTimeout(500);

    // Listen for navigation
    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => null);

    // Submit final step
    await page.click('button:has-text("Register as Vendor")').catch(() => {});

    // Wait for either navigation or console logs
    const navResult = await navigationPromise;
    const pathname = await page.evaluate(() => location.pathname + location.search + location.hash);
    console.log('After submit - PATHNAME:', pathname);

    // Dump onboardedVendor from localStorage
    const onboarded = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('onboardedVendor') || 'null'); } catch (e) { return null; }
    });
    console.log('localStorage.onboardedVendor:', onboarded);

    // Capture console logs already emitted
    await page.waitForTimeout(500);
  } catch (err) {
    console.error('GOTO_ERROR:', err.message);
  }

  await browser.close();
})();