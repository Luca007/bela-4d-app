/**
 * Firebase Cloud Functions — Programa 4D
 *
 * Todas as funções atuam como proxy seguro entre o frontend
 * e o n8n, evitando expor a URL dos webhooks.
 *
 * Deploy:
 *   cd firebase/functions
 *   npm install
 *   firebase deploy --only functions
 *
 * Região: southamerica-east1 (São Paulo)
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');

initializeApp();
const db = getFirestore();

// ─────────────────────────────────────────────
// ACHIEVEMENTS CATALOG — mirror from assets/js/config/constants.js
// Keep in sync: same ids, titles, descriptions, xp, icons, hidden, condition
// ────────────────────────────────────────────────────────────────────────
const ACHIEVEMENTS_CATALOG = [
  // ── Jornada (visíveis) ──
  { id: 'first_step',       title: 'Primeiro Passo',   description: 'Completar onboarding',                              xp: 100,  icon: '🎉',   condition: { event: 'ONBOARDING_COMPLETED' } },
  { id: 'organized',        title: 'Organizado',       description: 'Preencher todos os 5 formulários',                xp: 200,  icon: '📋',   condition: { event: 'ALL_FORMS_COMPLETED' } },
  { id: 'scientist',        title: 'Cientista',         description: 'Upload do primeiro exame',                        xp: 50,   icon: '🔬',   condition: { event: 'FIRST_EXAM_UPLOADED' } },
  { id: 'chef_formation',   title: 'Chef em Formação',  description: 'Gerar 3 receitas',                                xp: 75,   icon: '👨‍🍳', condition: { event: 'RECIPES_GENERATED', count: 3 } },
  { id: 'chef_confirmed',   title: 'Chef Confirmado',   description: 'Gerar 10 receitas',                               xp: 150,  icon: '🍽️',   condition: { event: 'RECIPES_GENERATED', count: 10 } },
  // ── Engajamento (visíveis) ──
  { id: 'conversationalist',title: 'Conversador',       description: 'Enviar 10 mensagens no chat',                     xp: 50,   icon: '💬',   condition: { event: 'CHAT_MESSAGES', count: 10 } },
  { id: 'consistent',       title: 'Consistente',       description: 'Login por 7 dias seguidos',                       xp: 100,  icon: '📅',   condition: { event: 'STREAK_DAYS', count: 7 } },
  { id: 'iron_fire',        title: 'Ferro e Fogo',      description: 'Login por 30 dias seguidos',                      xp: 500,  icon: '🔥',   condition: { event: 'STREAK_DAYS', count: 30 } },
  { id: 'explorer',         title: 'Explorador',        description: 'Usar Avaliador Alimentar 5 vezes',                xp: 75,   icon: '🧭',   condition: { event: 'FOOD_EVALUATIONS', count: 5 } },
  // ── Ranking + veterano ──
  { id: 'top_10',           title: 'Comunidade Top 10', description: 'Entrar no top 10 do ranking',                     xp: 200,  icon: '🏆',   condition: { event: 'TOP_RANKING', rank: 10 } },
  { id: 'veteran',          title: 'Veterano',          description: '90 dias de conta ativa',                          xp: 1000, icon: '🎖️',   condition: { event: 'ACCOUNT_AGE_DAYS', count: 90 } },
  { id: 'gmp_master',       title: 'Mestre GMP',        description: 'Atingir nível 5',                                 xp: 1000, icon: '👑',   condition: { event: 'LEVEL_REACHED', level: 5 } },
  // ── Hidden — revelados ao desbloquear ──
  { id: 'night_owl',        title: 'Coruja Noturna',    description: 'Acessar o app entre 23h e 5h em 3 dias diferentes', xp: 75, icon: '🦉', hidden: true, condition: { event: 'NIGHT_ACCESS_DAYS', count: 3 } },
  { id: 'early_bird',       title: 'Madrugadora',       description: 'Acessar o app entre 5h e 7h em 5 dias diferentes',  xp: 75, icon: '🌅', hidden: true, condition: { event: 'EARLY_ACCESS_DAYS', count: 5 } },
  { id: 'recipe_curator',   title: 'Curadora',          description: 'Favoritar 5 receitas',                             xp: 100, icon: '❤️', hidden: true, condition: { event: 'RECIPES_FAVORITED', count: 5 } },
  { id: 'food_explorer_pro',title: 'Exploradora Pro',   description: 'Avaliar 25 alimentos diferentes',                  xp: 200, icon: '🔍', hidden: true, condition: { event: 'FOOD_EVALUATIONS_UNIQUE', count: 25 } },
  { id: 'streak_breaker',   title: 'Persistente',       description: 'Retomar o app após perder um dia de streak',      xp: 50,  icon: '💪', hidden: true, condition: { event: 'STREAK_RECOVERED' } },
  { id: 'polymath',         title: 'Polivalente',       description: 'Usar 5 abas diferentes do app em menos de 24 horas', xp: 80, icon: '🌐', hidden: true, condition: { event: 'SECTIONS_VISITED_24H', count: 5 } },
  { id: 'chat_marathoner',  title: 'Maratonista',       description: 'Enviar 30 mensagens para a Guardiã em um único dia', xp: 150, icon: '🏃', hidden: true, condition: { event: 'CHAT_MESSAGES_24H', count: 30 } },
  { id: 'forms_finished',   title: 'Formulários em Dia',description: 'Completar o formulário de saúde e o cardápio',     xp: 200, icon: '✅', hidden: true, condition: { event: 'HEALTH_AND_MENU_FORMS_COMPLETE' } },
  { id: 'iron_will',        title: 'Vontade de Ferro',  description: 'Fazer login 60 vezes no total',                   xp: 600, icon: '🛡️', hidden: true, condition: { event: 'TOTAL_LOGINS', count: 60 } },
  { id: 'gmp_legend',       title: 'Lenda 4D',          description: 'Acumular 5000 XP',                                xp: 1500, icon: '🌟', hidden: true, condition: { event: 'TOTAL_XP', count: 5000 } },
];

// ─────────────────────────────────────────────
// SECRETS — definir via: firebase functions:secrets:set N8N_BASE_URL
// ─────────────────────────────────────────────
const secretN8nBaseUrl = defineSecret('N8N_BASE_URL');
const secretN8nWebhookSecret = defineSecret('N8N_WEBHOOK_SECRET');

const REGION = 'southamerica-east1';
const SECRETS = [secretN8nBaseUrl, secretN8nWebhookSecret];

// Resolvidos em runtime (dentro das funções, não no topo do módulo)
function getN8nBaseUrl() {
  return secretN8nBaseUrl.value() || process.env.N8N_BASE_URL || 'https://SEU-N8N.cloud/webhook';
}
function getN8nWebhookSecret() {
  return secretN8nWebhookSecret.value() || process.env.N8N_WEBHOOK_SECRET || 'TROQUE-EM-PRODUCAO';
}
function getN8nHeaders() {
  return { 'Content-Type': 'application/json', 'X-Webhook-Secret': getN8nWebhookSecret() };
}

// ─────────────────────────────────────────────
// Structured logging helper
// ─────────────────────────────────────────────
function log(severity, message, data = {}) {
  const entry = { severity: severity.toUpperCase(), message, ...data, ts: new Date().toISOString() };
  if (severity === 'error') console.error(JSON.stringify(entry));
  else if (severity === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

// Helper: desbloqueia conquista (idempotente)
async function unlockAchievement(uid, achievementId) {
  if (!uid || !achievementId) return false;
  const achRef = db.collection('users').doc(uid).collection('achievements').doc(achievementId);
  const snap = await achRef.get();
  if (snap.exists) return false; // idempotente

  const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === achievementId);
  if (!achievement) {
    log('warn', `Achievement not found: ${achievementId}`);
    return false;
  }

  const batch = db.batch();
  batch.set(achRef, {
    achievementId,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    xp: achievement.xp,
    unlocked: true,
    claimed: false,
    xpAwarded: 0,
    seen: false,
    unlockedAt: FieldValue.serverTimestamp(),
  });

  const notifRef = db.collection('users').doc(uid).collection('notifications').doc();
  batch.set(notifRef, {
    title: `🏆 ${achievement.title}`,
    message: `${achievement.description} — Reivindique sua recompensa!`,
    type: 'achievement',
    priority: achievement.xp >= 500 ? 'high' : 'normal',
    channel: 'app',
    payload: { achievementId, xp: achievement.xp },
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  const paRef = db.collection('users').doc(uid).collection('pendingActions').doc();
  batch.set(paRef, {
    type: 'achievement_unlocked',
    achievementId,
    seen: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  log('info', `Achievement unlocked: ${achievementId} for user ${uid}`);
  return true;
}

// Helper: concede XP ao usuário (backend)
async function awardXp(uid, xpAmount, eventId = null) {
  if (!xpAmount || xpAmount <= 0) return;
  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const data = userSnap.exists ? userSnap.data() : {};
    const newXp = (data.xp || 0) + xpAmount;

    await userRef.set({ xp: newXp, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    if (eventId) {
      await db.collection('users').doc(uid).collection('xpLog').add({
        eventId,
        xpAwarded: xpAmount,
        totalXp: newXp,
        timestamp: FieldValue.serverTimestamp(),
      });
    }
  } catch (e) {
    log('error', 'awardXp error', { error: e.message });
  }
}

// Helper: garante que o usuário está autenticado
function requireAuth(auth) {
  if (!auth) throw new HttpsError('unauthenticated', 'Autenticação necessária');
}

// Helper: chama webhook n8n
async function callN8n(endpoint, payload) {
  const url = `${getN8nBaseUrl()}/${endpoint}`;
  const response = await axios.post(url, payload, { headers: getN8nHeaders(), timeout: 30000 });
  return response.data;
}

async function callN8nWithRetry(endpoint, payload, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      return await callN8n(endpoint, payload);
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries - 1) break;
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function verifyWebhookSecret(req) {
  const received = req.get('x-webhook-secret') || req.get('X-Webhook-Secret');
  if (!received || received !== getN8nWebhookSecret()) {
    throw new HttpsError('permission-denied', 'Webhook secret inválido');
  }
}

// ─────────────────────────────────────────────
// 1. PROCESSAR TRANSCRIÇÃO DO GOOGLE MEET
// ─────────────────────────────────────────────
exports.processOnboardingTranscript = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  requireAuth(request.auth);
  const uid = request.auth.uid;
  const { transcriptText, driveFileUrl } = request.data;

  if (!transcriptText) throw new HttpsError('invalid-argument', 'transcriptText é obrigatório');

  // Busca perfil do usuário para enviar contexto
  const userDoc = await db.doc(`users/${uid}`).get();
  const userProfile = userDoc.exists ? userDoc.data() : {};

  const payload = {
    uid,
    userProfile: {
      name: userProfile.name,
      email: userProfile.email,
    },
    transcriptText,
    driveFileUrl: driveFileUrl || null,
    callbackUrl: `${getN8nBaseUrl()}/4d-transcript-callback`,
  };

  try {
    const result = await callN8nWithRetry('4d-process-transcript', payload);

    // n8n retorna: { hasBloodTest: bool, extractedHealthData: {...}, status: string }
    const { hasBloodTest, extractedHealthData, suggestedStatus } = result;

    // Salva dados extraídos da entrevista
    await db.doc(`users/${uid}/onboardingInterview/data`).set({
      extractedHealthData: extractedHealthData || {},
      hasBloodTest: hasBloodTest || false,
      processedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Atualiza status do usuário
    const newStatus = suggestedStatus || (hasBloodTest ? 'pending_blood_test' : 'exam_request_sent');
    await db.doc(`users/${uid}`).update({
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, hasBloodTest, newStatus };
  } catch (error) {
    console.error('[Functions] processOnboardingTranscript error:', error.message);
    throw new HttpsError('internal', 'Erro ao processar transcrição');
  }
});

// ─────────────────────────────────────────────
// 2. PROCESSAR EXAME DE SANGUE
// ─────────────────────────────────────────────
exports.processBloodTest = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  requireAuth(request.auth);
  const uid = request.auth.uid;
  const { bloodTestId, driveFileUrl } = request.data;

  if (!driveFileUrl) throw new HttpsError('invalid-argument', 'driveFileUrl é obrigatório');

  // Busca dados da entrevista para contexto
  const interviewDoc = await db.doc(`users/${uid}/onboardingInterview/data`).get();
  const healthData = interviewDoc.exists ? interviewDoc.data().extractedHealthData : {};

  const payload = {
    uid,
    bloodTestId,
    driveFileUrl,
    existingHealthData: healthData,
    callbackUrl: `${getN8nBaseUrl()}/4d-blood-test-callback`,
  };

  try {
    // Atualiza status para "processando"
    await db.doc(`users/${uid}/bloodTests/${bloodTestId}`).update({
      status: 'processing',
      processingStartedAt: FieldValue.serverTimestamp(),
    });
    await db.doc(`users/${uid}`).update({ status: 'processing_blood_test' });

    // n8n processa de forma assíncrona via callback
    callN8n('4d-process-blood-test', payload).catch(e =>
      console.error('[Functions] n8n blood test async error:', e.message)
    );

    return { success: true, message: 'Processamento iniciado. Você será notificado quando concluir.' };
  } catch (error) {
    console.error('[Functions] processBloodTest error:', error.message);
    throw new HttpsError('internal', 'Erro ao iniciar processamento do exame');
  }
});

// ─────────────────────────────────────────────
// 3. GERAR PEDIDO DE EXAMES (sem exame disponível)
// ─────────────────────────────────────────────
exports.generateExamRequest = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  requireAuth(request.auth);
  const uid = request.auth.uid;

  // Busca dados da entrevista
  const interviewDoc = await db.doc(`users/${uid}/onboardingInterview/data`).get();
  const extractedData = interviewDoc.exists ? interviewDoc.data().extractedHealthData : {};
  const userDoc = await db.doc(`users/${uid}`).get();
  const userProfile = userDoc.exists ? userDoc.data() : {};

  const payload = {
    uid,
    clientData: {
      name: userProfile.name,
      age: userProfile.age,
      gender: userProfile.gender,
      diagnostics: extractedData.diagnostics || [],
      medications: extractedData.medications || [],
      ...extractedData,
    },
  };

  try {
    const result = await callN8nWithRetry('4d-generate-exam-request', payload);
    // result: { driveFileUrl: string, fileName: string }

    // Salva referência no Firestore
    await db.collection(`users/${uid}/examRequests`).add({
      fileUrl: result.driveFileUrl,
      fileName: result.fileName,
      preFilledData: payload.clientData,
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.doc(`users/${uid}`).update({
      status: 'exam_request_sent',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, fileUrl: result.driveFileUrl };
  } catch (error) {
    console.error('[Functions] generateExamRequest error:', error.message);
    throw new HttpsError('internal', 'Erro ao gerar pedido de exames');
  }
});

// ─────────────────────────────────────────────
// 4. AGENTE DE CHAT IA (função principal do app)
// ─────────────────────────────────────────────
exports.agentChatMessage = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  requireAuth(request.auth);
  const uid = request.auth.uid;
  const { message, sessionId } = request.data;

  if (!message?.trim()) throw new HttpsError('invalid-argument', 'Mensagem não pode estar vazia');

  // Monta contexto completo do usuário para o agente
  const [userDoc, healthFormDoc, menuFormDoc, interviewDoc] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`users/${uid}/healthForm/data`).get(),
    db.doc(`users/${uid}/menuForm/data`).get(),
    db.doc(`users/${uid}/onboardingInterview/data`).get(),
  ]);

  const userContext = {
    profile: userDoc.exists ? userDoc.data() : {},
    healthForm: healthFormDoc.exists ? healthFormDoc.data() : {},
    menuForm: menuFormDoc.exists ? menuFormDoc.data() : {},
    interview: interviewDoc.exists ? interviewDoc.data() : {},
  };

  const payload = {
    uid,
    sessionId: sessionId || `${uid}_${Date.now()}`,
    message,
    userContext,
  };

  try {
    const result = await callN8nWithRetry('4d-agent-chat', payload);
    // result: { reply: string, type: 'text'|'recipe', recipe?: Object, xpAwarded?: number }

    // Salva a resposta no Firestore
    await db.collection(`users/${uid}/chatHistory`).add({
      role: 'assistant',
      content: result.reply,
      type: result.type || 'text',
      recipe: result.recipe || null,
      conversationId: sessionId,
      processed: true,
      processingStatus: 'success',
      timestamp: FieldValue.serverTimestamp(),
    });

    // Se a IA gerou uma receita, salva na coleção de receitas
    if (result.type === 'recipe' && result.recipe) {
      await db.collection(`users/${uid}/recipes`).add({
        ...result.recipe,
        source: 'ai_chat',
        isFavorite: false,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Achievement checks for chat
    const chatSnap = await db.collection('users').doc(uid).collection('chatHistory').get();
    const chatCount = chatSnap.size;
    if (chatCount >= 10) await unlockAchievement(uid, 'conversationalist');

    // chat_marathoner: count messages in last 24h
    const yesterday = new Date(Date.now() - 86400000);
    const recentChats = await db.collection('users').doc(uid).collection('chatHistory')
      .where('timestamp', '>=', yesterday).get();
    if (recentChats.size >= 30) await unlockAchievement(uid, 'chat_marathoner');

    return { success: true, reply: result.reply, type: result.type, recipe: result.recipe };
  } catch (error) {
    console.error('[Functions] agentChatMessage error:', error.message);
    throw new HttpsError('internal', 'Erro ao processar mensagem');
  }
});

// ─────────────────────────────────────────────
// 5. GERAR RECEITA (chamada direta, sem chat)
// ─────────────────────────────────────────────
exports.generateRecipe = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  requireAuth(request.auth);
  const uid = request.auth.uid;
  const { preferences } = request.data;

  const [menuFormDoc, healthFormDoc, userDoc] = await Promise.all([
    db.doc(`users/${uid}/menuForm/data`).get(),
    db.doc(`users/${uid}/healthForm/data`).get(),
    db.doc(`users/${uid}`).get(),
  ]);

  const payload = {
    uid,
    preferences: preferences || {},
    userProfile: userDoc.exists ? userDoc.data() : {},
    menuForm: menuFormDoc.exists ? menuFormDoc.data() : {},
    healthForm: healthFormDoc.exists ? healthFormDoc.data() : {},
  };

  try {
    const result = await callN8nWithRetry('4d-generate-recipe', payload);

    const recipeRef = await db.collection(`users/${uid}/recipes`).add({
      ...result.recipe,
      source: 'direct_request',
      isFavorite: false,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Achievement checks for recipes
    const recipesSnap = await db.collection('users').doc(uid).collection('recipes').get();
    const totalRecipes = recipesSnap.size;
    if (totalRecipes >= 3) await unlockAchievement(uid, 'chef_formation');
    if (totalRecipes >= 10) await unlockAchievement(uid, 'chef_confirmed');

    return { success: true, recipeId: recipeRef.id, recipe: result.recipe };
  } catch (error) {
    console.error('[Functions] generateRecipe error:', error.message);
    throw new HttpsError('internal', 'Erro ao gerar receita');
  }
});

// ─────────────────────────────────────────────
// 5. REMOVER RECEITA
// ─────────────────────────────────────────────
exports.deleteRecipe = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  requireAuth(request.auth);
  const uid = request.auth.uid;
  const { recipeId } = request.data;

  if (!recipeId) throw new HttpsError('invalid-argument', 'recipeId é obrigatório');

  const recipeRef = db.doc(`users/${uid}/recipes/${recipeId}`);
  const recipeDoc = await recipeRef.get();

  if (!recipeDoc.exists) {
    throw new HttpsError('not-found', 'Receita não encontrada');
  }

  const recipeData = recipeDoc.data() || {};

  try {
    await callN8nWithRetry('4d-delete-recipe', {
      uid,
      recipeId,
      recipe: {
        id: recipeId,
        name: recipeData.nm || recipeData.name || '',
        source: recipeData.source || 'manual',
      },
    });

    await recipeRef.delete();

    await db.doc(`users/${uid}`).set({
      totalRecipes: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true, recipeId };
  } catch (error) {
    console.error('[Functions] deleteRecipe error:', error.message);
    throw new HttpsError('internal', 'Erro ao remover receita');
  }
});

// ─────────────────────────────────────────────
// 5b. CLAIM ACHIEVEMENT (award XP only when user claims)
// ─────────────────────────────────────────────
exports.claimAchievement = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login required');

  const { achievementId } = request.data || {};
  if (!achievementId) throw new HttpsError('invalid-argument', 'achievementId required');

  const achRef = db.collection('users').doc(uid).collection('achievements').doc(achievementId);
  const snap = await achRef.get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Achievement not unlocked yet');

  const data = snap.data();
  if (data.claimed) return { success: false, reason: 'already_claimed' };

  const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === achievementId);
  if (!achievement) throw new HttpsError('not-found', 'Achievement not in catalog');

  await achRef.update({
    claimed: true,
    claimedAt: FieldValue.serverTimestamp(),
    xpAwarded: achievement.xp,
  });

  if (achievement.xp > 0) {
    try {
      await awardXp(uid, achievement.xp, `claim_${achievementId}`);
    } catch (e) {
      log('error', 'awardXp on claim failed', { error: e.message });
    }
  }

  return { success: true, xpAwarded: achievement.xp };
});

// ─────────────────────────────────────────────
// 6. AVALIADOR DE ALIMENTOS
// ─────────────────────────────────────────────
exports.evaluateFood = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  requireAuth(request.auth);
  const uid = request.auth.uid;
  const { foodName, quantity } = request.data;

  if (!foodName) throw new HttpsError('invalid-argument', 'foodName é obrigatório');

  const healthFormDoc = await db.doc(`users/${uid}/healthForm/data`).get();
  const userDoc = await db.doc(`users/${uid}`).get();

  const payload = {
    uid,
    foodName,
    quantity: quantity || null,
    userDiagnostics: healthFormDoc.exists ? (healthFormDoc.data().diagnostics || []) : [],
    userMedications: healthFormDoc.exists ? (healthFormDoc.data().medications || []) : [],
    userProfile: userDoc.exists ? userDoc.data() : {},
  };

  try {
    const result = await callN8nWithRetry('4d-evaluate-food', payload);

    // Achievement checks for food evaluations
    const foodSnap = await db.collection('users').doc(uid).collection('foodEvaluations').get();
    const totalEvals = foodSnap.size;
    if (totalEvals >= 5) await unlockAchievement(uid, 'explorer');
    // food_explorer_pro: count unique foods evaluated
    const uniqueFoods = new Set(foodSnap.docs.map(d => d.data().foodName || d.data().name)).size;
    if (uniqueFoods >= 25) await unlockAchievement(uid, 'food_explorer_pro');

    return { success: true, evaluation: result.evaluation };
  } catch (error) {
    console.error('[Functions] evaluateFood error:', error.message);
    throw new HttpsError('internal', 'Erro ao avaliar alimento');
  }
});

// ─────────────────────────────────────────────
// 7. DOWNLOAD PDF DE PEDIDO DE EXAME
// ─────────────────────────────────────────────
exports.downloadExamPdf = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login necessário');

  const { examRequestId } = request.data || {};
  if (!examRequestId) throw new HttpsError('invalid-argument', 'examRequestId obrigatório');

  const examRef = db.doc(`users/${uid}/examRequests/${examRequestId}`);
  const examDoc = await examRef.get();
  if (!examDoc.exists) throw new HttpsError('not-found', 'Pedido de exame não encontrado');

  const data = examDoc.data() || {};
  if (!data.driveFileUrl) throw new HttpsError('not-found', 'PDF ainda não foi gerado para este pedido');

  return { fileUrl: data.driveFileUrl, fileName: data.fileName || 'pedido_exame.pdf' };
});

// ─────────────────────────────────────────────
// 8. CALLBACKS HTTP (n8n -> Firebase)
// ─────────────────────────────────────────────
exports.onTranscriptCallback = onRequest({ region: REGION, secrets: SECRETS }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', getN8nBaseUrl().replace(/\/webhook.*$/, ''));
  res.set('Access-Control-Allow-Methods', 'POST');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'method-not-allowed' });
      return;
    }
    verifyWebhookSecret(req);

    const {
      uid,
      hasBloodTest = false,
      extractedHealthData = {},
      suggestedStatus,
      meetingId,
      transcriptUrl,
    } = req.body || {};

    if (!uid) {
      res.status(400).json({ success: false, error: 'uid-obrigatorio' });
      return;
    }

    const newStatus = suggestedStatus || (hasBloodTest ? 'pending_blood_test' : 'exam_request_sent');

    await db.doc(`users/${uid}/onboardingInterview/data`).set({
      extractedHealthData,
      hasBloodTest,
      processedAt: FieldValue.serverTimestamp(),
      source: 'n8n_callback',
    }, { merge: true });

    if (meetingId) {
      await db.doc(`users/${uid}/meetings/${meetingId}`).set({
        transcriptUrl: transcriptUrl || null,
        analyzedAt: FieldValue.serverTimestamp(),
        hasBloodTest,
        extractedData: extractedHealthData,
        status: 'processed',
      }, { merge: true });
    }

    await db.doc(`users/${uid}`).set({
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await db.collection(`users/${uid}/pendingActions`).add({
      type: 'meeting_analyzed',
      seen: false,
      message: 'Reunião analisada! Seus dados foram pré-preenchidos.',
      payload: { hasBloodTest, nextStatus: newStatus },
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, status: newStatus });
  } catch (error) {
    console.error('[Functions] onTranscriptCallback error:', error.message || error);
    if (error instanceof HttpsError) {
      res.status(403).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({ success: false, error: 'internal-error' });
  }
});

exports.onBloodTestCallback = onRequest({ region: REGION, secrets: SECRETS }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', getN8nBaseUrl().replace(/\/webhook.*$/, ''));
  res.set('Access-Control-Allow-Methods', 'POST');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'method-not-allowed' });
      return;
    }
    verifyWebhookSecret(req);

    const {
      uid,
      bloodTestId,
      extractedData = {},
      processingStatus = 'done',
      summary = null,
    } = req.body || {};

    if (!uid || !bloodTestId) {
      res.status(400).json({ success: false, error: 'uid-e-bloodTestId-obrigatorios' });
      return;
    }

    await db.doc(`users/${uid}/bloodTests/${bloodTestId}`).set({
      extractedData,
      status: processingStatus,
      summary,
      processedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await db.doc(`users/${uid}`).set({
      status: 'filling_health_form',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await db.collection(`users/${uid}/pendingActions`).add({
      type: 'blood_test_processed',
      seen: false,
      message: 'Exame processado! Você já pode revisar e confirmar seus dados.',
      payload: { bloodTestId },
      createdAt: FieldValue.serverTimestamp(),
    });

    // scientist: first blood test uploaded/processed
    const bloodSnap = await db.collection('users').doc(uid).collection('bloodTests').get();
    if (bloodSnap.size <= 1) await unlockAchievement(uid, 'scientist');

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Functions] onBloodTestCallback error:', error.message || error);
    if (error instanceof HttpsError) {
      res.status(403).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({ success: false, error: 'internal-error' });
  }
});

// ─────────────────────────────────────────────
// TRIGGERS AUTOMÁTICOS DO FIRESTORE
// ─────────────────────────────────────────────

/**
 * Quando um exame de sangue é criado, notifica o n8n automaticamente.
 * Isso complementa o fluxo manual via processBloodTest().
 */
