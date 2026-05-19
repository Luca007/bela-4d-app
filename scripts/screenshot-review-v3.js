#!/usr/bin/env node
/**
 * Playwright deep-audit v3 — Bela 4D App
 *
 * Mudanças vs v2:
 *   - força dark theme via localStorage antes do goto
 *   - aguarda toasts dismissarem antes de capturar (.toast)
 *   - abre drawer ([data-open-drawer]) antes de navegar
 *   - usa selectores reais: [data-nav-item], [data-community-like], etc.
 *   - cobre fluxo completo: login → drawer → cada aba → cardapio/forms/exam
 *   - relata todos os clicks que falharam
 *   - testa scroll/like da comunidade
 *
 * Uso:
 *   node scripts/screenshot-review-v3.js [--url=http://localhost:8090]
 */

const { chromium } = require('/home/luca/paperclip/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:8090';
const OUT_DIR = '/tmp/app-screenshots-v3';
const AUDIT_DIR = '/tmp/app-audit-v3';
const CREDS = { email: 'teste@gmail.com', password: 'Teste@01' };

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(AUDIT_DIR, { recursive: true });

const consoleLog = [];
const networkLog = [];
const pageErrors = [];
const clickAudit = [];

function attachListeners(page, label) {
  page.on('console', msg => {
    consoleLog.push({ view: label, type: msg.type(), text: msg.text(), ts: Date.now() });
  });
  page.on('pageerror', err => {
    pageErrors.push({ view: label, message: err.message, stack: err.stack, ts: Date.now() });
  });
  page.on('requestfailed', req => {
    networkLog.push({
      view: label, url: req.url(), method: req.method(),
      failure: req.failure()?.errorText, resourceType: req.resourceType(),
      kind: 'failed', ts: Date.now(),
    });
  });
  page.on('response', res => {
    const status = res.status();
    if (status >= 400 && !res.url().includes('google-analytics.com')) {
      networkLog.push({
        view: label, url: res.url(), status, statusText: res.statusText(),
        kind: 'http-error', ts: Date.now(),
      });
    }
  });
}

async function waitNoToasts(page, timeout = 8000) {
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('.toast, .achievement-toast, .xp-popup').length === 0,
      { timeout }
    );
  } catch {}
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

async function clickAndShot(page, selector, name, opts = {}) {
  try {
    const el = await page.$(selector);
    if (!el) {
      clickAudit.push({ name, selector, result: 'not-found' });
      console.log(`  ⚠️  not-found: ${selector} (${name})`);
      return false;
    }
    await el.click({ timeout: 3000 });
    await page.waitForTimeout(opts.wait ?? 1500);
    if (opts.dismissToasts) await waitNoToasts(page, 4000);
    await shot(page, name, opts);
    clickAudit.push({ name, selector, result: 'ok' });
    return true;
  } catch (e) {
    clickAudit.push({ name, selector, result: 'error', error: e.message });
    console.log(`  ⚠️  click ${name}: ${e.message}`);
    return false;
  }
}

async function login(page, label) {
  console.log(`  → login`);
  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  if (!emailInput || !passInput) {
    console.log('  ❌ login inputs missing');
    const html = await page.content();
    fs.writeFileSync(path.join(AUDIT_DIR, `login-dump-${label}.html`), html);
    return false;
  }
  await emailInput.fill(CREDS.email);
  await passInput.fill(CREDS.password);
  await shot(page, `02-login-filled-${label}`);
  const submit = await page.$('button[type="submit"], button:has-text("Entrar")');
  if (!submit) { console.log('  ❌ submit button missing'); return false; }
  await submit.click();
  await page.waitForTimeout(7000);
  return true;
}

async function openDrawerAndNav(page, navId, name, opts = {}) {
  // Open drawer
  const opened = await page.$('[data-open-drawer]');
  if (opened) {
    try {
      await opened.click();
      await page.waitForTimeout(700);
    } catch (e) { console.log(`  ⚠️  drawer open: ${e.message}`); }
  }
  // Click nav item
  return clickAndShot(page, `[data-nav-item="${navId}"]`, name, opts);
}

async function communityInteractions(page, label) {
  // Tries scroll and like
  console.log('  → community scroll + like');
  await openDrawerAndNav(page, 'comunidade', `${label}-comunidade-initial`, { dismissToasts: true });
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(800);
  await shot(page, `${label}-comunidade-scrolled`);
  const likeBtn = await page.$('[data-community-like]');
  if (likeBtn) {
    try {
      await likeBtn.click();
      await page.waitForTimeout(1200);
      await shot(page, `${label}-comunidade-after-like`);
      clickAudit.push({ name: `${label}-community-like`, selector: '[data-community-like]', result: 'ok' });
    } catch (e) {
      clickAudit.push({ name: `${label}-community-like`, selector: '[data-community-like]', result: 'error', error: e.message });
    }
  } else {
    clickAudit.push({ name: `${label}-community-like`, selector: '[data-community-like]', result: 'not-found' });
  }
}

