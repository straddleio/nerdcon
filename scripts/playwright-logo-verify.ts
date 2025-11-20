/**
 * Manual Developer Verification Script - Logo Style Testing
 *
 * ⚠️  MANUAL USE ONLY - DO NOT RUN IN CI ⚠️
 *
 * This script is for manual developer verification of logo styling changes.
 * It launches a browser, captures screenshots, and outputs style comparisons.
 *
 * Usage:
 *   npx tsx scripts/playwright-logo-verify.ts
 *
 * Prerequisites:
 *   - Dev server running on http://localhost:5173
 *   - Playwright installed (npm install @playwright/test)
 *
 * Output:
 *   - terminal-after-logo-fix.png
 *   - logo-closeup-after.png
 *   - Console output with style comparison
 *
 * ⚠️  WARNING: Do not include in automated test suites or CI pipelines
 */

import { chromium } from 'playwright';

async function verifyLogoFix() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for terminal to load
  await page.waitForSelector('.bg-background-dark', { timeout: 10000 });

  // Wait for styles to apply - wait for logo to be visible instead of arbitrary timeout
  const logoElement = page.locator('img[alt="NerdCon Miami"]');
  await logoElement.waitFor({ state: 'visible', timeout: 5000 });

  // Take screenshot of the full terminal AFTER fix
  await page.screenshot({
    path: 'terminal-after-logo-fix.png',
    fullPage: true
  });

  // Get updated computed styles
  const logoStyles = await logoElement.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      opacity: computed.opacity,
      mixBlendMode: computed.mixBlendMode,
      filter: computed.filter,
      width: computed.width,
      height: computed.height,
    };
  });

  console.log('✅ Updated Logo Styles:', logoStyles);

  // Take a close-up screenshot of the logo area AFTER fix
  const logoBox = await logoElement.boundingBox();
  if (logoBox) {
    await page.screenshot({
      path: 'logo-closeup-after.png',
      clip: logoBox
    });
  }

  console.log('\n✅ Verification complete! Screenshots saved:');
  console.log('  - terminal-after-logo-fix.png');
  console.log('  - logo-closeup-after.png');
  console.log('\n📊 Compare with before:');
  console.log('  - terminal-before-logo-fix.png');
  console.log('  - logo-closeup-before.png');

  console.log('\n🎨 Changes applied:');
  console.log('  • Opacity: 0.15 → 0.12 (slightly more subtle)');
  console.log('  • Filter: none → contrast(1.3) brightness(1.1) saturate(1.2)');
  console.log('  • Mix-blend-mode: screen (unchanged)');
  console.log('\n💡 This enhances the text vibrancy while eliminating any residual background.');

  // Keep browser open for manual inspection
  console.log('\n🔍 Browser kept open for manual inspection.');
  console.log('Press Ctrl+C when done.');
}

verifyLogoFix().catch(console.error);
