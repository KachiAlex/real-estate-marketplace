const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://localhost:3001/vendor/dashboard';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  try {
    // Navigate to base origin so localStorage is accessible for that origin
    const origin = new URL(url).origin;
    await page.goto(origin, { waitUntil: 'networkidle2' });

    // Seed localStorage with a mock onboarded vendor and local session
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('currentUser', JSON.stringify({ id: 'vendor-automation', email: 'vendor@example.com', role: 'vendor', displayName: 'Vendor Automation' }));
      localStorage.setItem('onboardedVendor', JSON.stringify({ id: 'vendor-automation', businessName: 'Vendor Automation', contactInfo: { email: 'vendor@example.com' }, kycDocs: [] }));
    });

    // Now navigate to the target dashboard URL with seeded localStorage
    await page.goto(url, { waitUntil: 'networkidle2' });
    const html = await page.content();
    const body = await page.evaluate(() => document.body.innerText);
    console.log('PAGE_URL:', page.url());
    console.log('BODY_SNIPPET_START');
    console.log(body.slice(0, 4000));
    console.log('BODY_SNIPPET_END');
    // Check for LocalModeBanner presence
    const banner = await page.$eval('div[role="status"]', el => el.innerText).catch(() => null);
    console.log('LOCAL_MODE_BANNER:', !!banner, banner || 'none');
    // Check for properties count element
    const propCount = await page.$$eval('[data-testid="property-item"]', els => els.length).catch(() => 0);
    console.log('PROPERTIES_RENDERED_COUNT:', propCount);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await browser.close();
  }
})();