#!/usr/bin/env node
/**
 * Injeta dados de teste no Firestore via Firebase REST API.
 * Usa autenticação por email/senha — não precisa de service account.
 *
 * Uso: node scripts/inject-test-data.js
 * Credenciais: teste@gmail.com / Teste@01
 */

const https = require('https');

const CONFIG = {
  apiKey: 'AIzaSyBPIZCJq9DVn8MT4hjkRRIuktOfUgW97yw',
  projectId: 'bela-4d-app',
  email: 'teste@gmail.com',
  password: 'Teste@01',
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function signIn() {
  const res = await request({
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/accounts:signInWithPassword?key=${CONFIG.apiKey}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: CONFIG.email, password: CONFIG.password, returnSecureToken: true });

  if (res.status !== 200) throw new Error(`Auth failed: ${JSON.stringify(res.body)}`);
  console.log(`[Auth] Signed in as ${CONFIG.email} (uid: ${res.body.localId})`);
  return { idToken: res.body.idToken, uid: res.body.localId };
}

// ─── Firestore REST helpers ───────────────────────────────────────────────────
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (typeof val === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(val)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, toFirestoreValue(v)])
        ),
      },
    };
  }
  return { stringValue: String(val) };
}

function toFirestoreDoc(obj) {
  return { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFirestoreValue(v)])) };
}

