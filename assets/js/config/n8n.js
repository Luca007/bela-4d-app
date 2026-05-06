// N8N Endpoints & Payload Builders — Programa 4D
// Centraliza URLs e tipos de payloads para n8n webhooks

export const N8N_ENDPOINTS = {
  // Process Onboarding Transcript
  PROCESS_TRANSCRIPT: '/webhook/4d-process-transcript',
  
  // Process Blood Test
  PROCESS_BLOOD_TEST: '/webhook/4d-process-blood-test',
  
  // Generate Exam Request for doctor
  GENERATE_EXAM_REQUEST: '/webhook/4d-generate-exam-request',
  
  // Chat with AI guardiã
  CHAT_MESSAGE: '/webhook/4d-chat-message',
  
  // Generate Recipe
  GENERATE_RECIPE: '/webhook/4d-generate-recipe',
  
  // Classify Food
  CLASSIFY_FOOD: '/webhook/4d-classify-food',
  
  // Update Ranking (cron job)
  UPDATE_RANKING: '/webhook/4d-update-ranking',
};

/**
 * Process Onboarding Transcript Payload
 * Enviado após Google Meet recording
 * Retorna: extractedHealthData + suggestedStatus
 */
export function buildTranscriptPayload(uid, userProfile, transcriptText, driveFileUrl) {
  return {
    uid,
    userProfile: {
      name: userProfile.name,
      email: userProfile.email,
      uid: userProfile.uid,
    },
    transcriptText,
    driveFileUrl,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process Blood Test Payload
 * Enviado quando user faz upload do exame
 * Retorna: extractedValues (glicose, HbA1c, etc)
 */
export function buildBloodTestPayload(uid, bloodTestId, fileUrl, examType = 'blood_test') {
  return {
    uid,
    bloodTestId,
    fileUrl,
    examType,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate Exam Request Payload
 * Enviado quando não há exame recente (baseado em transcrição)
 * Retorna: PDF URL do pedido gerado
 */
export function buildExamRequestPayload(uid, userProfile, extractedHealthData, diagnostics) {
  return {
    uid,
    userProfile,
    extractedHealthData,
    diagnostics,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Chat Message Payload
 * Enviado para agente IA guardiã
 * Contexto: perfil, forms, exame, histórico de chat
 */
export function buildChatPayload(uid, userMessage, sessionId, context = {}) {
  return {
    uid,
    message: userMessage,
    sessionId,
    context: {
      profile: context.profile || null,
      healthForm: context.healthForm || null,
      latestBloodTest: context.latestBloodTest || null,
      chatHistory: context.chatHistory || [],
      generatedRecipes: context.generatedRecipes || [],
      ...context,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate Recipe Payload
 * Enviado para gerar receita personalizada
 * Retorna: recipe object com title, ingredients, macros, steps
 */
export function buildRecipePayload(uid, preferences = {}) {
  return {
    uid,
    preferences: {
      dietaryRestrictions: preferences.dietaryRestrictions || [],
      timeLimit: preferences.timeLimit || 30, // minutos
      servings: preferences.servings || 1,
      mealType: preferences.mealType || 'any', // breakfast, lunch, dinner, snack
      ...preferences,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Classify Food Payload
 * Enviado para classificar um alimento
 * Retorna: color (green/yellow/red), macros, compatibility
 */
export function buildFoodClassifyPayload(uid, foodName, quantity = '100g', userDiagnostics = []) {
  return {
    uid,
    foodName,
    quantity,
    userDiagnostics,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Update Ranking Payload
 * Enviado periodicamente (daily cron)
 * Recalcula e atualiza ranking global
 */
export function buildRankingPayload() {
  return {
    action: 'update_ranking',
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────
// Response Type Interfaces (para TypeScript/JSDoc)
// ─────────────────────────────────────

/**
 * @typedef {Object} TranscriptResponse
 * @property {boolean} hasBloodTest - Se mencionou exame recente
 * @property {string} suggestedStatus - Próximo status do usuário
 * @property {Object} extractedHealthData - Dados de saúde extraídos
 * @property {Object} interviewSummary - Contexto emocional/motivação
 */

/**
 * @typedef {Object} BloodTestResponse
 * @property {Object} extractedValues - glicose, HbA1c, etc
 * @property {Object} analysis - Interpretação e alertas
 * @property {string} fileStorageUrl - URL do PDF processado
 */

/**
 * @typedef {Object} ChatResponse
 * @property {string} message - Resposta da IA guardiã
 * @property {number} xpAwarded - XP ganho pela interação
 * @property {Array} suggestions - Receitas ou alimentos sugeridos
 */

/**
 * @typedef {Object} RecipeResponse
 * @property {string} title - Nome da receita
 * @property {Array} ingredients - [{ name, quantity, unit }, ...]
 * @property {Object} macros - { protein, carbs, fat, calories }
 * @property {Array} steps - Modo de preparo
 * @property {number} prepTimeMin - Tempo de preparo
 * @property {string} difficulty - easy, medium, hard
 */
