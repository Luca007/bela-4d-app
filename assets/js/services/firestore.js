/**
 * Firestore Service — Programa 4D
 *
 * Schema de coleções:
 *   users/{uid}                    → perfil + status + gamificação
 *   users/{uid}/healthForm/data    → Formulário de Saúde (Form 1)
 *   users/{uid}/onboardingInterview/data → dados extraídos da reunião (interno)
 *   users/{uid}/menuForm/data      → Formulário Pré-Cardápio (Form 3)
 *   users/{uid}/bloodTests/{id}    → exames de sangue enviados + dados extraídos
 *   users/{uid}/examRequests/{id}  → pedidos de exame gerados para o médico
 *   users/{uid}/chatHistory/{id}   → histórico do agente de IA
 *   users/{uid}/recipes/{id}       → receitas personalizadas geradas
 *   users/{uid}/achievements/{id}  → conquistas desbloqueadas
 *   users/{uid}/examTracking/{id}  → exames de acompanhamento (HbA1c, glicemia etc.)
 */

import { getFirestore } from '../config/firebase.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

import { LEVELS, ACHIEVEMENTS_CATALOG, XP_EVENTS } from '../config/constants.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getLevelForXp(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

function xpToNextLevel(xp) {
  const current = getLevelForXp(xp);
  if (!current.maxXp) return null; // nível máximo
  return current.maxXp - xp + 1;
}

// ─────────────────────────────────────────────
// FirestoreService
// ─────────────────────────────────────────────

