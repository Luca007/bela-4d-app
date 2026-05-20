#!/usr/bin/env node
/**
 * Playwright Screenshot QA v4 — Bela 4D App
 *
 * Captura screenshots de TODAS as telas para 3 estados de usuário:
 *   fresh   → login + awaiting screen (scheduler)
 *   waiting → login + awaiting screen (com/sem meeting)
 *   active  → login + dashboard + todos tabs + details
 *
 * Uso:
 *   node scripts/screenshot-qa-v4.js --email=teste-fresh@gmail.com --viewport=mobile
 *   node scripts/screenshot-qa-v4.js --email=teste-waiting@gmail.com --viewport=desktop
 *   node scripts/screenshot-qa-v4.js --email=teste@gmail.com --viewport=mobile
 *
 * Opções:
 *   --url=          App URL (default: https://bela-4d-app.web.app)
 *   --viewport=     mobile|desktop (default: mobile)
 *   --email=        Email do usuário
 *   --password=     Password (default: Teste@01)
 *   --waiting-mode= scheduler|scheduled (default: scheduler — sem meeting)
 */

const { chromium } = require('/home/luca/paperclip/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
const fs = require('fs');
const path = require('path');

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v === undefined ? true : v]; })
);

const BASE_URL = args.url || 'http://localhost:8090';
const VIEWPORT_TYPE = args.viewport || 'mobile';
const EMAIL = args.email || 'teste@gmail.com';
const PASSWORD = args.password || 'Teste@01';
const WAITING_MODE = args['waiting-mode'] || 'scheduler';

const TIMESTAMP = Date.now();
const OUT_DIR = `/tmp/qa-bela4d-screens/v4-${TIMESTAMP}`;

const VIEWPORT = VIEWPORT_TYPE === 'desktop'
  ? { width: 1440, height: 900 }
  : { width: 375, height: 812 };

const IS_MOBILE = VIEWPORT_TYPE === 'mobile';
const LABEL = VIEWPORT_TYPE;

// Detect state from email pattern
const STATE = EMAIL.includes('fresh') ? 'fresh' : EMAIL.includes('waiting') ? 'waiting' : 'active';

fs.mkdirSync(OUT_DIR, { recursive: true });

const consoleLog = [];
const pageErrors = [];
const clickAudit = [];

function attachListeners(page) {
  page.on('console', msg => {
    consoleLog.push({ type: msg.type(), text: msg.text().slice(0, 300), ts: Date.now() });
  });
  page.on('pageerror', err => {
    pageErrors.push({ message: err.message.slice(0, 300), ts: Date.now() });
  });
}

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: false });
    console.log(`  📸 ${name}.png`);
  } catch (e) {
    console.log(`  ❌ shot ${name}: ${e.message}`);
  }
  return file;
}

