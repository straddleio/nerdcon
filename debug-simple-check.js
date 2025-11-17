const { chromium } = require('playwright');

async function quickCheck() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(c => c.newPage());

  const sseMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[SSE]')) {
      sseMessages.push(text);
    }
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Create customer and paykey
    await page.locator('input[type="text"]').fill('/customer-create --outcome verified');
    await page.locator('input[type="text"]').press('Enter');
    await page.waitForTimeout(3000);

    await page.locator('input[type="text"]').fill('/create-paykey bank --outcome review');
    await page.locator('input[type="text"]').press('Enter');
    await page.waitForTimeout(5000);

    // Extract state from SSE messages
    console.log('\n📊 SSE Messages Analysis:');
    console.log('=========================\n');

    const paykeyUpdates = sseMessages.filter(m => m.includes('Paykey updated:'));
    if (paykeyUpdates.length > 0) {
      console.log('Last Paykey Update:');
      console.log(paykeyUpdates[paykeyUpdates.length - 1]);
    }

    // Check UI elements
    console.log('\n🎨 UI Elements Check:');
    console.log('=====================\n');

    const reviewButton = await page.locator('button:has-text("REVIEW")').count() > 0;
    const verificationDetails = await page.locator('text=Verification Details').count() > 0;
    const showButton = await page.locator('button:has-text("SHOW")').count() > 0;
    const hideButton = await page.locator('button:has-text("HIDE")').count() > 0;
    const accountValidation = await page.locator('text=Account Validation').count() > 0;
    const nameMatch = await page.locator('text=Name Match').count() > 0;

    console.log('  ' + (reviewButton ? '✅' : '❌') + ' REVIEW button');
    console.log('  ' + (verificationDetails ? '✅' : '❌') + ' Verification Details text');
    console.log('  ' + (showButton ? '✅' : '❌') + ' SHOW button');
    console.log('  ' + (hideButton ? '✅' : '❌') + ' HIDE button');
    console.log('  ' + (accountValidation ? '✅' : '❌') + ' Account Validation text');
    console.log('  ' + (nameMatch ? '✅' : '❌') + ' Name Match text');

    // Run /paykey-review to see terminal output
    console.log('\n🔍 Running /paykey-review command...');
    await page.locator('input[type="text"]').fill('/paykey-review');
    await page.locator('input[type="text"]').press('Enter');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/paykey-review-output.png', fullPage: true });
    console.log('Screenshot saved to /tmp/paykey-review-output.png');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickCheck();
