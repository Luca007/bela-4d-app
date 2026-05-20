#!/usr/bin/env node
/**
 * Screenshot after notification panel fix — Bela 4D
 * Uses /snap/bin/chromium as executablePath
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8090';
const EMAIL = 'teste@gmail.com';
const PASSWORD = 'Teste@01';
const OUT_DIR = '/tmp/bela4d-notif-fix';
const CHROME_PATH = '/snap/bin/chromium';

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const viewports = [
    { name: 'desktop', w: 1440, h: 900 },
    { name: 'mobile', w: 375, h: 812 },
  ];

  for (const vp of viewports) {
    console.log(`\n=== ${vp.name} (${vp.w}x${vp.h}) ===`);

    const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    } catch (e) {
      console.log(`  Navigation timeout (expected), continuing: ${e.message}`);
    }

    // Wait for JavaScript to render
    await page.waitForTimeout(4000);

    // Check if login form exists
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[type="text"]');
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  Login form found, logging in...');
      await emailInput.fill(EMAIL);
      const passInput = page.locator('input[type="password"], input[name="password"]');
      if (await passInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passInput.fill(PASSWORD);
      }
      const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Acessar")');
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
      }
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle').catch(() => {});
    } else {
      console.log('  No login form visible (may already be on dashboard)');
    }

    await page.waitForTimeout(2000);

    // Screenshot: page loaded (no panel)
    await page.screenshot({ path: path.join(OUT_DIR, `01-${vp.name}-pagina-carregada.png`), fullPage: false });
    console.log(`  Screenshot: 01-${vp.name}-pagina-carregada.png`);

    // Try clicking the bell button
    const bell = page.locator('[data-toggle-notifications]');
    if (await bell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bell.click();
      await page.waitForTimeout(600);
      console.log('  Bell clicked, panel should open');

      // Screenshot: panel open
      await page.screenshot({ path: path.join(OUT_DIR, `02-${vp.name}-painel-aberto.png`), fullPage: false });
      console.log(`  Screenshot: 02-${vp.name}-painel-aberto.png`);

      // Close via Esc
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      console.log('  Esc pressed, panel should close');

      // Screenshot: after close
      await page.screenshot({ path: path.join(OUT_DIR, `03-${vp.name}-apos-esc.png`), fullPage: false });
      console.log(`  Screenshot: 03-${vp.name}-apos-esc.png`);
    } else {
      console.log('  Bell not found, taking full page screenshot');
      await page.screenshot({ path: path.join(OUT_DIR, `01-${vp.name}-sem-sino.png`), fullPage: true });
    }

    await browser.close();
  }

  console.log(`\nDONE. All screenshots in ${OUT_DIR}`);
  fs.writeFileSync(path.join(OUT_DIR, 'summary.txt'),
    `Bela4D Notification Panel Fix — ${new Date().toISOString()}\n` +
    `Changes:\n` +
    `  1. Panel position: fixed top:64px right:16px (was absolute 48px 8px)\n` +
    `  2. z-index: 1001 (was 30)\n` +
    `  3. Animation: 200ms ease (was 180ms ease)\n` +
    `  4. max-height: calc(100vh - 80px); overflow-y: auto\n` +
    `  5. box-shadow + border-radius on panel itself\n` +
    `  6. Close button: 44x44px min (was 32x32) — WCAG 2.5.5\n` +
    `  7. role="dialog" aria-label="Notificações"\n` +
    `  8. Esc → close + focus bell\n` +
    `  9. Click-outside → close + focus bell\n` +
    `  10. Mobile: 92vw below header (was full-width bottom sheet)\n` +
    `  11. Fade+slide-down animation 200ms (was 180ms)\n` +
    `\nFiles modified:\n` +
    `  - assets/js/screens/dashboard-v2.js\n` +
    `  - assets/css/components.css\n`
  );
  console.log('Summary written.');
})().catch(err => {
  console.error('FATAL:', err.message);
  console.error(err.stack?.substring(0, 500));
  process.exit(1);
});