const STATUS_NOTIFICATION_MAP = {
  awaiting_onboarding: {
    title: 'Seu onboarding está aguardando',
    message: 'Quando sua reunião de onboarding acontecer, vamos começar a personalizar seu programa.',
    type: 'status_update',
  },
  pending_blood_test: {
    title: 'Envio do exame necessário',
    message: 'Sua Guardiã identificou que precisamos do seu exame de sangue para seguir com o pré-preenchimento.',
    type: 'status_update',
  },
  processing_blood_test: {
    title: 'Seu exame está em processamento',
    message: 'Recebemos seu exame e estamos analisando os resultados para atualizar seus formulários.',
    type: 'processing',
  },
  exam_request_sent: {
    title: 'Pedido de exames enviado',
    message: 'Seu pedido de exames já foi preparado e está disponível para acompanhamento pela equipe.',
    type: 'status_update',
  },
  filling_health_form: {
    title: 'Formulário de saúde pronto',
    message: 'O formulário de saúde foi pré-preenchido com os dados do exame. Falta pouco para finalizar.',
    type: 'action_required',
  },
  awaiting_menu_form: {
    title: 'Aguardando o cardápio',
    message: 'Seu próximo formulário será liberado no momento certo. Continue acompanhando o app.',
    type: 'status_update',
  },
  filling_menu_form: {
    title: 'Formulário de cardápio liberado',
    message: 'Já é possível responder ao formulário de cardápio e ajustar sua rotina alimentar.',
    type: 'action_required',
  },
  active: {
    title: 'Seu programa está ativo',
    message: 'Tudo pronto. Você já pode seguir com o acompanhamento completo no dashboard.',
    type: 'success',
  },
};

