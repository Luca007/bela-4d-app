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
  'recipes':      () => import('./screens/recipes.js').then(m => m.RecipesScreen),
  'food-search':  () => import('./screens/food-search.js').then(m => m.FoodSearchScreen),
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
      [USER_STATUS.AWAITING_ONBOARDING]: async () => {
        this.navigate(SCREENS.AWAITING, { status: USER_STATUS.AWAITING_ONBOARDING });
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

  async navigate(screenId, params = {}) {
    if (this.currentScreen) {
      try { this.currentScreen.destroy?.(); } catch (_) {}
    }

    let ScreenClass = this.screens.get(screenId);

    if (!ScreenClass && lazyScreens[screenId]) {
      try {
        ScreenClass = await lazyScreens[screenId]();
        this.screens.set(screenId, ScreenClass);
      } catch (err) {
        console.error(`[App] Failed to load screen: ${screenId}`, err);
        return;
      }
    }

    if (!ScreenClass) {
      console.error(`[App] Screen not found: ${screenId}`);
      return;
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

  _pageTitle(screenId) {
    return {
      [SCREENS.LOGIN]:       'Login | Programa 4D',
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
      const profile = await firestoreService.getUserProfile(user.uid);
      try { State.set('userProfile', profile); } catch (error) { console.warn('[App] State.set failed', error); }
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

  /** Escuta pendingActions para notificações em tempo real */
  _watchPendingActions(uid) {
    const unsubscribe = firestoreService.onPendingActionsChange?.(uid, async (actions) => {
      if (!actions?.length) return;

      for (const action of actions) {
        if (action.seen) continue;
        switch (action.type) {
          case 'blood_test_processed':
            notificationService.toast('Exame processado! Preencha o formulário de saúde.', { type: 'success' });
            await this.routeByStatus(uid);
            break;
          case 'meeting_analyzed':
            notificationService.toast('Reunião analisada! Seus dados foram pré-preenchidos.', { type: 'success' });
            break;
          case 'recipe_ready':
            notificationService.toast('Nova receita disponível no chat!', { type: 'status' });
            break;
          default:
            notificationService.toast(action.message || 'Você tem uma nova atualização do programa.', { type: 'status' });
            break;
        }

        if (action.id) {
          await firestoreService.markActionSeen(uid, action.id);
        }
      }
    });
    if (unsubscribe) this.dataUnsubscribers.push(unsubscribe);
  }

  /** Escuta notificações do usuário para exibição futura na UI */
  _watchNotifications(uid) {
    const unsubscribe = firestoreService.onNotificationsChange?.(uid, (notifications) => {
      State.set('notifications', notifications || []);
      if (notifications?.length) {
        console.log('[App] Notificações atualizadas:', notifications.length);
      }
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