/**
 * Playwright script to debug frontend rendering issues
 */
const { chromium } = require('playwright');

async function debugFrontend() {
  console.log('🔍 Starting Playwright frontend debugging...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging from browser
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    // Navigate to app
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: '/tmp/frontend-initial.png', fullPage: true });
    console.log('✅ Initial screenshot saved to /tmp/frontend-initial.png\n');

    // Check if PaykeyCard exists
    console.log('🔍 Checking for PaykeyCard...');
    const paykeyCard = await page.locator('text=Paykey').first();
    const paykeyCardExists = await paykeyCard.count() > 0;
    console.log(`PaykeyCard exists: ${paykeyCardExists}\n`);

    // Create a customer first
    console.log('🧪 Creating customer...');
    await page.locator('input[type="text"]').fill('/customer-create --outcome verified');
    await page.locator('input[type="text"]').press('Enter');
    await page.waitForTimeout(3000);

    // Create paykey with review outcome
    console.log('🧪 Creating paykey with review outcome...');
    await page.locator('input[type="text"]').fill('/create-paykey bank --outcome review');
    await page.locator('input[type="text"]').press('Enter');
    await page.waitForTimeout(5000);

    // Take screenshot after paykey creation
    await page.screenshot({ path: '/tmp/frontend-after-paykey.png', fullPage: true });
    console.log('✅ Screenshot after paykey creation saved to /tmp/frontend-after-paykey.png\n');

    // Check PaykeyCard content
    console.log('🔍 Inspecting PaykeyCard DOM...');
    const paykeyCardHtml = await page.locator('[class*="RetroCard"]').filter({ hasText: 'Paykey' }).innerHTML();
    console.log('PaykeyCard HTML length:', paykeyCardHtml.length);

    // Check for REVIEW button
    const reviewButton = await page.locator('button:has-text("REVIEW")').count();
    console.log(`REVIEW button found: ${reviewButton > 0}`);

    // Check for "Verification Details" text
    const verificationDetails = await page.locator('text=Verification Details').count();
    console.log(`"Verification Details" text found: ${verificationDetails > 0}`);

    // Check for SHOW/HIDE buttons
    const showButton = await page.locator('button:has-text("SHOW")').count();
    const hideButton = await page.locator('button:has-text("HIDE")').count();
    console.log(`SHOW button found: ${showButton > 0}`);
    console.log(`HIDE button found: ${hideButton > 0}`);

    // Get the paykey state from the store
    console.log('\n🔍 Checking Zustand state...');
    const storeState = await page.evaluate(() => {
      // Access Zustand store from window
      const store = window.__ZUSTAND__ || window.useDemoStore?.getState();
      if (!store) {
        return { error: 'Store not found' };
      }

      const state = typeof store === 'function' ? store() : store;
      return {
        hasPaykey: !!state?.paykey,
        paykeyStatus: state?.paykey?.status,
        hasReview: !!state?.paykey?.review,
        reviewDecision: state?.paykey?.review?.verification_details?.decision,
        accountValidationDecision: state?.paykey?.review?.verification_details?.breakdown?.account_validation?.decision,
        nameMatchDecision: state?.paykey?.review?.verification_details?.breakdown?.name_match?.decision,
        paykeySource: state?.paykey?.source,
      };
    });
    console.log('Store state:', JSON.stringify(storeState, null, 2));

    // Check console errors
    console.log('\n🔍 Checking for React warnings...');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    // Wait a bit to collect any async warnings
    await page.waitForTimeout(2000);

    if (logs.length > 0) {
      console.log('Console warnings/errors:');
      logs.forEach(log => console.log('  -', log));
    } else {
      console.log('No console warnings or errors found');
    }

    console.log('\n✅ Debugging complete!');
    console.log('Screenshots saved:');
    console.log('  - /tmp/frontend-initial.png');
    console.log('  - /tmp/frontend-after-paykey.png');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    await page.screenshot({ path: '/tmp/frontend-error.png', fullPage: true });
    console.log('Error screenshot saved to /tmp/frontend-error.png');
  } finally {
    await browser.close();
  }
}

debugFrontend().catch(console.error);
