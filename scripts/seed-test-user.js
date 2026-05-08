#!/usr/bin/env node
/**
 * Seed de dados de teste — Programa 4D
 *
 * Popula o Firestore com dados completos para o usuário de teste.
 *
 * Uso:
 *   node scripts/seed-test-user.js --email=teste@gmail.com --reset
 *
 * Pré-requisito: variável de ambiente GOOGLE_APPLICATION_CREDENTIALS apontando
 * para uma service account com permissão de leitura/escrita no Firestore, OU
 * estar rodando com o emulador (FIRESTORE_EMULATOR_HOST=localhost:8080).
 *
 * Credenciais de teste: teste@gmail.com / Teste@01
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// ─── Parse args ──────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, v] = a.slice(2).split('=');
      return [k, v === undefined ? true : v];
    })
);

const EMAIL = args.email || 'teste@gmail.com';
const RESET = !!args.reset;

// ─── Firebase init ────────────────────────────────────────────────────────────
if (!getApps().length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'bela-4d-app' });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ credential: cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)) });
  } else {
    // Tenta service account local
    try {
      const sa = require('../firebase/service-account.json');
      initializeApp({ credential: cert(sa) });
    } catch {
      initializeApp({ projectId: 'bela-4d-app' });
    }
  }
}

const db = getFirestore();
const auth = getAuth();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function now() { return Timestamp.now(); }
function daysAgo(n) { return Timestamp.fromMillis(Date.now() - n * 86400000); }

async function deleteCollection(ref) {
  const snap = await ref.listDocuments();
  const batch = db.batch();
  for (const d of snap) {
    batch.delete(d);
    // Não deleta subcoleções de netos — aceitável para dados de teste
  }
  await batch.commit();
}

async function getUserUid(email) {
  try {
    const user = await auth.getUserByEmail(email);
    return user.uid;
  } catch (e) {
    console.error(`[Seed] Usuário ${email} não encontrado no Firebase Auth.`);
    console.error('[Seed] Crie o usuário primeiro em Firebase Console → Authentication.');
    process.exit(1);
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed(uid) {
  const userRef = db.doc(`users/${uid}`);

  if (RESET) {
    console.log('[Seed] Apagando dados antigos...');
    const subcols = [
      'chatHistory', 'recipes', 'achievements', 'notifications',
      'pendingActions', 'xpLog', 'bloodTests', 'examRequests',
      'healthForm', 'menuForm', 'onboardingInterview', 'examTracking',
    ];
    for (const col of subcols) {
      try { await deleteCollection(db.collection(`users/${uid}/${col}`)); } catch {}
    }
    await userRef.delete().catch(() => {});
    console.log('[Seed] Dados apagados.');
  }

  // ── Perfil principal ────────────────────────────────────────────────────────
  await userRef.set({
    uid,
    email: EMAIL,
    name: 'Maria Teste',
    avatar: '🌸',
    avatarColor: '#f0059a',
    status: 'active',
    xp: 1500,
    level: 3,
    streak: 7,
    lastActivityDate: daysAgo(0),
    totalRecipes: 3,
    totalChatMessages: 5,
    diagnostics: ['Diabetes tipo 2', 'Hipertensão'],
    hba1c: 7.2,
    glucoseFasting: 110,
    objective: 'controle_glicemia',
    phone: '+5511999999999',
    createdAt: daysAgo(30),
    updatedAt: now(),
  }, { merge: true });

  console.log('[Seed] Perfil salvo.');

  // ── Entrevista de onboarding ────────────────────────────────────────────────
  await db.doc(`users/${uid}/onboardingInterview/data`).set({
    extractedHealthData: {
      diagnostics: ['Diabetes tipo 2', 'Hipertensão'],
      medications: ['Metformina 500mg', 'Losartana 50mg'],
      allergies: ['Amendoim'],
      foodPreferences: 'Gosta de frango, legumes e arroz integral',
      lifestyle: 'Sedentária, trabalha em home office',
      sleepHours: 7,
      stressLevel: 'moderado',
    },
    hasBloodTest: true,
    processedAt: daysAgo(28),
    source: 'seed',
  });

  // ── Exame de sangue processado ──────────────────────────────────────────────
  const bloodTestRef = await db.collection(`users/${uid}/bloodTests`).add({
    driveFileUrl: 'https://drive.google.com/file/d/seed-blood-test',
    status: 'done',
    processingStatus: 'done',
    extractedData: {
      glicemia: [
        { d: daysAgo(20), v: 125 },
        { d: daysAgo(10), v: 118 },
        { d: daysAgo(0), v: 112 },
      ],
      hba1c: [
        { d: daysAgo(20), v: 7.5 },
        { d: daysAgo(0), v: 7.2 },
      ],
      peso: [
        { d: daysAgo(20), v: 78 },
        { d: daysAgo(0), v: 76.5 },
      ],
    },
    createdAt: daysAgo(20),
    processedAt: daysAgo(19),
  });

  console.log('[Seed] Exame de sangue salvo:', bloodTestRef.id);

  // ── Pedido de exame ─────────────────────────────────────────────────────────
  const examRequestRef = await db.collection(`users/${uid}/examRequests`).add({
    status: 'sent',
    driveFileUrl: 'https://drive.google.com/file/d/seed-exam-request',
    fileName: 'pedido_exame_maria.pdf',
    examsRequested: ['Hemoglobina Glicada', 'Glicemia em Jejum', 'Colesterol Total', 'TSH'],
    createdAt: daysAgo(15),
    sentAt: daysAgo(15),
  });

  console.log('[Seed] Pedido de exame salvo:', examRequestRef.id);

  // ── Formulário de saúde ─────────────────────────────────────────────────────
  await db.doc(`users/${uid}/healthForm/data`).set({
    completed: true,
    aiPrefilled: true,
    diagnostics: ['Diabetes tipo 2', 'Hipertensão'],
    hba1c: 7.2,
    glucoseFasting: 110,
    weight: 76.5,
    height: 162,
    age: 45,
    medications: ['Metformina 500mg', 'Losartana 50mg'],
    allergies: ['Amendoim'],
    foodRestrictions: [],
    physicalActivity: 'sedentario',
    sleepHours: 7,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(10),
  });

  // ── Formulário pré-cardápio ─────────────────────────────────────────────────
  await db.doc(`users/${uid}/menuForm/data`).set({
    completed: true,
    objective: 'controle_glicemia',
    mealTimes: [
      { id: 'breakfast', label: 'Café da Manhã', enabled: true, time: '07:00', foods: ['Aveia', 'Ovo', 'Fruta'] },
      { id: 'morning_snack', label: 'Lanche da Manhã', enabled: true, time: '10:00', foods: ['Iogurte', 'Castanhas'] },
      { id: 'lunch', label: 'Almoço', enabled: true, time: '12:30', foods: ['Arroz integral', 'Frango', 'Salada'] },
      { id: 'afternoon_snack', label: 'Lanche da Tarde', enabled: true, time: '15:30', foods: ['Fruta'] },
      { id: 'dinner', label: 'Jantar', enabled: true, time: '19:00', foods: ['Sopa de legumes', 'Pão integral'] },
    ],
    foodPreferences: 'Frango, peixes, legumes',
    foodAversions: 'Fígado, quiabo',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
  });

  // ── Histórico do chat ───────────────────────────────────────────────────────
  const chatMessages = [
    { role: 'user', content: 'Bom dia! O que posso comer no café da manhã?', type: 'text', timestamp: daysAgo(5) },
    { role: 'assistant', content: 'Bom dia, Maria! Para o café da manhã com seu perfil, recomendo aveia com frutas vermelhas e 2 ovos mexidos. O índice glicêmico é baixo e vai ajudar no controle da glicemia.', type: 'text', timestamp: daysAgo(5), xpAwarded: 10 },
    { role: 'user', content: 'Posso comer arroz branco no almoço?', type: 'text', timestamp: daysAgo(3) },
    { role: 'assistant', content: 'Com moderação! Prefira o *arroz integral* pois tem mais fibras e impacto glicêmico menor. Se for arroz branco, limite a 3 colheres de sopa e combine com proteína e salada.', type: 'text', timestamp: daysAgo(3), xpAwarded: 10 },
    { role: 'user', content: 'Qual é meu progresso esta semana?', type: 'text', timestamp: daysAgo(1) },
    { role: 'assistant', content: 'Você está indo muito bem! 🎉 Sua glicemia reduziu de 125 para 112 mg/dL nas últimas semanas. Continue assim! Sua próxima meta é manter abaixo de 100 mg/dL.', type: 'text', timestamp: daysAgo(1), xpAwarded: 15 },
  ];

  const chatBatch = db.batch();
  for (const msg of chatMessages) {
    const ref = db.collection(`users/${uid}/chatHistory`).doc();
    chatBatch.set(ref, { ...msg, id: ref.id });
  }
  await chatBatch.commit();

  console.log('[Seed] Histórico do chat salvo.');

  // ── Receitas ────────────────────────────────────────────────────────────────
  const recipes = [
    {
      title: 'Bowl de Aveia com Frutas Vermelhas',
      mealType: 'breakfast',
      difficulty: 'fácil',
      prepTime: 10,
      servings: 1,
      glycemicIndex: 45,
      nutrition: { calories: 320, proteins: 12, carbs: 48, fat: 8 },
      ingredients: [
        { name: 'Aveia em flocos', quantity: '4', unit: 'colheres' },
        { name: 'Leite desnatado', quantity: '200', unit: 'ml' },
        { name: 'Morango', quantity: '100', unit: 'g' },
        { name: 'Mirtilo', quantity: '50', unit: 'g' },
        { name: 'Chia', quantity: '1', unit: 'colher de chá' },
      ],
      instructions: [
        'Aqueça o leite e misture com a aveia.',
        'Cozinhe por 3 minutos mexendo sempre.',
        'Adicione as frutas vermelhas e a chia por cima.',
        'Sirva morno.',
      ],
      tips: 'Pode substituir o leite por leite vegetal sem açúcar.',
      tags: ['diabetes', 'café da manhã', 'baixo IG'],
      createdAt: daysAgo(8),
    },
    {
      title: 'Frango Grelhado com Legumes no Vapor',
      mealType: 'lunch',
      difficulty: 'fácil',
      prepTime: 25,
      servings: 1,
      glycemicIndex: 30,
      nutrition: { calories: 380, proteins: 42, carbs: 22, fat: 12 },
      ingredients: [
        { name: 'Filé de frango', quantity: '150', unit: 'g' },
        { name: 'Brócolis', quantity: '100', unit: 'g' },
        { name: 'Cenoura', quantity: '80', unit: 'g' },
        { name: 'Azeite', quantity: '1', unit: 'colher de sopa' },
        { name: 'Alho', quantity: '2', unit: 'dentes' },
        { name: 'Sal', quantity: 'a gosto', unit: '' },
      ],
      instructions: [
        'Tempere o frango com alho, sal e azeite.',
        'Grelhe por 6-7 minutos de cada lado.',
        'Cozinhe os legumes no vapor por 8 minutos.',
        'Sirva junto.',
      ],
      tips: 'Adicione limão para realçar o sabor sem sódio extra.',
      tags: ['diabetes', 'proteína', 'sem glúten'],
      createdAt: daysAgo(5),
    },
    {
      title: 'Sopa de Legumes com Quinoa',
      mealType: 'dinner',
      difficulty: 'média',
      prepTime: 35,
      servings: 2,
      glycemicIndex: 40,
      nutrition: { calories: 290, proteins: 14, carbs: 38, fat: 6 },
      ingredients: [
        { name: 'Quinoa', quantity: '80', unit: 'g' },
        { name: 'Caldo de frango sem sal', quantity: '500', unit: 'ml' },
        { name: 'Abobrinha', quantity: '1', unit: 'unidade' },
        { name: 'Cenoura', quantity: '1', unit: 'unidade' },
        { name: 'Cebola', quantity: '½', unit: 'unidade' },
        { name: 'Alho', quantity: '3', unit: 'dentes' },
        { name: 'Azeite', quantity: '1', unit: 'colher de sopa' },
      ],
      instructions: [
        'Refogue cebola e alho no azeite.',
        'Adicione os legumes em cubos e o caldo.',
        'Acrescente a quinoa lavada.',
        'Cozinhe por 20 minutos em fogo médio.',
        'Ajuste o sal e sirva.',
      ],
      tags: ['diabetes', 'jantar', 'sem glúten', 'fibras'],
      createdAt: daysAgo(2),
    },
  ];

  const recipeBatch = db.batch();
  for (const recipe of recipes) {
    const ref = db.collection(`users/${uid}/recipes`).doc();
    recipeBatch.set(ref, { ...recipe, id: ref.id, uid });
  }
  await recipeBatch.commit();

  console.log('[Seed] Receitas salvas.');

  // ── Conquistas ──────────────────────────────────────────────────────────────
  const achievements = [
    {
      id: 'first_login',
      unlocked: true,
      seen: true,
      title: 'Primeiro Acesso',
      description: 'Bem-vinda ao Programa 4D!',
      icon: '🌟',
      xp: 50,
      unlockedAt: daysAgo(30),
    },
    {
      id: 'streak_7',
      unlocked: true,
      seen: false,
      title: '7 Dias Seguidos',
      description: 'Você acessou o app por 7 dias consecutivos!',
      icon: '🔥',
      xp: 100,
      unlockedAt: daysAgo(0),
    },
  ];

  const achBatch = db.batch();
  for (const ach of achievements) {
    const ref = db.doc(`users/${uid}/achievements/${ach.id}`);
    achBatch.set(ref, ach);
  }
  await achBatch.commit();

  console.log('[Seed] Conquistas salvas.');

  // ── Notificações ────────────────────────────────────────────────────────────
  const notifBatch = db.batch();
  [
    { title: 'Bem-vinda ao Programa 4D!', message: 'Sua jornada começa agora. Acesse o app e conheça sua Guardiã.', type: 'welcome', priority: 'high', status: 'sent', createdAt: daysAgo(30) },
    { title: 'Lembrete de Consulta', message: 'Não esqueça de registrar seus resultados de exame mais recentes.', type: 'reminder', priority: 'normal', status: 'sent', createdAt: daysAgo(7) },
  ].forEach(n => {
    const ref = db.collection(`users/${uid}/notifications`).doc();
    notifBatch.set(ref, { ...n, id: ref.id });
  });
  await notifBatch.commit();

  // ── Ações pendentes ─────────────────────────────────────────────────────────
  const pendingBatch = db.batch();
  [
    { type: 'achievement_unlocked', seen: false, message: 'Nova conquista desbloqueada: 7 Dias Seguidos!', payload: { achievementId: 'streak_7' }, createdAt: daysAgo(0) },
    { type: 'exam_processed', seen: true, message: 'Seus exames foram processados. Confira seus resultados!', payload: { bloodTestId: 'seed-blood-test' }, createdAt: daysAgo(19) },
  ].forEach(a => {
    const ref = db.collection(`users/${uid}/pendingActions`).doc();
    pendingBatch.set(ref, { ...a, id: ref.id });
  });
  await pendingBatch.commit();

  // ── XP Log ──────────────────────────────────────────────────────────────────
  const xpBatch = db.batch();
  [
    { source: 'daily_login', amount: 10, eventId: 'daily_login', timestamp: daysAgo(0) },
    { source: 'daily_login', amount: 10, eventId: 'daily_login', timestamp: daysAgo(1) },
    { source: 'daily_login', amount: 10, eventId: 'daily_login', timestamp: daysAgo(2) },
    { source: 'chat_message', amount: 10, eventId: 'chat_msg_1', timestamp: daysAgo(5) },
    { source: 'food_evaluated', amount: 15, eventId: 'food_eval_1', timestamp: daysAgo(4) },
  ].forEach(e => {
    const ref = db.collection(`users/${uid}/xpLog`).doc();
    xpBatch.set(ref, { ...e, id: ref.id });
  });
  await xpBatch.commit();

  console.log('[Seed] XP Log salvo.');
  console.log('\n✅ Seed completo para', EMAIL, '(uid:', uid + ')');
  console.log('\n📋 Dados criados:');
  console.log('  - Perfil com XP 1500, nível 3, streak 7 dias');
  console.log('  - 1 exame de sangue processado');
  console.log('  - 1 pedido de exame');
  console.log('  - Formulário de saúde preenchido');
  console.log('  - Formulário de cardápio preenchido');
  console.log('  - 6 mensagens no chat');
  console.log('  - 3 receitas personalizadas');
  console.log('  - 2 conquistas (1 não vista)');
  console.log('  - 2 notificações');
  console.log('  - 2 ações pendentes');
  console.log('  - 5 eventos de XP');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`[Seed] Buscando usuário: ${EMAIL}`);
  const uid = await getUserUid(EMAIL);
  console.log(`[Seed] UID encontrado: ${uid}`);
  await seed(uid);
  process.exit(0);
})().catch(err => {
  console.error('[Seed] Erro:', err.message);
  process.exit(1);
});
