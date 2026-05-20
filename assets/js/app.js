/**
 * App.js — Orquestrador Principal do Programa 4D
 *
 * Roteamento baseado em status do usuário:
 *
 *   awaiting_onboarding  → AwaitingScreen  (aguardando reunião)
 *   pending_blood_test   → AwaitingScreen  (enviar exame)
 *   processing_blood_test→ AwaitingScreen  (processando)
 *   exam_request_sent    → AwaitingScreen  (pedido enviado ao médico)
 *   filling_health_form  → HealthFormScreen (Form 1 — com ou sem IA pré-fill)
 *   awaiting_menu_form   → AwaitingScreen  (aguarda semana 3)
 *   filling_menu_form    → CardapioScreen   (Form 3)
 *   active               → DashboardScreen
 *
 * Usuário sem status → redireciona para awaiting_onboarding
 */

import { DOM, State, Session } from './utils/helpers.js';
import { SCREENS, USER_STATUS } from './config/constants.js';
import { initializeFirebase } from './config/firebase.js';
import { authService } from './services/auth.js';
import { firestoreService } from './services/firestore.js';
import { notificationService } from './modules/notifications.js';
import { offlineQueue } from './modules/offline-queue.js';

// Telas críticas (carregadas imediatamente)
import { LoginScreen }    from './screens/login.js';
import { AwaitingScreen } from './screens/awaiting.js';

// Telas secundárias (lazy-loaded na primeira navegação)
const lazyScreens = {
  'exam-upload':  () => import('./screens/exam-upload.js').then(m => m.ExamUploadScreen),
  'health-form':  () => import('./screens/health-form.js').then(m => m.HealthFormScreen),
  'onboarding':   () => import('./screens/onboarding.js').then(m => m.OnboardingScreen),
  'cardapio':     () => import('./screens/cardapio.js').then(m => m.CardapioScreen),
  'dashboard':    () => import('./screens/dashboard-v2.js').then(m => m.DashboardScreen),
  'chat':         () => import('./screens/chat.js').then(m => m.ChatScreen),
  'forms':        () => import('./screens/forms.js').then(m => m.FormsScreen),
};

class App {
  constructor() {
    this.currentScreen = null;
    this.container = DOM.byId('app');
    this.isInitialized = false;
    this.dataUnsubscribers = [];

    // Mapa tela-id → classe (pré-carregadas)
    this.screens = new Map([
      [SCREENS.LOGIN,    LoginScreen],
      [SCREENS.AWAITING, AwaitingScreen],
    ]);

    this.statusRoutes = {
      [USER_STATUS.AWAITING_ONBOARDING]: async (uid) => {
        // Se onboarding NÃO foi completado → formulário primeiro
        const profile = State.get('userProfile');
        if (!profile?.onboardingCompleted) {
          // Trava: se já estamos no onboarding, NÃO re-rotear
          if (this._currentScreenId === SCREENS.ONBOARDING) return;
          this.navigate(SCREENS.ONBOARDING);
        } else {
          // Onboarding já feito → agendar reunião
          this.navigate(SCREENS.AWAITING, { status: USER_STATUS.AWAITING_ONBOARDING });
        }
      },
      [USER_STATUS.PENDING_BLOOD_TEST]: async () => {
        this.navigate(SCREENS.AWAITING, { status: USER_STATUS.PENDING_BLOOD_TEST });
      },
      [USER_STATUS.PROCESSING_BLOOD_TEST]: async (uid) => {
        this.navigate(SCREENS.AWAITING, { status: USER_STATUS.PROCESSING_BLOOD_TEST });
        this._watchUserStatus(uid);
      },
      [USER_STATUS.EXAM_REQUEST_SENT]: async (uid) => {
        const examRequest = await firestoreService.getLatestExamRequest(uid);
        this.navigate(SCREENS.AWAITING, { status: USER_STATUS.EXAM_REQUEST_SENT, examRequest });
      },
      [USER_STATUS.FILLING_HEALTH_FORM]: async (uid) => {
        const bloodTest = await firestoreService.getLatestBloodTest(uid);
        const aiPrefillData = bloodTest?.extractedData || null;
        this.navigate(SCREENS.HEALTH_FORM, { aiPrefillData });
      },
      [USER_STATUS.AWAITING_MENU_FORM]: async () => {
        this.navigate(SCREENS.AWAITING, { status: USER_STATUS.AWAITING_MENU_FORM });
      },
      [USER_STATUS.FILLING_MENU_FORM]: async () => {
        this.navigate(SCREENS.CARDAPIO);
      },
      [USER_STATUS.ACTIVE]: async () => {
        this.navigate(SCREENS.DASHBOARD);
      },
      default: async () => {
        this.navigate(SCREENS.DASHBOARD);
      },
    };
  }

