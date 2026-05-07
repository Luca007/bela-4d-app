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

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');

initializeApp();
const db = getFirestore();

// ─────────────────────────────────────────────
// CONFIGURAÇÃO (usar Firebase Secrets em produção)
// firebase functions:secrets:set N8N_BASE_URL
// ─────────────────────────────────────────────
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://SEU-N8N.cloud/webhook';
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'TROQUE-EM-PRODUCAO';

const REGION = 'southamerica-east1';

const n8nHeaders = {
  'Content-Type': 'application/json',
  'X-Webhook-Secret': N8N_WEBHOOK_SECRET,
};

// Helper: garante que o usuário está autenticado
function requireAuth(auth) {
  if (!auth) throw new HttpsError('unauthenticated', 'Autenticação necessária');
}

// Helper: chama webhook n8n
async function callN8n(endpoint, payload) {
  const url = `${N8N_BASE_URL}/${endpoint}`;
  const response = await axios.post(url, payload, { headers: n8nHeaders, timeout: 30000 });
  return response.data;
}

// ─────────────────────────────────────────────
// 1. PROCESSAR TRANSCRIÇÃO DO GOOGLE MEET
// ─────────────────────────────────────────────
exports.processOnboardingTranscript = onCall({ region: REGION }, async (request) => {
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
    callbackUrl: `${N8N_BASE_URL}/4d-transcript-callback`,
  };

  try {
    const result = await callN8n('4d-process-transcript', payload);

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
exports.processBloodTest = onCall({ region: REGION }, async (request) => {
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
    callbackUrl: `${N8N_BASE_URL}/4d-blood-test-callback`,
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
exports.generateExamRequest = onCall({ region: REGION }, async (request) => {
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
    const result = await callN8n('4d-generate-exam-request', payload);
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
exports.agentChatMessage = onCall({ region: REGION }, async (request) => {
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
    const result = await callN8n('4d-agent-chat', payload);
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

    return { success: true, reply: result.reply, type: result.type, recipe: result.recipe };
  } catch (error) {
    console.error('[Functions] agentChatMessage error:', error.message);
    throw new HttpsError('internal', 'Erro ao processar mensagem');
  }
});

// ─────────────────────────────────────────────
// 5. GERAR RECEITA (chamada direta, sem chat)
// ─────────────────────────────────────────────
exports.generateRecipe = onCall({ region: REGION }, async (request) => {
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
    const result = await callN8n('4d-generate-recipe', payload);

    const recipeRef = await db.collection(`users/${uid}/recipes`).add({
      ...result.recipe,
      source: 'direct_request',
      isFavorite: false,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, recipeId: recipeRef.id, recipe: result.recipe };
  } catch (error) {
    console.error('[Functions] generateRecipe error:', error.message);
    throw new HttpsError('internal', 'Erro ao gerar receita');
  }
});

// ─────────────────────────────────────────────
// 5. REMOVER RECEITA
// ─────────────────────────────────────────────
exports.deleteRecipe = onCall({ region: REGION }, async (request) => {
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
    await callN8n('4d-delete-recipe', {
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
// 6. AVALIADOR DE ALIMENTOS
// ─────────────────────────────────────────────
exports.evaluateFood = onCall({ region: REGION }, async (request) => {
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
    const result = await callN8n('4d-evaluate-food', payload);
    return { success: true, evaluation: result.evaluation };
  } catch (error) {
    console.error('[Functions] evaluateFood error:', error.message);
    throw new HttpsError('internal', 'Erro ao avaliar alimento');
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

exports.sendPatientNotification = onCall({ region: REGION }, async (request) => {
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
        callbackUrl: `${N8N_BASE_URL}/4d-blood-test-callback`,
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
  }
);
