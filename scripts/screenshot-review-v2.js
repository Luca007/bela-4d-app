#!/usr/bin/env node
/**
 * Playwright screenshot + console/network audit — Bela 4D App
 *
 * Uso:
 *   node scripts/screenshot-review-v2.js [--url=http://localhost:8090]
 *
 * Saída:
 *   /tmp/app-screenshots/*.png
 *   /tmp/app-audit/console.json
 *   /tmp/app-audit/network.json
 *   /tmp/app-audit/summary.md
 */

const { chromium } = require('/home/luca/paperclip/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:8090';
const OUT_DIR = '/tmp/app-screenshots';
const AUDIT_DIR = '/tmp/app-audit';
const CREDS = { email: 'teste@gmail.com', password: 'Teste@01' };

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(AUDIT_DIR, { recursive: true });

const consoleLog = [];
const networkLog = [];
const pageErrors = [];

function attachListeners(page, label) {
  page.on('console', msg => {
    consoleLog.push({
      view: label,
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      ts: Date.now(),
    });
  });
  page.on('pageerror', err => {
    pageErrors.push({
      view: label,
      message: err.message,
      stack: err.stack,
      ts: Date.now(),
    });
  });
  page.on('requestfailed', req => {
    networkLog.push({
      view: label,
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText,
      resourceType: req.resourceType(),
      kind: 'failed',
      ts: Date.now(),
    });
  });
  page.on('response', res => {
    const status = res.status();
    if (status >= 400) {
      networkLog.push({
        view: label,
        url: res.url(),
        status,
        statusText: res.statusText(),
        kind: 'http-error',
        ts: Date.now(),
      });
    }
  });
}

async function shot(page, name, opts = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: opts.fullPage !== false, ...opts });
    console.log(`  📸 ${name}.png`);
  } catch (e) {
    console.log(`  ❌ shot ${name}: ${e.message}`);
  }
  return file;
}

async function clickIfExists(page, selector, label) {
  try {
    const el = await page.$(selector);
    if (el) {
      await el.click({ timeout: 3000 });
      await page.waitForTimeout(1200);
      return true;
    }
  } catch (e) {
    console.log(`  ⚠️  click ${label}: ${e.message}`);
  }
  return false;
}

