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
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded — waiting 3s for runtime logs...');
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error('GOTO_ERROR:', err.message);
  }

  await browser.close();
})();