#!/usr/bin/env node
/**
 * Seed de Usuário Completo — Programa 4D
 * 
 * Popula TODAS as coleções do Firestore para o usuário de teste com dados
 * realistas, cobrindo: perfil, onboarding, formulários, exames, chat,
 * receitas, conquistas, examTracking, notificações e gamificação.
 *
 * Uso:
 *   node scripts/seed-user-completo.js [--email=teste@gmail.com] [--password=Teste@01]
 *
 * Credenciais padrão: teste@gmail.com / Teste@01
 *
 * O que é criado:
 *   ✅ Perfil completo (XP 1500, nível 3, streak 7)
 *   ✅ Entrevista de onboarding (dados extraídos pela IA)
 *   ✅ Formulário de Saúde (Form 1) preenchido
 *   ✅ Formulário de Cardápio (Form 3) preenchido
 *   ✅ 2 exames de sangue (1 antigo, 1 recente — mostrando melhora)
 *   ✅ 1 pedido de exame enviado ao médico
 *   ✅ 5 entradas de examTracking (HbA1c, glicemia, peso ao longo do tempo)
 *   ✅ 8 mensagens no chat (4 trocas com a Guardiã)
 *   ✅ 4 receitas personalizadas
 *   ✅ 6 conquistas (3 reivindicadas, 3 pendentes)
 *   ✅ 3 avaliações de alimentos
 *   ✅ 5 notificações
 *   ✅ 2 ações pendentes
 *   ✅ 11 eventos no XP Log
 *   ✅ 2 dias de visitas de seção
 *
 * NOTA: Este script usa autenticação por email/senha (Firebase REST API).
 * Não requer service account. O usuário deve existir no Firebase Auth.
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

async function patchDoc(idToken, path, obj) {
  const fieldMaskQuery = Object.keys(obj).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const opts = {
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${path}?${fieldMaskQuery}`,
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  };
  const res = await request(opts, toFirestoreDoc(obj));
  if (res.status >= 400) throw new Error(`PATCH ${path} failed (${res.status}): ${JSON.stringify(res.body)}`);
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

// ─── Timestamp helpers ────────────────────────────────────────────────────────

const NOW = new Date();
function daysAgo(n) { return new Date(NOW - n * 86400000).toISOString(); }

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function seed(idToken, uid) {
  const U = (subPath) => `users/${uid}/${subPath}`;

  console.log('\n🧪 Seed de Usuário Completo — Programa 4D');
  console.log(`   UID: ${uid}`);
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PERFIL PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ENTREVISTA DE ONBOARDING
  // ═══════════════════════════════════════════════════════════════════════════
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
  console.log('    ✅ Dados extraídos: 2 diagnósticos, 2 medicamentos, alergias');

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FORMULÁRIO DE SAÚDE (Form 1)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(' 3/15 Formulário de Saúde (Form 1)...');
  await setDoc(idToken, U('healthForm/data'), {
    completed: true,
    aiPrefilled: true,
    fullName: 'Maria Teste',
    birthDate: '1985-03-15',
    gender: 'feminino',
    weight: 76.5,
    height: 165,
    age: 41,
    diagnostics: ['Diabetes tipo 2', 'Hipertensão arterial'],
    customDiagnostics: '',
    medications: [
      { name: 'Metformina', dose: '850mg', frequency: '2x/dia' },
      { name: 'Losartana', dose: '50mg', frequency: '1x/dia' },
    ],
    allergies: 'Penicilina',
    foodRestrictions: [],
    familyHistory: 'Diabetes (mãe), Hipertensão (pai)',
    hba1c: 7.2,
    hba1cDate: '2026-04-15',
    glucoseFasting: 142,
    bloodPressure: '130/85',
    cholesterolTotal: 198,
    physicalActivity: 'sedentário',
    activityLevel: 'sedentário',
    sleepHours: 7,
    sleepQuality: 3,
    stressLevel: 4,
    smoker: false,
    alcohol: 'social',
    waterIntake: '1.5L',
    doctorConsultation: true,
    objective: 'controle_glicemia',
    completedAt: daysAgo(25),
    createdAt: daysAgo(30),
    updatedAt: daysAgo(25),
  });
  console.log('    ✅ Form 1 completo: diabetes + hipertensão, medicamentos registrados');

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. FORMULÁRIO DE CARDÁPIO (Form 3)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(' 4/15 Formulário de Cardápio (Form 3)...');
  await setDoc(idToken, U('menuForm/data'), {
    completed: true,
    objective: 'controle_glicemia',
    mealTimes: [
      { id: 'breakfast', label: 'Café da Manhã', enabled: true, time: '07:00', foods: ['Aveia', 'Ovo', 'Fruta'] },
      { id: 'morning_snack', label: 'Lanche da Manhã', enabled: true, time: '10:00', foods: ['Iogurte natural', 'Castanhas'] },
      { id: 'lunch', label: 'Almoço', enabled: true, time: '12:30', foods: ['Arroz integral', 'Frango', 'Salada'] },
      { id: 'afternoon_snack', label: 'Lanche da Tarde', enabled: true, time: '15:30', foods: ['Fruta', 'Chá sem açúcar'] },
      { id: 'dinner', label: 'Jantar', enabled: true, time: '19:30', foods: ['Sopa de legumes', 'Omelete'] },
    ],
    breakfastTime: '07:00',
    lunchTime: '12:30',
    dinnerTime: '19:30',
    snackPreferences: ['frutas', 'castanhas', 'iogurte natural'],
    forbiddenFoods: ['carne de porco', 'frutos do mar', 'fígado'],
    favoriteProteins: ['frango', 'peixe', 'ovos'],
    foodPreferences: 'Frango, peixes, legumes, arroz integral',
    foodAversions: 'Fígado, quiabo',
    dietRestrictions: ['baixo carboidrato', 'pouco sódio'],
    cookingFrequency: 'diaria',
    mealPrepStyle: 'rapido',
    budget: 'medio',
    kitchenEquipment: ['fogão', 'forno', 'liquidificador', 'air fryer'],
    weeklyShoppingDay: 'sabado',
    foodSourcePreference: 'supermercado',
    completedAt: daysAgo(10),
    createdAt: daysAgo(12),
    updatedAt: daysAgo(10),
  });
  console.log('    ✅ Form 3 completo: 5 refeições/dia, prefere frango e peixe');

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EXAMES DE SANGUE
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(' 5/15 Exames de sangue...');

  // Exame antigo (3 meses atrás — valores piores)
  await setDoc(idToken, U('bloodTests/bt-old'), {
    driveFileUrl: 'https://drive.google.com/file/d/seed-blood-old',
    fileName: 'exame_inicial_maria.pdf',
    fileSize: 245000,
    status: 'done',
    processingStatus: 'done',
    extractedData: {
      glucose: 165,
      hba1c: 8.1,
      cholesterol: { total: 220, hdl: 42, ldl: 148, triglycerides: 195 },
      creatinine: 0.95,
      tsh: 2.8,
      weight: 80,
    },
    createdAt: daysAgo(30),
    processedAt: daysAgo(28),
  });
  console.log('    ✅ Exame antigo (3 meses): HbA1c 8.1%, Glicemia 165');

  // Exame recente (valores melhorando)
  await setDoc(idToken, U('bloodTests/bt-recent'), {
    driveFileUrl: 'https://drive.google.com/file/d/seed-blood-recent',
    fileName: 'exame_recente_maria.pdf',
    fileSize: 252000,
    status: 'done',
    processingStatus: 'done',
    extractedData: {
      glucose: 125,
      hba1c: 7.2,
      cholesterol: { total: 198, hdl: 45, ldl: 130, triglycerides: 165 },
      creatinine: 0.9,
      tsh: 2.4,
      weight: 76.5,
    },
    createdAt: daysAgo(5),
    processedAt: daysAgo(4),
  });
  console.log('    ✅ Exame recente: HbA1c 7.2%, Glicemia 125 — melhora visível!');

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. PEDIDO DE EXAME
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(' 6/15 Pedido de exame...');
  await addDoc(idToken, U('examRequests'), {
    status: 'sent',
    driveFileUrl: 'https://drive.google.com/file/d/seed-exam-request',
    fileName: 'pedido_exame_maria.pdf',
    examsRequested: ['Hemoglobina Glicada', 'Glicemia em Jejum', 'Colesterol Total e Frações', 'TSH', 'Creatinina'],
    createdAt: daysAgo(18),
    sentAt: daysAgo(18),
  });
  console.log('    ✅ Pedido enviado: HbA1c, Glicemia, Colesterol, TSH, Creatinina');

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EXAM TRACKING (acompanhamento de métricas ao longo do tempo) 🆕
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(' 7/15 Exam Tracking (acompanhamento)...');
  const trackingEntries = [
    { type: 'hba1c',          value: 8.1,  unit: '%',      note: 'Diagnóstico inicial',                         createdAt: daysAgo(90) },
    { type: 'glucose_fasting', value: 165, unit: 'mg/dL',   note: 'Jejum — valor elevado',                       createdAt: daysAgo(90) },
    { type: 'weight',          value: 80,   unit: 'kg',     note: 'Peso inicial',                                createdAt: daysAgo(90) },
    { type: 'hba1c',          value: 7.8,  unit: '%',      note: 'Após 1 mês de programa',                      createdAt: daysAgo(60) },
    { type: 'glucose_fasting', value: 148, unit: 'mg/dL',   note: 'Redução de 17 pontos',                        createdAt: daysAgo(60) },
    { type: 'weight',          value: 78.5, unit: 'kg',     note: 'Perda de 1.5 kg',                             createdAt: daysAgo(60) },
    { type: 'hba1c',          value: 7.5,  unit: '%',      note: 'Continua melhorando',                         createdAt: daysAgo(30) },
    { type: 'glucose_fasting', value: 135, unit: 'mg/dL',   note: 'Meta: <100 mg/dL',                            createdAt: daysAgo(30) },
    { type: 'weight',          value: 77.2, unit: 'kg',     note: '',                                            createdAt: daysAgo(30) },
    { type: 'hba1c',          value: 7.2,  unit: '%',      note: 'Último exame — melhora de 0.9% em 3 meses!',  createdAt: daysAgo(4) },
    { type: 'glucose_fasting', value: 125, unit: 'mg/dL',   note: 'Redução de 40 mg/dL desde o início',         createdAt: daysAgo(4) },
    { type: 'weight',          value: 76.5, unit: 'kg',     note: 'Total: -3.5 kg em 3 meses',                  createdAt: daysAgo(4) },
    { type: 'blood_pressure',  value: 130, unit: 'mmHg',    note: 'Sistólica — ainda elevada',                  createdAt: daysAgo(4) },
  ];

  for (let i = 0; i < trackingEntries.length; i++) {
    const entry = trackingEntries[i];
    await addDoc(idToken, U('examTracking'), entry);
  }
  console.log(`    ✅ ${trackingEntries.length} entradas: HbA1c (8.1→7.2), Glicemia (165→125), Peso (80→76.5)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. HISTÓRICO DE CHAT
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(' 8/15 Histórico de chat...');
  const chatMessages = [
    { role: 'user', content: 'Olá! Quais alimentos devo evitar com diabetes tipo 2?', type: 'text', timestamp: daysAgo(6) },
    { role: 'assistant', content: 'Olá Maria! Com diabetes tipo 2, evite alimentos de alto índice glicêmico: pão branco, arroz branco, doces, refrigerantes e sucos industrializados. Prefira alimentos integrais, vegetais folhosos, proteínas magras e gorduras saudáveis como azeite e abacate. Posso montar um cardápio personalizado para você! 🌿', type: 'text', timestamp: daysAgo(6) },

    { role: 'user', content: 'Monte um cardápio para amanhã, por favor.', type: 'text', timestamp: daysAgo(5) },
    { role: 'assistant', content: 'Claro! Aqui está sua sugestão:\n\n☀️ Café da manhã (7:00): Omelete com 2 ovos + espinafre + 1 fatia de pão integral\n🍎 Lanche (10:00): 1 iogurte natural + 1 punhado de castanhas\n🍗 Almoço (12:30): Frango grelhado + arroz integral (3 col.) + salada verde com azeite\n🍌 Lanche (15:30): 1 banana + canela\n🥣 Jantar (19:30): Sopa de legumes com frango desfiado\n\nLembre-se de beber 2L de água ao longo do dia!', type: 'text', timestamp: daysAgo(5) },

    { role: 'user', content: 'Estou sentindo muita fome entre as refeições. O que posso fazer?', type: 'text', timestamp: daysAgo(3) },
    { role: 'assistant', content: 'Isso é comum no início da adaptação! Algumas dicas:\n\n1. Aumente as fibras nas refeições principais (aveia, chia, linhaça)\n2. Inclua proteína em TODOS os lanches — não só fruta\n3. Beba água 30 min antes das refeições\n4. Tente comer devagar, mastigando bem\n\nPara os lanches, boas opções: iogurte com chia, palitos de cenoura com homus, ou 1 ovo cozido. Evite ficar mais de 3h sem comer.', type: 'text', timestamp: daysAgo(3) },

    { role: 'user', content: 'Meus exames melhoraram! A glicemia caiu de 165 para 125!', type: 'text', timestamp: daysAgo(1) },
    { role: 'assistant', content: 'Que notícia MARAVILHOSA, Maria! 🎉🚀\n\nSua glicemia caiu 40 mg/dL — isso é fruto da sua disciplina com a alimentação e o cardápio. A HbA1c também melhorou de 8.1% para 7.2%. Você perdeu 3.5 kg nesse período.\n\nContinue assim! Sua próxima meta é manter a glicemia de jejum abaixo de 100 mg/dL. Você está no caminho certo. Muito orgulho de você! 💪🌸', type: 'text', timestamp: daysAgo(1) },
  ];

  for (const msg of chatMessages) {
    await addDoc(idToken, U('chatHistory'), msg);
  }
  console.log(`    ✅ ${chatMessages.length} mensagens (4 trocas)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. RECEITAS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(' 9/15 Receitas...');
  const recipes = [
    {
      id: 'recipe-1',
      nm: 'Frango Grelhado com Salada',
      e: '🍗',
      tm: '25 min',
      kc: 320,
      ct: 'Almoço',
      df: 'Fácil',
      desc: 'Receita leve e nutritiva, rica em proteínas',
      ig: ['200g de peito de frango', 'Mix de folhas verdes', 'Tomate-cereja', 'Pepino', 'Azeite extra virgem', 'Limão', 'Sal e pimenta'],
      st: ['Tempere o frango com sal, pimenta e limão', 'Grelhe 5-6 min de cada lado', 'Monte a salada com folhas e legumes', 'Fatie o frango e sirva com fio de azeite'],
      macros: { calories: 320, protein: 38, carbs: 12, fat: 14 },
      tags: ['proteína', 'baixo IG', 'sem glúten'],
      favorited: true,
      createdAt: daysAgo(8),
    },
    {
      id: 'recipe-2',
      nm: 'Omelete de Legumes',
      e: '🥚',
      tm: '15 min',
      kc: 280,
      ct: 'Café da Manhã',
      df: 'Fácil',
      desc: 'Café da manhã proteico e de baixo índice glicêmico',
      ig: ['3 ovos', '1 abobrinha pequena', '1 tomate', 'Cebolinha', 'Azeite', 'Sal e ervas'],
      st: ['Bata os ovos com sal e ervas', 'Refogue abobrinha e tomate no azeite', 'Despeje os ovos sobre os legumes', 'Cozinhe em fogo baixo até firmar'],
      macros: { calories: 280, protein: 22, carbs: 8, fat: 18 },
      tags: ['café da manhã', 'proteína', 'low carb'],
      favorited: true,
      createdAt: daysAgo(5),
    },
    {
      id: 'recipe-3',
      nm: 'Salada de Quinoa com Legumes',
      e: '🥗',
      tm: '30 min',
      kc: 240,
      ct: 'Almoço',
      df: 'Médio',
      desc: 'Rica em fibras e proteínas vegetais, sacia por horas',
      ig: ['1 xícara de quinoa', 'Pepino picado', 'Tomate-cereja', 'Salsinha', 'Azeite', 'Limão', 'Sal'],
      st: ['Cozinhe a quinoa em água por 15 min', 'Deixe esfriar', 'Misture com legumes picados', 'Tempere com azeite, limão e sal'],
      macros: { calories: 240, protein: 12, carbs: 38, fat: 6 },
      tags: ['vegetariano', 'fibras', 'sem glúten'],
      favorited: false,
      createdAt: daysAgo(3),
    },
    {
      id: 'recipe-4',
      nm: 'Sopa de Legumes com Frango',
      e: '🍲',
      tm: '40 min',
      kc: 260,
      ct: 'Jantar',
      df: 'Fácil',
      desc: 'Sopa leve e reconfortante, ideal para o jantar',
      ig: ['150g de peito de frango', '2 cenouras', '1 abobrinha', '1 chuchu', 'Cebola', 'Alho', 'Caldo de legumes sem sal', 'Azeite'],
      st: ['Refogue cebola e alho no azeite', 'Adicione o frango em cubos e doure', 'Acrescente legumes picados e caldo', 'Cozinhe por 25 min e ajuste o sal'],
      macros: { calories: 260, protein: 28, carbs: 18, fat: 8 },
      tags: ['jantar', 'leve', 'sem glúten'],
      favorited: false,
      createdAt: daysAgo(1),
    },
  ];

  for (const r of recipes) {
    await setDoc(idToken, U(`recipes/${r.id}`), r);
  }
  console.log('    ✅ 4 receitas: almoço, café, jantar (2 favoritas)');

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. CONQUISTAS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('10/15 Conquistas...');
  const achievements = [
    { id: 'first_step',     title: 'Primeiro Passo',       description: 'Completar o onboarding do programa',                    icon: '🌟', xp: 100, claimed: true,  seen: true,  daysAgo: 30, claimedDaysAgo: 30 },
    { id: 'scientist',      title: 'Cientista',            description: 'Completar o Formulário de Saúde',                        icon: '🔬', xp: 50,  claimed: true,  seen: true,  daysAgo: 25, claimedDaysAgo: 25 },
    { id: 'consistent',     title: 'Consistente',          description: 'Manter 7 dias de streak',                                 icon: '🔥', xp: 100, claimed: true,  seen: true,  daysAgo: 0,  claimedDaysAgo: 0 },
    { id: 'night_owl',      title: 'Coruja Noturna',       description: 'Acessar entre 23h e 5h em 3 dias diferentes',            icon: '🦉', xp: 75,  claimed: false, seen: false, daysAgo: 5,  claimedDaysAgo: null },
    { id: 'recipe_curator', title: 'Curadora de Receitas', description: 'Salvar 3 receitas como favoritas',                       icon: '📋', xp: 100, claimed: false, seen: false, daysAgo: 2,  claimedDaysAgo: null },
    { id: 'polymath',       title: 'Polivalente',          description: 'Acessar 5 seções diferentes do app no mesmo dia',         icon: '🎯', xp: 80,  claimed: false, seen: false, daysAgo: 0,  claimedDaysAgo: null },
  ];

  for (const ach of achievements) {
    await setDoc(idToken, U(`achievements/${ach.id}`), {
      achievementId: ach.id,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      xp: ach.xp,
      unlocked: true,
      claimed: ach.claimed,
      xpAwarded: ach.claimed ? ach.xp : 0,
      seen: ach.seen,
      unlockedAt: daysAgo(ach.daysAgo),
      claimedAt: ach.claimedDaysAgo ? daysAgo(ach.claimedDaysAgo) : null,
    });
  }
  console.log('    ✅ 6 conquistas: 3 reivindicadas (+250 XP), 3 pendentes');

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. AVALIAÇÕES DE ALIMENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('11/15 Avaliações de alimentos...');
  const foodEvaluations = [
    { foodName: 'Arroz integral', mealType: 'Almoço', glycemicImpact: 'low', note: 'Combinado com frango e salada', createdAt: daysAgo(6) },
    { foodName: 'Pão integral', mealType: 'Café da Manhã', glycemicImpact: 'medium', note: 'Com ovo — impacto menor que pão branco', createdAt: daysAgo(4) },
    { foodName: 'Banana', mealType: 'Lanche', glycemicImpact: 'medium', note: 'Comer com canela para reduzir pico glicêmico', createdAt: daysAgo(2) },
  ];

  for (const eval_ of foodEvaluations) {
    await addDoc(idToken, U('foodEvaluations'), eval_);
  }
  console.log('    ✅ 3 avaliações registradas');

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. NOTIFICAÇÕES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('12/15 Notificações...');
  const notifications = [
    { title: '🌸 Bem-vinda ao Programa 4D!', message: 'Sua jornada de saúde começa agora. Explore o app e fale com sua Guardiã.', type: 'welcome', priority: 'high', read: true, createdAt: daysAgo(35) },
    { title: '🏆 Conquista: Primeiro Passo', message: 'Você completou o onboarding! +100 XP', type: 'achievement', priority: 'normal', read: true, createdAt: daysAgo(30) },
    { title: '📋 Exames processados', message: 'Seus exames de sangue foram analisados. Confira os resultados!', type: 'exam', priority: 'high', read: true, createdAt: daysAgo(28) },
    { title: '🦉 Conquista desbloqueada: Coruja Noturna', message: 'Parabéns! Você acessou entre 23h e 5h em 3 dias diferentes! +75 XP', type: 'achievement-unlocked', priority: 'high', read: false, createdAt: daysAgo(7) },
    { title: '🧪 Exame pronto para coleta', message: 'Seu pedido de exames de sangue está liberado. Compareça ao laboratório.', type: 'exame-ready', priority: 'urgent', read: false, createdAt: daysAgo(6) },
    { title: '💬 Nova mensagem da Guardiã', message: 'Sua Guardiã de Saúde enviou uma nova mensagem sobre seu progresso semanal.', type: 'chat-new-message', priority: 'normal', read: false, createdAt: daysAgo(4) },
    { title: '📊 Relatório Semanal disponível', message: 'Seu relatório de progresso da semana já está pronto. Veja suas conquistas!', type: 'weekly-report', priority: 'normal', read: false, createdAt: daysAgo(2) },
    { title: '⭐ Nível 3 alcançado!', message: 'Parabéns! Você chegou ao nível 3: Guardiã da Saúde', type: 'level_up', priority: 'high', read: false, createdAt: daysAgo(3) },
    { title: '⭐ Subiu para o Nível 4!', message: '+200 XP! Você desbloqueou o título Mestra da Saúde. Continue assim! 🎉', type: 'level-up', priority: 'urgent', read: false, createdAt: daysAgo(1) },
    { title: '📋 Exame de sangue disponível', message: 'Resultado do exame recente já disponível para visualização.', type: 'exame-ready', priority: 'high', read: false, createdAt: daysAgo(0) },
  ];

  for (const n of notifications) {
    await addDoc(idToken, U('notifications'), n);
  }
  console.log('    ✅ 11 notificações (8 não lidas — achievement-unlocked, exame-ready, chat-new-message, weekly-report, level-up)');

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. AÇÕES PENDENTES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('13/15 Ações pendentes...');
  const pendingActions = [
    { type: 'achievement_unlocked', achievementId: 'polymath', seen: false, message: 'Nova conquista: Polivalente! Acessou 5 seções diferentes.', payload: { achievementId: 'polymath' }, createdAt: daysAgo(0) },
    { type: 'exam_processed', bloodTestId: 'bt-recent', seen: true, message: 'Exame recente processado — veja a melhora nos seus resultados!', payload: { bloodTestId: 'bt-recent' }, createdAt: daysAgo(4) },
  ];

  for (const pa of pendingActions) {
    await addDoc(idToken, U('pendingActions'), pa);
  }
  console.log('    ✅ 2 ações (1 não vista)');

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. XP LOG
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('14/15 XP Log...');
  const xpEvents = [
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
  ];

  for (const xp of xpEvents) {
    await addDoc(idToken, U('xpLog'), xp);
  }
  console.log(`    ✅ ${xpEvents.length} eventos de XP registrados`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. VISITAS DE SEÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('15/15 Visitas de seção...');

  // Hoje — 5 seções (dispara polymath)
  await setDoc(idToken, U(`sectionVisits/${NOW.toISOString().split('T')[0]}`), {
    sections: ['home', 'receitas', 'chat', 'conquistas', 'perfil'],
    updatedAt: daysAgo(0),
  });

  // Ontem
  const yesterday = new Date(NOW - 86400000).toISOString().split('T')[0];
  await setDoc(idToken, U(`sectionVisits/${yesterday}`), {
    sections: ['home', 'receitas', 'chat'],
    updatedAt: daysAgo(1),
  });
  console.log('    ✅ 2 dias de visitas registrados');

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          ✅ SEED COMPLETO — Maria Teste                     ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  Perfil:          XP 1500 | Nível 3 | Streak 7 dias         ║');
  console.log('║  Diagnósticos:    Diabetes tipo 2 + Hipertensão             ║');
  console.log('║  Exames:          2 processados (HbA1c: 8.1→7.2)           ║');
  console.log('║  Exam Tracking:   13 entradas (3 métricas ao longo do tempo)║');
  console.log('║  Chat:            8 mensagens (4 trocas)                    ║');
  console.log('║  Receitas:        4 (2 favoritas)                           ║');
  console.log('║  Conquistas:      6 (3 reivindicadas, 3 pendentes)         ║');
  console.log('║  Notificações:    11 (8 não lidas — 5 tipos)                    ║');
  console.log('║  Peso:            80→76.5 kg (-3.5 kg)                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const { idToken, uid } = await signIn();
    await seed(idToken, uid);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
})();
