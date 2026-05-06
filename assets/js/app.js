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
      ['forms',             FormsScreen],
    ]);
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

    console.log(`[App] Status do usuário: ${status}`);

    switch (status) {
      // ── Aguardando reunião ──
      case USER_STATUS.AWAITING_ONBOARDING:
        this.navigate(SCREENS.AWAITING, { status });
        break;

      // ── Tem exame, precisa enviar ──
      case USER_STATUS.PENDING_BLOOD_TEST:
        this.navigate(SCREENS.AWAITING, { status });
        break;

      // ── Exame sendo processado pela IA ──
      case USER_STATUS.PROCESSING_BLOOD_TEST:
        this.navigate(SCREENS.AWAITING, { status });
        // Fica escutando mudança de status em tempo real
        this._watchUserStatus(uid);
        break;

      // ── Pedido de exame enviado ao médico ──
      case USER_STATUS.EXAM_REQUEST_SENT: {
        const examRequest = await firestoreService.getLatestExamRequest(uid);
        this.navigate(SCREENS.AWAITING, { status, examRequest });
        break;
      }

      // ── Pronto para preencher/confirmar Form 1 ──
      case USER_STATUS.FILLING_HEALTH_FORM: {
        const bloodTest = await firestoreService.getLatestBloodTest(uid);
        const aiPrefillData = bloodTest?.extractedData || null;
        this.navigate(SCREENS.HEALTH_FORM, { aiPrefillData });
        break;
      }

      // ── Form 1 pronto, aguardando semana 3 ──
      case USER_STATUS.AWAITING_MENU_FORM:
        this.navigate(SCREENS.AWAITING, { status });
        break;

      // ── Semana 3: preencher Form Pré-Cardápio ──
      case USER_STATUS.FILLING_MENU_FORM:
        this.navigate(SCREENS.CARDAPIO);
        break;

      // ── Tudo completo: dashboard ──
      case USER_STATUS.ACTIVE:
      default:
        this.navigate(SCREENS.DASHBOARD);
        break;
    }
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
        S