async function patchDoc(idToken, path, obj) {
  const doc = toFirestoreDoc(obj);
  const fieldMaskQuery = Object.keys(obj).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${path}?${fieldMaskQuery}`,
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  }, doc);
  if (res.status >= 400) throw new Error(`PATCH ${path} failed (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body;
}

async function setDoc(idToken, path, obj) {
  const doc = toFirestoreDoc(obj);
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${path}`,
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  }, doc);
  if (res.status >= 400) throw new Error(`SET ${path} failed (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body;
}

async function addDoc(idToken, collectionPath, obj) {
  const doc = toFirestoreDoc(obj);
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${collectionPath}`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  }, doc);
  if (res.status >= 400) throw new Error(`ADD ${collectionPath} failed (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
async function inject(idToken, uid) {
  console.log('\n[Seed] Injetando dados para uid:', uid);
  const today = new Date().toISOString().split('T')[0];

  // 1. User profile
  console.log('[Seed] 1/8 Perfil do usuário...');
  await patchDoc(idToken, `users/${uid}`, {
    xp: 1500,
    level: 3,
    streak: 7,
    totalLogins: 12,
    onboardingCompleted: true,
    status: 'active',
    profile: {
      name: 'Maria Teste',
      birthDate: '1985-03-15',
      gender: 'feminino',
      weight: 75,
      height: 165,
    },
    onboardingData: {
      name: 'Maria Teste',
      birthDate: '1985-03-15',
      gender: 'feminino',
      weight: 75,
      height: 165,
      diagnostics: ['Diabetes tipo 2', 'Hipertensão arterial'],
    },
    diagnostics: ['Diabetes tipo 2', 'Hipertensão arterial'],
    lastLoginAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  console.log('[Seed] ✓ Perfil salvo');

  // 2. Achievements
  console.log('[Seed] 2/8 Conquistas...');
  const achievements = [
    { id: 'first_step', xpAwarded: 100, unlockedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: 'scientist', xpAwarded: 50, unlockedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
    { id: 'consistent', xpAwarded: 100, unlockedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'night_owl', xpAwarded: 75, unlockedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'recipe_curator', xpAwarded: 100, unlockedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'polymath', xpAwarded: 80, unlockedAt: new Date().toISOString() },
  ];
  for (const ach of achievements) {
    await setDoc(idToken, `users/${uid}/achievements/${ach.id}`, { xpAwarded: ach.xpAwarded, unlockedAt: ach.unlockedAt });
  }
  console.log('[Seed] ✓ Conquistas salvas');

  // 3. Recipes
  console.log('[Seed] 3/8 Receitas...');
  const recipes = [
    { id: 'recipe-test-1', nm: 'Frango Grelhado com Salada', e: '🍗', desc: 'Receita leve e nutritiva para diabéticos', macros: { calories: 320, protein: 38, carbs: 12, fat: 14 }, favorited: true, createdAt: new Date().toISOString() },
    { id: 'recipe-test-2', nm: 'Omelete de Legumes', e: '🥚', desc: 'Café da manhã proteico e de baixo índice glicêmico', macros: { calories: 280, protein: 22, carbs: 8, fat: 18 }, favorited: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'recipe-test-3', nm: 'Salada de Quinoa', e: '🥗', desc: 'Rica em fibras e proteínas vegetais', macros: { calories: 240, protein: 12, carbs: 38, fat: 6 }, favorited: false, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  ];
  for (const r of recipes) {
    await setDoc(idToken, `users/${uid}/recipes/${r.id}`, r);
  }
  console.log('[Seed] ✓ Receitas salvas');

  // 4. Notifications
  console.log('[Seed] 4/8 Notificações...');
  const notifications = [
    { title: 'Bem-vinda ao Programa 4D!', message: 'Sua jornada de saúde começa agora. Explore o app!', type: 'welcome', priority: 'high', read: false, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { title: '🏆 Primeiro Passo', message: 'Completar onboarding (+100 XP)', type: 'achievement', priority: 'normal', read: true, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { title: '🦉 Coruja Noturna', message: 'Acessar entre 23h e 5h em 3 dias diferentes (+75 XP)', type: 'achievement', priority: 'normal', read: false, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { title: '⭐ Nível 3 alcançado!', message: 'Parabéns! Você chegou ao nível 3: Guardiã da Saúde', type: 'achievement', priority: 'high', read: false, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  ];
  for (const n of notifications) {
    await addDoc(idToken, `users/${uid}/notifications`, n);
  }
  console.log('[Seed] ✓ Notificações salvas');

  // 5. Pending actions
  console.log('[Seed] 5/8 Ações pendentes...');
  await addDoc(idToken, `users/${uid}/pendingActions`, {
    type: 'achievement_unlocked',
    achievementId: 'polymath',
    seen: false,
    createdAt: new Date().toISOString(),
  });
  console.log('[Seed] ✓ Ações pendentes salvas');

  // 6. Chat history
  console.log('[Seed] 6/8 Histórico de chat...');
  const chatMessages = [
    { role: 'user', content: 'Olá! Quais alimentos devo evitar com diabetes tipo 2?', type: 'text', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    { role: 'assistant', content: 'Olá Maria! Para o diabetes tipo 2, é importante evitar alimentos com alto índice glicêmico como pão branco, arroz branco, doces e refrigerantes. Prefira alimentos integrais, vegetais, proteínas magras e gorduras saudáveis.', type: 'text', timestamp: new Date(Date.now() - 2 * 86400000 + 30000).toISOString() },
    { role: 'user', content: 'Pode me sugerir um cardápio para amanhã?', type: 'text', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { role: 'assistant', content: 'Claro! Para amanhã sugiro: Café da manhã: Omelete com 2 ovos e vegetais + 1 fatia de pão integral; Almoço: Frango grelhado + salada verde + azeite + 1 col. de sopa de azeite; Lanche: 1 punhado de nozes; Jantar: Sopa de legumes com frango.', type: 'text', timestamp: new Date(Date.now() - 86400000 + 30000).toISOString() },
  ];
  for (const msg of chatMessages) {
    await addDoc(idToken, `users/${uid}/chatHistory`, msg);
  }
  console.log('[Seed] ✓ Chat salvo');

  // 7. Section visits (for polymath achievement)
  console.log('[Seed] 7/8 Visitas de seção...');
  await setDoc(idToken, `users/${uid}/sectionVisits/${today}`, {
    sections: ['home', 'receitas', 'chat', 'conquistas', 'perfil'],
    updatedAt: new Date().toISOString(),
  });
  console.log('[Seed] ✓ Visitas de seção salvas');

  // 8. XP log
  console.log('[Seed] 8/8 XP Log...');
  const xpEvents = [
    { source: 'daily_login', amount: 10, eventId: 'login_today', timestamp: new Date().toISOString() },
    { source: 'achievement', amount: 100, eventId: 'achievement_first_step', timestamp: new Date(Date.now() - 30 * 86400000).toISOString() },
    { source: 'achievement', amount: 75, eventId: 'achievement_night_owl', timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
    { source: 'chat_message', amount: 10, eventId: 'chat_1', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
  ];
  for (const xp of xpEvents) {
    await addDoc(idToken, `users/${uid}/xpLog`, xp);
  }
  console.log('[Seed] ✓ XP Log salvo');

  console.log('\n✅ Injeção de dados completa para', CONFIG.email);
  console.log('   UID:', uid);
  console.log('   XP: 1500, Nível: 3, Streak: 7 dias');
  console.log('   Conquistas: 6 (incluindo 3 ocultas desbloqueadas)');
  console.log('   Notificações: 4 (2 não lidas)');
  console.log('   Receitas: 3');
  console.log('   Chat: 4 mensagens');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const { idToken, uid } = await signIn();
    await inject(idToken, uid);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
})();