async function sendWhatsAppNotification(uid, profile, notification, metadata = {}) {
  const payload = {
    uid,
    patient: {
      uid,
      name: profile?.name || null,
      phone: profile?.phone || profile?.whatsapp || null,
      email: profile?.email || null,
      status: profile?.status || null,
    },
    notification: {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority || 'normal',
      metadata,
    },
    timestamp: new Date().toISOString(),
  };

  const result = await callN8n('4d-send-whatsapp-notification', payload);

  await db.collection(`users/${uid}/notifications`).add({
    channel: 'whatsapp',
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority || 'normal',
    status: 'sent',
    providerResponse: result || null,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  });

  return result;
}

exports.sendPatientNotification = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  requireAuth(request.auth);
  const uid = request.auth.uid;
  const { title, message, type = 'manual', priority = 'normal', metadata = {} } = request.data || {};

  if (!message?.trim()) {
    throw new HttpsError('invalid-argument', 'message é obrigatório');
  }

  const userDoc = await db.doc(`users/${uid}`).get();
  const profile = userDoc.exists ? userDoc.data() : {};

  const result = await sendWhatsAppNotification(uid, profile, { title: title || 'Atualização do Programa 4D', message, type, priority }, metadata);
  return { success: true, result };
});

exports.onBloodTestCreated = onDocumentCreated(
  { document: 'users/{uid}/bloodTests/{testId}', region: REGION },
  async (event) => {
    const { uid, testId } = event.params;
    const data = event.data.data();

    if (data.driveFileUrl) {
      const payload = {
        uid,
        bloodTestId: testId,
        driveFileUrl: data.driveFileUrl,
        callbackUrl: `${getN8nBaseUrl()}/4d-blood-test-callback`,
      };

      try {
        await callN8n('4d-process-blood-test', payload);
      } catch (e) {
        console.error('[Trigger] onBloodTestCreated n8n error:', e.message);
      }
    }
  }
);