async function shotFull(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  📸 ${name}.png (full page)`);
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
    if (opts.fullPage) {
      await shotFull(page, name);
    } else {
      await shot(page, name);
    }
    clickAudit.push({ name, selector, result: 'ok' });
    return true;
  } catch (e) {
    clickAudit.push({ name, selector, result: 'error', error: e.message.slice(0, 150) });
    console.log(`  ⚠️  click ${name}: ${e.message.slice(0, 150)}`);
    return false;
  }
}

async function waitNoToasts(page, timeout = 8000) {
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('.toast, .achievement-toast, .xp-popup').length === 0,
      { timeout }
    );
  } catch {}
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function doLogin(page) {
  console.log('  → login');
  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  if (!emailInput || !passInput) {
    console.log('  ❌ login inputs missing');
    return false;
  }
  await emailInput.fill(EMAIL);
  await passInput.fill(PASSWORD);
  await shot(page, `01-login-filled-${LABEL}`);

  const submit = await page.$('button[type="submit"], button:has-text("Entrar"), button:has-text("Acessar")');
  if (!submit) { console.log('  ❌ submit button missing'); return false; }
  await submit.click();

  // Wait for navigation — could go to dashboard, awaiting, or onboarding
  await page.waitForTimeout(7000);
  await waitNoToasts(page, 6000);
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openDrawer(page) {
  const drawerBtn = await page.$('[data-open-drawer], [class*="menu"], button[class*="hamburger"]');
  if (drawerBtn) {
    try {
      await drawerBtn.click();
      await page.waitForTimeout(700);
      return true;
    } catch {}
  }
  return false;
}

async function navTo(page, navId) {
  await openDrawer(page);
  await page.waitForTimeout(300);
  const result = await clickAndShot(page, `[data-nav-item="${navId}"]`, `drawer-${navId}-${LABEL}`, { wait: 500 });
  // Close drawer if still open
  await page.waitForTimeout(500);
  const closeBtn = await page.$('[data-close-drawer]');
  if (closeBtn) {
    try { await closeBtn.click(); await page.waitForTimeout(800); } catch {}
  } else {
    // Click outside drawer
    await page.evaluate(() => {
      const backdrop = document.querySelector('[class*="overlay"], [class*="backdrop"]');
      if (backdrop) backdrop.click();
    });
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(500);
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: FRESH — Login + Awaiting screen (scheduler)
// ═══════════════════════════════════════════════════════════════════════════════

async function captureFresh(page) {
  console.log('\n=== FRESH STATE ===');

  // After login: awaiting screen with scheduler
  await shot(page, `02-after-login-${LABEL}`);
  await shotFull(page, `03-awaiting-scheduler-full-${LABEL}`);

  // Check if there are onboarding elements we can interact with
  // Try to interact with date/time inputs on the scheduler
  const dateInput = await page.$('#meeting-quick-entry input[type="date"], input[type="date"]');
  if (dateInput) {
    try {
      // Set a date
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      await dateInput.fill(tomorrow);
      await page.waitForTimeout(500);

      const timeInput = await page.$('#meeting-quick-entry input[type="time"], input[type="time"]');
      if (timeInput) {
        await timeInput.fill('10:00');
        await page.waitForTimeout(500);
      }
      await shot(page, `04-awaiting-scheduler-filled-${LABEL}`);

      // Click schedule button
      const schedBtn = await page.$('#schedule-meeting-btn, button:has-text("Agendar")');
      if (schedBtn) {
        await schedBtn.click();
        await page.waitForTimeout(3000);
        await shot(page, `05-awaiting-scheduled-${LABEL}`);
      }
    } catch (e) {
      console.log(`  ⚠️  scheduler interaction: ${e.message.slice(0, 100)}`);
    }
  }

  // Try light/dark toggle if available
  if (IS_MOBILE) {
    await shot(page, `06-awaiting-screen-dark-${LABEL}`);
  }

  // Try to scroll for full view
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.waitForTimeout(500);
  await shot(page, `07-awaiting-scrolled-${LABEL}`);
  await page.evaluate(() => window.scrollTo(0, 0));
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: WAITING — AwaitingScreen (scheduler OR scheduled)
// ═══════════════════════════════════════════════════════════════════════════════

async function captureWaiting(page) {
  console.log('\n=== WAITING STATE ===');

  // After login: awaiting screen
  await shot(page, `02-after-login-${LABEL}`);
  await waitNoToasts(page, 6000);
  await shot(page, `03-after-toasts-${LABEL}`);

  if (WAITING_MODE === 'scheduled') {
    // Already has meeting scheduled — shows confirmation
    await shotFull(page, `04-awaiting-scheduled-confirmation-${LABEL}`);
  } else {
    // No meeting — shows scheduler
    await shotFull(page, `04-awaiting-scheduler-${LABEL}`);

    // Try interactions with scheduler
    const dateInput = await page.$('#meeting-quick-entry input[type="date"], input[type="date"]');
    if (dateInput) {
      try {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        await dateInput.fill(tomorrow);
        await page.waitForTimeout(500);
        const timeInput = await page.$('#meeting-quick-entry input[type="time"], input[type="time"]');
        if (timeInput) {
          await timeInput.fill('14:30');
          await page.waitForTimeout(500);
        }
        await shot(page, `05-awaiting-scheduler-filled-${LABEL}`);
      } catch (e) {
        console.log(`  ⚠️  scheduler fill: ${e.message.slice(0, 100)}`);
      }
    }

    // Try calendar interaction
    const calBtn = await page.$('#meeting-calendar button, [class*="calendar"] button, [class*="day"]');
    if (calBtn) {
      try {
        await calBtn.click();
        await page.waitForTimeout(500);
        await shot(page, `06-awaiting-calendar-clicked-${LABEL}`);
      } catch {}
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: ACTIVE — Full dashboard, all tabs, details
// ═══════════════════════════════════════════════════════════════════════════════

async function captureActive(page) {
  console.log('\n=== ACTIVE STATE ===');

  // After login: dashboard should appear
  await page.waitForTimeout(2000);
  await shot(page, `02-after-login-${LABEL}`);
  await waitNoToasts(page, 8000);
  await shot(page, `03-after-toasts-${LABEL}`);

  // Dashboard (início)
  await shotFull(page, `04-dashboard-inicio-${LABEL}`);

  // Check for dashSkeleton
  const hadSkeleton = await page.evaluate(() => {
    const sk = document.querySelector('[class*="skeleton"], [class*="Skeleton"]');
    return !!sk;
  });
  if (hadSkeleton) {
    console.log('  👀 dashSkeleton was visible');
  }

  // Scroll dashboard
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  await shot(page, `05-dashboard-scrolled-${LABEL}`);
  await page.evaluate(() => window.scrollTo(0, 0));

  // Open Drawer
  await navTo(page, 'inicio');

  // RECEITAS
  console.log('\n  → RECEITAS tab');
  await navTo(page, 'receitas');
  await shotFull(page, `06-receitas-lista-${LABEL}`);

  // Click first recipe for detail using data-recipe-open
  await clickAndShot(page, '[data-recipe-open]:first-child', `07-receita-detail-1-${LABEL}`, { wait: 2000, fullPage: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, `07b-receita-detail-top-${LABEL}`);

  // Go back / close detail
  const backBtn = await page.$('button[class*="back"], [data-back], [class*="close"]');
  if (backBtn) {
    try { await backBtn.click(); await page.waitForTimeout(1000); } catch {}
  }

  // EXAMES
  console.log('\n  → EXAMES tab');
  await navTo(page, 'exames');
  await shotFull(page, `08-exames-lista-${LABEL}`);

  // Switch to "resultados" tab if on "pedidos"
  const resultadosTab = await page.$('[data-exam-tab="resultados"]');
  if (resultadosTab) {
    await clickAndShot(page, '[data-exam-tab="resultados"]', `08b-exames-resultados-${LABEL}`, { wait: 1500, fullPage: true });
  }

  // Switch to "pedidos" tab
  const pedidosTab = await page.$('[data-exam-tab="pedidos"]');
  if (pedidosTab) {
    await clickAndShot(page, '[data-exam-tab="pedidos"]', `08c-exames-pedidos-${LABEL}`, { wait: 1500, fullPage: true });
  }

  // Try "Exam Upload" button (if exists)
  const examUploadBtn = await page.$('[data-exam-upload], button:has-text("Upload"), button:has-text("Enviar"), button:has-text("Pedir")');
  if (examUploadBtn) {
    await clickAndShot(page, '[data-exam-upload]', `10-exam-upload-screen-${LABEL}`, { wait: 2000 });
    const backBtn2 = await page.$('button[class*="back"], [data-back]');
    if (backBtn2) { try { await backBtn2.click(); await page.waitForTimeout(1000); } catch {} }
  }

  // EVOLUÇÃO
  console.log('\n  → EVOLUÇÃO tab');
  await navTo(page, 'evolucao');
  await shotFull(page, `11-evolucao-${LABEL}`);

  // CONQUISTAS
  console.log('\n  → CONQUISTAS tab');
  await navTo(page, 'conquistas');
  await shotFull(page, `12-conquistas-${LABEL}`);

  // Scroll conquistas
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  await shot(page, `12b-conquistas-scrolled-${LABEL}`);
  await page.evaluate(() => window.scrollTo(0, 0));

  // PERFIL
  console.log('\n  → PERFIL tab');
  await navTo(page, 'perfil');
  await shotFull(page, `13-perfil-${LABEL}`);

  // Scroll perfil
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  await shot(page, `13b-perfil-scrolled-${LABEL}`);
  await page.evaluate(() => window.scrollTo(0, 0));

  // THEME TOGGLE (light mode)
  console.log('\n  → THEME TOGGLE (light)');
  const themeToggle = await page.$('[data-toggle-theme], button:has-text("tema"), button:has-text("Tema")');
  let currentTheme = 'dark';
  if (themeToggle) {
    try {
      await themeToggle.click();
      await page.waitForTimeout(800);
      currentTheme = await page.evaluate(() => localStorage.getItem('gmp-theme-mode') || 'light');
      await shot(page, `14-theme-light-${LABEL}`);
      // Restore dark
      await page.evaluate(() => localStorage.setItem('gmp-theme-mode', 'dark'));
      await page.waitForTimeout(300);
    } catch (e) {
      console.log(`  ⚠️  theme toggle: ${e.message.slice(0, 100)}`);
    }
  }
  if (currentTheme === 'light') {
    // restore dark
    await page.evaluate(() => localStorage.setItem('gmp-theme-mode', 'dark'));
  }

  // CHAT
  console.log('\n  → CHAT tab');
  await navTo(page, 'chat');
  await shotFull(page, `15-chat-${LABEL}`);

  // Scroll chat up (older messages)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot(page, `15b-chat-top-${LABEL}`);

  // Scroll chat down
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await shot(page, `15c-chat-bottom-${LABEL}`);

  // Type in chat
  const chatInput = await page.$('textarea, input[placeholder*="ergun"], input[type="text"]');
  if (chatInput) {
    try {
      await chatInput.fill('Como está meu progresso hoje?');
      await page.waitForTimeout(500);
      await shot(page, `15d-chat-typed-${LABEL}`);
    } catch (e) {
      console.log(`  ⚠️  chat type: ${e.message.slice(0, 100)}`);
    }
  }

  // CARDÁPIO section (if accessible as sub-section on dashboard/receitas)
  // Not a separate drawer item — skip

  // NOTIFICAÇÕES are accessible via bell icon in header
  console.log('\n  → NOTIFICAÇÕES (bell icon)');
  const notifBtn = await page.$('[data-toggle-notifications]');
  if (notifBtn) {
    await clickAndShot(page, '[data-toggle-notifications]', `17-notificacoes-${LABEL}`, { wait: 1500, fullPage: true });
    // Close notification panel
    const closeNotif = await page.$('[data-close-notification-panel]');
    if (closeNotif) { try { await closeNotif.click(); await page.waitForTimeout(500); } catch {} }
  }

  // CONFIGURAÇÕES are in the perfil section
  // Skip — not a separate drawer item

  // Drawer open screenshot
  await openDrawer(page);
  await page.waitForTimeout(500);
  await shot(page, `19-drawer-open-${LABEL}`);
  // Close drawer by clicking outside
  await page.evaluate(() => {
    const backdrop = document.querySelector('[class*="overlay"], [class*="backdrop"]');
    if (backdrop) backdrop.click();
  });
  await page.waitForTimeout(500);

  // LOGOUT
  console.log('\n  → LOGOUT');
  await openDrawer(page);
  await page.waitForTimeout(500);
  const logoutBtn = await page.$('button:has-text("Sair"), [data-logout]');
  if (logoutBtn) {
    await clickAndShot(page, 'button:has-text("Sair")', `20-logout-${LABEL}`, { wait: 2500 });
  }

  // Try to login again to get login screen screenshot
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await shot(page, `21-login-clean-${LABEL}`);

  await page.evaluate(() => window.scrollTo(0, 0));
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

(async () => {
  console.log(`\n🚀 Bela 4D Screenshot v4 — ${STATE} state, ${VIEWPORT_TYPE}`);
  console.log(`   URL: ${BASE_URL}`);
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Output: ${OUT_DIR}/`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: '/home/luca/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
  });

  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();
  attachListeners(page);

  // Service worker unregister + dark theme pre-set
  await page.addInitScript(() => {
    try { localStorage.setItem('gmp-theme-mode', 'dark'); } catch {}
    navigator.serviceWorker?.getRegistrations?.()?.then?.(regs => regs.forEach(r => r.unregister()));
  });

  // Navigate to app
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => {
    console.log(`  ⚠️  goto: ${e.message}`);
  });
  await page.waitForTimeout(2000);

  // Screenshot login screen
  await shot(page, `00-login-clean-${LABEL}`);

  // Login
  const ok = await doLogin(page);
  if (!ok) {
    console.log('❌ Login failed');
    await ctx.close();
    await browser.close();
    process.exit(1);
  }

  // Capture based on state
  if (STATE === 'fresh') {
    await captureFresh(page);
  } else if (STATE === 'waiting') {
    await captureWaiting(page);
  } else if (STATE === 'active') {
    await captureActive(page);
  }

  await ctx.close();
  await browser.close();

  // Write audit
  const errors = consoleLog.filter(l => l.type === 'error');
  const clickFails = clickAudit.filter(c => c.result !== 'ok');

  const summary = [
    `# Bela 4D — Screenshot QA v4 Report (${STATE}, ${VIEWPORT_TYPE})`,
    ``,
    `- State: ${STATE}`,
    `- Viewport: ${VIEWPORT_TYPE} (${VIEWPORT.width}×${VIEWPORT.height})`,
    `- Output: ${OUT_DIR}/`,
    `- Total screenshots: ${fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).length}`,
    `- Console errors: ${errors.length}`,
    `- Page JS errors: ${pageErrors.length}`,
    `- Click failures: ${clickFails.length}`,
    ``,
  ].join('\n');

  // Save detailed errors.json
  fs.writeFileSync(path.join(OUT_DIR, 'errors.json'), JSON.stringify({
    consoleErrors: consoleLog.filter(l => l.type === 'error'),
    pageErrors: pageErrors,
    clickFailures: clickAudit.filter(c => c.result !== 'ok'),
  }, null, 2));

  fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), summary);

  console.log(`\n✅ Done. ${fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).length} screenshots in ${OUT_DIR}/`);
  console.log(`   Console errors: ${errors.length} | Page errors: ${pageErrors.length} | Click fails: ${clickFails.length}`);
})().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
