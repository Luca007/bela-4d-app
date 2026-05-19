// MOCK notificationService — used only by test pages
export const notificationService = {
  async notify(opts) {
    console.log('[MOCK notifications] notify', opts);
    window.__lastNotification = opts;
    return true;
  },
};
