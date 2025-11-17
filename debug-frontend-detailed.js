const { chromium } = require('playwright');

async function debugFrontend() {
  console.log('🔍 Starting Playwright frontend debugging...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging from browser
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('BROWSER:', text);
    consoleMessages.push(text);
  });
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    // Navigate to app
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('\n🧪 Creating customer...');
    await page.locator('input[type="text"]').fill('/customer-create --outcome verified');
    await page.locator('input[type="text"]').press('Enter');
    await page.waitForTimeout(3000);

    console.log('🧪 Creating paykey with review outcome...');
    await page.locator('input[type="text"]').fill('/create-paykey bank --outcome review');
    await page.locator('input[type="text"]').press('Enter');
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/frontend-after-paykey.png', fullPage: true });
    console.log('✅ Screenshot saved\n');

    // Check UI elements
    console.log('🔍 Checking UI elements...');
    const reviewButton = await page.locator('button:has-text("REVIEW")').count();
    console.log('  REVIEW button:', reviewButton > 0 ? '✅ FOUND' : '❌ NOT FOUND');

    const verificationDetails = await page.locator('text=Verification Details').count();
    console.log('  "Verification Details":', verificationDetails > 0 ? '✅ FOUND' : '❌ NOT FOUND');

    const showButton = await page.locator('button:has-text("SHOW")').count();
    console.log('  SHOW button:', showButton > 0 ? '✅ FOUND' : '❌ NOT FOUND');

    const hideButton = await page.locator('button:has-text("HIDE")').count();
    console.log('  HIDE button:', hideButton > 0 ? '✅ FOUND' : '❌ NOT FOUND');

    // Get PaykeyCard HTML to inspect structure
    console.log('\n🔍 Getting PaykeyCard structure...');
    const paykeyCardText = await page.locator('[class*="RetroCard"]').filter({ hasText: 'Paykey' }).textContent();
    console.log('PaykeyCard contains "Account Validation":', paykeyCardText.includes('Account Validation'));
    console.log('PaykeyCard contains "Name Match":', paykeyCardText.includes('Name Match'));

    // Get the Zustand store state by accessing it via React DevTools globals or direct evaluation
    console.log('\n🔍 Checking Zustand state...');
    const storeState = await page.evaluate(() => {
      // Try to access the store through React internals
      const rootElement = document.getElementById('root');
      if (!rootElement) return { error: 'No root element' };

      // Try to find React Fiber
      const fiberKey = Object.keys(rootElement).find(key => key.startsWith('__reactContainer'));
      if (!fiberKey) {
        // Try alternative approach - look for the store in window
        const allWindowProps = Object.keys(window).filter(k => k.includes('store') || k.includes('demo'));
        return {
          error: 'Could not access store',
          windowProps: allWindowProps,
          hasReactDevTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
        };
      }

      return { error: 'Could not extract state from React Fiber' };
    });

    console.log('Store access result:', JSON.stringify(storeState, null, 2));

    // Alternative: Get state from API logs in console
    console.log('\n🔍 Extracting paykey state from SSE messages...');
    const paykeyMessages = consoleMessages.filter(msg => msg.includes('[SSE] Paykey updated:'));
    if (paykeyMessages.length > 0) {
      console.log('Last paykey update message:');
      console.log(paykeyMessages[paykeyMessages.length - 1]);
    }

    // Try to call /paykey-review command to get review details
    console.log('\n🧪 Running /paykey-review command...');
    await page.locator('input[type="text"]').fill('/paykey-review');
    await page.locator('input[type="text"]').press('Enter');
    await page.waitForTimeout(2000);

    // Get terminal output
    const terminalOutput = await page.locator('[class*="Terminal"]').textContent();
    console.log('\nTerminal contains review data:', terminalOutput.includes('verification_details'));

    console.log('\n✅ Debugging complete!');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    await page.screenshot({ path: '/tmp/frontend-error.png', fullPage: true });
    console.log('Error screenshot saved to /tmp/frontend-error.png');
  } finally {
    await browser.close();
  }
}

debugFrontend().catch(console.error);