export class FirestoreService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    try {
      this.db = getFirestore();
      this.initialized = true;
    } catch (error) {
      console.error('[Firestore] Error initializing:', error);
    }
  }

  getDb() {
    if (!this.db) this.db = getFirestore();
    return this.db;
  }

  // Refs helpers
  userRef(uid)                   { return doc(this.getDb(), 'users', uid); }
  subCol(uid, name)              { return collection(this.getDb(), 'users', uid, name); }
  subDoc(uid, name, docId)       { return doc(this.getDb(), 'users', uid, name, docId); }

  // ─────────────────────────────────────────────
  // PERFIL DO USUÁRIO
  // ─────────────────────────────────────────────

  async getUserProfile(uid) {
    try {
      const snap = await getDoc(this.userRef(uid));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error('[Firestore] getUserProfile:', e);
      return null;
    }
  }

  async saveUserProfile(uid, data) {
    try {
      const toSave = { ...data, updatedAt: serverTimestamp() };
      const existing = await getDoc(this.userRef(uid));
      if (!existing.exists()) {
        toSave.createdAt = serverTimestamp();
        // Gamificação inicial
        toSave.xp = 0;
        toSave.level = 1;
        toSave.streak = 0;
        toSave.lastActivityDate = null;
        toSave.totalRecipes = 0;
        toSave.totalChatMessages = 0;
        toSave.status = 'awaiting_onboarding';
      }
      await setDoc(this.userRef(uid), toSave, { merge: true });
      return true;
    } catch (e) {
      console.error('[Firestore] saveUserProfile:', e);
      return false;
    }
  }

  /** Atualiza só o status do usuário */
  async updateUserStatus(uid, status) {
    try {
      await updateDoc(this.userRef(uid), { status, updatedAt: serverTimestamp() });
      return true;
    } catch (e) {
      console.error('[Firestore] updateUserStatus:', e);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // FORMULÁRIO DE SAÚDE — Form 1
  // ─────────────────────────────────────────────

  async getHealthForm(uid) {
    try {
      const snap = await getDoc(this.subDoc(uid, 'healthForm', 'data'));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error('[Firestore] getHealthForm:', e);
      return null;
    }
  }

  /**
   * Salva o Formulário de Saúde.
   * @param {string} uid
   * @param {Object} formData  — dados do formulário
   * @param {boolean} aiPrefilled — se foi pré-preenchido pela IA
   * @param {boolean} completed   — se o usuário confirmou/completou
   */
  async saveHealthForm(uid, formData, { aiPrefilled = false, completed = false } = {}) {
    try {
      const ref = this.subDoc(uid, 'healthForm', 'data');
      const existing = await getDoc(ref);
      const toSave = {
        ...formData,
        aiPrefilled,
        completed,
        updatedAt: serverTimestamp(),
      };
      if (!existing.exists()) toSave.createdAt = serverTimestamp();
      await setDoc(ref, toSave, { merge: true });

      if (completed) {
        await this.updateUserStatus(uid, 'awaiting_menu_form');
        await this.awardXp(uid, XP_EVENTS.HEALTH_FORM_COMPLETED, 'health_form_done');
      }
      return true;
    } catch (e) {
      console.error('[Firestore] saveHealthForm:', e);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // ENTREVISTA DE ONBOARDING (interno — Guardiã)
  // Dados extraídos pelo n8n da transcrição do Google Meet
  // ─────────────────────────────────────────────

  async getOnboardingInterview(uid) {
    try {
      const snap = await getDoc(this.subDoc(uid, 'onboardingInterview', 'data'));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error('[Firestore] getOnboardingInterview:', e);
      return null;
    }
  }

  async saveOnboardingInterview(uid, data) {
    try {
      const ref = this.subDoc(uid, 'onboardingInterview', 'data');
      await setDoc(ref, {
        ...data,
        processedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (e) {
      console.error('[Firestore] saveOnboardingInterview:', e);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // FORMULÁRIO PRÉ-CARDÁPIO — Form 3 (semana 3)
  // ─────────────────────────────────────────────

  async getMenuForm(uid) {
    try {
      const snap = await getDoc(this.subDoc(uid, 'menuForm', 'data'));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error('[Firestore] getMenuForm:', e);
      return null;
    }
  }

  async saveMenuForm(uid, formData, completed = false) {
    try {
      const ref = this.subDoc(uid, 'menuForm', 'data');
      const existing = await getDoc(ref);
      const toSave = { ...formData, completed, updatedAt: serverTimestamp() };
      if (!existing.exists()) toSave.createdAt = serverTimestamp();
      await setDoc(ref, toSave, { merge: true });

      if (completed) {
        await this.updateUserStatus(uid, 'active');
        await this.awardXp(uid, XP_EVENTS.MENU_FORM_COMPLETED, 'menu_form_done');
      }
      return true;
    } catch (e) {
      console.error('[Firestore] saveMenuForm:', e);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // EXAMES DE SANGUE
  // ─────────────────────────────────────────────

  async saveBloodTest(uid, { fileUrl, fileName, fileSize, extractedData = null, status = 'pending' }) {
    try {
      const ref = await addDoc(this.subCol(uid, 'bloodTests'), {
        fileUrl,
        fileName,
        fileSize,
        extractedData,   // null até o n8n processar
        status,          // pending | processing | done | error
        uploadedAt: serverTimestamp(),
        processedAt: null,
      });

      // Atualiza status do usuário para "processando"
      await this.updateUserStatus(uid, 'processing_blood_test');
      await this.awardXp(uid, XP_EVENTS.BLOOD_TEST_UPLOADED, 'blood_test_uploaded');

      return ref.id;
    } catch (e) {
      console.error('[Firestore] saveBloodTest:', e);
      return null;
    }
  }

  /** Chamado pelo n8n após processar o exame */
  async updateBloodTestExtraction(uid, bloodTestId, extractedData) {
    try {
      await updateDoc(this.subDoc(uid, 'bloodTests', bloodTestId), {
        extractedData,
        status: 'done',
        processedAt: serverTimestamp(),
      });
      // Avança para preenchimento do Form 1
      await this.updateUserStatus(uid, 'filling_health_form');
      return true;
    } catch (e) {
      console.error('[Firestore] updateBloodTestExtraction:', e);
      return false;
    }
  }

  async getLatestBloodTest(uid) {
    try {
      const q = query(this.subCol(uid, 'bloodTests'), orderBy('uploadedAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    } catch (e) {
      console.error('[Firestore] getLatestBloodTest:', e);
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // PEDIDOS DE EXAME (gerados quando não tem exame)
  // ─────────────────────────────────────────────

  async saveExamRequest(uid, { fileUrl, fileName, preFilledData }) {
    try {
      const ref = await addDoc(this.subCol(uid, 'examRequests'), {
        fileUrl,
        fileName,
        preFilledData,
        createdAt: serverTimestamp(),
      });
      await this.updateUserStatus(uid, 'exam_request_sent');
      return ref.id;
    } catch (e) {
      console.error('[Firestore] saveExamRequest:', e);
      return null;
    }
  }

  async getLatestExamRequest(uid) {
    try {
      const q = query(this.subCol(uid, 'examRequests'), orderBy('createdAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    } catch (e) {
      console.error('[Firestore] getLatestExamRequest:', e);
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // CHAT IA
  // ─────────────────────────────────────────────

  async saveChatMessage(uid, { role, content, type = 'text', conversationId = null }) {
    try {
      const ref = await addDoc(this.subCol(uid, 'chatHistory'), {
        role,          // 'user' | 'assistant'
        content,
        type,          // 'text' | 'recipe' | 'advice'
        conversationId,
        processed: false,
        processingStatus: 'pending',
        timestamp: serverTimestamp(),
      });

      // Gamificação por interação com IA
      if (role === 'user') {
        await this.incrementCounter(uid, 'totalChatMessages');
        const profile = await this.getUserProfile(uid);
        const total = (profile?.totalChatMessages ?? 0) + 1;
        if (total === 10)  await this.awardXp(uid, XP_EVENTS.CHAT_MESSAGE_SENT * 10, 'chat_10');
        if (total === 50)  await this.awardXp(uid, XP_EVENTS.CHAT_MESSAGE_SENT * 20, 'chat_50');
        else               await this.awardXp(uid, XP_EVENTS.CHAT_MESSAGE_SENT);
      }

      return ref.id;
    } catch (e) {
      console.error('[Firestore] saveChatMessage:', e);
      return null;
    }
  }

  async getChatHistory(uid, maxMessages = 50) {
    try {
      const q = query(
        this.subCol(uid, 'chatHistory'),
        orderBy('timestamp', 'desc'),
        limit(maxMessages)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    } catch (error) {
      console.error('[FirestoreService] getChatHistory error:', error);
      return [];
    }
  }

  /**
   * Real-time listener para chat history
   * @param {string} uid
   * @param {Function} callback — chamado com array de mensagens quando muda
   * @returns {Function} unsubscriber
   */
  onChatHistoryUpdate(uid, callback) {
    try {
      const q = query(
        this.subCol(uid, 'chatHistory'),
        orderBy('timestamp', 'asc')
      );
      return onSnapshot(q, (snap) => {
        const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(messages);
      });
    } catch (error) {
      console.error('[FirestoreService] onChatHistoryUpdate:', error);
      return () => {}; // noop unsubscriber
    }
  }

  /**
   * Real-time listener para receitas do usuário.
   * Compatibilidade com telas que usam onRecipesChange.
   */
  onRecipesChange(uid, callback) {
    try {
      const q = query(this.subCol(uid, 'recipes'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        const recipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(recipes);
      });
    } catch (error) {
      console.error('[FirestoreService] onRecipesChange:', error);
      return () => {};
    }
  }

  /**
   * Real-time listener para conquistas do usuário.
   * Compatibilidade com telas que usam onAchievementsChange.
   */
  onAchievementsChange(uid, callback) {
    try {
      const q = query(this.subCol(uid, 'achievements'), orderBy('unlockedAt', 'desc'));
      return onSnapshot(q, (snap) => {
        const achievements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(achievements);
      });
    } catch (error) {
      console.error('[FirestoreService] onAchievementsChange:', error);
      return () => {};
    }
  }

  /**
   * Alias de compatibilidade para histórico do chat em tempo real.
   */
  onChatHistoryChange(uid, callback) {
    return this.onChatHistoryUpdate(uid, callback);
  }

  /**
   * Real-time listener para mudanças do perfil/status do usuário.
   * Compatibilidade com App._watchUserStatus.
   */
  onUserStatusChange(uid, callback) {
    try {
      return onSnapshot(this.userRef(uid), (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        callback(data.status, data);
      });
    } catch (error) {
      console.error('[FirestoreService] onUserStatusChange:', error);
      return () => {};
    }
  }

  /**
   * Real-time listener para notificações do usuário.
   */
  onNotificationsChange(uid, callback) {
    try {
      const q = query(this.subCol(uid, 'notifications'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(notifications);
      });
    } catch (error) {
      console.error('[FirestoreService] onNotificationsChange:', error);
      return () => {};
    }
  }

  /**
   * Real-time listener para ações pendentes geradas pela equipe/IA.
   */
  onPendingActionsChange(uid, callback) {
    try {
      const q = query(
        this.subCol(uid, 'pendingActions'),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snap) => {
        const actions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(actions);
      });
    } catch (error) {
      console.error('[FirestoreService] onPendingActionsChange:', error);
      return () => {};
    }
  }

  // ─────────────────────────────────────────────
  // RECEITAS
  // ─────────────────────────────────────────────

  async getAllRecipes(uid) {
    try {
      const q = query(this.subCol(uid, 'recipes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('[Firestore] getAllRecipes:', e);
      return [];
    }
  }

  async saveRecipe(uid, recipeData) {
    try {
      const ref = await addDoc(this.subCol(uid, 'recipes'), {
        ...recipeData,
        createdAt: serverTimestamp(),
      });
      await this.incrementCounter(uid, 'totalRecipes');
      await this.awardXp(uid, XP_EVENTS.RECIPE_GENERATED, 'recipe_generated');
      return ref.id;
    } catch (e) {
      console.error('[Firestore] saveRecipe:', e);
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // AVALIAÇÕES DE ALIMENTOS
  // ─────────────────────────────────────────────

  async saveFoodEvaluation(uid, evaluationData) {
    try {
      const ref = await addDoc(this.subCol(uid, 'foodEvaluations'), {
        ...evaluationData,
        createdAt: serverTimestamp(),
      });
      await this.awardXp(uid, XP_EVENTS.FOOD_EVALUATED, 'food_evaluated');
      return ref.id;
    } catch (e) {
      console.error('[Firestore] saveFoodEvaluation:', e);
      return null;
    }
  }

  async getFoodEvaluations(uid, limit_ = 50) {
    try {
      const q = query(
        this.subCol(uid, 'foodEvaluations'),
        orderBy('createdAt', 'desc'),
        limit(limit_)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('[Firestore] getFoodEvaluations:', e);
      return [];
    }
  }

  // ─────────────────────────────────────────────
  // DADOS DO USUÁRIO (genérico)
  // ─────────────────────────────────────────────

  async getUserData(uid, path) {
    try {
      // Se path contém /, trata como subcoleção/documento
      if (path.includes('/')) {
        const [subCollection, docId] = path.split('/');
        const snap = await getDoc(this.subDoc(uid, subCollection, docId));
        return snap.exists() ? snap.data() : null;
      } else {
        // Caso contrário, trata como campo do perfil do usuário
        const profile = await this.getUserProfile(uid);
        return profile ? profile[path] : null;
      }
    } catch (e) {
      console.error('[Firestore] getUserData:', e);
      return null;
    }
  }

  async saveUserData(uid, path, data) {
    try {
      if (path.includes('/')) {
        const [subCollection, docId] = path.split('/');
        const ref = this.subDoc(uid, subCollection, docId);
        await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await this.saveUserProfile(uid, { [path]: data });
      }
      return true;
    } catch (e) {
      console.error('[Firestore] saveUserData:', e);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // CLOUD FUNCTIONS
  // ─────────────────────────────────────────────

  async callCloudFunction(functionName, data) {
    try {
      const idToken = await this._getIdToken();
      const response = await fetch(
        `${this._getFunctionsUrl()}/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`Cloud Function error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Firestore] callCloudFunction:', error);
      throw error;
    }
  }

  _getFunctionsUrl() {
    // Substitua com sua URL real do Firebase
    return 'https://southamerica-east1-YOUR-PROJECT.cloudfunctions.net';
  }

  async _getIdToken() {
    try {
      // Obter token do usuário autenticado
      const { getAuth } = await import('../config/firebase.js');
      const auth = getAuth();
      return await auth.currentUser?.getIdToken();
    } catch (error) {
      console.error('[Firestore] _getIdToken:', error);
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  async incrementCounter(uid, fieldName) {
    try {
      const { increment } = await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js');
      await updateDoc(this.userRef(uid), { [fieldName]: increment(1) });
    } catch (e) {
      console.error('[Firestore] incrementCounter:', e);
    }
  }

  async awardXp(uid, xpAmount, eventId = null) {
    try {
      const { increment } = await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js');
      const profile = await this.getUserProfile(uid);
      const newXp = (profile?.xp || 0) + xpAmount;
      const newLevel = getLevelForXp(newXp);

      const updates = { xp: newXp };
      if (newLevel.level !== (profile?.level || 1)) {
        updates.level = newLevel.level;
      }

      await updateDoc(this.userRef(uid), updates);

      // Log do evento
      if (eventId) {
        await addDoc(collection(this.getDb(), 'users', uid, 'xpLog'), {
          eventId,
          xpAwarded: xpAmount,
          totalXp: newXp,
          timestamp: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error('[Firestore] awardXp:', e);
    }
  }

  async logXPEvent(uid, eventType, details = {}) {
    try {
      await addDoc(this.subCol(uid, 'xpEvents'), {
        eventType,
        details,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error('[Firestore] logXPEvent:', e);
    }
  }
}

// Export singleton instance
export const firestoreService = new FirestoreService();