(async () => {
  console.log(`\n🚀 Bela 4D deep audit v3 — ${BASE_URL}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
    executablePath: '/home/luca/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
  });

  for (const profile of [
    { label: 'mobile', viewport: { width: 375, height: 812 }, isMobile: true },
    { label: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false },
  ]) {
    console.log(`\n📲 ${profile.label} (${profile.viewport.width}×${profile.viewport.height})`);
    const ctx = await browser.newContext({
      viewport: profile.viewport,
      colorScheme: 'dark',
    });
    const page = await ctx.newPage();
    attachListeners(page, profile.label);

    // Pre-set dark theme and unregister SW
    await page.addInitScript(() => {
      try { localStorage.setItem('gmp-theme-mode', 'dark'); } catch {}
      navigator.serviceWorker?.getRegistrations?.()?.then?.(regs => regs.forEach(r => r.unregister()));
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 }).catch(e => {
      console.log(`  ⚠️  goto: ${e.message}`);
    });
    await page.waitForTimeout(1500);
    await shot(page, `01-login-${profile.label}`, { fullPage: false });

    const ok = await login(page, profile.label);
    if (!ok) { await ctx.close(); continue; }

    await shot(page, `03-after-login-${profile.label}`);
    await waitNoToasts(page, 6000);
    await shot(page, `04-after-toasts-${profile.label}`);

    // Navigate every drawer item
    const navs = [
      ['inicio', '05-inicio'],
      ['receitas', '06-receitas'],
      ['exames', '07-exames'],
      ['evolucao', '08-evolucao'],
      ['conquistas', '09-conquistas'],
      ['perfil', '10-perfil'],
      ['comunidade', '11-comunidade'],
      ['chat', '12-chat'],
    ];
    for (const [id, name] of navs) {
      await openDrawerAndNav(page, id, `${name}-${profile.label}`, { dismissToasts: true });
    }

    // Theme toggle
    await openDrawerAndNav(page, 'perfil', `perfil-back-${profile.label}`, { dismissToasts: true });
    await clickAndShot(page, '[data-toggle-theme]', `13-theme-toggled-${profile.label}`, { wait: 800 });
    // restore dark
    await page.evaluate(() => localStorage.setItem('gmp-theme-mode', 'dark'));

    // Community scroll + like
    await communityInteractions(page, profile.label);

    // Chat: open + type a message
    await openDrawerAndNav(page, 'chat', `chat-final-${profile.label}`, { dismissToasts: true });
    const textarea = await page.$('textarea, input[placeholder*="ergun"]');
    if (textarea) {
      try {
        await textarea.fill('Oi Guardiã! Quero ver minhas próximas conquistas.');
        await shot(page, `14-chat-typed-${profile.label}`);
        clickAudit.push({ name: 'chat-fill', selector: 'textarea', result: 'ok' });
      } catch (e) {
        clickAudit.push({ name: 'chat-fill', selector: 'textarea', result: 'error', error: e.message });
      }
    } else {
      clickAudit.push({ name: 'chat-fill', selector: 'textarea', result: 'not-found' });
    }

    // Logout button if present
    await openDrawerAndNav(page, 'perfil', `perfil-final-${profile.label}`, { dismissToasts: true });
    const logout = await page.$('button:has-text("Sair"), [data-logout]');
    if (logout) {
      try {
        await logout.click();
        await page.waitForTimeout(2500);
        await shot(page, `15-after-logout-${profile.label}`);
        clickAudit.push({ name: 'logout', selector: 'logout', result: 'ok' });
      } catch (e) {
        clickAudit.push({ name: 'logout', selector: 'logout', result: 'error', error: e.message });
      }
    }

    await ctx.close();
  }

  await browser.close();

  // Persist audit
  fs.writeFileSync(path.join(AUDIT_DIR, 'console.json'), JSON.stringify(consoleLog, null, 2));
  fs.writeFileSync(path.join(AUDIT_DIR, 'network.json'), JSON.stringify(networkLog, null, 2));
  fs.writeFileSync(path.join(AUDIT_DIR, 'pageerrors.json'), JSON.stringify(pageErrors, null, 2));
  fs.writeFileSync(path.join(AUDIT_DIR, 'clicks.json'), JSON.stringify(clickAudit, null, 2));

  const errors = consoleLog.filter(l => l.type === 'error');
  const failedNet = networkLog.filter(n => n.kind === 'failed');
  const httpErrs = networkLog.filter(n => n.kind === 'http-error');
  const clickFails = clickAudit.filter(c => c.result !== 'ok');

  const summary = `# Bela 4D — Deep Audit v3 Summary

- Console logs total: ${consoleLog.length}
- Console errors: ${errors.length}
- Page-level JS errors: ${pageErrors.length}
- Failed network requests: ${failedNet.length}
- HTTP errors (>=400): ${httpErrs.length}
- Clicks attempted: ${clickAudit.length} (failed: ${clickFails.length})

## Console errors (first 30)
${errors.slice(0, 30).map(e => `- [${e.view}] ${e.text.slice(0, 200)}`).join('\n') || '(none)'}

## Page JS errors (first 15)
${pageErrors.slice(0, 15).map(e => `- [${e.view}] ${e.message}`).join('\n') || '(none)'}

## Failed network requests (first 20)
${failedNet.slice(0, 20).map(n => `- [${n.view}] ${n.method} ${n.url} — ${n.failure}`).join('\n') || '(none)'}

## HTTP errors (first 20)
${httpErrs.slice(0, 20).map(n => `- [${n.view}] ${n.status} ${n.url}`).join('\n') || '(none)'}

## Click failures
${clickFails.map(c => `- ${c.name} (${c.selector}) → ${c.result}${c.error ? ': ' + c.error : ''}`).join('\n') || '(none)'}
`;
  fs.writeFileSync(path.join(AUDIT_DIR, 'summary.md'), summary);

  console.log(`\n✅ Done. Screenshots in ${OUT_DIR}/ (${fs.readdirSync(OUT_DIR).length} files), audit in ${AUDIT_DIR}/`);
  console.log(`   Errors: ${errors.length} | Page errors: ${pageErrors.length} | Net failed: ${failedNet.length} | HTTP errors: ${httpErrs.length} | Click fails: ${clickFails.length}`);
})().catch(err => {
  console.error('\n❌ Playwright fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
