// MOCK authService — used only by test pages
const mockUser = {
  uid: 'test-user-uid-123',
  email: 'test@bela4d.com',
  displayName: 'Maria Teste',
  getIdToken: async () => 'mock-id-token',
};

export class AuthService {
  constructor() {
    this.currentUser = mockUser;
    this.initialized = true;
  }
  async initialize() { return true; }
  async login() { return { success: true, user: mockUser, uid: mockUser.uid }; }
  async sendPasswordReset() { return { success: true }; }
  async logout() { this.currentUser = null; return true; }
  getCurrentUser() { return this.currentUser; }
  isAuthenticated() { return !!this.currentUser; }
  async getIdToken() { return 'mock-id-token'; }
  onAuthStateChanged(cb) { cb(this.currentUser); return () => {}; }
  isValidEmail(e) { return /.+@.+/.test(e); }
  getErrorMessage(e) { return e?.message || 'erro'; }
}

export const authService = new AuthService();
