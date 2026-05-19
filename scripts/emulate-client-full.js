#!/usr/bin/env node
/**
 * Emulação completa de cliente — Bela 4D
 *
 * Navega TODAS as telas, clica em TODOS os botões visíveis, captura:
 *   - Screenshot por tela
 *   - Erros de console (JS errors, warnings)
 *   - Network failures (4xx/5xx)
 *   - Estado final do DOM
 *
 * Saída: /tmp/bela-4d-emulate/
 *   - screenshots/*.png
 *   - report.json (relatório estruturado)
 *   - report.md (relatório legível)
 *
 * Uso:
 *   python3 -m http.server 5500 --directory /home/luca/bela-4d-app &
 *   node scripts/emulate-client-full.js
 */

const { chromium } = require('/home/luca/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:5500';
const OUT_DIR = '/tmp/bela-4d-emulate';
const SHOTS = path.join(OUT_DIR, 'screenshots');
const CREDS = { email: 'teste@gmail.com', password: 'Teste@01' };

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });

const report = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  credentials: { email: CREDS.email, password: '***' },
  scenes: [],
  consoleErrors: [],
  consoleWarnings: [],
  networkFailures: [],
  pageErrors: [],
};

let sceneCounter = 0;

async function shot(page, name, note = '') {
  sceneCounter++;
  const file = path.join(SHOTS, `${String(sceneCounter).padStart(2, '0')}-${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: true });
    report.scenes.push({ idx: sceneCounter, name, note, file: path.basename(file), url: page.url() });
    console.log(`  📸 [${sceneCounter}] ${name}${note ? ' — ' + note : ''}`);
  } catch (e) {
    console.log(`  ❌ shot(${name}) falhou: ${e.message}`);
    report.scenes.push({ idx: sceneCounter, name, note, error: e.message });
  }
}

function attachListeners(page, label) {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      report.consoleErrors.push({ page: label, text, location: msg.location() });
    } else if (type === 'warning') {
      report.consoleWarnings.push({ page: label, text });
    }
  });
  page.on('pageerror', err => {
    report.pageErrors.push({ page: label, message: err.message, stack: err.stack?.split('\n')[1] });
  });
  page.on('response', resp => {
    const status = resp.status();
    if (status >= 400) {
      report.networkFailures.push({ page: label, url: resp.url(), status, statusText: resp.statusText() });
    }
  });
}

async function clickAndShot(page, selector, name, opts = {}) {
  try {
    const el = await page.$(selector);
    if (!el) {
      console.log(`  ⚠️  Não achou: ${selector}`);
      return false;
    }
    await el.click({ timeout: 2000, ...opts });
    await page.waitForTimeout(opts.wait || 1200);
    await shot(page, name);
    return true;
  } catch (e) {
    console.log(`  ⚠️  click(${selector}): ${e.message}`);
    await shot(page, `${name}-error`, e.message);
    return false;
  }
}

(async () => {
  console.log(`\n🚀 Emulando cliente — ${BASE_URL}`);
  console.log(`👤 Conta: ${CREDS.email}`);
  console.log(`📁 Saída: ${OUT_DIR}\n`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/luca/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    colorScheme: 'dark',
  });

  const page = await ctx.newPage();
  attachListeners(page, 'main');

  // ── 1. Login screen ─────────────────────────────────────────────────────────
  console.log('🔐 1. Login');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 }).catch(e => console.log('  ⚠️  networkidle:', e.message));
  await page.waitForTimeout(2000);
  await shot(page, 'login-initial', 'tela inicial');

  // Try to fill login form
  try {
    const email = await page.$('input[type="email"], input[name="email"], #email');
    const pwd = await page.$('input[type="password"], input[name="password"], #password');
    if (email && pwd) {
      await email.fill(CREDS.email);
      await pwd.fill(CREDS.password);
      await shot(page, 'login-filled', 'campos preenchidos');

      const submit = await page.$('button[type="submit"], .btn-primary, button:has-text("Entrar"), button:has-text("Login")');
      if (submit) {
        await submit.click();
        await page.waitForTimeout(6000);
        await shot(page, 'login-after-submit', 'após submit');
      }
    } else {
      await shot(page, 'login-no-form', 'sem campos email/password');
    }
  } catch (e) {
    console.log('  ⚠️  login flow error:', e.message);
  }

  // ── 2. Detectar tela pós-login (awaiting/dashboard/onboarding) ───────────────
  console.log('🧭 2. Tela pós-login');
  await page.waitForTimeout(2000);
  await shot(page, 'post-login-detect', 'detectando rota');

  // ── 3. Awaiting (scheduler) — se aparecer ───────────────────────────────────
  console.log('📅 3. Scheduler (se awaiting)');
  const dateInput = await page.$('#meeting-date-input, input[type="date"]');
  if (dateInput) {
    await dateInput.fill('2026-06-15');
    await page.waitForTimeout(500);
    await shot(page, 'scheduler-date-filled');
    const timeInput = await page.$('#meeting-time-input, input[type="time"]');
    if (timeInput) {
      await timeInput.fill('10:00');
      await page.waitForTimeout(500);
      await shot(page, 'scheduler-time-filled');
    }
  } else {
    console.log('  ⚠️  Sem scheduler visível');
  }

  // ── 4. Dashboard tabs (6) ───────────────────────────────────────────────────
  console.log('🏠 4. Dashboard tabs');
  // 4a. Drawer (menu lateral) — abrir primeiro
  console.log('☰ 4a. Drawer toggle');
  await clickAndShot(page, '[data-open-drawer]', 'drawer-open');
  await page.waitForTimeout(800);
  await shot(page, 'drawer-with-items', 'menu aberto com items');

  const tabs = [
    { id: 'inicio', name: 'tab-inicio' },
    { id: 'evolucao', name: 'tab-evolucao' },
    { id: 'receitas', name: 'tab-receitas' },
    { id: 'exames', name: 'tab-exames' },
    { id: 'conquistas', name: 'tab-conquistas' },
    { id: 'chat', name: 'tab-chat' },
    { id: 'perfil', name: 'tab-perfil' },
  ];
  for (const t of tabs) {
    // re-open drawer if needed
    const openDrawer = await page.$('[data-open-drawer]');
    if (openDrawer) {
      await openDrawer.click().catch(()=>{});
      await page.waitForTimeout(400);
    }
    await clickAndShot(page, `[data-nav-item="${t.id}"]`, t.name);
  }

  // close drawer
  await clickAndShot(page, '[data-close-drawer]', 'drawer-closed-by-backdrop');

  // ── 6. Chat ─────────────────────────────────────────────────────────────────
  console.log('💬 6. Chat');
  const chatNav = await page.$('[data-nav="chat"], a[href*="chat"], #chat-fab');
  if (chatNav) {
    await chatNav.click().catch(()=>{});
    await page.waitForTimeout(2000);
    await shot(page, 'chat-screen');
    const ta = await page.$('.chat-textarea, textarea, #chat-input');
    if (ta) {
      await ta.fill('Olá Guardiã! Pode me sugerir uma receita low-carb para o jantar?');
      await shot(page, 'chat-with-message');
    }
  }

  // ── 7. Community like ───────────────────────────────────────────────────────
  console.log('👥 7. Comunidade like');
  const goCommunity = async () => {
    const open = await page.$('[data-open-drawer]');
    if (open) { await open.click().catch(()=>{}); await page.waitForTimeout(300); }
    const tab = await page.$('[data-nav-item="comunidade"]');
    if (tab) { await tab.click().catch(()=>{}); await page.waitForTimeout(1200); }
  };
  // comunidade é sub-aba de conquistas
  const goCom2 = async () => {
    const open = await page.$('[data-open-drawer]');
    if (open) { await open.click().catch(()=>{}); await page.waitForTimeout(300); }
    const tab = await page.$('[data-nav-item="conquistas"]');
    if (tab) { await tab.click().catch(()=>{}); await page.waitForTimeout(1200); }
    // try sub-nav
    const subBtns = await page.$$('[data-sub-nav]');
    for (const b of subBtns) {
      const sub = await b.getAttribute('data-sub-nav');
      if (sub === 'comunidade' || sub === 'ranking') {
        await b.click().catch(()=>{}); await page.waitForTimeout(800);
        break;
      }
    }
  };
  await goCom2();
  await shot(page, 'comunidade-loaded', 'sub-aba comunidade');
  const likeBtn = await page.$('[data-community-like]');
  if (likeBtn) {
    await likeBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'comunidade-after-like', 'like clicado');
  } else {
    console.log('  ⚠️  Sem post da comunidade visível');
  }

  // ── 8. Receitas — abrir uma ─────────────────────────────────────────────────
  console.log('🍽️  8. Receitas');
  const openD2 = await page.$('[data-open-drawer]');
  if (openD2) { await openD2.click().catch(()=>{}); await page.waitForTimeout(300); }
  await clickAndShot(page, '[data-nav-item="receitas"]', 'receitas-screen');
  const recipeCard = await page.$('.recipe-card, [data-recipe-id]');
  if (recipeCard) {
    await recipeCard.click();
    await page.waitForTimeout(1500);
    await shot(page, 'recipe-detail');
  } else {
    console.log('  ⚠️  Sem receita visível');
  }

  // ── 9. Conquistas ───────────────────────────────────────────────────────────
  console.log('🏆 9. Conquistas');
  const openD3 = await page.$('[data-open-drawer]');
  if (openD3) { await openD3.click().catch(()=>{}); await page.waitForTimeout(300); }
  await clickAndShot(page, '[data-nav-item="conquistas"]', 'conquistas-screen');

  // ── 10. Perfil → logout ─────────────────────────────────────────────────────
  console.log('🚪 10. Perfil');
  const openD4 = await page.$('[data-open-drawer]');
  if (openD4) { await openD4.click().catch(()=>{}); await page.waitForTimeout(300); }
  await clickAndShot(page, '[data-nav-item="perfil"]', 'perfil-screen');
  await page.waitForTimeout(800);

  // ── Final ───────────────────────────────────────────────────────────────────
  await ctx.close();
  await browser.close();

  // Save reports
  report.finishedAt = new Date().toISOString();
  report.summary = {
    totalScenes: report.scenes.length,
    consoleErrors: report.consoleErrors.length,
    consoleWarnings: report.consoleWarnings.length,
    pageErrors: report.pageErrors.length,
    networkFailures: report.networkFailures.length,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  const md = [
    '# Bela 4D — Relatório de emulação de cliente',
    `**Data:** ${report.startedAt}`,
    `**Base URL:** ${BASE_URL}`,
    `**Conta:** ${CREDS.email}`,
    '',
    '## Resumo',
    `- Cenas capturadas: **${report.summary.totalScenes}**`,
    `- 🔴 Erros JS no console: **${report.summary.consoleErrors}**`,
    `- 🟠 Page errors: **${report.summary.pageErrors}**`,
    `- 🌐 Network failures (4xx/5xx): **${report.summary.networkFailures}**`,
    `- 🟡 Warnings: **${report.summary.consoleWarnings}**`,
    '',
    '## Erros JS encontrados',
    ...report.consoleErrors.slice(0, 20).map((e, i) => `${i + 1}. \`${e.text}\` (${e.location?.url || 'unknown'}:${e.location?.lineNumber || 0})`),
    '',
    '## Page errors',
    ...report.pageErrors.slice(0, 20).map((e, i) => `${i + 1}. \`${e.message}\` — ${e.stack || ''}`),
    '',
    '## Network failures',
    ...report.networkFailures.slice(0, 20).map((f, i) => `${i + 1}. ${f.status} ${f.statusText} — ${f.url}`),
    '',
    '## Cenas',
    ...report.scenes.map(s => `- **${s.idx}.** ${s.name}${s.note ? ` (_${s.note}_)` : ''} — \`${s.file}\``),
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'report.md'), md);

  console.log(`\n✅ Emulação finalizada`);
  console.log(`   📁 ${OUT_DIR}/`);
  console.log(`   📄 report.md / report.json`);
  console.log(`   📸 ${report.scenes.length} screenshots`);
  console.log(`\n📊 Resumo:`);
  console.log(`   🔴 ${report.summary.consoleErrors} erros JS`);
  console.log(`   🟠 ${report.summary.pageErrors} page errors`);
  console.log(`   🌐 ${report.summary.networkFailures} network failures`);
})().catch(err => {
  console.error('\n❌ Fatal:', err);
  process.exit(1);
});
