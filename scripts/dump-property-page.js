const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://localhost:3001/property/prop_001';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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