// Firebase Authentication Service
import { getAuth } from '../config/firebase.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

export class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.initialized = false;
    this.pendingLoginPromise = null;
    this.pendingLoginKey = null;
  }

  /**
   * Initialize authentication listener
   * This should be called once when the app starts
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      const auth = getAuth();
      
      // Listen for auth state changes
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this.notifyListeners();
      });
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return false;
    }
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Email e senha são obrigatórios' };
    }
    if (!this.isValidEmail(email)) {
      return { success: false, error: 'E-mail inválido e/ou senha incorreta' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const requestKey = `${normalizedEmail}|${password}`;

    if (this.pendingLoginPromise && this.pendingLoginKey === requestKey) {
      return this.pendingLoginPromise;
    }

    this.pendingLoginKey = requestKey;
    this.pendingLoginPromise = (async () => {
      try {
        const auth = getAuth();
        const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        return {
          success: true,
          user: result.user,
          uid: result.user.uid
        };
      } catch (error) {
        const code = error?.code || '';
        const isExpectedAuthFailure = code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-email';
        if (!isExpectedAuthFailure) {
          console.error('Login error:', error);
        }
        return {
          success: false,
          error: this.getErrorMessage(error)
        };
      } finally {
        this.pendingLoginPromise = null;
        this.pendingLoginKey = null;
      }
    })();

    return this.pendingLoginPromise;
  }

  /**
   * Send password reset email via Firebase Auth.
   * @param {string} email
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendPasswordReset(email) {
    if (!email || !email.trim()) {
      return { success: false, error: 'Email não informado' };
    }
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: this._friendlyResetError(error) };
    }
  }

  _friendlyResetError(error) {
    const code = error?.code || error?.message || '';
    if (code.includes('user-not-found')) return 'Email não cadastrado no sistema.';
    if (code.includes('invalid-email')) return 'Email inválido.';
    if (code.includes('too-many-requests')) return 'Muitas tentativas. Aguarde alguns minutos.';
    return 'Não foi possível enviar o email de recuperação.';
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      const auth = getAuth();
      await signOut(auth);
      this.currentUser = null;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Get user ID token
   */
  async getIdToken() {
    if (!this.currentUser) {
      return null;
    }
    return await this.currentUser.getIdToken();
  }

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Function to call when auth state changes
   */
  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  notifyListeners() {
    this.authListeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('Error in auth state change listener:', error);
      }
    });
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    const errorMessages = {
      'auth/invalid-email': 'E-mail inválido e/ou senha incorreta',
      'auth/invalid-credential': 'E-mail ou senha inválidos',
      'auth/user-disabled': 'Usuário desativado',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/too-many-requests': 'Muitas tentativas de login. Tente novamente mais tarde.',
      'auth/operation-not-allowed': 'Operação não permitida',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
    };

    return errorMessages[error.code] || error.message || 'Erro ao fazer login';
  }
}

// Export singleton instance
export const authService = new AuthService();