  // ────────────────────────────────────────────────
  // Navegação
  // ────────────────────────────────────────────────

  async _loadScreen(screenId) {
    let ScreenClass = this.screens.get(screenId);
    if (!ScreenClass && lazyScreens[screenId]) {
      try {
        ScreenClass = await lazyScreens[screenId]();
        this.screens.set(screenId, ScreenClass);
      } catch (err) {
        console.error(`[App] Failed to load screen: ${screenId}`, err);
        return null;
      }
    }
    return ScreenClass || null;
  }

  _activateScreen(ScreenClass, screenId, params) {
    if (this.currentScreen) {
      try { this.currentScreen.destroy?.(); } catch (_) {}
    }
    const screenParams = {
      ...params,
      onNavigate: (nextId, nextParams) => this.navigate(nextId, nextParams),
    };
    this.currentScreen = new ScreenClass(screenParams);
    this.currentScreen.mount?.();
    document.title = this._pageTitle(screenId);
    console.log(`[App] → ${screenId}`, params.status || '');
  }

  async navigate(screenId, params = {}) {
    const ScreenClass = await this._loadScreen(screenId);
    if (!ScreenClass) {
      console.error(`[App] Screen not found: ${screenId}`);
      return;
    }
    this._currentScreenId = screenId;
    this._activateScreen(ScreenClass, screenId, params);
  }

  _pageTitle(screenId) {
    return {
      [SCREENS.LOGIN]:       'Login | Programa 4D',
      [SCREENS.ONBOARDING]:  'Onboarding | Programa 4D',
      [SCREENS.AWAITING]:    'Aguardando | Programa 4D',
      [SCREENS.EXAM_UPLOAD]: 'Enviar Exame | Programa 4D',
      [SCREENS.HEALTH_FORM]: 'Formulário de Saúde | Programa 4D',
      [SCREENS.CARDAPIO]:    'Formulário Pré-Cardápio | Programa 4D',
      [SCREENS.DASHBOARD]:   'Dashboard | Programa 4D',
    }[screenId] || 'Programa 4D — Bela Nutrição';
  }

  // ────────────────────────────────────────────────
  // Roteamento por status do usuário (pós-login)
  // ────────────────────────────────────────────────

  async routeByStatus(uid) {
    const profile = State.get('userProfile');
    const status = profile?.status || USER_STATUS.AWAITING_ONBOARDING;
    const handler = this.statusRoutes[status] || this.statusRoutes.default;

    console.log(`[App] Status do usuário: ${status}`);
    await handler(uid, status);
  }

  /** Escuta mudanças de status no Firestore (para detectar fim do processamento do exame) */
  _watchUserStatus(uid) {
    const unsubscribe = firestoreService.onUserStatusChange?.(uid, async (newStatus) => {
      if (newStatus && newStatus !== USER_STATUS.PROCESSING_BLOOD_TEST) {
        unsubscribe?.();
        const profile = State.get('userProfile') || {};
        State.set('userProfile', { ...profile, status: newStatus });
        await this.routeByStatus(uid);
      }
    });
    if (unsubscribe) this.dataUnsubscribers.push(unsubscribe);
  }

  // ────────────────────────────────────────────────
  // Inicialização
  // ────────────────────────────────────────────────

