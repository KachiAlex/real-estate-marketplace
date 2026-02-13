const puppeteer = require('puppeteer');

const url = process.argv[2] || 'http://localhost:5001/auth/login';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const logs = [];
  const failedRequests = [];

  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.stack || err.message }));
  page.on('response', async (resp) => {
    try {
      const status = resp.status();
      if (status >= 400) {
        failedRequests.push({ url: resp.url(), status });
      }
    } catch (e) {}
  });

  console.log('Navigating to', url);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (err) {
    console.error('goto-error', String(err));
  }

  await new Promise(r => setTimeout(r, 1200));

  const title = await page.title().catch(() => '');
  const headerExists = await page.evaluate(() => !!document.querySelector('header'));
  const modalInputExists = await page.evaluate(() => !!document.querySelector('input[placeholder="you@email.com"]'));

  console.log('PAGE_TITLE:', title);
  console.log('HEADER_FOUND:', headerExists);
  console.log('SIGNIN_MODAL_INPUT_FOUND:', modalInputExists);

  if (failedRequests.length) {
    console.log('--- Failed network requests ---');
    failedRequests.forEach((r, i) => console.log(`${i+1}. [${r.status}] ${r.url}`));
  }

  if (logs.length) {
    console.log('--- Console logs ---');
    logs.forEach((l, i) => console.log(`${i+1}. [${l.type}] ${l.text}`));
  }

  await browser.close();

  if (!headerExists || !modalInputExists) process.exit(2);
  process.exit(0);
})();
