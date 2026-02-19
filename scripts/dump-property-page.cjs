const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://localhost:3001/property/prop_001';
  const os = require('os');
  const path = require('path');
  const tmpDir = path.join(os.tmpdir(), `pptr-profile-${Date.now()}`);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], userDataDir: tmpDir });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const body = await page.evaluate(() => document.body.innerText);
    console.log('BODY_TEXT_START\n', body.slice(0, 4000), '\nBODY_TEXT_END');
  } catch (err) {
    console.error('ERROR LOADING PAGE:', err);
  } finally {
    await browser.close();
  }
})();