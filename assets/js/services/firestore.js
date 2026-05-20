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

import { getFirestore, firebaseConfig, getFunctions, httpsCallable } from '../config/firebase.js';
import {
  addDoc,
  arrayUnion,
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

import { getLevels, getAchievementsCatalog, getXpEvents as getXpEventsFromConfig } from '../config/constants.js';
import { State } from '../utils/helpers.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getLevelForXp(xp) {
  const levels = getLevels();
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXp) return levels[i];
  }
  return levels[0];
}

function xpToNextLevel(xp) {
  const current = getLevelForXp(xp);
  if (!current.maxXp) return null; // nível máximo
  return current.maxXp - xp + 1;
}

function getXpEvents() {
  return getXpEventsFromConfig();
}

// ─────────────────────────────────────────────
// FirestoreService
// ─────────────────────────────────────────────

export class FirestoreService {
  constructor() {
    this.db = null;
    this.initialized = false;
    this._cache = new Map();
    this._localPrefix = '_bela_fs_';
  }

  _cacheGet(key) { return this._cache.get(key); }
  _cacheSet(key, value) { this._cache.set(key, value); }
  _cacheDelete(key) { this._cache.delete(key); }

  // ── localStorage fallback ─────────────────────────────────

  /** Gera chave localStorage para um Firestore path. */
  _localKey(uid, sub, docId) {
    const parts = [this._localPrefix, uid];
    if (sub) parts.push(sub);
    if (docId) parts.push(docId);
    return parts.join('/');
  }

  /** Salva no localStorage como fallback offline. */
  _localSet(uid, sub, docId, data) {
    try {
      const key = this._localKey(uid, sub, docId);
      const wrapped = { _ts: Date.now(), data };
      localStorage.setItem(key, JSON.stringify(wrapped));
    } catch (e) {
      console.warn('[Firestore] localStorage set fallback failed:', e);
    }
  }

  /** Lê do localStorage (fallback offline). */
  _localGet(uid, sub, docId) {
    try {
      const key = this._localKey(uid, sub, docId);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const wrapped = JSON.parse(raw);
      return wrapped.data || null;
    } catch {
      return null;
    }
  }

  /** Remove do localStorage. */
  _localDelete(uid, sub, docId) {
    try {
      const key = this._localKey(uid, sub, docId);
      localStorage.removeItem(key);
    } catch {}
  }

  /**
   * Detecta se o erro é relacionado a offline/Firestore indisponível.
   * Firebase Firestore lança erro com code 'unavailable' ou mensagem de rede.
   */
  _isOfflineError(e) {
    if (!e) return false;
    const msg = (e.message || e.code || '').toLowerCase();
    return msg.includes('unavailable')
      || msg.includes('network')
      || msg.includes('offline')
      || msg.includes('timeout')
      || msg.includes('failed to get document')
      || (typeof navigator !== 'undefined' && navigator.onLine === false);
  }

  async _run(fn, label, fallback = null) {
    try {
      return await fn();
    } catch (e) {
      console.error(`[Firestore] ${label}:`, e);
      return fallback;
    }
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
    const cacheKey = `profile_${uid}`;
    const cached = this._cacheGet(cacheKey);
    if (cached !== undefined) return cached;
    return this._run(async () => {
      const snap = await getDoc(this.userRef(uid));
      const value = snap.exists() ? snap.data() : null;
      this._cacheSet(cacheKey, value);
      // Salva no localStorage para fallback offline
      if (value) this._localSet(uid, null, 'profile', value);
      return value;
    }, 'getUserProfile', async () => {
      // Fallback offline: tenta localStorage
      const local = this._localGet(uid, null, 'profile');
      if (local) { this._cacheSet(cacheKey, local); return local; }
      return null;
    });
  }

  async saveUserProfile(uid, data) {
    this._cacheDelete(`profile_${uid}`);
    // Sempre salva no localStorage como fallback
    this._localSet(uid, null, 'profile', data);
    return this._run(async () => {
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
    }, 'saveUserProfile', false);
  }

