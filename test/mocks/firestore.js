// MOCK firestoreService — used only by test pages
// Extended to cover all screens for visual screenshot testing.
const memory = {
  healthForm: null,
  menuForm: null,
  formProgress: null,
  userProfile: {
    name: 'Maria Teste',
    email: 'test@bela4d.com',
    avatar: '🌸',
    avatarColor: '#f0059a',
    xp: 520,
    level: 3,
    streak: 5,
    totalRecipes: 8,
    totalChatMessages: 22,
    status: 'active',
    onboardingCompleted: true,
    healthFormCompleted: true,
    menuFormCompleted: true,
    profile: {
      name: 'Maria Teste',
      birthDate: '1985-03-12',
      gender: 'Feminino',
      weight: 72.5,
      height: 163,
    },
    diagnostics: ['Pré-diabetes', 'Sobrepeso'],
    lastActivityDate: new Date().toISOString(),
  },
};

const recipes = [
  { id: 'r1', title: 'Salmão grelhado com abobrinha', tags: ['low-carb','jantar'], calories: 420, createdAt: new Date().toISOString() },
  { id: 'r2', title: 'Bowl de frango e brócolis', tags: ['almoço','proteico'], calories: 380, createdAt: new Date().toISOString() },
  { id: 'r3', title: 'Omelete de espinafre', tags: ['café','rápido'], calories: 260, createdAt: new Date().toISOString() },
];

const achievements = [
  { id: 'first_step', title: 'Primeiro Passo', description: 'Complete o cadastro', icon: '🌱', xp: 50, unlocked: true, claimed: true, unlockedAt: new Date().toISOString() },
  { id: 'consistent', title: 'Consistente', description: '7 dias seguidos', icon: '🔥', xp: 100, unlocked: true, claimed: false, unlockedAt: new Date().toISOString() },
];

const chatHistory = [
  { id: 'm1', role: 'assistant', content: 'Olá Maria! Como posso te ajudar hoje?', type: 'text', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 'm2', role: 'user', content: 'Quero uma receita low-carb para o jantar', type: 'text', timestamp: new Date(Date.now() - 540000).toISOString() },
  { id: 'm3', role: 'assistant', content: 'Que tal um salmão grelhado com legumes? Posso gerar a receita completa.', type: 'text', timestamp: new Date(Date.now() - 480000).toISOString() },
];

const notifications = [
  { id: 'n1', title: 'Bem-vinda!', message: 'Seu programa começou.', type: 'welcome', priority: 'high', read: false, createdAt: new Date().toISOString() },
];

const ranking = [
  { position: 1, uid: 'u1', name: 'Ana', xp: 1200, level: 5, streak: 12, avatar: '🌺', avatarColor: '#f0059a' },
  { position: 2, uid: 'u2', name: 'Beatriz', xp: 980, level: 4, streak: 8, avatar: '🌷', avatarColor: '#ec4899' },
  { position: 3, uid: 'test-user-uid-123', name: 'Maria Teste', xp: 520, level: 3, streak: 5, avatar: '🌸', avatarColor: '#f0059a' },
];

function noopUnsub() { return () => {}; }