  async initialize() {
    try {
      const debugLoginOnly = new URLSearchParams(window.location.search).has('loginOnly');

      const firebaseReady = await initializeFirebase();
      if (!firebaseReady) { this._showFatalError('Erro ao conectar com o servidor'); return false; }

      if (debugLoginOnly) {
        this.isInitialized = true;
        return true;
      }

      await firestoreService.initialize();
      const authReady = await authService.initialize();
      if (!authReady) { this._showFatalError('Erro ao inicializar autenticação'); return false; }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[App] initialize error:', error);
      this._showFatalError('Erro ao inicializar aplicação');
      return false;
    }
  }

  isLoginOnlyMode() {
    return new URLSearchParams(window.location.search).has('loginOnly');
  }

  ensureSessionStateShims() {
    const attachObjectShim = (targetName, fallbackValue) => {
      if (typeof window[targetName] !== 'object' || window[targetName] === null) {
        console.debug(`[App] Creating global shim for ${targetName}.`);
        window[targetName] = fallbackValue;
      }
    };

    const attachMethod = (objectName, methodName, implementation) => {
      if (typeof window[objectName][methodName] !== 'function') {
        window[objectName][methodName] = implementation;
      }
    };

    try {
      attachObjectShim('Session', { data: {} });
      attachMethod('Session', 'set', (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
        window.Session[key] = value;
      });
      attachMethod('Session', 'get', (key) => {
        try {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : window.Session[key];
        } catch {
          return window.Session[key];
        }
      });
      attachMethod('Session', 'clear', () => {
        try { localStorage.clear(); } catch {}
        this.resetPlainObject(window.Session, ['set', 'get', 'clear']);
      });

      attachObjectShim('State', { data: {}, listeners: [] });
      attachMethod('State', 'set', (key, value) => {
        window.State.data[key] = value;
        window.State.notify?.();
      });
      attachMethod('State', 'get', (key) => window.State.data[key]);
      attachMethod('State', 'clear', () => {
        window.State.data = {};
        window.State.notify?.();
      });
    } catch (error) {
      console.error('[App] Error ensuring Session/State shims:', error);
    }
  }

  resetPlainObject(objectValue, protectedKeys = []) {
    Object.keys(objectValue).forEach((key) => {
      if (!protectedKeys.includes(key)) delete objectValue[key];
    });
  }

  async handleAuthStateChange(user) {
    if (user) {
      console.log('[App] Usuário logado:', user.uid);
      try { Session.set('userId', user.uid); } catch (error) { console.warn('[App] Session.set failed', error); }
      // Garante que o documento do usuário existe ANTES de qualquer operação
      const profile = await firestoreService.ensureUserDocument(user.uid, user.email);
      try { State.set('userProfile', profile); } catch (error) { console.warn('[App] State.set failed', error); }
      // Carrega appConfig do Firestore (níveis, conquistas, XP events) ANTES
      // de qualquer operação que dependa desses dados (awardXp, unlockAchievement…)
      const config = await firestoreService.preloadAppConfig();
      if (config) {
        State.set('appConfig', config);
        console.log('[App] appConfig carregado:', Object.keys(config));
      }
      this._registerOfflineHandlers(user.uid);
      this._setupConnectionListeners();
      await firestoreService.awardDailyLoginXp(user.uid);
      this._watchPendingActions(user.uid);
      this._watchNotifications(user.uid);
      await this.routeByStatus(user.uid);
      return;
    }

    console.log('[App] Usuário desconectado');
    console.log('[App][DEBUG] Session snapshot before clear:', Session);
    console.log('[App][DEBUG] State snapshot before clear:', State);
    try { Session.clear(); } catch (error) { console.warn('[App] Session.clear failed', error); }
    try { State.clear(); } catch (error) { console.warn('[App] State.clear failed', error); }
    this.navigate(SCREENS.LOGIN);
  }

  start() {
    if (this.isLoginOnlyMode()) {
      console.log('[App] loginOnly debug mode active');
      this.navigate(SCREENS.LOGIN);
      return;
    }

    this.ensureSessionStateShims();
    authService.onAuthStateChanged((user) => this.handleAuthStateChange(user));
  }