  /**
   * Garante que o documento do usuário existe com todos os campos mínimos.
   * Idempotente: chamado em todo login. Se o doc não existe, cria com defaults
   * e dispara notificação de boas-vindas. Se existe, complementa campos faltantes.
   * @returns {Promise<Object|null>} perfil completo após garantia.
   */
  async ensureUserDocument(uid, email = null) {
    if (!uid) return null;
    return this._run(async () => {
      const ref = this.userRef(uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const patch = {};
        if (data.xp === undefined) patch.xp = 0;
        if (data.level === undefined) patch.level = 1;
        if (data.streak === undefined) patch.streak = 0;
        if (data.totalLogins === undefined) patch.totalLogins = 1;
        if (data.totalRecipes === undefined) patch.totalRecipes = 0;
        if (data.totalChatMessages === undefined) patch.totalChatMessages = 0;
        if (data.status === undefined) patch.status = 'awaiting_onboarding';
        if (data.onboardingCompleted === undefined) patch.onboardingCompleted = false;
        if (Object.keys(patch).length > 0) {
          patch.updatedAt = serverTimestamp();
          await updateDoc(ref, patch);
          this._cacheDelete(`profile_${uid}`);
        }
        return { ...data, ...patch };
      }

      // Doc não existe — criar com defaults completos
      const initialData = {
        email: email || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        xp: 0,
        level: 1,
        streak: 0,
        totalLogins: 1,
        totalRecipes: 0,
        totalChatMessages: 0,
        onboardingCompleted: false,
        healthFormCompleted: false,
        menuFormCompleted: false,
        status: 'awaiting_onboarding',
        lastActivityDate: null,
        profile: {},
        diagnostics: [],
      };
      await setDoc(ref, initialData);
      this._cacheDelete(`profile_${uid}`);

      // Notificação de boas-vindas
      try {
        await this.createNotification(uid, {
          title: '🌸 Bem-vinda ao Programa 4D!',
          message: 'Sua jornada de saúde começa agora. Explore o app e fale com sua Guardiã.',
          type: 'welcome',
          priority: 'high',
        });
      } catch (e) {
        console.warn('[Firestore] welcome notification failed:', e);
      }

      return initialData;
    }, 'ensureUserDocument');
  }

  /** Atualiza só o status do usuário */
  async updateUserStatus(uid, status) {
    this._cacheDelete(`profile_${uid}`);
    // Sincroniza State.userProfile local — necessário para que a trava
    // anti-bypass em app.navigate() (que bloqueia dashboard se
    // status !== 'active') receba o status atualizado imediatamente,
    // sem precisar esperar um round-trip no Firestore.
    try {
      const profile = State.get?.('userProfile') || {};
      State.set?.('userProfile', { ...profile, status });
    } catch (_) { /* State pode não estar inicializado em contextos isolados */ }
    return this._run(async () => {
      await updateDoc(this.userRef(uid), { status, updatedAt: serverTimestamp() });
      return true;
    }, 'updateUserStatus', false);
  }

  /**
   * Agenda a reunião de onboarding. Grava em users/{uid}.meeting e cria
   * notificação. Mantém o status awaiting_onboarding — a Guardiã confirma
   * no Firestore quando a reunião acontece (mudando para pending_blood_test
   * ou filling_health_form).
   *
   * @param {string} uid
   * @param {string} isoDatetime — formato 'YYYY-MM-DDTHH:MM' (input local)
   * @param {string} timezone   — IANA tz string (ex: 'America/Sao_Paulo')
   */
  async scheduleOnboardingMeeting(uid, isoDatetime, timezone = null) {
    if (!uid || !isoDatetime) return false;
    this._cacheDelete(`profile_${uid}`);
    const tz = timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo');
    return this._run(async () => {
      await updateDoc(this.userRef(uid), {
        meeting: {
          scheduledFor: isoDatetime,           // 'YYYY-MM-DDTHH:MM' (local)
          scheduledAt: serverTimestamp(),       // quando o usuário agendou
          timezone: tz,
          status: 'scheduled',                  // scheduled | confirmed | done | cancelled
        },
        updatedAt: serverTimestamp(),
      });
      try {
        const human = new Date(isoDatetime).toLocaleString('pt-BR', {
          dateStyle: 'short', timeStyle: 'short',
        });
        await this.createNotification(uid, {
          title: 'Reunião agendada',
          message: `Sua reunião inicial foi marcada para ${human}.`,
          type: 'meeting_scheduled',
          priority: 'high',
        });
      } catch (e) { console.warn('[Firestore] schedule notification failed:', e); }
      return true;
    }, 'scheduleOnboardingMeeting', false);
  }

