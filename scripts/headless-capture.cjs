const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'http://localhost:3000/';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const consoleMessages = [];

  page.on('console', msg => {
    consoleMessages.push({type: msg.type(), text: msg.text()});
  });

  page.on('pageerror', err => {
    consoleMessages.push({type: 'pageerror', text: err.stack || err.message});
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
  } catch (err) {
    consoleMessages.push({type: 'goto-error', text: String(err)});
  }

  console.log('--- Console / Errors ---');
  consoleMessages.forEach((m, i) => {
    console.log(`${i+1}. [${m.type}] ${m.text}`);
  });

  await browser.close();
  if (consoleMessages.some(m => m.type === 'error' || m.type === 'pageerror')) process.exit(1);
  process.exit(0);
})();
