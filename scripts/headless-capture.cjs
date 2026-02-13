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
    // If invoked in 'flow' mode, exercise the AI assistant chat flow
    const mode = process.argv[3] || '';
    if (mode === 'flow') {
      // small delay for client-side scripts
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await page.click('button[title="Open Kiki - Your AI Assistant"]');
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (_) {}

      const inputSelector = 'input[placeholder="Ask about properties, pricing, financing, legal docs..."]';
      try {
        await page.waitForSelector(inputSelector, { timeout: 10000 });
        await page.focus(inputSelector);
        const message = process.argv[4] || 'Hello, show me properties in Lagos';
        await page.keyboard.type(message, { delay: 40 });
        await page.click('button[title="Send message"]');
        // wait for AI response
        await new Promise(resolve => setTimeout(resolve, 6000));
      } catch (err) {
        consoleMessages.push({type: 'flow-error', text: String(err)});
      }
    } else {
      // default: just wait a bit for any runtime errors to occur
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
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