  async cancelOnboardingMeeting(uid) {
    if (!uid) return false;
    this._cacheDelete(`profile_${uid}`);
    return this._run(async () => {
      await updateDoc(this.userRef(uid), {
        'meeting.status': 'cancelled',
        'meeting.cancelledAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    }, 'cancelOnboardingMeeting', false);
  }

  // ─────────────────────────────────────────────
  // FORMULÁRIO DE SAÚDE — Form 1
  // ─────────────────────────────────────────────

  async getHealthForm(uid) {
    const cacheKey = `healthForm_${uid}`;
    const cached = this._cacheGet(cacheKey);
    if (cached !== undefined) return cached;
    return this._run(async () => {
      const snap = await getDoc(this.subDoc(uid, 'healthForm', 'data'));
      const value = snap.exists() ? snap.data() : null;
      this._cacheSet(cacheKey, value);
      if (value) this._localSet(uid, 'healthForm', 'data', value);
      return value;
    }, 'getHealthForm', async () => {
      // Fallback offline
      const local = this._localGet(uid, 'healthForm', 'data');
      if (local) { this._cacheSet(cacheKey, local); return local; }
      return null;
    });
  }

  /**
   * Salva o Formulário de Saúde.
   * @param {string} uid
   * @param {Object} formData  — dados do formulário
   * @param {boolean} aiPrefilled — se foi pré-preenchido pela IA
   * @param {boolean} completed   — se o usuário confirmou/completou
   */
  async saveHealthForm(uid, formData, { aiPrefilled = false, completed = false } = {}) {
    if (!uid) return false;
    this._cacheDelete(`healthForm_${uid}`);
    // Salva no localStorage como fallback offline
    this._localSet(uid, 'healthForm', 'data', { ...formData, aiPrefilled, completed });
    return this._run(async () => {
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
        await this.awardXp(uid, getXpEvents().HEALTH_FORM_COMPLETED, 'HEALTH_FORM_COMPLETED', { idempotencyKey: 'health_form_done' });
      }
      return true;
    }, 'saveHealthForm', false);
  }

  /**
   * Salva rascunho do Formulário de Saúde sem disparar XP / mudança de status.
   * Usado para auto-save por seção durante o preenchimento.
   */
  async saveHealthFormDraft(uid, formData, currentSection = 0) {
    if (!uid) return false;
    this._cacheDelete(`healthForm_${uid}`);
    return this._run(async () => {
      const ref = this.subDoc(uid, 'healthForm', 'data');
      const existing = await getDoc(ref);
      const toSave = {
        ...formData,
        completed: false,
        draftSection: currentSection,
        updatedAt: serverTimestamp(),
      };
      if (!existing.exists()) toSave.createdAt = serverTimestamp();
      await setDoc(ref, toSave, { merge: true });
      return true;
    }, 'saveHealthFormDraft', false);
  }

  // ─────────────────────────────────────────────
  // ENTREVISTA DE ONBOARDING (interno — Guardiã)
  // Dados extraídos pelo n8n da transcrição do Google Meet
  // ─────────────────────────────────────────────

  async getOnboardingInterview(uid) {
    return this._run(async () => {
      const snap = await getDoc(this.subDoc(uid, 'onboardingInterview', 'data'));
      return snap.exists() ? snap.data() : null;
    }, 'getOnboardingInterview');
  }

  async saveOnboardingData(uid, data) {
    if (!uid) return false;
    return this._run(async () => {
      const userRef = doc(this.db, 'users', uid);
      await setDoc(userRef, {
        onboardingData: {
          name: data.name || null,
          birthDate: data.birthDate || null,
          gender: data.gender || null,
          weight: data.weight ? Number(data.weight) : null,
          height: data.height ? Number(data.height) : null,
          diagnostics: data.diagnostics || [],
          completedAt: data.completedAt ? data.completedAt.toISOString?.() ?? data.completedAt : null,
        },
        profile: {
          name: data.name || null,
          birthDate: data.birthDate || null,
          gender: data.gender || null,
          weight: data.weight ? Number(data.weight) : null,
          height: data.height ? Number(data.height) : null,
        },
        diagnostics: data.diagnostics || [],
        onboardingCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      this._cacheDelete(`profile_${uid}`);
      return true;
    }, 'saveOnboardingData', false);
  }

  /** Salva rascunho parcial do onboarding (auto-save a cada campo) */
  async saveOnboardingDraft(uid, draft) {
    if (!uid) return false;
    return this._run(async () => {
      const draftRef = doc(this.db, 'users', uid, 'onboardingDraft', 'current');
      await setDoc(draftRef, { ...draft, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    }, 'saveOnboardingDraft', false);
  }

  /** Recupera rascunho salvo do onboarding */
  async getOnboardingDraft(uid) {
    if (!uid) return null;
    return this._run(async () => {
      const draftRef = doc(this.db, 'users', uid, 'onboardingDraft', 'current');
      const snap = await getDoc(draftRef);
      return snap.exists() ? snap.data() : null;
    }, 'getOnboardingDraft');
  }

  /** Remove rascunho após submit bem-sucedido */
  async deleteOnboardingDraft(uid) {
    if (!uid) return false;
    return this._run(async () => {
      const draftRef = doc(this.db, 'users', uid, 'onboardingDraft', 'current');
      await deleteDoc(draftRef);
      return true;
    }, 'deleteOnboardingDraft', false);
  }

  async saveOnboardingInterview(uid, data) {
    return this._run(async () => {
      const ref = this.subDoc(uid, 'onboardingInterview', 'data');
      await setDoc(ref, {
        ...data,
        processedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    }, 'saveOnboardingInterview', false);
  }

  // ─────────────────────────────────────────────
  // FORMULÁRIO PRÉ-CARDÁPIO — Form 3 (semana 3)
  // ─────────────────────────────────────────────

  async getMenuForm(uid) {
    const cacheKey = `menuForm_${uid}`;
    const cached = this._cacheGet(cacheKey);
    if (cached !== undefined) return cached;
    return this._run(async () => {
      const snap = await getDoc(this.subDoc(uid, 'menuForm', 'data'));
      const value = snap.exists() ? snap.data() : null;
      this._cacheSet(cacheKey, value);
      if (value) this._localSet(uid, 'menuForm', 'data', value);
      return value;
    }, 'getMenuForm', async () => {
      // Fallback offline
      const local = this._localGet(uid, 'menuForm', 'data');
      if (local) { this._cacheSet(cacheKey, local); return local; }
      return null;
    });
  }

  async saveMenuForm(uid, formData, completed = false) {
    this._cacheDelete(`menuForm_${uid}`);
    // Salva no localStorage como fallback offline
    this._localSet(uid, 'menuForm', 'data', { ...formData, completed });
    return this._run(async () => {
      const ref = this.subDoc(uid, 'menuForm', 'data');
      const existing = await getDoc(ref);
      const toSave = { ...formData, completed, updatedAt: serverTimestamp() };
      if (!existing.exists()) toSave.createdAt = serverTimestamp();
      await setDoc(ref, toSave, { merge: true });

      if (completed) {
        await this.updateUserStatus(uid, 'active');
        await this.awardXp(uid, getXpEvents().MENU_FORM_COMPLETED, 'MENU_FORM_COMPLETED', { idempotencyKey: 'menu_form_done' });
      }
      return true;
    }, 'saveMenuForm', false);
  }

  // ─────────────────────────────────────────────
  // FORMULÁRIO MULTI-ETAPAS (FormsScreen)
  // ─────────────────────────────────────────────

  async getFormProgress(uid) {
    const cacheKey = `formProgress_${uid}`;
    const cached = this._cacheGet(cacheKey);
    if (cached !== undefined) return cached;
    return this._run(async () => {
      const snap = await getDoc(this.subDoc(uid, 'formProgress', 'data'));
      const value = snap.exists() ? snap.data() : null;
      this._cacheSet(cacheKey, value);
      return value;
    }, 'getFormProgress');
  }

  async saveFormProgress(uid, data) {
    if (!uid) return false;
    this._cacheDelete(`formProgress_${uid}`);
    return this._run(async () => {
      const ref = this.subDoc(uid, 'formProgress', 'data');
      const existing = await getDoc(ref);
      const toSave = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      if (!existing.exists()) toSave.createdAt = serverTimestamp();
      await setDoc(ref, toSave, { merge: true });
      return true;
    }, 'saveFormProgress', false);
  }

  async submitFormsComplete(uid, formData) {
    if (!uid) return false;
    this._cacheDelete(`formProgress_${uid}`);
    return this._run(async () => {
      const ref = this.subDoc(uid, 'formProgress', 'data');
      await setDoc(ref, {
        ...formData,
        completed: true,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await this.updateUserStatus(uid, 'active');
      await this.awardXp(uid, getXpEvents().MENU_FORM_COMPLETED, 'MENU_FORM_COMPLETED', { idempotencyKey: 'forms_completed' });
      return true;
    }, 'submitFormsComplete');
  }

  // ─────────────────────────────────────────────
  // EXAMES DE SANGUE
  // ─────────────────────────────────────────────

  async saveBloodTest(uid, { fileUrl, fileName, fileSize, extractedData = null, status = 'pending' }) {
    return this._run(async () => {
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
      await this.awardXp(uid, getXpEvents().BLOOD_TEST_UPLOADED, 'BLOOD_TEST_UPLOADED', { idempotencyKey: 'blood_test_uploaded' });

      return ref.id;
    }, 'saveBloodTest');
  }

  /** Chamado pelo n8n após processar o exame */
  async updateBloodTestExtraction(uid, bloodTestId, extractedData) {
    return this._run(async () => {
      await updateDoc(this.subDoc(uid, 'bloodTests', bloodTestId), {
        extractedData,
        status: 'done',
        processedAt: serverTimestamp(),
      });
      // Avança para preenchimento do Form 1
      await this.updateUserStatus(uid, 'filling_health_form');
      return true;
    }, 'updateBloodTestExtraction', false);
  }

  async getLatestBloodTest(uid) {
    return this._run(async () => {
      const q = query(this.subCol(uid, 'bloodTests'), orderBy('uploadedAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }, 'getLatestBloodTest');
  }

  // ─────────────────────────────────────────────
  // PEDIDOS DE EXAME (gerados quando não tem exame)
  // ─────────────────────────────────────────────

  async saveExamRequest(uid, { fileUrl, fileName, preFilledData }) {
    return this._run(async () => {
      const ref = await addDoc(this.subCol(uid, 'examRequests'), {
        fileUrl,
        fileName,
        preFilledData,
        createdAt: serverTimestamp(),
      });
      await this.updateUserStatus(uid, 'exam_request_sent');
      return ref.id;
    }, 'saveExamRequest');
  }

  async getLatestExamRequest(uid) {
    return this._run(async () => {
      const q = query(this.subCol(uid, 'examRequests'), orderBy('createdAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }, 'getLatestExamRequest');
  }

  // ─────────────────────────────────────────────
  // CHAT IA
  // ─────────────────────────────────────────────

  async saveChatMessage(uid, { role, content, type = 'text', conversationId = null }) {
    return this._run(async () => {
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
        if (total === 10)  await this.awardXp(uid, getXpEvents().CHAT_MESSAGE_SENT * 10, 'CHAT_MESSAGE_SENT', { idempotencyKey: 'chat_10' });
        if (total === 50)  await this.awardXp(uid, getXpEvents().CHAT_MESSAGE_SENT * 20, 'CHAT_MESSAGE_SENT', { idempotencyKey: 'chat_50' });
        else               await this.awardXp(uid, getXpEvents().CHAT_MESSAGE_SENT, 'CHAT_MESSAGE_SENT');
      }

      return ref.id;
    }, 'saveChatMessage');
  }

  async getChatHistory(uid, maxMessages = 50) {
    return this._run(async () => {
      const q = query(
        this.subCol(uid, 'chatHistory'),
        orderBy('timestamp', 'desc'),
        limit(maxMessages)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    }, 'getChatHistory', []);
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
   * Cria um documento de notificação em users/{uid}/notifications.
   * @param {string} uid
   * @param {Object} data — { title, message, type, priority, channel, payload }
   * @returns {Promise<string|null>} id do doc criado, ou null
   */
  async createNotification(uid, data) {
    if (!uid) return null;
    return this._run(async () => {
      const ref = await addDoc(this.subCol(uid, 'notifications'), {
        title: data.title || 'Notificação',
        message: data.message || '',
        type: data.type || 'info',
        priority: data.priority || 'normal',
        channel: data.channel || 'app',
        payload: data.payload || null,
        read: false,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    }, 'createNotification');
  }

  /**
   * Marca notificação como lida.
   */
  async markNotificationRead(uid, notificationId) {
    if (!uid || !notificationId) return false;
    return this._run(async () => {
      await updateDoc(this.subDoc(uid, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });
      return true;
    }, 'markNotificationRead', false);
  }

  async markNotificationUnread(uid, notificationId) {
    if (!uid || !notificationId) return false;
    return this._run(async () => {
      await updateDoc(this.subDoc(uid, 'notifications', notificationId), {
        read: false,
        readAt: null,
      });
      return true;
    }, 'markNotificationUnread', false);
  }

  async deleteNotification(uid, notificationId) {
    if (!uid || !notificationId) return false;
    return this._run(async () => {
      await deleteDoc(this.subDoc(uid, 'notifications', notificationId));
      return true;
    }, 'deleteNotification', false);
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
    return this._run(async () => {
      const q = query(this.subCol(uid, 'recipes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }, 'getAllRecipes', []);
  }

  async saveRecipe(uid, recipeData) {
    return this._run(async () => {
      const ref = await addDoc(this.subCol(uid, 'recipes'), {
        ...recipeData,
        createdAt: serverTimestamp(),
      });
      await this.incrementCounter(uid, 'totalRecipes');
      await this.awardXp(uid, getXpEvents().RECIPE_SAVED, 'RECIPE_SAVED', { idempotencyKey: 'recipe_generated' });
      return ref.id;
    }, 'saveRecipe');
  }

  // ─────────────────────────────────────────────
  // AVALIAÇÕES DE ALIMENTOS
  // ─────────────────────────────────────────────

  async saveFoodEvaluation(uid, evaluationData) {
    return this._run(async () => {
      const ref = await addDoc(this.subCol(uid, 'foodEvaluations'), {
        ...evaluationData,
        createdAt: serverTimestamp(),
      });
      await this.awardXp(uid, getXpEvents().FOOD_EVALUATED, 'FOOD_EVALUATED', { idempotencyKey: 'food_evaluated' });
      return ref.id;
    }, 'saveFoodEvaluation');
  }

  async getFoodEvaluations(uid, limit_ = 50) {
    return this._run(async () => {
      const q = query(
        this.subCol(uid, 'foodEvaluations'),
        orderBy('createdAt', 'desc'),
        limit(limit_)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }, 'getFoodEvaluations', []);
  }

  // ─────────────────────────────────────────────
  // DADOS DO USUÁRIO (genérico)
  // ─────────────────────────────────────────────

  async getUserData(uid, path) {
    return this._run(async () => {
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
    }, 'getUserData');
  }

  async saveUserData(uid, path, data) {
    return this._run(async () => {
      if (path.includes('/')) {
        const [subCollection, docId] = path.split('/');
        const ref = this.subDoc(uid, subCollection, docId);
        await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await this.saveUserProfile(uid, { [path]: data });
      }
      return true;
    }, 'saveUserData', false);
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
    const projectId = firebaseConfig?.projectId || 'bela-4d-app';
    const region = 'southamerica-east1';
    return `https://${region}-${projectId}.cloudfunctions.net`;
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

  async awardXp(uid, xpAmount, event, options = {}) {
    try {
      const fn = httpsCallable(getFunctions(), 'awardXp');
      const payload = {
        event: event || 'DAILY_LOGIN',
        amount: xpAmount,
      };
      if (options.idempotencyKey) payload.idempotencyKey = options.idempotencyKey;
      if (options.reason) payload.reason = options.reason;
      if (options.meta) payload.meta = options.meta;

      const result = await fn(payload);
      return result.data;
    } catch (e) {
      const code = e?.code || '';
      if (code === 'functions/permission-denied') {
        console.error('[Firestore] awardXp: permissão negada pela Function');
        this._showToast?.('Não foi possível registrar XP: acesso negado.', 'error');
      } else if (code === 'functions/invalid-argument') {
        console.error('[Firestore] awardXp: argumento inválido', e.message);
        this._showToast?.('Não foi possível registrar XP: evento inválido.', 'error');
      } else {
        console.error('[Firestore] awardXp:', e);
      }
      return null;
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

  async awardDailyLoginXp(uid) {
    try {
      const profile = await this.getUserProfile(uid);
      if (!profile) return false;

      const toDate = value => {
        if (!value) return null;
        if (typeof value?.toDate === 'function') return value.toDate();
        if (value instanceof Date) return value;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const today = new Date();
      const todayKey = today.toDateString();
      const lastLoginDate = toDate(profile.lastLoginAt);

      if (lastLoginDate && lastLoginDate.toDateString() === todayKey) {
        return false;
      }

      await this.awardXp(uid, getXpEvents().DAILY_LOGIN, 'DAILY_LOGIN', { idempotencyKey: 'daily_login' });
      await this._updateStreak(uid, profile);
      await updateDoc(this.userRef(uid), {
        lastLoginAt: serverTimestamp(),
      });

      return true;
    } catch (e) {
      console.error('[Firestore] awardDailyLoginXp:', e);
      return false;
    }
  }

  async _updateStreak(uid, profile = null) {
    try {
      const sourceProfile = profile || await this.getUserProfile(uid) || {};
      const toDate = value => {
        if (!value) return null;
        if (typeof value?.toDate === 'function') return value.toDate();
        if (value instanceof Date) return value;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const lastActivityDate = toDate(sourceProfile.lastActivityDate);
      let newStreak = 1;

      if (lastActivityDate && lastActivityDate.toDateString() === yesterday.toDateString()) {
        newStreak = Number(sourceProfile.streak || 0) + 1;
      } else if (lastActivityDate && lastActivityDate.toDateString() === today.toDateString()) {
        newStreak = Number(sourceProfile.streak || 0);
      }

      await updateDoc(this.userRef(uid), {
        streak: newStreak,
        lastActivityDate: serverTimestamp(),
      });

      if (newStreak === 7) await this.unlockAchievement(uid, 'consistent');
      if (newStreak === 30) await this.unlockAchievement(uid, 'iron_fire');

      return newStreak;
    } catch (e) {
      console.error('[Firestore] _updateStreak:', e);
      return null;
    }
  }

  async unlockAchievement(uid, achievementId) {
    if (!uid || !achievementId) return false;
    return this._run(async () => {
      const ref = this.subDoc(uid, 'achievements', achievementId);
      const existing = await getDoc(ref);
      if (existing.exists()) return false; // idempotente

      const catalog = getAchievementsCatalog();
      const achievement = catalog.find(item => item.id === achievementId);
      if (!achievement) {
        console.warn('[Firestore] unlockAchievement: id not found in catalog', achievementId);
        return false;
      }

      await setDoc(ref, {
        achievementId,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        xp: achievement.xp,
        unlocked: true,
        claimed: false,
        seen: false,
        unlockedAt: serverTimestamp(),
      }, { merge: true });

      // Notificação persistente — XP é entregue apenas no claim.
      try {
        await this.createNotification(uid, {
          title: `🏆 ${achievement.title}`,
          message: `${achievement.description} — Reivindique sua recompensa!`,
          type: 'achievement',
          priority: achievement.xp >= 500 ? 'high' : 'normal',
          payload: { achievementId, xp: achievement.xp },
        });
      } catch (e) {
        console.warn('[Firestore] notification on unlock failed:', e);
      }

      return true;
    }, 'unlockAchievement', false);
  }

  async claimAchievement(uid, achievementId) {
    if (!uid || !achievementId) return false;
    return this._run(async () => {
      const ref = this.subDoc(uid, 'achievements', achievementId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.warn('[Firestore] claimAchievement: not unlocked yet', achievementId);
        return false;
      }
      const data = snap.data();
      if (data.claimed) return false;

      const catalog = getAchievementsCatalog();
      const achievement = catalog.find(a => a.id === achievementId);
      if (!achievement) return false;

      await updateDoc(ref, {
        claimed: true,
        claimedAt: serverTimestamp(),
        xpAwarded: achievement.xp,
      });

      // Award XP only on claim
      if (achievement.xp > 0) {
        await this.awardXp(uid, achievement.xp, 'ACHIEVEMENT_CLAIMED', { idempotencyKey: `claim_${achievementId}`, meta: { achievementId } });
      }

      return true;
    }, 'claimAchievement', false);
  }

  async getTopRanking(limitCount = 10) {
    return this._run(async () => {
      // Lê de globalRanking (firestore rules: signed-in pode ler), não de users
      const q = query(collection(this.getDb(), 'globalRanking'), orderBy('xp', 'desc'), limit(limitCount));
      const snap = await getDocs(q);

      if (snap.empty) return [];

      // Dados base do globalRanking
      const rawList = snap.docs.map(docSnap => {
        const data = docSnap.data() || {};
        return {
          uid: docSnap.id,
          xp: Number(data.xp || 0),
          level: Number(data.level || 1),
          streak: Number(data.streak || 0),
          name: data.name || null,
          avatar: data.avatar || null,
          avatarColor: data.avatarColor || null,
        };
      });

      // Batch-fetch user docs para campos que globalRanking pode não ter
      // (remove após cloud function escrever name/avatar/etc)
      const userDocs = await Promise.all(
        rawList.map(item =>
          item.uid ? getDoc(doc(this.getDb(), 'users', item.uid)).catch(() => null) : null
        )
      );

      return rawList.map((item, index) => {
        const ud = userDocs[index]?.data?.() || {};
        return {
          position: index + 1,
          uid: item.uid,
          name: item.name || ud.name || 'Usuário',
          xp: item.xp,
          level: item.level,
          streak: item.streak || Number(ud.streak || 0),
          avatar: item.avatar || ud.avatar || '🌸',
          avatarColor: item.avatarColor || ud.avatarColor || '#f0059a',
        };
      });
    }, 'getTopRanking', []);
  }

  async markActionSeen(uid, actionId) {
    return this._run(async () => {
      await updateDoc(this.subDoc(uid, 'pendingActions', actionId), {
        seen: true,
        seenAt: serverTimestamp(),
      });
      return true;
    }, 'markActionSeen', false);
  }

  /**
   * Registra visita a uma aba do dashboard.
   * Escreve diretamente no Firestore (sem Cloud Function).
   * @param {string} uid
   * @param {string} sectionId — identificador da aba (e.g. 'chat', 'recipes', 'forms')
   */
  async recordSectionVisit(uid, sectionId) {
    if (!uid || !sectionId) return;
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const ref = doc(this.getDb(), 'users', uid, 'sectionVisits', today);
      await setDoc(ref, {
        sections: arrayUnion(sectionId),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] recordSectionVisit error:', e);
    }
  }

  onXpLogChange(uid, callback) {
    try {
      const q = query(this.subCol(uid, 'xpLog'), orderBy('timestamp', 'desc'), limit(1));
      return onSnapshot(q, (snap) => {
        if (snap.empty) {
          callback(null);
          return;
        }
        const entry = snap.docs[0];
        callback({ id: entry.id, ...entry.data() });
      });
    } catch (e) {
      console.error('[Firestore] onXpLogChange:', e);
      return () => {};
    }
  }

  // ─────────────────────────────────────────────
  // APP CONFIG (dados de referência)
  // ─────────────────────────────────────────────

  /**
   * Busca configuração do app no Firestore.
   * Ex: getAppConfig('levels') → retorna array de níveis.
   * Ex: getAppConfig('achievementsCatalog') → retorna array de conquistas.
   * Cache em memória (só busca uma vez por sessão).
   * @param {string} docId — 'levels', 'achievementsCatalog', 'navItems', 'recipes', 'ranking', 'dicas', 'refeicoes'
   * @returns {Promise<Array|null>}
   */
  async getAppConfig(docId) {
    const cacheKey = `appConfig_${docId}`;
    const cached = this._cacheGet(cacheKey);
    if (cached !== undefined) return cached;

    return this._run(async () => {
      const snap = await getDoc(doc(this.getDb(), 'appConfig', docId));
      if (!snap.exists()) {
        console.warn(`[Firestore] appConfig/${docId} não encontrado`);
        return null;
      }
      const value = snap.data().data || null;
      this._cacheSet(cacheKey, value);
      return value;
    }, `getAppConfig(${docId})`);
  }

  /**
   * Pré-carrega todos os appConfigs e coloca no State.
   * Chamado uma vez após login.
   */
  async preloadAppConfig() {
    const configs = ['levels', 'achievementsCatalog', 'xpEvents', 'navItems', 'recipes', 'ranking', 'dicas', 'refeicoes'];
    const results = {};
    await Promise.all(configs.map(async (docId) => {
      const data = await this.getAppConfig(docId);
      if (data) results[docId] = data;
    }));
    return results;
  }

  // ─────────────────────────────────────────────
  // LISTENERS EM TEMPO REAL (onSnapshot)
  // ─────────────────────────────────────────────

  /**
   * Escuta mudanças no chat history do usuário.
   * @returns {function} unsubscribe
   */
  onChatHistoryUpdate(uid, callback) {
    const q = query(
      collection(this.getDb(), 'users', uid, 'chatHistory'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(messages);
    });
  }

  onChatHistoryChange(uid, callback) {
    return this.onChatHistoryUpdate(uid, callback);
  }

  /**
   * Escuta mudanças nas conquistas/achievements do usuário.
   * @returns {function} unsubscribe
   */
  onAchievementsChange(uid, callback) {
    const q = query(
      collection(this.getDb(), 'users', uid, 'achievements'),
      orderBy('unlockedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const achievements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(achievements);
    });
  }

  /**
   * Escuta mudanças nas receitas do usuário.
   * @returns {function} unsubscribe
   */
  onRecipesChange(uid, callback) {
    const q = query(
      collection(this.getDb(), 'users', uid, 'recipes'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(recipes);
    });
  }
}

// Export singleton instance
export const firestoreService = new FirestoreService();