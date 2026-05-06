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

// Telas
import { LoginScreen }      from './screens/login.js';
import { AwaitingScreen }   from './screens/awaiting.js';
import { ExamUploadScreen } from './screens/exam-upload.js';
import { HealthFormScreen } from './screens/health-form.js';
import { OnboardingScreen } from './screens/onboarding.js';
import { CardapioScreen }   from './screens/cardapio.js';
import { DashboardScreen }  from './screens/dashboard.js';
import { ChatScreen }       from './screens/chat.js';
import { RecipesScreen }    from './screens/recipes.js';
import { FoodSearchScreen } from './screens/food-search.js';
import { FormsScreen }      from './screens/forms.js';

class App {
  constructor() {
    this.currentScreen = null;
    this.container = DOM.byId('app');
    this.isInitialized = false;
    this.dataUnsubscribers = [];

    // Mapa tela-id → classe
    this.screens = new Map([
      [SCREENS.LOGIN,      LoginScreen],
      [SCREENS.AWAITING,   AwaitingScreen],
      [SCREENS.EXAM_UPLOAD, ExamUploadScreen],
      [SCREENS.HEALTH_FORM, HealthFormScreen],
      [SCREENS.ONBOARDING,  OnboardingScreen],
      [SCREENS.CARDAPIO,    CardapioScreen],
      [SCREENS.DASHBOARD,   DashboardScreen],
      [SCREENS.CHAT,        ChatScreen],
      [SCREENS.RECIPES,     RecipesScreen],
      [SCREENS.FOOD_SEARCH, FoodSearchScreen],
      [SCREENS.FORMS,       FormsScreen],
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

  navigate(screenId, params = {}) {
    if (this.currentScreen) {
      try { this.currentScreen.destroy?.(); } catch (_) {}
    }

    const ScreenClass = this.screens.get(screenId);
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
      const firebaseReady = await initializeFirebase();
      if (!firebaseReady) { this._showFatalError('Erro ao conectar com o servidor'); return false; }

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

  start() {
    authService.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('[App] Usuário logado:', user.uid);
        Session.set('userId', user.uid);
        const profile = await firestoreService.getUserProfile(user.uid);
        State.set('userProfile', profile);
        this._watchPendingActions(user.uid);
        this._watchNotifications(user.uid);
        await this.routeByStatus(user.uid);
      } else {
        console.log('[App] Usuário desconectado');
        Session.clear();
        State.clear();
        this.navigate(SCREENS.LOGIN);
      }
    });
  }

  /** Escuta pendingActions para notificações em tempo real */
  _watchPendingActions(uid) {
    const unsubscribe = firestoreService.onPendingActionsChange?.(uid, async (actions) => {
      if (actions && actions.length > 0) {
        const latestAction = actions[0];
        console.log('[App] Nova ação pendente:', latestAction.type);
        // Aqui você pode disparar notificações ou redirecionar o usuário
        // this.showNotification(latestAction);
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