export const firestoreService = {
  __memory: memory,

  async initialize() { return true; },

  // ── Profile ───────────────────────────
  async getUserProfile(uid) { return memory.userProfile; },
  async saveUserProfile(uid, data) {
    memory.userProfile = { ...memory.userProfile, ...data };
    return true;
  },
  async ensureUserDocument(uid, email) { return memory.userProfile; },
  async updateUserStatus(uid, status) { memory.userProfile.status = status; return true; },
  async scheduleOnboardingMeeting(uid, isoDatetime, timezone = null) {
    memory.userProfile.meeting = {
      scheduledFor: isoDatetime,
      scheduledAt: new Date().toISOString(),
      timezone: timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone),
      status: 'scheduled',
    };
    window.__lastMeetingSchedule = memory.userProfile.meeting;
    return true;
  },
  async cancelOnboardingMeeting(uid) {
    if (memory.userProfile.meeting) memory.userProfile.meeting.status = 'cancelled';
    return true;
  },

  // ── Health Form ───────────────────────
  async getHealthForm(uid) { return memory.healthForm; },
  async saveHealthFormDraft(uid, formData, currentSection = 0) {
    memory.healthForm = { ...formData, completed: false, draftSection: currentSection };
    window.__lastDraftSave = memory.healthForm;
    return true;
  },
  async saveHealthForm(uid, formData, opts = {}) {
    memory.healthForm = { ...formData, ...opts };
    window.__lastFinalSave = memory.healthForm;
    return true;
  },

  // ── Onboarding interview ──────────────
  async getOnboardingInterview(uid) { return null; },
  async saveOnboardingData(uid, data) { return true; },
  async saveOnboardingInterview(uid, data) { return true; },

  // ── Menu form ─────────────────────────
  async getMenuForm(uid) { return memory.menuForm; },
  async saveMenuForm(uid, formData, completed = false) {
    memory.menuForm = { ...formData, completed };
    return true;
  },

  // ── Form progress ─────────────────────
  async getFormProgress(uid) { return memory.formProgress; },
  async saveFormProgress(uid, data) { memory.formProgress = { ...(memory.formProgress||{}), ...data }; return true; },
  async submitFormsComplete(uid, formData) { memory.formProgress = { ...formData, completed: true }; return true; },

  // ── Blood tests / exams ───────────────
  async saveBloodTest(uid, payload) { return 'bt-mock-1'; },
  async updateBloodTestExtraction(uid, id, data) { return true; },
  async getLatestBloodTest(uid) { return null; },
  async saveExamRequest(uid, payload) { return 'er-mock-1'; },
  async getLatestExamRequest(uid) { return null; },

  // ── Chat ──────────────────────────────
  async saveChatMessage(uid, msg) {
    const id = 'm-' + (chatHistory.length + 1);
    chatHistory.push({ id, ...msg, timestamp: new Date().toISOString() });
    return id;
  },
  async getChatHistory(uid, max = 50) { return chatHistory.slice(0, max); },
  onChatHistoryUpdate(uid, cb) { cb(chatHistory); return noopUnsub(); },
  onChatHistoryChange(uid, cb) { cb(chatHistory); return noopUnsub(); },

  // ── Recipes ───────────────────────────
  async getAllRecipes(uid) { return recipes; },
  async saveRecipe(uid, data) { recipes.push({ id: 'r-' + recipes.length, ...data, createdAt: new Date().toISOString() }); return 'r-mock'; },
  onRecipesChange(uid, cb) { cb(recipes); return noopUnsub(); },

  // ── Food eval ─────────────────────────
  async saveFoodEvaluation(uid, data) { return 'fe-mock'; },
  async getFoodEvaluations(uid, lim = 50) { return []; },

  // ── Notifications ─────────────────────
  async createNotification(uid, data) { notifications.push({ id: 'n-' + notifications.length, ...data, createdAt: new Date().toISOString(), read: false }); return 'n-mock'; },
  async markNotificationRead(uid, id) { const n = notifications.find(x => x.id === id); if (n) n.read = true; return true; },
  async markNotificationUnread(uid, id) { const n = notifications.find(x => x.id === id); if (n) n.read = false; return true; },
  async deleteNotification(uid, id) { return true; },
  onNotificationsChange(uid, cb) { cb(notifications); return noopUnsub(); },

  // ── Achievements / Gamification ───────
  onAchievementsChange(uid, cb) { cb(achievements); return noopUnsub(); },
  async unlockAchievement(uid, id) { return true; },
  async claimAchievement(uid, id) { return true; },
  async getTopRanking(limitCount = 10) { return ranking.slice(0, limitCount); },
  async awardXp(uid, amount, eventId) { return amount; },
  async awardDailyLoginXp(uid) { return true; },
  async logXPEvent(uid, type, details) { return true; },
  onXpLogChange(uid, cb) { cb(null); return noopUnsub(); },

  // ── User status / pending ─────────────
  onUserStatusChange(uid, cb) { cb(memory.userProfile.status, memory.userProfile); return noopUnsub(); },
  onPendingActionsChange(uid, cb) { cb([]); return noopUnsub(); },
  async markActionSeen(uid, id) { return true; },
  async recordSectionVisit(uid, sectionId) { return true; },

  // ── Generic getters ───────────────────
  async getUserData(uid, path) { return null; },
  async saveUserData(uid, path, data) { return true; },

  // ── App config ────────────────────────
  async getAppConfig(docId) { return null; },
  async preloadAppConfig() { return {}; },

  // ── Cloud function ────────────────────
  async callCloudFunction(name, data) { return { ok: true }; },

  // ── Helpers ───────────────────────────
  async incrementCounter(uid, field) { return true; },
};
