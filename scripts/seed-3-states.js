#!/usr/bin/env node
/**
 * Seed 3 Estados — Programa 4D
 *
 * Popula Firestore com dados para 3 estados de usuário de teste:
 *   fresh   → signup novo (status: awaiting_onboarding, sem dados)
 *   waiting → awaiting_onboarding + healthForm + menuForm (+ opcional meeting)
 *   active  → status active com dados completos (re-seed)
 *
 * Uso:
 *   node scripts/seed-3-states.js --state=fresh  --email=teste-fresh@gmail.com
 *   node scripts/seed-3-states.js --state=waiting --email=teste-waiting@gmail.com [--with-meeting]
 *   node scripts/seed-3-states.js --state=active  --email=teste@gmail.com
 *
 * Credenciais padrão: Teste@01
 */

const https = require('https');

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v === undefined ? true : v]; })
);

const CONFIG = {
  apiKey: 'AIzaSyBPIZCJq9DVn8MT4hjkRRIuktOfUgW97yw',
  projectId: 'bela-4d-app',
  email: args.email || 'teste@gmail.com',
  password: args.password || 'Teste@01',
};

const STATE = args.state || 'active';
const WITH_MEETING = !!args['with-meeting'];

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

  if (res.status !== 200) {
    // Try signUp
    const signUp = await request({
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${CONFIG.apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: CONFIG.email, password: CONFIG.password, returnSecureToken: true });
    if (signUp.status !== 200) throw new Error(`Auth failed: ${JSON.stringify(signUp.body)}`);
    console.log(`[Auth] Created ${CONFIG.email} (uid: ${signUp.body.localId})`);
    return { idToken: signUp.body.idToken, uid: signUp.body.localId };
  }
  console.log(`[Auth] ${CONFIG.email} (uid: ${res.body.localId})`);
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

async function firestoreReq(idToken, method, path, body) {
  const opts = {
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${path}`,
    method,
    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  };
  const res = await request(opts, body ? toFirestoreDoc(body) : undefined);
  if (res.status >= 400 && res.status !== 404) {
    throw new Error(`${method} ${path} failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function setDoc(idToken, path, obj) {
  return firestoreReq(idToken, 'PATCH', path, obj);
}

async function addDoc(idToken, collectionPath, obj) {
  const opts = {
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${collectionPath}`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  };
  const res = await request(opts, toFirestoreDoc(obj));
  if (res.status >= 400) throw new Error(`POST ${collectionPath} failed (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body;
}

async function listDocs(idToken, collectionPath, pageSize = 100) {
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${collectionPath}?pageSize=${pageSize}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${idToken}` },
  });
  if (res.status === 404 || (res.status === 200 && !res.body.documents)) return [];
  return res.body.documents || [];
}

async function deleteDocByName(idToken, fullName) {
  const path = fullName.replace(/^.*\/documents\//, '');
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${path}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` },
  });
  return res.status < 400;
}

async function deleteCollection(idToken, collectionPath) {
  let total = 0;
  while (true) {
    const docs = await listDocs(idToken, collectionPath, 100);
    if (!docs.length) break;
    for (const d of docs) {
      await deleteDocByName(idToken, d.name);
      total++;
    }
    if (docs.length < 100) break;
  }
  return total;
}

// ─── Timestamp helpers ────────────────────────────────────────────────────────

const NOW = new Date();
function daysAgo(n) { return new Date(NOW - n * 86400000).toISOString(); }

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: FRESH — zera tudo, deixa só o auth
// ═══════════════════════════════════════════════════════════════════════════════

async function seedFresh(idToken, uid) {
  console.log('\n🧪 STATE: FRESH — Resetando dados do usuário');
  const subcollections = [
    'achievements', 'notifications', 'pendingActions', 'recipes',
    'chatHistory', 'foodEvaluations', 'bloodTests', 'examRequests',
    'sectionVisits', 'xpLog', 'examTracking',
  ];
  let totalDeleted = 0;
  for (const sub of subcollections) {
    const count = await deleteCollection(idToken, `users/${uid}/${sub}`);
    if (count > 0) { console.log(`  ✓ ${sub}: ${count} docs apagados`); totalDeleted += count; }
  }
  const singletonPaths = [
    `users/${uid}/healthForm/data`,
    `users/${uid}/menuForm/data`,
    `users/${uid}/onboardingInterview/data`,
  ];
  for (const path of singletonPaths) {
    const res = await request({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${path}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${idToken}` },
    });
    if (res.status < 400) { console.log(`  ✓ ${path}: apagado`); totalDeleted++; }
  }
  // Apagar user doc inteiro — ensureUserDocument recria no próximo login
  await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/users/${uid}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` },
  });
  console.log('  ✓ users/${uid}: apagado');
  console.log(`\n✅ FRESH pronto. No login, ensureUserDocument cria perfil zerado com status awaiting_onboarding.`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: WAITING — awaiting_onboarding + healthForm + menuForm
// ═══════════════════════════════════════════════════════════════════════════════

async function seedWaiting(idToken, uid) {
  console.log('\n🧪 STATE: WAITING — awaiting onboarding com forms preenchidos');

  // Primeiro limpa como fresh
  const subcollections = [
    'achievements', 'notifications', 'pendingActions', 'recipes',
    'chatHistory', 'foodEvaluations', 'bloodTests', 'examRequests',
    'sectionVisits', 'xpLog', 'examTracking',
  ];
  for (const sub of subcollections) {
    const count = await deleteCollection(idToken, `users/${uid}/${sub}`);
    if (count > 0) console.log(`  ✓ ${sub}: ${count} docs apagados`);
  }

  console.log('  → Criando perfil (status: awaiting_onboarding)...');
  const profile = {
    email: CONFIG.email,
    name: 'Marina Silva',
    avatar: '🌻',
    avatarColor: '#f0059a',
    xp: 0,
    level: 1,
    streak: 0,
    totalLogins: 1,
    totalRecipes: 0,
    totalChatMessages: 0,
    onboardingCompleted: false,
    healthFormCompleted: true,
    menuFormCompleted: true,
    status: 'awaiting_onboarding',
    lastActivityDate: daysAgo(0),
    diagnostics: ['Diabetes tipo 2'],
    profile: {
      name: 'Marina Silva',
      birthDate: '1990-07-22',
      gender: 'feminino',
      weight: 72.0,
      height: 168,
    },
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
  };

  if (WITH_MEETING) {
    profile.meeting = {
      scheduledFor: daysAgo(0),
      status: 'scheduled',
      googleMeetLink: 'https://meet.google.com/abc-defg-hij',
      createdAt: daysAgo(1),
    };
  }

  await setDoc(idToken, `users/${uid}`, profile);
  console.log('  ✅ Perfil: awaiting_onboarding, XP 0, level 1');

  // Health Form
  console.log('  → Criando healthForm...');
  await setDoc(idToken, `users/${uid}/healthForm/data`, {
    completed: true,
    aiPrefilled: true,
    fullName: 'Marina Silva',
    birthDate: '1990-07-22',
    gender: 'feminino',
    weight: 72.0,
    height: 168,
    age: 35,
    diagnostics: ['Diabetes tipo 2'],
    customDiagnostics: '',
    medications: [{ name: 'Metformina', dose: '850mg', frequency: '2x/dia' }],
    allergies: 'Nenhuma',
    foodRestrictions: [],
    familyHistory: 'Diabetes (mãe)',
    hba1c: 7.5,
    hba1cDate: '2026-05-01',
    glucoseFasting: 145,
    bloodPressure: '125/80',
    cholesterolTotal: 190,
    physicalActivity: 'leve',
    activityLevel: 'leve',
    sleepHours: 7,
    sleepQuality: 4,
    stressLevel: 3,
    smoker: false,
    alcohol: 'social',
    waterIntake: '1.5L',
    doctorConsultation: false,
    objective: 'controle_glicemia',
    completedAt: daysAgo(1),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  });
  console.log('  ✅ Health Form completo');

  // Menu Form
  console.log('  → Criando menuForm...');
  await setDoc(idToken, `users/${uid}/menuForm/data`, {
    completed: true,
    objective: 'controle_glicemia',
    mealTimes: [
      { id: 'breakfast', label: 'Café da Manhã', enabled: true, time: '07:00', foods: ['Aveia', 'Ovo', 'Fruta'] },
      { id: 'morning_snack', label: 'Lanche da Manhã', enabled: true, time: '10:00', foods: ['Iogurte natural', 'Castanhas'] },
      { id: 'lunch', label: 'Almoço', enabled: true, time: '12:30', foods: ['Arroz integral', 'Frango', 'Salada'] },
      { id: 'afternoon_snack', label: 'Lanche da Tarde', enabled: true, time: '15:30', foods: ['Fruta', 'Chá'] },
      { id: 'dinner', label: 'Jantar', enabled: true, time: '19:30', foods: ['Sopa de legumes', 'Omelete'] },
    ],
    breakfastTime: '07:00',
    lunchTime: '12:30',
    dinnerTime: '19:30',
    snackPreferences: ['frutas', 'castanhas', 'iogurte natural'],
    forbiddenFoods: ['carne de porco', 'frutos do mar'],
    favoriteProteins: ['frango', 'peixe', 'ovos'],
    foodPreferences: 'Frango, peixes, legumes, arroz integral',
    foodAversions: 'Fígado',
    dietRestrictions: ['baixo carboidrato', 'pouco sódio'],
    cookingFrequency: 'diaria',
    mealPrepStyle: 'rapido',
    budget: 'medio',
    kitchenEquipment: ['fogão', 'forno', 'liquidificador', 'air fryer'],
    weeklyShoppingDay: 'sabado',
    foodSourcePreference: 'supermercado',
    completedAt: daysAgo(1),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  });
  console.log('  ✅ Menu Form completo');

  const status = WITH_MEETING ? 'com reunião agendada' : 'sem reunião agendada';
  console.log(`\n✅ WAITING pronto (${status}).`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: ACTIVE — full seed (re-seed)
// ═══════════════════════════════════════════════════════════════════════════════

async function seedActive(idToken, uid) {
  console.log('\n🧪 STATE: ACTIVE — Re-seed completo');
  const U = (subPath) => `users/${uid}/${subPath}`;

  // — 1. PERFIL — com status ACTIVE e dados que permitem dashboard
  console.log(' 1/15 Perfil principal...');
  await setDoc(idToken, `users/${uid}`, {
    email: CONFIG.email,
    name: 'Maria Teste',
    avatar: '🌸',
    avatarColor: '#f0059a',
    xp: 1500,
    level: 3,
    streak: 7,
    totalLogins: 14,
    totalRecipes: 4,
    totalChatMessages: 8,
    onboardingCompleted: true,
    healthFormCompleted: true,
    menuFormCompleted: true,
    status: 'active',
    lastActivityDate: daysAgo(0),
    diagnostics: ['Diabetes tipo 2', 'Hipertensão arterial'],
    profile: {
      name: 'Maria Teste',
      birthDate: '1985-03-15',
      gender: 'feminino',
      weight: 76.5,
      height: 165,
    },
    onboardingData: {
      name: 'Maria Teste',
      birthDate: '1985-03-15',
      gender: 'feminino',
      weight: 76.5,
      height: 165,
      diagnostics: ['Diabetes tipo 2', 'Hipertensão arterial'],
    },
    createdAt: daysAgo(35),
    updatedAt: daysAgo(0),
  });
  console.log('    ✅ Perfil: XP 1500, nível 3, streak 7, status active');

  // — 2. ENTREVISTA ONBOARDING
  console.log(' 2/15 Entrevista de onboarding...');
  await setDoc(idToken, U('onboardingInterview/data'), {
    extractedHealthData: {
      diagnostics: ['Diabetes tipo 2', 'Hipertensão arterial'],
      medications: ['Metformina 850mg 2x/dia', 'Losartana 50mg 1x/dia'],
      allergies: ['Penicilina'],
      familyHistory: ['Diabetes (mãe)', 'Hipertensão (pai)'],
      foodPreferences: 'Prefere frango, peixes, legumes e arroz integral',
      lifestyle: 'Sedentária, trabalha em home office',
      sleepHours: 7,
      stressLevel: 'moderado',
    },
    transcript: 'Transcrição resumida da reunião de onboarding: Maria, 41 anos, diabetes tipo 2 há 3 anos e hipertensão há 5 anos. Toma metformina e losartana. Alergia a penicilina. Histórico familiar relevante. Objetivo: melhorar alimentação e perder peso.',
    suggestedStatus: 'filling_health_form',
    hasBloodTest: true,
    processedAt: daysAgo(33),
    source: 'seed',
  });
  console.log('    ✅ Dados extraídos: 2 diagnósticos');

  // — 3. HEALTH FORM
  console.log(' 3/15 Formulário de Saúde (Form 1)...');
  await setDoc(idToken, U('healthForm/data'), {
    completed: true, aiPrefilled: true,
    fullName: 'Maria Teste', birthDate: '1985-03-15', gender: 'feminino',
    weight: 76.5, height: 165, age: 41,
    diagnostics: ['Diabetes tipo 2', 'Hipertensão arterial'],
    customDiagnostics: '',
    medications: [
      { name: 'Metformina', dose: '850mg', frequency: '2x/dia' },
      { name: 'Losartana', dose: '50mg', frequency: '1x/dia' },
    ],
    allergies: 'Penicilina', foodRestrictions: [],
    familyHistory: 'Diabetes (mãe), Hipertensão (pai)',
    hba1c: 7.2, hba1cDate: '2026-04-15',
    glucoseFasting: 142, bloodPressure: '130/85',
    cholesterolTotal: 198,
    physicalActivity: 'sedentário', activityLevel: 'sedentário',
    sleepHours: 7, sleepQuality: 3, stressLevel: 4,
    smoker: false, alcohol: 'social', waterIntake: '1.5L',
    doctorConsultation: true, objective: 'controle_glicemia',
    completedAt: daysAgo(25), createdAt: daysAgo(30), updatedAt: daysAgo(25),
  });
  console.log('    ✅ Form 1 completo');

  // — 4. MENU FORM
  console.log(' 4/15 Formulário de Cardápio (Form 3)...');
  await setDoc(idToken, U('menuForm/data'), {
    completed: true, objective: 'controle_glicemia',
    mealTimes: [
      { id: 'breakfast', label: 'Café da Manhã', enabled: true, time: '07:00', foods: ['Aveia', 'Ovo', 'Fruta'] },
      { id: 'morning_snack', label: 'Lanche da Manhã', enabled: true, time: '10:00', foods: ['Iogurte natural', 'Castanhas'] },
      { id: 'lunch', label: 'Almoço', enabled: true, time: '12:30', foods: ['Arroz integral', 'Frango', 'Salada'] },
      { id: 'afternoon_snack', label: 'Lanche da Tarde', enabled: true, time: '15:30', foods: ['Fruta', 'Chá sem açúcar'] },
      { id: 'dinner', label: 'Jantar', enabled: true, time: '19:30', foods: ['Sopa de legumes', 'Omelete'] },
    ],
    breakfastTime: '07:00', lunchTime: '12:30', dinnerTime: '19:30',
    snackPreferences: ['frutas', 'castanhas', 'iogurte natural'],
    forbiddenFoods: ['carne de porco', 'frutos do mar', 'fígado'],
    favoriteProteins: ['frango', 'peixe', 'ovos'],
    foodPreferences: 'Frango, peixes, legumes, arroz integral',
    foodAversions: 'Fígado, quiabo',
    dietRestrictions: ['baixo carboidrato', 'pouco sódio'],
    cookingFrequency: 'diaria', mealPrepStyle: 'rapido', budget: 'medio',
    kitchenEquipment: ['fogão', 'forno', 'liquidificador', 'air fryer'],
    weeklyShoppingDay: 'sabado', foodSourcePreference: 'supermercado',
    completedAt: daysAgo(10), createdAt: daysAgo(12), updatedAt: daysAgo(10),
  });
  console.log('    ✅ Form 3 completo');

  // — 5. EXAMES DE SANGUE
  console.log(' 5/15 Exames de sangue...');
  await setDoc(idToken, U('bloodTests/bt-old'), {
    driveFileUrl: 'https://drive.google.com/file/d/seed-blood-old',
    fileName: 'exame_inicial_maria.pdf', fileSize: 245000,
    status: 'done', processingStatus: 'done',
    extractedData: { glucose: 165, hba1c: 8.1, cholesterol: { total: 220, hdl: 42, ldl: 148, triglycerides: 195 }, creatinine: 0.95, tsh: 2.8, weight: 80 },
    createdAt: daysAgo(30), processedAt: daysAgo(28),
  });
  await setDoc(idToken, U('bloodTests/bt-recent'), {
    driveFileUrl: 'https://drive.google.com/file/d/seed-blood-recent',
    fileName: 'exame_recente_maria.pdf', fileSize: 252000,
    status: 'done', processingStatus: 'done',
    extractedData: { glucose: 125, hba1c: 7.2, cholesterol: { total: 198, hdl: 45, ldl: 130, triglycerides: 165 }, creatinine: 0.9, tsh: 2.4, weight: 76.5 },
    createdAt: daysAgo(5), processedAt: daysAgo(4),
  });
  console.log('    ✅ 2 exames: HbA1c 8.1→7.2');

  // — 6. PEDIDO DE EXAME
  console.log(' 6/15 Pedido de exame...');
  await addDoc(idToken, U('examRequests'), {
    status: 'sent',
    driveFileUrl: 'https://drive.google.com/file/d/seed-exam-request',
    fileName: 'pedido_exame_maria.pdf',
    examsRequested: ['Hemoglobina Glicada', 'Glicemia em Jejum', 'Colesterol Total e Frações', 'TSH', 'Creatinina'],
    createdAt: daysAgo(18), sentAt: daysAgo(18),
  });
  console.log('    ✅ Pedido enviado');

  // — 7. EXAM TRACKING
  console.log(' 7/15 Exam Tracking...');
  const trackingEntries = [
    { type: 'hba1c',          value: 8.1,  unit: '%',      note: 'Diagnóstico inicial',            createdAt: daysAgo(90) },
    { type: 'glucose_fasting', value: 165, unit: 'mg/dL',   note: 'Jejum — valor elevado',           createdAt: daysAgo(90) },
    { type: 'weight',          value: 80,   unit: 'kg',     note: 'Peso inicial',                    createdAt: daysAgo(90) },
    { type: 'hba1c',          value: 7.8,  unit: '%',      note: 'Após 1 mês de programa',          createdAt: daysAgo(60) },
    { type: 'glucose_fasting', value: 148, unit: 'mg/dL',   note: 'Redução de 17 pontos',            createdAt: daysAgo(60) },
    { type: 'weight',          value: 78.5, unit: 'kg',     note: 'Perda de 1.5 kg',                 createdAt: daysAgo(60) },
    { type: 'hba1c',          value: 7.5,  unit: '%',      note: 'Continua melhorando',             createdAt: daysAgo(30) },
    { type: 'glucose_fasting', value: 135, unit: 'mg/dL',   note: 'Meta: <100 mg/dL',                createdAt: daysAgo(30) },
    { type: 'weight',          value: 77.2, unit: 'kg',     note: '',                                createdAt: daysAgo(30) },
    { type: 'hba1c',          value: 7.2,  unit: '%',      note: 'Último exame — melhora de 0.9%',  createdAt: daysAgo(4) },
    { type: 'glucose_fasting', value: 125, unit: 'mg/dL',   note: 'Redução de 40 mg/dL',             createdAt: daysAgo(4) },
    { type: 'weight',          value: 76.5, unit: 'kg',     note: 'Total: -3.5 kg em 3 meses',       createdAt: daysAgo(4) },
    { type: 'blood_pressure',  value: 130, unit: 'mmHg',    note: 'Sistólica — ainda elevada',       createdAt: daysAgo(4) },
  ];
  for (const entry of trackingEntries) {
    await addDoc(idToken, U('examTracking'), entry);
  }
  console.log(`    ✅ ${trackingEntries.length} entradas`);

  // — 8. CHAT
  console.log(' 8/15 Histórico de chat...');
  const chatMessages = [
    { role: 'user', content: 'Olá! Quais alimentos devo evitar com diabetes tipo 2?', type: 'text', timestamp: daysAgo(6) },
    { role: 'assistant', content: 'Olá Maria! Com diabetes tipo 2, evite alimentos de alto índice glicêmico: pão branco, arroz branco, doces, refrigerantes... Prefira alimentos integrais, vegetais folhosos, proteínas magras e gorduras saudáveis como azeite e abacate. 🌿', type: 'text', timestamp: daysAgo(6) },
    { role: 'user', content: 'Monte um cardápio para amanhã, por favor.', type: 'text', timestamp: daysAgo(5) },
    { role: 'assistant', content: 'Claro! Aqui está sua sugestão:\n\n☀️ Café da manhã (7:00): Omelete com 2 ovos + espinafre + 1 fatia de pão integral\n🍎 Lanche (10:00): 1 iogurte natural + 1 punhado de castanhas\n🍗 Almoço (12:30): Frango grelhado + arroz integral (3 col.) + salada verde com azeite\n🍌 Lanche (15:30): 1 banana + canela\n🥣 Jantar (19:30): Sopa de legumes com frango desfiado', type: 'text', timestamp: daysAgo(5) },
    { role: 'user', content: 'Estou sentindo muita fome entre as refeições. O que posso fazer?', type: 'text', timestamp: daysAgo(3) },
    { role: 'assistant', content: 'Isso é comum no início da adaptação! Dicas:\n1. Aumente fibras (aveia, chia, linhaça)\n2. Inclua proteína em TODOS os lanches\n3. Beba água 30 min antes\n4. Mastigue bem\nOpções: iogurte com chia, cenoura com homus, ovo cozido.', type: 'text', timestamp: daysAgo(3) },
    { role: 'user', content: 'Meus exames melhoraram! A glicemia caiu de 165 para 125!', type: 'text', timestamp: daysAgo(1) },
    { role: 'assistant', content: 'Que notícia MARAVILHOSA, Maria! 🎉 Sua glicemia caiu 40 mg/dL — isso é fruto da sua disciplina! HbA1c também melhorou de 8.1% para 7.2%. Você perdeu 3.5 kg nesse período. Continue assim! 💪🌸', type: 'text', timestamp: daysAgo(1) },
  ];
  for (const msg of chatMessages) {
    await addDoc(idToken, U('chatHistory'), msg);
  }
  console.log(`    ✅ ${chatMessages.length} mensagens`);

  // — 9. RECEITAS (com detalhes completos para recipe detail)
  console.log(' 9/15 Receitas...');
  const recipes = [
    {
      id: 'recipe-1', nm: 'Frango Grelhado com Salada', e: '🍗', tm: '25 min', kc: 320, ct: 'Almoço', df: 'Fácil',
      desc: 'Receita leve e nutritiva, rica em proteínas magras e fibras. Ideal para o almoço de quem busca controle glicêmico.',
      ig: ['200g de peito de frango', 'Mix de folhas verdes (alface, rúcula, agrião)', 'Tomate-cereja (6 unidades)', 'Pepino japonês', 'Azeite extra virgem (1 colher de sopa)', 'Limão siciliano', 'Sal rosa e pimenta do reino a gosto'],
      st: ['1. Tempere o frango com sal, pimenta e suco de limão. Deixe marinar por 10 minutos.', '2. Aqueça uma frigideira antiaderente com fio de azeite.', '3. Grelhe o frango por 5-6 minutos de cada lado até dourar.', '4. Enquanto isso, lave e seque as folhas, corte os tomates ao meio e o pepino em rodelas.', '5. Monte a salada em um prato grande, regue com azeite e limão.', '6. Fatie o frango e disponha sobre a salada. Sirva imediatamente.'],
      macros: { calories: 320, protein: 38, carbs: 12, fat: 14 },
      fiber: '6g', sugar: '4g', sodium: '280mg',
      tags: ['proteína', 'baixo IG', 'sem glúten', 'diabetes'],
      dica: 'Adicione 1 colher de chia para aumentar as fibras.',
      favorited: true, createdAt: daysAgo(8),
    },
    {
      id: 'recipe-2', nm: 'Omelete de Legumes', e: '🥚', tm: '15 min', kc: 280, ct: 'Café da Manhã', df: 'Fácil',
      desc: 'Café da manhã proteico e de baixo índice glicêmico. Mantém a saciedade até o almoço.',
      ig: ['3 ovos caipiras', '1 abobrinha pequena ralada', '1 tomate picado sem sementes', 'Cebolinha e salsinha picadas', 'Azeite (1 colher de chá)', 'Sal e ervas finas a gosto', 'Orégano para finalizar'],
      st: ['1. Bata os ovos com sal, ervas finas e orégano até ficar homogêneo.', '2. Refogue a abobrinha e o tomate no azeite por 2 minutos em fogo médio.', '3. Despeje os ovos batidos sobre os legumes na frigideira.', '4. Cozinhe em fogo baixo por 3-4 minutos até firmar.', '5. Vire com cuidado (ou dobre ao meio) e cozinhe mais 1 minuto.', '6. Salpique cebolinha por cima e sirva.'],
      macros: { calories: 280, protein: 22, carbs: 8, fat: 18 },
      fiber: '3g', sugar: '3g', sodium: '350mg',
      tags: ['café da manhã', 'proteína', 'low carb', 'rápido'],
      dica: 'Acompanhe com 1 fatia de pão integral ou 1/2 abacate.',
      favorited: true, createdAt: daysAgo(5),
    },
    {
      id: 'recipe-3', nm: 'Salada de Quinoa com Legumes', e: '🥗', tm: '30 min', kc: 240, ct: 'Almoço', df: 'Médio',
      desc: 'Rica em fibras e proteínas vegetais. Quinoa é um pseudo-cereal de baixo IG que sacia por horas.',
      ig: ['1 xícara de quinoa em grãos', 'Pepino picado em cubos', 'Tomate-cereja (8 unidades)', 'Salsinha fresca picada', 'Azeite extra virgem (2 colheres)', 'Limão tahiti', 'Sal marinho', 'Hortelã fresca (opcional)'],
      st: ['1. Lave a quinoa em água corrente usando uma peneira fina.', '2. Cozinhe em 2 xícaras de água fervente com uma pitada de sal por 15 minutos.', '3. Escorra o excesso de água e deixe esfriar completamente.', '4. Enquanto isso, pique o pepino, corte os tomates ao meio e pique a salsinha.', '5. Misture tudo em uma tigela grande.', '6. Tempere com azeite, limão e sal. Decore com folhas de hortelã.'],
      macros: { calories: 240, protein: 12, carbs: 38, fat: 6 },
      fiber: '8g', sugar: '5g', sodium: '120mg',
      tags: ['vegetariano', 'fibras', 'sem glúten', 'vegano'],
      dica: 'Adicione grão de bico ou tofu para aumentar a proteína.',
      favorited: false, createdAt: daysAgo(3),
    },
    {
      id: 'recipe-4', nm: 'Sopa de Legumes com Frango', e: '🍲', tm: '40 min', kc: 260, ct: 'Jantar', df: 'Fácil',
      desc: 'Sopa leve e reconfortante, ideal para o jantar. Baixa caloria, nutritiva e termogênica.',
      ig: ['150g de peito de frango desfiado', '2 cenouras médias em rodelas', '1 abobrinha em cubos', '1 chuchu picado', '1 cebola picada', '2 dentes de alho amassados', 'Caldo de legumes caseiro sem sal', 'Azeite (1 colher de sopa)', 'Cheiro verde para finalizar'],
      st: ['1. Refogue a cebola e o alho no azeite até dourar.', '2. Adicione o frango em cubos e doure levemente.', '3. Acrescente todos os legumes picados e refogue por 3 minutos.', '4. Cubra com caldo de legumes e cozinhe em fogo médio por 25 minutos.', '5. Desfie o frango grosseiramente com um garfo.', '6. Ajuste o sal, finalize com cheiro verde e sirva quente.'],
      macros: { calories: 260, protein: 28, carbs: 18, fat: 8 },
      fiber: '6g', sugar: '7g', sodium: '320mg',
      tags: ['jantar', 'leve', 'sem glúten', 'termogênico'],
      dica: 'Sirva com 1 colher de gengibre ralado para efeito termogênico.',
      favorited: false, createdAt: daysAgo(1),
    },
  ];
  for (const r of recipes) {
    await setDoc(idToken, U(`recipes/${r.id}`), r);
  }
  console.log('    ✅ 4 receitas com detalhes completos');

  // — 10. CONQUISTAS
  console.log('10/15 Conquistas...');
  const achievements = [
    { id: 'first_step',     title: 'Primeiro Passo',       description: 'Completar o onboarding do programa',                 icon: '🌟', xp: 100, claimed: true,  seen: true,  daysAgo: 30, claimedDaysAgo: 30 },
    { id: 'scientist',      title: 'Cientista',            description: 'Completar o Formulário de Saúde',                     icon: '🔬', xp: 50,  claimed: true,  seen: true,  daysAgo: 25, claimedDaysAgo: 25 },
    { id: 'consistent',     title: 'Consistente',          description: 'Manter 7 dias de streak',                              icon: '🔥', xp: 100, claimed: true,  seen: true,  daysAgo: 0,  claimedDaysAgo: 0 },
    { id: 'night_owl',      title: 'Coruja Noturna',       description: 'Acessar entre 23h e 5h em 3 dias diferentes',        icon: '🦉', xp: 75,  claimed: false, seen: false, daysAgo: 5,  claimedDaysAgo: null },
    { id: 'recipe_curator', title: 'Curadora de Receitas', description: 'Salvar 3 receitas como favoritas',                    icon: '📋', xp: 100, claimed: false, seen: false, daysAgo: 2,  claimedDaysAgo: null },
    { id: 'polymath',       title: 'Polivalente',          description: 'Acessar 5 seções diferentes do app no mesmo dia',      icon: '🎯', xp: 80,  claimed: false, seen: false, daysAgo: 0,  claimedDaysAgo: null },
  ];
  for (const ach of achievements) {
    try {
      await setDoc(idToken, U(`achievements/${ach.id}`), {
        achievementId: ach.id, title: ach.title, description: ach.description,
        icon: ach.icon, xp: ach.xp, unlocked: true, claimed: ach.claimed,
        xpAwarded: ach.claimed ? ach.xp : 0, seen: ach.seen,
        unlockedAt: daysAgo(ach.daysAgo), claimedAt: ach.claimedDaysAgo ? daysAgo(ach.claimedDaysAgo) : null,
      });
    } catch (e) {
      if (e.message.includes('403') || e.message.includes('PERMISSION_DENIED')) {
        console.log(`    ⚠️  achievement ${ach.id}: write blocked by rules (expected)`);
      } else { throw e; }
    }
  }
  console.log('    ✅ 6 conquistas: 3 reivindicadas, 3 pendentes');

  // — 11. FOOD EVALUATIONS
  console.log('11/15 Avaliações de alimentos...');
  for (const eval_ of [
    { foodName: 'Arroz integral', mealType: 'Almoço', glycemicImpact: 'low', note: 'Combinado com frango e salada', createdAt: daysAgo(6) },
    { foodName: 'Pão integral', mealType: 'Café da Manhã', glycemicImpact: 'medium', note: 'Com ovo — impacto menor', createdAt: daysAgo(4) },
    { foodName: 'Banana', mealType: 'Lanche', glycemicImpact: 'medium', note: 'Comer com canela para reduzir pico glicêmico', createdAt: daysAgo(2) },
  ]) { await addDoc(idToken, U('foodEvaluations'), eval_); }
  console.log('    ✅ 3 avaliações');

  // — 12. NOTIFICAÇÕES
  console.log('12/15 Notificações...');
  const notifications = [
    { title: '🌸 Bem-vinda ao Programa 4D!', message: 'Sua jornada começa agora.', type: 'welcome', priority: 'high', read: true, createdAt: daysAgo(35) },
    { title: '🏆 Conquista: Primeiro Passo', message: '+100 XP', type: 'achievement', priority: 'normal', read: true, createdAt: daysAgo(30) },
    { title: '📋 Exames processados', message: 'Seus exames foram analisados!', type: 'exam', priority: 'high', read: true, createdAt: daysAgo(28) },
    { title: '🦉 Coruja Noturna', message: 'Nova conquista pendente', type: 'achievement', priority: 'normal', read: false, createdAt: daysAgo(5) },
    { title: '⭐ Nível 3 alcançado!', message: 'Guardiã da Saúde', type: 'level_up', priority: 'high', read: false, createdAt: daysAgo(3) },
  ];
  for (const n of notifications) { await addDoc(idToken, U('notifications'), n); }
  console.log('    ✅ 5 notificações (2 não lidas)');

  // — 13. AÇÕES PENDENTES
  console.log('13/15 Ações pendentes...');
  for (const pa of [
    { type: 'achievement_unlocked', achievementId: 'polymath', seen: false, message: 'Nova conquista: Polivalente!', payload: { achievementId: 'polymath' }, createdAt: daysAgo(0) },
    { type: 'exam_processed', bloodTestId: 'bt-recent', seen: true, message: 'Exame recente processado!', payload: { bloodTestId: 'bt-recent' }, createdAt: daysAgo(4) },
  ]) { await addDoc(idToken, U('pendingActions'), pa); }
  console.log('    ✅ 2 ações');

  // — 14. XP LOG
  console.log('14/15 XP Log...');
  for (const xp of [
    { source: 'onboarding_complete', amount: 100, eventId: 'onboarding_done', timestamp: daysAgo(30) },
    { source: 'health_form', amount: 50, eventId: 'health_form_done', timestamp: daysAgo(25) },
    { source: 'menu_form', amount: 50, eventId: 'menu_form_done', timestamp: daysAgo(10) },
    { source: 'achievement', amount: 100, eventId: 'achievement_first_step', timestamp: daysAgo(30) },
    { source: 'achievement', amount: 50, eventId: 'achievement_scientist', timestamp: daysAgo(25) },
    { source: 'achievement', amount: 100, eventId: 'achievement_consistent', timestamp: daysAgo(0) },
    { source: 'food_evaluated', amount: 15, eventId: 'food_eval_1', timestamp: daysAgo(6) },
    { source: 'food_evaluated', amount: 15, eventId: 'food_eval_2', timestamp: daysAgo(4) },
    { source: 'food_evaluated', amount: 15, eventId: 'food_eval_3', timestamp: daysAgo(2) },
    { source: 'chat_message', amount: 10, eventId: 'chat_1', timestamp: daysAgo(6) },
    { source: 'daily_login', amount: 10, eventId: 'daily_login_today', timestamp: daysAgo(0) },
  ]) {
    try { await addDoc(idToken, U('xpLog'), xp); }
    catch (e) {
      if (e.message.includes('403') || e.message.includes('PERMISSION_DENIED')) {
        // write blocked by rules (expected)
      } else { throw e; }
    }
  }
  console.log(`    ✅ 11 eventos de XP`);

  // — 15. SECTION VISITS
  console.log('15/15 Visitas de seção...');
  try {
    await setDoc(idToken, U(`sectionVisits/${NOW.toISOString().split('T')[0]}`), {
      sections: ['home', 'receitas', 'chat', 'conquistas', 'perfil'], updatedAt: daysAgo(0),
    });
  } catch (e) {
    if (e.message.includes('403') || e.message.includes('PERMISSION_DENIED')) {
      console.log('    ⚠️  sectionVisits: write blocked by rules (expected)');
    } else { throw e; }
  }
  try {
    const yesterday = new Date(NOW - 86400000).toISOString().split('T')[0];
    await setDoc(idToken, U(`sectionVisits/${yesterday}`), {
      sections: ['home', 'receitas', 'chat'], updatedAt: daysAgo(1),
    });
  } catch (e) {
    if (e.message.includes('403') || e.message.includes('PERMISSION_DENIED')) {
      // expected
    } else { throw e; }
  }
  console.log('    ✅ 2 dias de visitas');

  console.log('\n✅ ACTIVE pronto — Maria Teste, XP 1500, nível 3, 4 receitas, 6 conquistas.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

(async () => {
  try {
    const { idToken, uid } = await signIn();

    if (STATE === 'fresh') {
      await seedFresh(idToken, uid);
    } else if (STATE === 'waiting') {
      await seedWaiting(idToken, uid);
    } else if (STATE === 'active') {
      await seedActive(idToken, uid);
    } else {
      console.error(`Estado inválido: ${STATE}. Use fresh|waiting|active`);
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