  async _handlePendingAction(action, uid) {
    switch (action.type) {
      case 'blood_test_processed':
        notificationService.notify({
          uid: this.currentUser?.uid,
          title: 'Exame processado',
          message: 'Seu exame foi analisado! Preencha o formulário de saúde.',
          type: 'success',
        });
        await this.routeByStatus(uid);
        break;
      case 'meeting_analyzed':
        notificationService.notify({
          uid: this.currentUser?.uid,
          title: 'Reunião analisada',
          message: 'Seus dados foram pré-preenchidos com base na reunião.',
          type: 'success',
        });
        break;
      case 'recipe_ready':
        notificationService.notify({
          uid: this.currentUser?.uid,
          title: 'Nova receita disponível',
          message: 'A Guardiã preparou uma nova receita para você no chat!',
          type: 'status',
        });
        break;
      default:
        notificationService.toast(action.message || 'Você tem uma nova atualização do programa.', { type: 'status' });
        break;
    }

    if (action.id) {
      await firestoreService.markActionSeen(uid, action.id);
    }
  }

  /** Escuta pendingActions para notificações em tempo real */
  _watchPendingActions(uid) {
    const unsubscribe = firestoreService.onPendingActionsChange?.(uid, async (actions) => {
      if (!actions?.length) return;
      for (const action of actions) {
        if (action.seen) continue;
        await this._handlePendingAction(action, uid);
      }
    });
    if (unsubscribe) this.dataUnsubscribers.push(unsubscribe);
  }

  _onNotificationsUpdate(notifications) {
    State.set('notifications', notifications || []);
    if (notifications?.length) {
      console.log('[App] Notificações atualizadas:', notifications.length);
    }
  }

  /** Escuta notificações do usuário para exibição futura na UI */
  _watchNotifications(uid) {
    const unsubscribe = firestoreService.onNotificationsChange?.(uid, (notifications) => {
      this._onNotificationsUpdate(notifications);
    });
    if (unsubscribe) this.dataUnsubscribers.push(unsubscribe);
  }