(async () => {
  console.log(`\n🚀 Bela 4D audit — ${BASE_URL}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
    executablePath: '/home/luca/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
  });

  // ── Mobile ───────────────────────────────────────────
  console.log('\n📱 Mobile (375×812)');
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  attachListeners(mobile, 'mobile');

  await mobile.addInitScript(() => {
    navigator.serviceWorker?.getRegistrations?.()?.then?.(regs => regs.forEach(r => r.unregister()));
  });

  await mobile.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 }).catch(e => {
    console.log(`  ⚠️  goto: ${e.message}`);
  });
  await mobile.waitForTimeout(2000);
  await shot(mobile, '01-login-mobile');

  // Login flow
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
        await mobile.waitForTimeout(5000);
        await shot(mobile, '03-after-login-mobile');
      } else {
        console.log('  ⚠️  no submit button');
      }
    } else {
      console.log('  ⚠️  email/pass inputs not found');
      // dump body to inspect
      const html = await mobile.content();
      fs.writeFileSync(path.join(AUDIT_DIR, 'login-dump.html'), html);
    }
  } catch (e) {
    console.log('  ⚠️  login flow:', e.message);
  }

  // Nav tabs
  const tabs = [
    { selector: '[data-nav="home"], [data-nav="inicio"]', name: '04-dashboard-home' },
    { selector: '[data-nav="receitas"]', name: '05-receitas-tab' },
    { selector: '[data-nav="conquistas"]', name: '06-conquistas-tab' },
    { selector: '[data-nav="perfil"]', name: '07-perfil-tab' },
    { selector: '[data-nav="chat"]', name: '08-chat-tab' },
  ];
  for (const tab of tabs) {
    if (await clickIfExists(mobile, tab.selector, tab.name)) {
      await shot(mobile, tab.name);
    }
  }

  // Try CTAs on dashboard
  await clickIfExists(mobile, '[data-nav="home"], [data-nav="inicio"]', 'back to home');
  await mobile.waitForTimeout(500);

  // Common CTA selectors
  const ctaSelectors = [
    'button.btn-primary',
    'a.btn-primary',
    '[data-action]',
    'button.cta',
    '.dash-card button',
    '.action-card',
  ];
  for (const sel of ctaSelectors) {
    const els = await mobile.$$(sel);
    if (els.length > 0) {
      console.log(`  found ${els.length} of ${sel}`);
    }
  }

  // Chat input
  try {
    if (await clickIfExists(mobile, '[data-nav="chat"]', 'chat')) {
      await shot(mobile, '09-chat-empty-mobile');
      const textarea = await mobile.$('textarea, input[placeholder*="ergun"], input[placeholder*="ensag"]');
      if (textarea) {
        await textarea.fill('Olá Guardiã! Preciso de ajuda com minha dieta.');
        await shot(mobile, '10-chat-typed-mobile');
      }
    }
  } catch (e) {
    console.log('  ⚠️  chat:', e.message);
  }

  await mobile.close();

  // ── Desktop ─────────────────────────────────────────
  console.log('\n🖥️  Desktop (1280×900)');
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  attachListeners(desktop, 'desktop');

  await desktop.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await desktop.waitForTimeout(2000);
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
        await desktop.waitForTimeout(5000);
        await shot(desktop, '12-dashboard-desktop', { fullPage: false });
        await shot(desktop, '13-dashboard-desktop-fullpage', { fullPage: true });
      }
    }
  } catch (e) {
    console.log('  ⚠️  desktop login:', e.message);
  }

  await desktop.close();
  await browser.close();

  // ── Persist audit data ──────────────────────────────
  fs.writeFileSync(path.join(AUDIT_DIR, 'console.json'), JSON.stringify(consoleLog, null, 2));
  fs.writeFileSync(path.join(AUDIT_DIR, 'network.json'), JSON.stringify(networkLog, null, 2));
  fs.writeFileSync(path.join(AUDIT_DIR, 'pageerrors.json'), JSON.stringify(pageErrors, null, 2));

  const errors = consoleLog.filter(l => l.type === 'error');
  const warnings = consoleLog.filter(l => l.type === 'warning');
  const failedNet = networkLog.filter(n => n.kind === 'failed');
  const httpErrs = networkLog.filter(n => n.kind === 'http-error');

  const summary = `# Bela 4D — Console/Network Audit Summary

- Console logs total: ${consoleLog.length}
- Console errors: ${errors.length}
- Console warnings: ${warnings.length}
- Page-level JS errors: ${pageErrors.length}
- Failed network requests: ${failedNet.length}
- HTTP errors (>=400): ${httpErrs.length}

## Top console errors (first 20)
${errors.slice(0, 20).map(e => `- [${e.view}] ${e.text.slice(0, 200)}`).join('\n') || '(none)'}

## Page JS errors
${pageErrors.slice(0, 10).map(e => `- [${e.view}] ${e.message}`).join('\n') || '(none)'}

## Failed network requests
${failedNet.slice(0, 20).map(n => `- [${n.view}] ${n.method} ${n.url} — ${n.failure}`).join('\n') || '(none)'}

## HTTP errors
${httpErrs.slice(0, 20).map(n => `- [${n.view}] ${n.status} ${n.url}`).join('\n') || '(none)'}
`;
  fs.writeFileSync(path.join(AUDIT_DIR, 'summary.md'), summary);

  console.log(`\n✅ Done. Screenshots in ${OUT_DIR}/, audit in ${AUDIT_DIR}/`);
  console.log(`   Errors: ${errors.length} | Warnings: ${warnings.length} | Page errors: ${pageErrors.length} | Net failed: ${failedNet.length} | HTTP errors: ${httpErrs.length}`);
})().catch(err => {
  console.error('\n❌ Playwright fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
