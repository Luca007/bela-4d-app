// MOCK notificationService — used only by test pages
export const notificationService = {
  toast(text, opts = {}) {
    console.log('[MOCK notifications] toast', text, opts);
    window.__lastToast = { text, opts };
  },
  async notify(opts) {
    console.log('[MOCK notifications] notify', opts);
    window.__lastNotification = opts;
    if (opts?.message) this.toast(opts.message, { type: opts.type });
    return true;
  },
  showAchievement(opts = {}) {
    console.log('[MOCK notifications] showAchievement', opts);
    window.__lastAchievement = opts;
  },
  banner(opts = {}) {
    console.log('[MOCK notifications] banner', opts);
    window.__lastBanner = opts;
  },
  modal(opts = {}) {
    console.log('[MOCK notifications] modal', opts);
    window.__lastModal = opts;
    return { close: () => {} };
  },
};
export default notificationService;