exports.onUserStatusUpdated = onDocumentUpdated(
  { document: 'users/{uid}', region: REGION },
  async (event) => {
    const before = event.data.before.data() || {};
    const after = event.data.after.data() || {};
    const uid = event.params.uid;

    if (!before || !after || before.status === after.status) {
      return;
    }

    const notification = STATUS_NOTIFICATION_MAP[after.status];
    if (!notification) {
      return;
    }

    const profile = { ...after, status: after.status };
    await sendWhatsAppNotification(uid, profile, notification, {
      statusFrom: before.status || null,
      statusTo: after.status,
      source: 'firestore_status_trigger',
    });

    // Check level-based and XP-based achievements on any user doc update
    const level = after.level || 1;
    if (level >= 5) await unlockAchievement(uid, 'gmp_master');
    const totalXp = after.xp || 0;
    if (totalXp >= 5000) await unlockAchievement(uid, 'gmp_legend');
  }
);

// ─────────────────────────────────────────────
// Scheduled: Atualiza ranking global diariamente
// ─────────────────────────────────────────────
exports.updateGlobalRanking = onSchedule(
  { schedule: 'every 24 hours', region: REGION, timeZone: 'America/Sao_Paulo' },
  async () => {
    const snapshot = await db.collection('users')
      .orderBy('xp', 'desc')
      .limit(100)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      const ref = db.doc(`globalRanking/${doc.id}`);
      batch.set(ref, {
        uid: doc.id,
        position: i + 1,
        name: data.name || 'Usuária',
        avatar: data.avatar || '🌸',
        avatarColor: data.avatarColor || '#f0059a',
        xp: data.xp || 0,
        streak: data.streak || 0,
        level: data.level || 1,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    await batch.commit();
    console.log(`[Ranking] Updated global ranking with ${snapshot.size} users`);
  }
);

// ─────────────────────────────────────────────
// recordSectionVisit — registra visita a uma aba do dashboard
// ─────────────────────────────────────────────
exports.recordSectionVisit = onCall({ region: REGION, secrets: SECRETS }, async (request) => {
  const { uid, sectionId } = request.data;
  if (!uid || !sectionId) throw new HttpsError('invalid-argument', 'uid and sectionId required');

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ref = db.collection('users').doc(uid).collection('sectionVisits').doc(today);

  await ref.set({
    sections: FieldValue.arrayUnion(sectionId),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Check polymath: 5 unique sections in one day
  const snap = await ref.get();
  const sections = snap.data()?.sections || [];
  const uniqueSections = new Set(sections).size;
  if (uniqueSections >= 5) await unlockAchievement(uid, 'polymath');

  return { recorded: true };
});

// ─────────────────────────────────────────────
// evaluateTimeBasedAchievements — scheduled daily
// ─────────────────────────────────────────────
exports.evaluateTimeBasedAchievements = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'America/Sao_Paulo', region: REGION, secrets: SECRETS },
  async () => {
    log('info', 'Running evaluateTimeBasedAchievements');
    const usersSnap = await db.collection('users').limit(500).get();

    const tasks = usersSnap.docs.map(async (userDoc) => {
      const uid = userDoc.id;
      const data = userDoc.data();

      try {
        // veteran: 90 days of account
        if (data.createdAt) {
          const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          const ageDays = (Date.now() - created.getTime()) / 86400000;
          if (ageDays >= 90) await unlockAchievement(uid, 'veteran');
        }

        // iron_will: 60 total logins
        const totalLogins = data.totalLogins || 0;
        if (totalLogins >= 60) await unlockAchievement(uid, 'iron_will');

        // gmp_legend: 5000+ XP
        const totalXp = data.xp || 0;
        if (totalXp >= 5000) await unlockAchievement(uid, 'gmp_legend');

        // gmp_master: level 5+
        const level = data.level || 1;
        if (level >= 5) await unlockAchievement(uid, 'gmp_master');

      } catch (e) {
        log('error', `evaluateTimeBasedAchievements failed for ${uid}`, { error: e.message });
      }
    });

    await Promise.allSettled(tasks);
    log('info', `evaluateTimeBasedAchievements done for ${usersSnap.size} users`);
  }
);
