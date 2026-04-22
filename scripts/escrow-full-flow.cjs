const puppeteer = require('puppeteer');

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

(async () => {
  const base = process.argv[2] || 'https://propertyark.netlify.app/';
  const propertyId = process.argv[3] || 'prop_005';
  // Optional selectors: arg4 = priceSelector, arg5 = paymentSelector, arg6 = priceRegex
  const priceSelector = process.argv[4] || null;
  const paymentSelector = process.argv[5] || null;
  const priceRegexRaw = process.argv[6] || null;
  // Optional numeric assertion: arg7 = expectedPrice (number), arg8 = tolerance (fraction if <1, absolute if >=1)
  const expectedPriceArg = process.argv[7] || null;
  const toleranceArg = process.argv[8] || null;
  const expectedPrice = expectedPriceArg ? parseFloat(expectedPriceArg) : null;
  const tolerance = toleranceArg ? parseFloat(toleranceArg) : 0.05; // default 5%
  const origin = new URL(base).origin;
  const propertyUrl = origin + '/property/' + propertyId;

  console.log('[full-flow] start: propertyUrl=%s', propertyUrl);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    await page.goto(propertyUrl, { waitUntil: 'domcontentloaded' });
    console.log('[full-flow] loaded property page, url=%s', page.url());

    // attempt to find buy CTA with several heuristics
    const buySelector = await page.evaluate(() => {
      const regex = /(buy with escrow protection|buy with escrow|buy now|make payment|proceed to payment|buy)/i;
      // look for buttons and anchors
      const candidates = Array.from(document.querySelectorAll('button,a')).map(el => ({
        text: (el.textContent||'').trim(),
        href: el.getAttribute && el.getAttribute('href')
      })).filter(c => regex.test(c.text || '') || (c.href && /escrow|purchase|checkout/.test(c.href)));
      if (candidates.length) return true;

      // fallback: look for data-test attributes
      const d = document.querySelector('[data-test*="escrow"], [data-testid*="escrow"], [data-test*="buy"], [data-testid*="buy"]');
      if (d) return true;
      return false;
    });

    if (buySelector) {
      console.log('[full-flow] buy CTA appears present — attempting click via text match');
      // prefer clicking a button or anchor matching the text
      const clicked = await page.evaluate(() => {
        const regex = /(buy with escrow protection|buy with escrow|buy now|make payment|proceed to payment|buy)/i;
        const els = Array.from(document.querySelectorAll('button,a'));
        for (const el of els){
          const t = (el.textContent||'').trim();
          if (regex.test(t)){
            try{ el.click(); return { ok: true, by: 'text', text: t }; }catch(e){ }
          }
        }
        const d = document.querySelector('[data-test*="escrow"], [data-testid*="escrow"], [data-test*="buy"], [data-testid*="buy"]');
        if (d){ try{ d.click(); return { ok:true, by:'data-test' }; }catch(e){} }
        return { ok:false };
      });

      console.log('[full-flow] click result:', clicked);
      // wait a bit for navigation
      try{ await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }); }catch(e){}
    } else {
      console.log('[full-flow] no buy CTA found — attempting to find link to register or to set authRedirect manually');
    }

    // If we're not on /auth/register or /escrow yet, set sessionStorage.authRedirect and navigate to register
    const cur = page.url();
    console.log('[full-flow] after click/url=', cur);

    if (!/\/auth\/register/.test(cur) && !/\/escrow/.test(cur)){
      const redirectPath = `/escrow?propertyId=${encodeURIComponent(propertyId)}`;
      await page.evaluate((r)=> sessionStorage.setItem('authRedirect', r), redirectPath);
      console.log('[full-flow] set sessionStorage.authRedirect=%s', redirectPath);
      const registerUrl = origin + '/auth/register';
      console.log('[full-flow] navigating to register page=%s', registerUrl);
      await page.goto(registerUrl, { waitUntil: 'domcontentloaded' });
      await sleep(500);
    }

    // Now on register page — attempt to fill and submit the form if present
    console.log('[full-flow] at register? url=', page.url());

    const formPresent = await page.evaluate(()=> {
      const form = document.querySelector('form');
      return !!form;
    });

    if (formPresent){
      console.log('[full-flow] registration form detected — attempting to fill common fields');
      const timestamp = Date.now();
      const fakeEmail = `test+${timestamp}@example.com`;
      const fakePassword = 'Test1234!';

      // try several common selectors
      await page.evaluate((email, password) => {
        const setValue = (selector, value) => {
          const el = document.querySelector(selector);
          if (el){ el.focus(); el.value = value; el.dispatchEvent(new Event('input', {bubbles:true})); el.blur(); return true; }
          return false;
        };
        setValue('input[name="firstName"]', 'Auto');
        setValue('input[name="lastName"]', 'Tester');
        setValue('input[name="fullName"]', 'Auto Tester');
        setValue('input[name="name"]', 'Auto Tester');
        setValue('input[name="email"]', email);
        setValue('input[type="email"]', email);
        setValue('input[name="password"]', password);
        setValue('input[type="password"]', password);
      }, fakeEmail, fakePassword);

      // attempt to click submit
      const submitResult = await page.evaluate(()=>{
        const btn = document.querySelector('button[type="submit"], button.submit, input[type="submit"]');
        if (btn){ try{ btn.click(); return true; }catch(e){} }
        const btn2 = Array.from(document.querySelectorAll('button')).find(b=>/register|sign up|create account|continue/i.test(b.textContent||''));
        if (btn2){ try{ btn2.click(); return true;}catch(e){} }
        return false;
      });
      console.log('[full-flow] attempted form submit=', submitResult);

      try{ await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }); }catch(e){}

      // If submitting the form did not navigate (server-side validation, captcha, etc.), fallback to localStorage simulation
      const postSubmitUrl = page.url();
      if (/\/auth\/register/.test(postSubmitUrl)){
        console.log('[full-flow] form submit did not navigate — applying localStorage fallback');
        const mockUser = {
          id: 'sim_user_fullflow_' + Date.now(),
          firstName: 'Sim',
          lastName: 'Fallback',
          email: `sim.fallback+${Date.now()}@example.com`,
          roles: ['buyer'],
          activeRole: 'buyer'
        };
        await page.evaluate((u)=>{
          localStorage.setItem('currentUser', JSON.stringify(u));
          localStorage.setItem('accessToken', 'fake-access-token');
          localStorage.setItem('refreshToken', 'fake-refresh-token');
        }, mockUser);
        console.log('[full-flow] localStorage mock user set (fallback)');
        const authRedirect = await page.evaluate(()=> sessionStorage.getItem('authRedirect'));
        if (authRedirect){
          const target = authRedirect.startsWith('http') ? authRedirect : (origin + authRedirect);
          console.log('[full-flow] navigating to target (fallback)=', target);
          await page.goto(target, { waitUntil: 'networkidle2' });
        }
      }
    } else {
      console.log('[full-flow] no visible form — using localStorage fallback to simulate registered user');
      const mockUser = {
        id: 'sim_user_fullflow_' + Date.now(),
        firstName: 'Sim',
        lastName: 'Fullflow',
        email: `sim.fullflow+${Date.now()}@example.com`,
        roles: ['buyer'],
        activeRole: 'buyer'
      };
      await page.evaluate((u)=>{
        localStorage.setItem('currentUser', JSON.stringify(u));
        localStorage.setItem('accessToken', 'fake-access-token');
        localStorage.setItem('refreshToken', 'fake-refresh-token');
      }, mockUser);
      console.log('[full-flow] localStorage mock user set');

      // trigger navigation to authRedirect
      const authRedirect = await page.evaluate(()=> sessionStorage.getItem('authRedirect'));
      console.log('[full-flow] authRedirect=', authRedirect);
      if (authRedirect){
        const target = authRedirect.startsWith('http') ? authRedirect : (origin + authRedirect);
        console.log('[full-flow] navigating to target=', target);
        await page.goto(target, { waitUntil: 'networkidle2' });
      }
    }

    // Final verification on escrow page
    const finalUrl = page.url();
    console.log('[full-flow] finalUrl=', finalUrl);

    const escrowCheck = await page.evaluate((priceSelector, paymentSelector, priceRegexRaw) => {
      const priceRegex = priceRegexRaw ? new RegExp(priceRegexRaw) : null;
      const result = { match: false, details: {} };
      const regexBtn = /(buy with escrow|buy with escrow protection|proceed to payment|make payment|pay now|complete purchase|complete payment)/i;
      const title = Array.from(document.querySelectorAll('h1,h2')).map(n => n.textContent || '').join(' | ');
      result.details.heading = title;
      if (/escrow/i.test(title)) result.match = true;

      // Button/anchor checks
      const btns = Array.from(document.querySelectorAll('button,a')).map(el => (el.textContent || '').trim()).filter(t => regexBtn.test(t));
      result.details.buttonMatches = btns.slice(0,5);
      if (btns.length) result.match = true;

      // Form presence and fields
      const form = document.querySelector('form[id*="escrow"], form[class*="escrow"], form[id*="payment"], form[class*="payment"]') || document.querySelector('form');
      result.details.formPresent = !!form;
      if (form){
        const hasName = !!form.querySelector('input[name="name"], input[name="fullName"], input[name="buyerName"], input[name*="name"]');
        const hasEmail = !!form.querySelector('input[name="email"], input[type="email"]');
        const hasPhone = !!form.querySelector('input[name="phone"], input[name*="phone"], input[type="tel"]');
        result.details.formFields = { name: hasName, email: hasEmail, phone: hasPhone };
        if (hasEmail || hasName) result.match = true;
      }

      // Price/amount detection: prefer provided selector
      let priceEl = null;
      if (priceSelector) priceEl = document.querySelector(priceSelector);
      if (!priceEl) priceEl = document.querySelector('[data-test*="price"], [data-testid*="price"], .price, .amount, [id*="price"]');
      result.details.priceText = priceEl ? (priceEl.textContent||'').trim().slice(0,120) : null;
      result.details.priceSelectorUsed = priceSelector || 'auto';
      if (priceEl) result.match = true;
      if (priceEl && priceRegex) result.details.priceRegexMatch = priceRegex.test(result.details.priceText);

      // Payment widget or iframe: prefer provided selector
      const iframe = document.querySelector('iframe[src*="stripe"], iframe[src*="payment"], iframe[src*="checkout"]');
      let paymentWidget = null;
      if (paymentSelector) paymentWidget = document.querySelector(paymentSelector);
      if (!paymentWidget) paymentWidget = document.querySelector('[data-test*="payment"], [data-testid*="payment"], .payment-widget, .payment-form');
      result.details.iframe = !!iframe;
      result.details.paymentWidget = !!paymentWidget;
      result.details.paymentSelectorUsed = paymentSelector || 'auto';
      if (iframe || paymentWidget) result.match = true;

      // Data attributes useful for CI
      const dataTest = document.querySelector('[data-test*="escrow"], [data-testid*="escrow"]');
      result.details.dataTest = !!dataTest;
      if (dataTest) result.match = true;

      // Include sample button texts if present
      result.details.sampleButtons = Array.from(document.querySelectorAll('button,a')).slice(0,10).map(el => (el.textContent||'').trim());

      return result;
    }, priceSelector, paymentSelector, priceRegexRaw);

    console.log('[full-flow] escrowCheck=', JSON.stringify(escrowCheck));

    // If expectedPrice was provided, try to parse numeric value and compare
    if (expectedPrice !== null){
      const priceText = (escrowCheck.details && escrowCheck.details.priceText) || '';
      let parsedValue = null;
      const numMatch = priceText.match(/[-+]?\d[\d,\.\s]*/);
      if (numMatch){
        const numStr = numMatch[0].replace(/[,\s]/g, '');
        const v = parseFloat(numStr);
        if (!isNaN(v)) parsedValue = v;
      }
      escrowCheck.details.parsedPriceValue = parsedValue;
      escrowCheck.details.expectedPrice = expectedPrice;
      escrowCheck.details.tolerance = tolerance;
      if (parsedValue !== null){
        const diff = Math.abs(parsedValue - expectedPrice);
        const rel = expectedPrice !== 0 ? diff / Math.abs(expectedPrice) : (diff === 0 ? 0 : Infinity);
        const matched = (tolerance < 1) ? (rel <= tolerance) : (diff <= tolerance);
        escrowCheck.details.priceMatch = matched;
        escrowCheck.details.priceDiff = diff;
        escrowCheck.details.priceRelDiff = rel;
      } else {
        escrowCheck.details.priceMatch = false;
      }
    }

    // Optionally attempt to interact with payment UI to complete E2E
    let paymentInteraction = { attempted:false, clicked:false, confirmationFound:false, messages:[] };
    try{
      if (finalUrl.includes('/escrow')){
        // If a payment iframe exists, try to note it (can't reliably click cross-origin iframe)
        if (escrowCheck.details.iframe){
          paymentInteraction.attempted = true;
          paymentInteraction.messages.push('payment iframe present; cannot click cross-origin iframe automatically');
        }

        // If a payment widget or selector is present, try clicking a common payment button
        if (escrowCheck.details.paymentWidget || escrowCheck.details.buttonMatches.length){
          paymentInteraction.attempted = true;
          // Try to click obvious CTA buttons by text
          const clickResult = await page.evaluate(() => {
            const payRegex = /(pay now|make payment|complete payment|proceed to payment|checkout|complete purchase)/i;
            const els = Array.from(document.querySelectorAll('button,a'));
            for (const el of els){
              const t = (el.textContent||'').trim();
              if (payRegex.test(t)){
                try{ el.click(); return { ok:true, by:'text', text: t }; }catch(e){ return { ok:false, err: String(e) }; }
              }
            }
            // fallback: click element with data-test/payment-test attributes
            const attr = document.querySelector('[data-test*="payment"], [data-testid*="payment"], [data-test*="pay"], [data-testid*="pay"]');
            if (attr){ try{ attr.click(); return { ok:true, by:'data-attr' }; }catch(e){ return { ok:false, err: String(e) }; } }
            return { ok:false };
          });
          paymentInteraction.clicked = !!(clickResult && clickResult.ok);
          paymentInteraction.messages.push('clickResult:' + JSON.stringify(clickResult));

          // Wait a moment and look for confirmation text
          try{ await page.waitForTimeout(2000); }catch(e){}
          const conf = await page.evaluate(() => {
            const txt = (document.body && document.body.innerText) || '';
            const confirmRegex = /(payment (successful|completed|received)|thank you for your purchase|transaction (complete|successful)|receipt)/i;
            const m = txt.match(confirmRegex);
            return { found: !!m, snippet: m ? txt.slice(Math.max(0, m.index-60), m.index+120) : null };
          });
          paymentInteraction.confirmationFound = !!(conf && conf.found);
          paymentInteraction.messages.push('confirmation:' + JSON.stringify(conf));
        }
      }
    }catch(e){ paymentInteraction.messages.push('paymentInteractionError:' + String(e)); }

    // Determine final outcome including payment assertions
    const onEscrow = finalUrl.includes('/escrow');
    const priceOk = expectedPrice === null || (escrowCheck.details && escrowCheck.details.priceMatch);

    if (onEscrow && escrowCheck.match && priceOk){
      // If an expected payment completion was required, ensure it succeeded
      const paymentRequired = !!(escrowCheck.details.paymentWidget || escrowCheck.details.iframe || escrowCheck.details.buttonMatches.length);
      if (paymentRequired && !paymentInteraction.attempted){
        console.warn('FULL_FLOW: PARTIAL - on escrow but no payment interaction attempted', JSON.stringify({escrowDetails: escrowCheck.details, paymentInteraction}));
        await browser.close();
        process.exit(4);
      }
      if (paymentRequired && paymentInteraction.attempted && !paymentInteraction.confirmationFound){
        console.warn('FULL_FLOW: PARTIAL - payment interaction attempted but no confirmation detected', JSON.stringify({escrowDetails: escrowCheck.details, paymentInteraction}));
        await browser.close();
        process.exit(6);
      }

      console.log('FULL_FLOW: SUCCESS - ended on /escrow with escrow UI and price check passed', JSON.stringify({escrowDetails: escrowCheck.details, paymentInteraction}));
      await browser.close();
      process.exit(0);
    }

    if (onEscrow && escrowCheck.match && !priceOk){
      console.error('FULL_FLOW: FAILED - landed on /escrow but price assertion failed', JSON.stringify(escrowCheck.details));
      await browser.close();
      process.exit(5);
    }

    if (onEscrow){
      console.warn('FULL_FLOW: PARTIAL - landed on /escrow but escrow UI not detected', JSON.stringify(escrowCheck.details));
      await browser.close();
      process.exit(4);
    }

    console.error('FULL_FLOW: FAILED - did not land on /escrow', JSON.stringify(escrowCheck.details));
    await browser.close();
    process.exit(2);

  } catch (err){
    console.error('FULL_FLOW ERROR:', err && err.stack || err.message);
    await browser.close();
    process.exit(3);
  }

})();