  _showFatalError(message) {
    const container = DOM.byId('app');
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #dc2626;">
          <h1>❌ Erro Crítico</h1>
          <p>${message}</p>
          <p style="font-size: 12px; margin-top: 20px; color: #666;">
            Por favor, recarregue a página ou contate o suporte.
          </p>
        </div>
      `;
    }
  }

  destroy() {
    this.dataUnsubscribers.forEach(unsub => unsub?.());
    this.dataUnsubscribers = [];
  }

  async debugSignOut() {
    try {
      await authService.logout();
      console.log('[App] debugSignOut completed');
      return true;
    } catch (error) {
      console.error('[App] debugSignOut failed:', error);
      return false;
    }
  }

  /**
   * Registra handlers da fila offline para ações comuns.
   * Chamado uma vez por sessão de usuário autenticado.
   */
  _registerOfflineHandlers(uid) {
    if (this._offlineHandlersRegistered) return;
    this._offlineHandlersRegistered = true;

    // Notificações
    offlineQueue.registerHandler('mark_notification_read', async ({ uid: u, notificationId }) => {
      await firestoreService.markNotificationRead(u || uid, notificationId);
    });
    offlineQueue.registerHandler('mark_notification_unread', async ({ uid: u, notificationId }) => {
      await firestoreService.markNotificationUnread?.(u || uid, notificationId);
    });
    offlineQueue.registerHandler('delete_notification', async ({ uid: u, notificationId }) => {
      await firestoreService.deleteNotification?.(u || uid, notificationId);
    });

    // Chat
    offlineQueue.registerHandler('chat_send', async ({ uid: u, message, sessionId }) => {
      await firestoreService.saveChatMessage(u || uid, { role: 'user', content: message, type: 'text', conversationId: sessionId });
    });

    // AI / n8n — ações enfileiradas quando offline
    offlineQueue.registerHandler('generate_recipe', async ({ uid: u, preferences }) => {
      const { n8nService } = await import('../services/n8n.js');
      await n8nService.generateRecipe(u || uid, preferences || {});
    });
    offlineQueue.registerHandler('agent_chat_message', async ({ uid: u, message, sessionId }) => {
      const { n8nService } = await import('../services/n8n.js');
      await n8nService.sendChatMessage(u || uid, message, sessionId);
    });
    offlineQueue.registerHandler('evaluate_food', async ({ uid: u, foodName, quantity }) => {
      const { n8nService } = await import('../services/n8n.js');
      await n8nService.evaluateFood(u || uid, foodName, quantity);
    });
    offlineQueue.registerHandler('process_blood_test', async ({ uid: u, bloodTestId, driveFileUrl }) => {
      const { n8nService } = await import('../services/n8n.js');
      await n8nService.processBloodTest(u || uid, bloodTestId, driveFileUrl);
    });

    // Comunidade
    offlineQueue.registerHandler('community_like', async ({ uid: u, postId, liked }) => {
      await firestoreService.toggleCommunityLike?.(u || uid, postId, liked);
    });
  }

  /**
   * Configura listeners de online/offline e exibe banners de status.
   *
   * Estados do banner:
   *   🟢 online        → "Conectado à internet" (desaparece em 3s)
   *   🔄 reconnecting  → "Reestabelecendo conexão..." (animado, persiste)
   *   🔴 offline       → "Conexão perdida — suas ações serão salvas localmente" (persiste)
   */
  _setupConnectionListeners() {
    if (this._connectionListenersSetup) return;
    this._connectionListenersSetup = true;

    window.addEventListener('online', () => {
      // Mostra estado de reconexão brevemente e dispara flush da fila
      this._showConnectionBanner('reconnecting', '🔄 Reestabelecendo conexão...', { sticky: true, animated: true });
      offlineQueue.flush()
        .then(() => {
          // Transição para online após flush
          this._showConnectionBanner('online', '🟢 Conectado à internet', { sticky: false, dismissAfter: 3000 });
        })
        .catch(() => {
          this._showConnectionBanner('online', '🟢 Conectado à internet', { sticky: false, dismissAfter: 3000 });
        });
    });

    window.addEventListener('offline', () => {
      this._showConnectionBanner('offline', '🔴 Conexão perdida — suas ações serão salvas localmente', { sticky: true });
    });

    // Estado inicial: se já estiver offline ao carregar, mostra
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this._showConnectionBanner('offline', '🔴 Conexão perdida — suas ações serão salvas localmente', { sticky: true });
    }
  }

  /**
   * Exibe banner de status de conexão no topo da página.
   * @param {'online'|'offline'|'reconnecting'} kind
   * @param {string} text
   * @param {{ sticky?: boolean, animated?: boolean, dismissAfter?: number }} options
   */
  _showConnectionBanner(kind, text, { sticky = false, animated = false, dismissAfter = 0 } = {}) {
    // Substitui banner existente (transição suave)
    const existing = document.querySelector('.connection-banner');
    if (existing) {
      existing.classList.add('fade-out');
      setTimeout(() => existing.remove(), 320);
    }

    const banner = DOM.create('div', `connection-banner ${kind}${animated ? ' anim-pulse' : ''}`);
    banner.textContent = text;
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    document.body.appendChild(banner);

    if (!sticky) {
      const delay = dismissAfter || 3000;
      setTimeout(() => {
        banner.classList.add('fade-out');
        setTimeout(() => banner.remove(), 320);
      }, delay);
    }
  }
}

// ────────────────────────────────────────────────
// Bootstrap
// ────────────────────────────────────────────────

window.app = null;

window.initApp = async () => {
  window.app = new App();
  const ready = await window.app.initialize();
  if (ready) {
    window.app.start();
    console.log('[App] ✅ Inicialização completa');
  } else {
    console.error('[App] ❌ Inicialização falhou');
  }
};

// Auto-init se DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initApp);
} else {
  window.initApp();
}