#!/usr/bin/env node
/**
 * Playwright screenshot review — Bela 4D App
 * Abre o app em Chromium headless, faz login e tira screenshots de cada tela.
 *
 * Uso:
 *   # Inicie um servidor HTTP primeiro:
 *   python3 -m http.server 8080 --directory /home/user/bela-4d-app &
 *
 *   # Então rode este script:
 *   node scripts/screenshot-review.js [--url=http://localhost:8080]
 *
 * Screenshots salvas em /tmp/app-screenshots/
 */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:8080';
const OUT_DIR = '/tmp/app-screenshots';
const CREDS = { email: 'teste@gmail.com', password: 'Teste@01' };

fs.mkdirSync(OUT_DIR, { recursive: true });

async function shot(page, name, opts = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage !== false, ...opts });
  console.log(`  📸 Saved: ${file}`);
  return file;
}

async function waitAndShot(page, selector, name) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
  } catch {}
  return shot(page, name);
}

(async () => {
  console.log(`\n🚀 Starting Playwright review — ${BASE_URL}`);
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // ── Mobile view ──────────────────────────────────────────────────────────────
  console.log('\n📱 Mobile (375×812)');
  const mobile = await browser.newPage();
  await mobile.setViewportSize({ width: 375, height: 812 });
  await mobile.addInitScript(() => {
    // Suppress service worker to avoid cache issues
    navigator.serviceWorker?.getRegistrations?.()?.then?.(regs => regs.forEach(r => r.unregister()));
  });

  await mobile.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {
    console.log('  ⚠️  networkidle timeout — continuing anyway');
  });
  await shot(mobile, '01-login-mobile');

  // Fill login form
  try {
    const emailInput = await mobile.$('input[type="email"]');
    const passInput = await mobile.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.fill(CREDS.email);
      await passInput.fill(CREDS.password);
      await shot(mobile, '02-login-filled-mobile');

      const submitBtn = await mobile.$('button[type="submit"], .btn-primary, button:has-text("Entrar")');
      if (submitBtn) {
        await submitBtn.click();
        await mobile.waitForTimeout(4000);
        await shot(mobile, '03-after-login-mobile');
      }
    } else {
      console.log('  ⚠️  Login form not found');
      await shot(mobile, '03-no-login-form');
    }
  } catch (e) {
    console.log('  ⚠️  Login error:', e.message);
  }

  // Take screenshots of various tabs
  const tabs = [
    { selector: '[data-nav="home"], [data-nav="inicio"], .dash-nav-item:first-child', name: '04-dashboard-home' },
    { selector: '[data-nav="receitas"], .dash-nav-item:nth-child(2)', name: '05-receitas-tab' },
    { selector: '[data-nav="conquistas"], .dash-nav-item', name: '06-conquistas-tab' },
    { selector: '[data-nav="perfil"], .dash-nav-item:last-child', name: '07-perfil-tab' },
  ];

  for (const tab of tabs) {
    try {
      const el = await mobile.$(tab.selector);
      if (el) {
        await el.click();
        await mobile.waitForTimeout(1500);
        await shot(mobile, tab.name);
      }
    } catch (e) {
      console.log(`  ⚠️  Tab ${tab.name}: ${e.message}`);
    }
  }

  // Screenshot of header specifically
  try {
    const header = await mobile.$('.dash-header, header');
    if (header) {
      await header.screenshot({ path: path.join(OUT_DIR, '08-header-detail.png') });
      console.log(`  📸 Saved: ${OUT_DIR}/08-header-detail.png`);
    }
  } catch (e) {
    console.log('  ⚠️  Header screenshot:', e.message);
  }

  // Navigate to chat
  try {
    const chatBtn = await mobile.$('[data-nav="chat"], a[href*="chat"]');
    if (chatBtn) {
      await chatBtn.click();
      await mobile.waitForTimeout(2000);
      await shot(mobile, '09-chat-screen-mobile');

      // Type a message to see input + bubble
      const textarea = await mobile.$('.chat-textarea, textarea, input[placeholder*="Pergunte"]');
      if (textarea) {
        await textarea.fill('Olá Guardiã! Preciso de ajuda com minha dieta.');
        await shot(mobile, '10-chat-with-input-mobile');
      }
    }
  } catch (e) {
    console.log('  ⚠️  Chat tab:', e.message);
  }

  await mobile.close();

  // ── Desktop view ─────────────────────────────────────────────────────────────
  console.log('\n🖥️  Desktop (1280×900)');
  const desktop = await browser.newPage();
  await desktop.setViewportSize({ width: 1280, height: 900 });

  await desktop.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await shot(desktop, '11-login-desktop', { fullPage: false });

  try {
    const emailInput = await desktop.$('input[type="email"]');
    const passInput = await desktop.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.fill(CREDS.email);
      await passInput.fill(CREDS.password);
      const submitBtn = await desktop.$('button[type="submit"], .btn-primary, button:has-text("Entrar")');
      if (submitBtn) {
        await submitBtn.click();
        await desktop.waitForTimeout(4000);
        await shot(desktop, '12-dashboard-desktop', { fullPage: false });
      }
    }
  } catch (e) {
    console.log('  ⚠️  Desktop login:', e.message);
  }

  await desktop.close();
  await browser.close();

  console.log(`\n✅ Screenshots completas em: ${OUT_DIR}/`);
  console.log('   Use o Read tool para visualizar cada imagem.\n');
})().catch(err => {
  console.error('\n❌ Playwright error:', err.message);
  process.exit(1);
});
