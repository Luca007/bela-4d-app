// MOCK firestoreService — used only by test pages
const memory = {
  healthForm: null,
};

export const firestoreService = {
  __memory: memory,

  async getHealthForm(uid) {
    console.log('[MOCK firestore] getHealthForm', { uid });
    return memory.healthForm;
  },

  async saveHealthFormDraft(uid, formData, currentSection = 0) {
    if (!uid) return false;
    memory.healthForm = {
      ...formData,
      completed: false,
      draftSection: currentSection,
      updatedAt: new Date().toISOString(),
    };
    console.log('[MOCK firestore] saveHealthFormDraft', { uid, currentSection, fieldCount: Object.keys(formData).length });
    window.__lastDraftSave = memory.healthForm;
    return true;
  },

  async saveHealthForm(uid, formData, opts = {}) {
    if (!uid) return false;
    memory.healthForm = {
      ...formData,
      ...opts,
      updatedAt: new Date().toISOString(),
    };
    console.log('[MOCK firestore] saveHealthForm', { uid, opts, fieldCount: Object.keys(formData).length });
    window.__lastFinalSave = memory.healthForm;
    return true;
  },
};
