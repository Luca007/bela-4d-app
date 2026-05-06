// Main Application Entry Point
import { DOM, State, Session } from './utils/helpers.js';
import { Colors } from './config/colors.js';
import { SCREENS } from './config/constants.js';
import { initializeFirebase } from './config/firebase.js';
import { authService } from './services/auth.js';
import { firestoreService } from './services/firestore.js';
import { LoginScreen } from './screens/login.js';
import { OnboardingScreen } from './screens/onboarding.js';
import { CardapioScreen } from './screens/cardapio.js';
import { DashboardScreen } from './screens/dashboard.js';
import { FormsScreen } from './screens/forms.js';

class App {
  constructor() {
    this.currentScreen = null;
    this.screens = new Map();
    this.container = DOM.byId('app');
    this.isInitialized = false;
    this.dataUnsubscribers = [];
    this.setupScreens();
  }

  setupScreens() {
    this.screens.set(SCREENS.LOGIN, LoginScreen);
    this.screens.set(SCREENS.ONBOARDING, OnboardingScreen);
    this.screens.set(SCREENS.CARDAPIO, CardapioScreen);
    this.screens.set(SCREENS.DASHBOARD, DashboardScreen);
    this.screens.set('forms', FormsScreen);
  }

  navigate(screenId, params = {}) {
    // Cleanup current screen
    if (this.currentScreen) {
      this.currentScreen.destroy();
    }

    // Get screen class
    const ScreenClass = this.screens.get(screenId);
    if (!ScreenClass) {
      console.error(`Screen ${screenId} not found`);
      return;
    }

    // Create and mount new screen
    const screenParams = {
      ...params,
      onNavigate: (nextScreenId, nextParams) => this.navigate(nextScreenId, nextParams),
    };
    
    this.currentScreen = new ScreenClass(screenParams);
    this.currentScreen.mount();

    // Update document title
    this.updatePageTitle(screenId);

    // Log navigation for debugging
    console.log(`[Navigation] Moved to: ${screenId}`);
  }

  updatePageTitle(screenId) {
    const titles = {
      [SCREENS.LOGIN]: 'Login | GMP',
      [SCREENS.ONBOARDING]: 'Onboarding | GMP',
      [SCREENS.CARDAPIO]: 'Cardápio | GMP',
      [SCREENS.DASHBOARD]: 'Dashboard | GMP',
      'forms': 'Formulários | GMP',
    };
    document.title = titles[screenId] || 'GMP - Guia Metabólico Personalizado';
  }

  async initialize() {
    try {
      // Initialize Firebase
      const firebaseReady = await initializeFirebase();
      if (!firebaseReady) {
        console.error('Firebase initialization failed');
        this.showError('Erro ao conectar com o servidor');
        return false;
      }
      
      console.log('✅ Firebase initialized');
      
      // Initialize Firestore service
      await firestoreService.initialize();
      console.log('✅ Firestore service initialized');
      
      // Initialize Auth service
      const authReady = await authService.initialize();
      if (!authReady) {
        console.error('Auth service initialization failed');
        this.showError('Erro ao inicializar autenticação');
        return false;
      }
      
      console.log('✅ Auth service initialized');
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('Erro ao inicializar aplicação');
      return false;
    }
  }

  showError(message) {
    const errorDiv = DOM.create('div', 'error-message');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4444;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 3000);
  }

  start() {
    console.log('🚀 App started');
    
    // Subscribe to auth state changes
    authService.onAuthStateChanged(async (user) => {
      if (user) {
        // User is logged in
        console.log('✅ User logged in:', user.uid);
        State.set('currentUser', {
          uid: user.uid,
          email: user.email
        });
        
        // Load user data from Firestore
        this.clearUserDataListeners();
        await this.loadUserData(user.uid);
        
        // Check if onboarding is completed
        const onboardingCompleted = Session.get('onboardingCompleted');
        if (onboardingCompleted) {
          this.navigate(SCREENS.DASHBOARD);
        } else {
          this.navigate(SCREENS.ONBOARDING);
        }
      } else {
        // User is logged out
        console.log('❌ User logged out');
        this.clearUserDataListeners();
        State.set('currentUser', null);
        this.navigate(SCREENS.LOGIN);
      }
    });
  }

  clearUserDataListeners() {
    this.dataUnsubscribers.forEach((unsubscribe) => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.error('Error clearing data listener:', error);
      }
    });

    this.dataUnsubscribers = [];
  }

  async loadUserData(uid) {
    try {
      // Load user profile
      const userProfile = await firestoreService.getUserProfile(uid);
      if (userProfile) {
        State.set('userProfile', userProfile);
        Session.set('userProfile', userProfile);
      }
      
      // Load onboarding data
      const onboardingData = await firestoreService.getOnboardingData(uid);
      if (onboardingData) {
        State.set('onboardingData', onboardingData);
        Session.set('onboardingData', onboardingData);
        Session.set('onboardingCompleted', true);
      }
      
      // Load recipes
      const recipes = await firestoreService.getRecipes(uid);
      State.set('recipes', recipes);
      
      // Load achievements
      const achievements = await firestoreService.getAchievements(uid);
      State.set('achievements', achievements);
      
      // Setup real-time listeners
      const recipesUnsubscribe = firestoreService.onRecipesChange(uid, (recipes) => {
        State.set('recipes', recipes);
      });
      
      const achievementsUnsubscribe = firestoreService.onAchievementsChange(uid, (achievements) => {
        State.set('achievements', achievements);
      });

      if (typeof recipesUnsubscribe === 'function') {
        this.dataUnsubscribers.push(recipesUnsubscribe);
      }

      if (typeof achievementsUnsubscribe === 'function') {
        this.dataUnsubscribers.push(achievementsUnsubscribe);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
}

// Initialize app when DOM is ready and Firebase is loaded
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new App();

  const success = await window.app.initialize();
  if (success) {
    window.app.start();
  }
});

// Handle unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
