// Dashboard Screen - JSX-inspired refactor (modularizado)
import { DOM, State, Session } from '../utils/helpers.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { authService } from '../services/auth.js';
import { firestoreService } from '../services/firestore.js';
import { getLevels, getAchievementsCatalog, getNavItems } from '../config/constants.js';
import { offlineQueue } from '../modules/offline-queue.js';
import { ConnectionIndicator } from '../modules/connection-indicator.js';
import { dashSkeleton } from '../modules/loading-states.js';
import { EXAM_RESULTS, EXAM_ORDERS } from '../config/data.js';
import { getGreeting, getStaticRecipes, getStaticRefeicoes, getStaticDicas, getStaticRanking, normalizeAvatarEmoji } from './dashboard/helpers.js';
import { render as renderInicio } from './dashboard/inicio.js';
import { render as renderEvolucao } from './dashboard/evolucao.js';
import { renderRecipes } from './dashboard/receitas.js';
import { render as renderExames } from './dashboard/exames.js';
import { render as renderConquistas } from './dashboard/conquistas.js';
import { render as renderChat } from './dashboard/chat.js';
import { render as renderPerfil } from './dashboard/perfil.js';

export class DashboardScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.currentNav = params.initialNav || 'inicio';
    this.currentUser = authService.getCurrentUser();
    this.userProfile = State.get('userProfile') || {};
    this.recipes = State.get('recipes') || getStaticRecipes();
    this.achievements = State.get('achievements') || getAchievementsCatalog();
    this.navItems = getNavItems();
    this.chatHistory = State.get('chatHistory') || [];
    this.dailyMeals = State.get('dailyMeals') || this.userProfile.dailyMeals || getStaticRefeicoes();
    this.mealDraft = { icon: '🍽️', nome: '', hora: '08:00', desc: '' };
    this.recipesView = 'catalogo';
    this.sideOpen = false;
    this.recipesUnlocked = Boolean(this.userProfile?.onboardingCompleted || this.userProfile?.status === 'active');
    this.examTab = 'pedidos';
    this.profileAvatar = {
      emoji: normalizeAvatarEmoji(this.userProfile.avatar),
      color: this.userProfile.avatarColor || '#f0059a',
      nick: this.userProfile.name ? `@${this.userProfile.name.trim().toLowerCase()}` : '@voce',
    };
    this.xp = Number(this.userProfile?.xp ?? 0);
    this.streak = Number(this.userProfile?.streak ?? 0);
    this.homeChatMessages = [{ r: 'ai', t: 'Olá! Posso sugerir uma receita, tirar dúvida sobre alimentação ou te ajudar com o cardápio de hoje. O que você precisa?' }];
    this.homeChecked = new Set();
    this.homeChatInput = '';
    this.chatSessionId = `${this.currentUser?.uid || 'anon'}_${Date.now()}`;
    this.chatRecipeContext = null;
    this.communityTab = 'badges';
    this.communityFeed = State.get('communityFeed') || this.userProfile.communityFeed || FEED0();
    this.commentOpenId = null;
    this.commentText = '';
    this.notifications = State.get('notifications') || [];
    this.notificationPanelOpen = false;
    this.recipeFilter = 'Todas';
    const initialRecipeId = params.recipeId || null;
    this.selectedRecipe = initialRecipeId ? getStaticRecipes().find(recipe => recipe.id === initialRecipeId) || null : null;
    this.recipeOriginNav = null;
    this.themeToggleLocked = false;
    this.examOrders = Array.isArray(this.userProfile?.examOrders) && this.userProfile.examOrders.length ? this.userProfile.examOrders : EXAM_ORDERS;
    this.dicas = State.get('belaTips') || this.userProfile.belaTips || getStaticDicas().map((dica, index) => ({ ...dica, id: `dica-${index + 1}`, likes: 0, dislikes: 0, myVote: null }));
    this.ranking = State.get('ranking') || getStaticRanking();
    this.examResults = State.get('examResults') || EXAM_RESULTS;
    this._dataLoaded = false;
    this._dataLoading = false;
    this.themeMode = this.loadThemeMode();
    this.isDark = this.resolveThemeIsDark(this.themeMode);
    this._connIndicatorInjected = false;

    this.setupFirestoreListeners();
    State.subscribe(data => {
      if (data.userProfile) {
        const prevXp = Number(this.xp || 0);
        this.userProfile = data.userProfile;
        this.profileAvatar = {
          emoji: normalizeAvatarEmoji(data.userProfile.avatar, this.profileAvatar.emoji),
          color: data.userProfile.avatarColor || this.profileAvatar.color,
          nick: data.userProfile.name ? `@${data.userProfile.name.trim().toLowerCase()}` : this.profileAvatar.nick,
        };
        this.xp = Number(data.userProfile.xp ?? this.xp);
        this.streak = Number(data.userProfile.streak ?? this.streak);
        // Unlock recipes automatically when onboarding completed or user active
        this.recipesUnlocked = Boolean(data.userProfile.onboardingCompleted || data.userProfile.status === 'active' || this.recipesUnlocked);
        // detect newly unlocked achievements and notify
        try {
          const prev = Array.isArray(this.achievements) ? this.achievements.reduce((m, a) => (m[a.id] = a, m), {}) : {};
          const next = Array.isArray(data.achievements) ? data.achievements : this.achievements;
          if (next && prev) {
            next.forEach(item => {
              const id = item.id || item.slug || item.nm;
              const was = prev[id]?.ok || prev[id]?.unlocked || false;
              const now = item.ok || item.unlocked || false;
              if (!was && now) {
                import('../modules/notifications.js').then(mod => mod.notificationService.showAchievement({ icon: item.e || '🏆', title: item.nm || 'Conquista', subtitle: item.ds || '', xp: Number(item.xp || 0) }));
              }
            });
          }
        } catch (e) { /* ignore */ }
        try {
          const prevLevel = this.getLevel(prevXp);
          const newLevel = this.getLevel(this.xp);
          if (newLevel.level > prevLevel.level) {
            import('../modules/notifications.js').then(mod => {
              mod.notificationService.showAchievement({
                icon: '⭐',
                title: `Nível ${newLevel.level} desbloqueado!`,
                subtitle: newLevel.title,
                xp: 0,
              });
              // Persist to bell dropdown
              const uid = this.currentUser?.uid || authService?.currentUser?.uid;
              if (uid) {
                mod.notificationService.notify({
                  uid,
                  title: `⭐ Nível ${newLevel.level} alcançado!`,
                  message: `Parabéns! Você chegou ao nível ${newLevel.level}: ${newLevel.title}`,
                  type: 'achievement',
                  priority: 'high',
                  payload: { level: newLevel.level, title: newLevel.title },
                });
              }
            });
          }
        } catch (e) { /* ignore */ }
      }
      if (data.recipes) this.recipes = data.recipes;
      if (data.achievements) this.achievements = data.achievements;
      if (data.chatHistory) this.chatHistory = data.chatHistory;
      if (Array.isArray(data.userProfile?.dailyMeals)) this.dailyMeals = data.userProfile.dailyMeals;
      if (Array.isArray(data.dailyMeals)) this.dailyMeals = data.dailyMeals;
      if (Array.isArray(data.userProfile?.communityFeed)) this.communityFeed = data.userProfile.communityFeed;
      if (Array.isArray(data.communityFeed)) this.communityFeed = data.communityFeed;
      if (Array.isArray(data.userProfile?.belaTips)) this.dicas = data.userProfile.belaTips;
      if (Array.isArray(data.belaTips)) this.dicas = data.belaTips;
      if (Array.isArray(data.userProfile?.examOrders)) this.examOrders = data.userProfile.examOrders;
      if (Array.isArray(data.notifications)) this.notifications = data.notifications;
    });
  }

  mountPreservingScroll() {
    const scrollHost = this.element?.querySelector('.dash-content');
    const previousScroll = scrollHost ? scrollHost.scrollTop : 0;
    this.mount();
    requestAnimationFrame(() => {
      const nextHost = this.element?.querySelector('.dash-content');
      if (nextHost) nextHost.scrollTop = previousScroll;
    });
  }

  async persistProfileFields(fields = {}, { silent = false } = {}) {
    if (!this.currentUser?.uid) return;
    const nextProfile = { ...(this.userProfile || {}), ...fields };
    this.userProfile = nextProfile;
    const loader = silent ? null : UIComponents.loaderOverlay({ message: 'Salvando alterações...', color: '#f0059a' });
    if (loader) document.body.appendChild(loader);
    try {
      await firestoreService.saveUserProfile(this.currentUser.uid, nextProfile);
      State.set('userProfile', nextProfile);
    } catch (error) {
      console.error('[DashboardV2] persistProfileFields failed:', error);
    } finally {
      if (loader) loader.remove();
    }
  }

  loadThemeMode() {
    try {
      return localStorage.getItem('gmp-theme-mode') || 'system';
    } catch {
      return 'system';
    }
  }

  resolveThemeIsDark(mode) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  saveTheme(mode) {
    const nextMode = mode === 'dark' || mode === 'light' || mode === 'system'
      ? mode
      : (mode ? 'dark' : 'light');
    try { localStorage.setItem('gmp-theme-mode', nextMode); } catch {}
    this.themeMode = nextMode;
    this.isDark = this.resolveThemeIsDark(nextMode);
    try { State.set('uiThemeDark', this.isDark); } catch {}
  }

  setupFirestoreListeners() {
    if (!this.currentUser) return;

    this.recipeUnsubscribe = firestoreService.onRecipesChange?.(this.currentUser.uid, recipes => {
      this.recipes = recipes;
      State.set('recipes', recipes);
      this._refreshSection('receitas');
      this._refreshSection('inicio');
    });

    this.achievementsUnsubscribe = firestoreService.onAchievementsChange?.(this.currentUser.uid, achievements => {
      this.achievements = achievements;
      State.set('achievements', achievements);
      this._refreshSection('conquistas');
    });

    this.chatUnsubscribe = firestoreService.onChatHistoryChange?.(this.currentUser.uid, messages => {
      this.chatHistory = messages;
      State.set('chatHistory', messages);
    });
  }

  _refreshSection(navId) {
    if (this.currentNav !== navId) return;
    this.mountPreservingScroll();
  }

  async mount() {
    super.mount();
    // Injeta indicador de conexão persistente no header
    this._injectConnectionIndicator();
    if (!this._dataLoaded) {
      // Mostra skeleton enquanto carrega
      this._showSkeletonForCurrentTab();
      await this._loadFirestoreData();
    }
  }

  _injectConnectionIndicator() {
    if (this._connIndicatorInjected) return;
    const anchor = this.element?.querySelector('#conn-indicator-anchor');
    if (anchor && !anchor.hasChildNodes()) {
      const indicator = ConnectionIndicator.create();
      anchor.appendChild(indicator);
      this._connIndicatorInjected = true;
    }
  }

  _showSkeletonForCurrentTab() {
    const contentEl = this.element?.querySelector('.dash-content');
    if (!contentEl) return;
    // Só mostra skeleton se o conteúdo atual for placeholder de loading
    const loadingEl = contentEl.querySelector('[data-loading]');
    if (loadingEl) {
      const skel = dashSkeleton(this.currentNav);
      loadingEl.replaceWith(skel);
    }
  }

  async _loadUserData(uid) {
    const [ranking] = await Promise.allSettled([
      firestoreService.getTopRanking?.(20),
    ]);
    let needsRefresh = false;

    const hasRankingData = ranking.status === 'fulfilled' && Array.isArray(ranking.value) && ranking.value.length > 0;
    if (hasRankingData) {
      this.ranking = ranking.value.map((user, i) => ({
        p: user.position || i + 1,
        nm: user.name || 'Usuária',
        nk: `@${(user.name || 'user').split(' ')[0].toLowerCase()}`,
        e: user.avatar || '🌸',
        col: user.avatarColor || '#f0059a',
        xp: user.xp || 0,
        st: user.streak || 0,
        me: user.uid === this.currentUser?.uid,
      }));
      State.set('ranking', this.ranking);
      needsRefresh = true;
    }

    return needsRefresh;
  }

  async _loadActivityData(uid) {
    const [latestExam, latestRequest, menuForm, chatHistory] = await Promise.allSettled([
      firestoreService.getLatestBloodTest?.(uid),
      firestoreService.getLatestExamRequest?.(uid),
      firestoreService.getMenuForm?.(uid),
      firestoreService.getChatHistory?.(uid, 3),
    ]);
    let needsRefresh = false;

    const hasExamData = latestExam.status === 'fulfilled' && Boolean(latestExam.value?.extractedData);
    if (hasExamData) {
      this.examResults = latestExam.value.extractedData;
      needsRefresh = true;
    }

    const hasExamRequest = latestRequest.status === 'fulfilled' && Boolean(latestRequest.value);
    if (hasExamRequest) {
      this.examOrders = [latestRequest.value, ...(this.examOrders || []).filter(o => o.id !== latestRequest.value?.id)];
      needsRefresh = true;
    }

    const hasMenuForm = menuForm.status === 'fulfilled' && Array.isArray(menuForm.value?.mealTimes) && menuForm.value.mealTimes.length > 0;
    if (hasMenuForm) {
      this.dailyMeals = menuForm.value.mealTimes.filter(m => m.enabled !== false);
      needsRefresh = true;
    }

    const hasChatHistory = chatHistory.status === 'fulfilled' && Array.isArray(chatHistory.value) && chatHistory.value.length > 0;
    if (hasChatHistory) {
      const msgs = chatHistory.value.map(m => ({ r: m.role === 'user' ? 'user' : 'ai', t: m.content }));
      if (msgs.length) this.homeChatMessages = msgs;
      needsRefresh = true;
    }

    return needsRefresh;
  }

  async _loadFirestoreData() {
    if (this._dataLoading || this._dataLoaded) return;
    this._dataLoading = true;
    if (!this.currentUser?.uid) { this._dataLoading = false; return; }
    const uid = this.currentUser.uid;

    const [userRefresh, activityRefresh] = await Promise.all([
      this._loadUserData(uid),
      this._loadActivityData(uid),
    ]);
    const needsRefresh = userRefresh || activityRefresh;

    this._dataLoading = false;
    this._dataLoaded = true;

    if (needsRefresh) this._refreshSection(this.currentNav);

    setTimeout(() => this._prefetchOtherSections(), 1200);
  }

  async _prefetchOtherSections() {
    if (!this.currentUser?.uid) return;
    const uid = this.currentUser.uid;
    await Promise.allSettled([
      firestoreService.getAllRecipes?.(uid),
      firestoreService.getTopRanking?.(20),
      firestoreService.getLatestBloodTest?.(uid),
    ]);
  }

  destroy() {
    this.recipeUnsubscribe?.();
    this.achievementsUnsubscribe?.();
    this.chatUnsubscribe?.();
    ConnectionIndicator.destroy();
    this._connIndicatorInjected = false;
    if (this._outsideClickHandler) { document.removeEventListener('mousedown', this._outsideClickHandler); this._outsideClickHandler = null; }
    if (this._escHandler) { document.removeEventListener('keydown', this._escHandler); this._escHandler = null; }
    super.destroy();
  }

  getNotificationTitle(notification) {
    return notification?.title || notification?.nm || notification?.t || 'Notificação';
  }

  getNotificationBody(notification) {
    return notification?.body || notification?.message || notification?.text || notification?.ds || '';
  }

  getNotificationTime(notification) {
    const raw = notification?.createdAt || notification?.timestamp || notification?.time || null;
    if (!raw) return 'agora';
    if (typeof raw.toDate === 'function') {
      const date = raw.toDate();
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (raw instanceof Date) {
      return raw.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return 'agora';
  }

  getUnreadNotificationCount() {
    return (this.notifications || []).filter(notification => !notification.read).length;
  }

  _handleNotificationClick(id, wrapper, item) {
    const notification = (this.notifications || []).find(n => n.id === id);
    if (!notification || notification.read) return;
    // Optimistic UI
    notification.read = true;
    item.classList.remove('unread');
    item.style.paddingLeft = '14px';
    const dot = item.querySelector('.dash-notification-dot');
    if (dot) dot.textContent = '✓';
    this._refreshBellBadge();
    // Network update / queue
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      firestoreService.markNotificationRead(this.currentUser.uid, id).catch((err) => {
        console.warn('[Dashboard] markRead network error:', err);
        offlineQueue.enqueue('mark_notification_read', { uid: this.currentUser.uid, notificationId: id });
      });
    } else {
      offlineQueue.enqueue('mark_notification_read', { uid: this.currentUser.uid, notificationId: id });
    }
  }

  _handleNotificationUnread(id, wrapper, item) {
    const notification = (this.notifications || []).find(n => n.id === id);
    if (!notification) return;
    notification.read = false;
    item.classList.add('unread');
    item.style.paddingLeft = '20px';
    const dot = item.querySelector('.dash-notification-dot');
    if (dot) dot.textContent = '🔔';
    this._refreshBellBadge();
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      firestoreService.markNotificationUnread?.(this.currentUser.uid, id).catch(() => {
        offlineQueue.enqueue('mark_notification_unread', { uid: this.currentUser.uid, notificationId: id });
      });
    } else {
      offlineQueue.enqueue('mark_notification_unread', { uid: this.currentUser.uid, notificationId: id });
    }
  }

  _handleNotificationDelete(id, wrapper, item) {
    // Animate out and remove from DOM
    item.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    item.style.transform = 'translateX(-110%)';
    item.style.opacity = '0';
    setTimeout(() => {
      wrapper.style.transition = 'max-height 0.2s ease, padding 0.2s ease, opacity 0.2s ease';
      wrapper.style.maxHeight = '0';
      wrapper.style.padding = '0';
      wrapper.style.opacity = '0';
      setTimeout(() => wrapper.remove(), 220);
    }, 200);
    // Update local state
    this.notifications = (this.notifications || []).filter(n => n.id !== id);
    this._refreshBellBadge();
    // Network update / queue
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      firestoreService.deleteNotification?.(this.currentUser.uid, id).catch(() => {
        offlineQueue.enqueue('delete_notification', { uid: this.currentUser.uid, notificationId: id });
      });
    } else {
      offlineQueue.enqueue('delete_notification', { uid: this.currentUser.uid, notificationId: id });
    }
  }

  _refreshBellBadge() {
    const remaining = this.getUnreadNotificationCount();
    const bellBtn = this.element?.querySelector('[data-toggle-notifications]');
    if (!bellBtn) return;
    let badge = bellBtn.querySelector('span');
    if (remaining === 0) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.style.cssText = 'position:absolute;top:4px;right:4px;min-width:16px;height:16px;padding:0 4px;background:linear-gradient(135deg,#f0059a,#c0027c);border-radius:8px;border:2px solid var(--dash-bg,#0f0f1a);box-shadow:0 0 6px rgba(240,5,154,0.7);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1;';
      bellBtn.appendChild(badge);
    }
    badge.textContent = remaining > 9 ? '9+' : String(remaining);
  }

  _showAchievementConfetti(anchorEl) {
    if (!anchorEl) return;
    const colors = ['#f0059a', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#fff'];
    const rect = anchorEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 24; i++) {
      const conf = document.createElement('span');
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.4;
      const distance = 80 + Math.random() * 80;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 40;
      conf.style.cssText = `
        position: fixed;
        left: ${cx}px;
        top: ${cy}px;
        width: 8px; height: 8px;
        background: ${colors[i % colors.length]};
        border-radius: ${i % 2 === 0 ? '50%' : '2px'};
        pointer-events: none;
        z-index: 99999;
        --dx: ${dx}px;
        --dy: ${dy}px;
        animation: confettiFly 1s ease-out forwards;
        animation-delay: ${i * 0.015}s;
      `;
      document.body.appendChild(conf);
      setTimeout(() => conf.remove(), 1100 + i * 15);
    }
  }

  _getLevelForXp(xp) {
    for (let i = getLevels().length - 1; i >= 0; i--) {
      if (xp >= getLevels()[i].minXp) return getLevels()[i].level;
    }
    return 1;
  }

  _showXpPopup({ xpBefore, xpAfter, xpGained, levelBefore, levelAfter }) {
    const leveledUp = levelAfter > levelBefore;
    const levelData = getLevels().find(l => l.level === levelAfter) || getLevels()[0];
    const nextLevel = getLevels().find(l => l.level === levelAfter + 1);
    const rangeMin = levelData.minXp;
    const rangeMax = nextLevel ? nextLevel.minXp : levelData.minXp + 500;
    const pctBefore = Math.min(100, Math.max(0, Math.round(((xpBefore - rangeMin) / (rangeMax - rangeMin)) * 100)));
    const pctAfter = Math.min(100, Math.max(0, Math.round(((xpAfter - rangeMin) / (rangeMax - rangeMin)) * 100)));

    const overlay = document.createElement('div');
    overlay.className = 'xp-popup-overlay';
    overlay.innerHTML = `
      <div class="xp-popup-card${leveledUp ? ' leveled-up' : ''}">
        ${leveledUp ? `<div class="xp-popup-levelup">🎉 SUBIU DE NÍVEL!</div>` : ''}
        <div class="xp-popup-emoji">${levelData.emoji || '⭐'}</div>
        <div class="xp-popup-level">Nível ${levelAfter} — ${levelData.title || ''}</div>
        <div class="xp-popup-bar-wrap">
          <div class="xp-popup-bar" style="width:${pctBefore}%" data-target="${pctAfter}"></div>
        </div>
        <div class="xp-popup-numbers">
          <span class="xp-before">${xpBefore} XP</span>
          <span class="xp-gained">+${xpGained} XP</span>
          <span class="xp-after">${xpAfter} XP</span>
        </div>
        <button class="xp-popup-close">Continuar</button>
      </div>
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      const bar = overlay.querySelector('.xp-popup-bar');
      if (bar) bar.style.width = bar.dataset.target + '%';
    });

    const close = () => overlay.remove();
    overlay.querySelector('.xp-popup-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    setTimeout(close, 7000);
  }

  async markAllNotificationsRead() {
    if (!this.currentUser?.uid) return;
    const unread = (this.notifications || []).filter(notification => !notification.read && notification.id);
    if (!unread.length) return;
    const loader = UIComponents.loaderOverlay({ message: 'Marcando notificações como lidas...', color: '#f0059a' });
    document.body.appendChild(loader);
    try {
      await Promise.all(unread.map(notification => firestoreService.markNotificationRead(this.currentUser.uid, notification.id)));
    } catch (error) {
      console.error('[DashboardV2] markAllNotificationsRead failed:', error);
    } finally {
      loader.remove();
    }
  }

  openRecipeEditChat(recipe) {
    this.params?.onNavigate?.('chat', {
      recipeId: recipe.id,
      recipeName: recipe.name || recipe.nm,
      recipeEmoji: recipe.e || recipe.emoji || '🍽️',
    });
  }

  async removeRecipe(recipe) {
    const recipeId = recipe?.id;
    if (!recipeId) return;
    if (!this.currentUser?.uid) {
      const { notificationService } = await import('../modules/notifications.js');
      notificationService.toast('Faça login para remover receitas.', { type: 'warning' });
      return;
    }
    const confirmed = window.confirm(`Remover a receita "${recipe.name || recipe.nm}" do seu cardápio?`);
    if (!confirmed) return;
    const loader = UIComponents.loaderOverlay({ message: 'Removendo receita...', color: '#f0059a' });
    document.body.appendChild(loader);
    try {
      const { n8nService } = await import('../services/n8n.js');
      await n8nService.deleteRecipe(this.currentUser.uid, recipeId);
      this.selectedRecipe = null;
      this.recipes = (this.recipes || []).filter(item => item.id !== recipeId);
      State.set('recipes', this.recipes);
      const { notificationService } = await import('../modules/notifications.js');
      notificationService.toast('Receita removida com sucesso.', { type: 'success' });
      this.mountPreservingScroll();
    } catch (error) {
      console.error('[DashboardV2] removeRecipe failed:', error);
      const { notificationService } = await import('../modules/notifications.js');
      notificationService.toast('Não foi possível remover a receita agora.', { type: 'error' });
    } finally {
      loader.remove();
    }
  }

  async sendDashboardChatMessage(rawMessage) {
    const message = String(rawMessage || '').trim();
    if (!message) return;
    const uid = this.currentUser?.uid;
    const markerPrefix = this.chatRecipeContext?.id ? `[[RECIPE_EDIT:${this.chatRecipeContext.id}]] ` : '';
    const outboundMessage = `${markerPrefix}${message}`;

    this.homeChatInput = '';
    this.chatHistory = [...this.chatHistory, { role: 'user', content: outboundMessage }];
    this.mountPreservingScroll();

    if (!uid) {
      window.setTimeout(() => {
        this.chatHistory = [...this.chatHistory, { role: 'system', content: 'Faça login para conversar com a Guardiã 💬' }];
        this.mountPreservingScroll();
      }, 900);
      return;
    }

    const loader = UIComponents.loaderOverlay({ message: 'Enviando para a Guardiã...', color: '#f0059a' });
    document.body.appendChild(loader);
    try {
      const conversationId = this.chatSessionId || `${uid}_${Date.now()}`;
      await firestoreService.saveChatMessage(uid, { role: 'user', content: outboundMessage, conversationId });
      const { n8nService } = await import('../services/n8n.js');
      const result = await n8nService.sendChatMessage(uid, outboundMessage, conversationId);
      const reply = result?.reply || 'Recebido. Vou preparar sua resposta.';
      this.chatHistory = [...this.chatHistory, { role: 'ai', content: reply, type: result?.type || 'text' }];
      await firestoreService.saveChatMessage(uid, { role: 'assistant', content: reply, type: result?.type || 'text', conversationId });
      if (result?.type === 'recipe' && result.recipe) {
        this.chatHistory = [...this.chatHistory, { role: 'assistant', content: 'Sugestão de receita adicionada.', type: 'recipe' }];
      }
      this.mountPreservingScroll();
    } catch (error) {
      console.error('[DashboardV2] sendDashboardChatMessage failed:', error);
      this.chatHistory = [...this.chatHistory, { role: 'system', content: 'Não consegui enviar agora. Tente novamente.' }];
      this.mountPreservingScroll();
    } finally {
      loader.remove();
    }
  }

  render() {
    const root = DOM.create('div', 'dash-shell');
    root.innerHTML = `
      <style>
        :root {
          --dash-bg: ${this.isDark ? '#0b0b0d' : '#f2f2f5'};
          --dash-surface: ${this.isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)'};
          --dash-border: ${this.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'};
          --dash-text: ${this.isDark ? '#f0f0f4' : '#0a0a0d'};
          --dash-muted: ${this.isDark ? '#8a8aa0' : '#6b6b80'};
          --dash-shadow: ${this.isDark ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.08)'};
        }
        .dash-shell { min-height: 100vh; position: relative; background: var(--dash-bg); color: var(--dash-text); overflow: hidden; font-family: 'DM Sans', 'Outfit', -apple-system, sans-serif; }
        .dash-shell *, .dash-shell *::before, .dash-shell *::after { box-sizing: border-box; }
        .dash-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: var(--dash-bg); }
        .dash-bg::before, .dash-bg::after { content: ''; position: absolute; border-radius: 50%; filter: blur(80px); }
        .dash-bg::before { width: 520px; height: 520px; left: -5%; top: 5%; background: radial-gradient(circle, rgba(240,5,154,0.08) 0%, transparent 70%); animation: dashFloatA 11s ease-in-out infinite; }
        .dash-bg::after { width: 420px; height: 420px; right: -3%; bottom: 8%; background: radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%); animation: dashFloatB 14s ease-in-out infinite; }
        .dash-grid { position: fixed; inset: 0; z-index: 0; opacity: 0.015; background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0); background-size: 36px 36px; }
        .dash-app { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; }
        .dash-header { flex: 0 0 auto; min-height: 62px; display: flex; align-items: center; gap: 12px; padding: 0 16px; background: ${this.isDark ? 'rgba(11,11,13,0.9)' : 'rgba(255,255,255,0.95)'}; border-bottom: 1px solid var(--dash-border); -webkit-backdrop-filter: blur(28px); backdrop-filter: blur(28px); box-shadow: 0 1px 0 var(--dash-border); }
        .dash-btn-icon { width: 46px; height: 46px; border-radius: 14px; background: var(--dash-surface); border: 1px solid var(--dash-border); color: var(--dash-text); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
        .dash-btn-icon:hover { transform: translateY(-1px); border-color: rgba(240,5,154,0.55); background: rgba(240,5,154,0.12); }
        .dash-title { flex: 1; text-align: center; line-height: 1.1; }
        .dash-title .top, .dash-title .bottom { font-weight: 900; background: linear-gradient(90deg, #c0027c 0%, #f0059a 30%, #ff79c6 50%, #f0059a 70%, #c0027c 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmerTitle 10s linear infinite; will-change: background-position; }
        .dash-title .top { font-size: 17px; letter-spacing: -0.3px; }
        .dash-title .bottom { font-size: 16px; letter-spacing: -0.1px; }
        .dash-streak { flex: 0 0 auto; background: rgba(234,179,8,0.14); border: 1px solid rgba(234,179,8,0.35); border-radius: 10px; padding: 6px 12px; display: flex; align-items: center; gap: 4px; color: #f59e0b; font-weight: 800; font-size: 15px; }
        .dash-body { flex: 1; position: relative; overflow: hidden; }
        .dash-screen { position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden; }
        .dash-subheader { flex: 0 0 auto; padding: 10px 20px; border-bottom: 1px solid var(--dash-border); background: ${this.isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.045)'}; display: flex; align-items: center; gap: 10px; }
        .dash-subheader .pill { margin-left: auto; background: rgba(240,5,154,0.16); border: 1px solid rgba(240,5,154,0.35); color: #f0059a; border-radius: 8px; padding: 3px 10px; font-size: 12px; font-weight: 700; }
        .dash-content { flex: 1; overflow: auto; padding: 20px 22px 120px; display: flex; flex-direction: column; gap: 18px; }
        .dash-card { background: var(--dash-surface); border: 1px solid var(--dash-border); border-radius: 18px; backdrop-filter: blur(20px); box-shadow: 0 12px 30px var(--dash-shadow); }
        .dash-card.pad { padding: 18px; }
        .dash-section-title { color: var(--dash-text); font-size: 21px; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 4px; }
        .dash-section-subtitle { color: var(--dash-muted); font-size: 15px; margin-bottom: 16px; }
        .dash-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .dash-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .dash-chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .dash-chip { padding: 9px 14px; border-radius: 22px; background: rgba(255,255,255,0.04); border: 1px solid var(--dash-border); color: var(--dash-muted); font-weight: 600; font-size: 14px; cursor: pointer; }
        .dash-chip.active { background: linear-gradient(135deg, #f0059a, #c0027c); color: white; border-color: transparent; box-shadow: 0 4px 18px rgba(240,5,154,0.26); }
        .dash-nav-backdrop { position: absolute; inset: 0; z-index: 10; animation: dashBlurIn 0.28s ease forwards; backdrop-filter: blur(6px); background: rgba(0,0,0,0.45); cursor: pointer; }
        .dash-drawer { position: absolute; left: 0; top: 0; bottom: 0; width: 272px; z-index: 20; display: flex; flex-direction: column; background: var(--dash-bg); border-right: 1px solid var(--dash-border); backdrop-filter: blur(30px); box-shadow: 6px 0 40px rgba(0,0,0,0.6); animation: dashDrawerIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
        .dash-drawer-head { padding: 20px 18px 14px; border-bottom: 1px solid var(--dash-border); display: flex; align-items: center; justify-content: space-between; }
        .dash-drawer-nav { flex: 1; padding: 10px; overflow-y: auto; }
        .dash-drawer-item { width: 100%; border: none; border-radius: 14px; padding: 14px 16px; margin-bottom: 4px; cursor: pointer; text-align: left; background: transparent; border-left: 3px solid transparent; transition: all 0.18s ease; }
        .dash-drawer-item.active { background: rgba(240,5,154,0.12); border-left-color: #f0059a; }
        .dash-drawer-item .row { display: flex; align-items: center; gap: 12px; }
        .dash-drawer-item .icon { font-size: 24px; line-height: 1; }
        .dash-drawer-item .label { color: var(--dash-text); font-weight: 700; font-size: 17px; line-height: 1.2; }
        .dash-drawer-item.active .label { color: #f0059a; }
        .dash-drawer-item .sub { color: var(--dash-muted); font-size: 13px; margin-top: 2px; }
        .dash-nav-dot { position: absolute; top: 8px; right: 12px; min-width: 18px; height: 18px; padding: 0 5px; background: linear-gradient(135deg, #f0059a, #c0027c); color: #fff; font-size: 10px; font-weight: 800; border-radius: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(240,5,154,0.7); animation: navDotPulse 1.4s infinite; }
        .dash-drawer-foot { padding: 10px 10px 18px; border-top: 1px solid var(--dash-border); }
        .dash-toggle { width: 100%; padding: 13px 16px; border-radius: 14px; border: 1px solid var(--dash-border); background: ${this.isDark ? 'var(--dash-surface)' : 'rgba(0,0,0,0.06)'}; display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .dash-toggle .bubble { width: 42px; height: 24px; border-radius: 12px; position: relative; flex: 0 0 auto; background: linear-gradient(135deg, #f0059a, #c0027c); }
        .dash-toggle .bubble::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #fff; top: 3px; left: 21px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
        .dash-toggle.light .bubble { background: var(--dash-surface); }
        .dash-toggle.light .bubble::after { left: 3px; }
        .dash-footer-actions { padding: 10px 10px 18px; }
        .dash-ghost-btn, .dash-primary-btn { border: none; border-radius: 16px; padding: 18px 24px; min-height: 58px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        .dash-primary-btn { background: linear-gradient(135deg, #f0059a, #c0027c); color: #fff; box-shadow: 0 6px 28px rgba(240,5,154,0.25); }
        .dash-ghost-btn { background: rgba(255,255,255,0.06); color: var(--dash-muted); border: 1px solid var(--dash-border); }
        .dash-input, .dash-textarea { width: 100%; border-radius: 13px; padding: 16px 18px; background: rgba(255,255,255,0.05); border: 1.5px solid var(--dash-border); color: var(--dash-text); font: inherit; outline: none; }
        .dash-input:focus, .dash-textarea:focus { border-color: #f0059a; box-shadow: 0 0 0 3px rgba(240,5,154,0.25); }
        .dash-textarea { min-height: 110px; resize: none; }
        .dash-avatar { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
        .dash-stat { padding: 14px 14px; }
        .dash-stat-label { color: var(--dash-muted); font-size: 12px; font-weight: 600; margin-bottom: 6px; }
        .dash-stat-value { color: var(--dash-text); font-size: 22px; font-weight: 800; line-height: 1; }
        .dash-stat-delta { margin-top: 6px; font-size: 12px; font-weight: 700; }
        .dash-sparkline { width: 100%; height: 124px; }
        .dash-color-wheel { width:40px; height:40px; border-radius:50%; border:2px solid var(--dash-border); padding:0; background:transparent; cursor:pointer; box-sizing:border-box; overflow:hidden; }
        .dash-color-wheel::-webkit-color-swatch-wrapper { padding: 0; }
        .dash-color-wheel::-webkit-color-swatch { border: none; border-radius: 50%; }
        .dash-color-wheel::-moz-color-swatch { border: none; border-radius: 50%; }
        .dash-meal { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-bottom: 1px solid var(--dash-border); cursor: pointer; }
        .dash-meal:last-child { border-bottom: none; }
        .dash-meal-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .dash-meal.done .dash-meal-icon { background: rgba(31,204,116,0.15); border: 1.5px solid rgba(31,204,116,0.5); }
        .dash-meal.current .dash-meal-icon { background: rgba(240,5,154,0.12); border: 1.5px solid rgba(240,5,154,0.44); }
        .dash-meal.done .title { text-decoration: line-through; color: var(--dash-muted); }
        .dash-meal.current .title { color: #f0059a; }
        .dash-recipe-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .dash-recipe-card { padding: 18px 16px; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease; }
        .dash-recipe-card:hover { transform: translateY(-2px); border-color: #f0059a; }
        .dash-lock-panel { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.02); }
        .dash-lock-card { max-width: 340px; width: 100%; text-align: center; padding: 32px 28px; background: rgba(10,10,15,0.88); border: 1px solid rgba(240,5,154,0.2); border-radius: 24px; box-shadow: 0 8px 60px rgba(0,0,0,0.7); }
        .dash-notification-panel { position: absolute; top: 48px; right: 8px; width: min(380px, calc(100vw - 28px)); z-index: 30; opacity: 0; transform: translateY(-8px) scale(0.97); pointer-events: none; transition: opacity 180ms ease, transform 180ms ease; }
        .dash-notification-panel.is-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
        .dash-notification-card { background: ${this.isDark ? 'rgba(15,15,20,0.98)' : 'rgba(255,255,255,0.97)'}; border: 1px solid var(--dash-border); border-radius: 18px; box-shadow: 0 18px 40px rgba(0,0,0,0.28); overflow: hidden; backdrop-filter: blur(18px); }
        .dash-notification-item { display:flex; gap:10px; padding:14px 16px; border-bottom:1px solid var(--dash-border); position: relative; cursor: pointer; transition: background 0.15s; }
        .dash-notification-item:hover { background: rgba(240,5,154,0.06); }
        .dash-notification-item.unread::before { content: ''; position: absolute; left: 6px; top: 50%; transform: translateY(-50%); width: 6px; height: 6px; border-radius: 50%; background: #f0059a; box-shadow: 0 0 6px rgba(240,5,154,0.7); }
        .dash-notification-item.unread { background: rgba(240,5,154,0.04); }
        .dash-notification-item:last-child { border-bottom:none; }
        .dash-notification-dot { width:34px; height:34px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background: rgba(240,5,154,0.12); border: 1px solid rgba(240,5,154,0.22); }
        .dash-notification-title { color: var(--dash-text); font-size: 14px; font-weight: 800; line-height: 1.2; }
        .dash-notification-body { color: var(--dash-muted); font-size: 13px; line-height: 1.4; margin-top: 3px; }
        .dash-notification-meta { color: var(--dash-muted); font-size: 11px; margin-top: 6px; }
        .dash-hide { display: none !important; }
        @keyframes dashFloatA { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
        @keyframes dashFloatB { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
        @keyframes dashBlurIn { from{ backdrop-filter: blur(0px); background: transparent; } to{ backdrop-filter: blur(6px); background: rgba(0,0,0,0.45); } }
        @keyframes dashDrawerIn { from{ opacity:0; transform: translateX(-100%); } to{ opacity:1; transform: translateX(0); } }
        @keyframes shimmerTitle { 0%{ background-position: 200% center; } 100%{ background-position: -200% center; } }
        @keyframes fadeUp { from{ opacity:0; transform: translateY(14px); } to{ opacity:1; transform: translateY(0); } }
        @media (max-width: 860px) {
          .dash-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .dash-recipe-grid { grid-template-columns: 1fr; }
        }
      </style>
      <div class="dash-bg"></div>
      <div class="dash-grid"></div>
      <div class="dash-app">
        ${this.renderHeader()}
        <div class="dash-body">
          <div class="dash-screen" style="${this.sideOpen ? 'filter: blur(3px); pointer-events: none;' : ''}">
            ${this.renderSubheader()}
            <div class="dash-content">
              ${this.renderContent()}
            </div>
          </div>
          ${this.renderNotificationPanel()}
          ${this.sideOpen ? '<div class="dash-nav-backdrop" data-close-drawer></div>' : ''}
          ${this.sideOpen ? this.renderDrawer() : ''}
        </div>
      </div>
    `;
    return root;
  }

  renderHeader() {
    const unreadCount = this.getUnreadNotificationCount();
    return `
      <div class="dash-header">
        <button class="dash-btn-icon" data-open-drawer title="Abrir menu">☰</button>
        <button class="dash-btn-icon" data-toggle-theme title="Alternar tema" style="font-size:18px;">${this.isDark ? '☀️' : '🌙'}</button>
        <div class="dash-title">
          <div class="top">Guia Metabólico</div>
          <div class="bottom">Personalizado</div>
        </div>
        <div class="dash-streak" style="cursor:pointer;" title="Ver conquistas"><span>🔥</span><span>${this.streak}</span></div>
        <div id="conn-indicator-anchor" style="display:flex;align-items:center"></div>
        <button class="dash-bell-btn" data-toggle-notifications aria-label="Notificações" style="position:relative;width:40px;height:40px;border:none;border-radius:50%;background:rgba(255,255,255,0.07);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s,transform 0.15s;flex-shrink:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(255,255,255,0.85)">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          ${unreadCount > 0 ? `<span style="position:absolute;top:4px;right:4px;min-width:16px;height:16px;padding:0 4px;background:linear-gradient(135deg,#f0059a,#c0027c);border-radius:8px;border:2px solid var(--dash-bg,#0f0f1a);box-shadow:0 0 6px rgba(240,5,154,0.7);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1;">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
        </button>
      </div>
    `;
  }

  renderSubheader() {
    if (this.currentNav === 'inicio') {
      return `
        <div class="dash-subheader">
          <span>🏠</span>
          <span style="color: var(--dash-text); font-weight: 700; font-size: 14px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${getGreeting()}${this.profileAvatar.nick ? `, ${this.profileAvatar.nick.replace('@', '')}` : ''}! <span style="color: var(--dash-muted); font-weight: 400; font-size: 13px;">Sua jornada começa aqui</span>
          </span>
        </div>
      `;
    }

    const current = this.navItems.find(item => item.id === this.currentNav) || this.navItems[0];
    const badge = this.currentNav === 'conquistas' ? '<span class="pill">Você está em #8</span>' : this.currentNav === 'chat' ? '<span class="pill">IA Online ✓</span>' : '';
    return `
      <div class="dash-subheader">
        <span style="font-size: 17px;">${current.icon}</span>
        <span style="color: var(--dash-text); font-weight: 700; font-size: 15px;">${current.label}</span>
        <span style="color: var(--dash-muted); font-size: 13px;">· ${current.sub}</span>
        ${badge}
      </div>
    `;
  }

  renderDrawer() {
    const pendingClaims = (this.achievements || []).filter(a => (a.unlocked === true || a.unlockedAt) && !a.claimed).length;
    return `
      <div class="dash-drawer">
        <div class="dash-drawer-head">
          <div>
            <div style="color: var(--dash-text); font-weight: 800; font-size: 17px; line-height: 1;">Menu</div>
            <div style="color: var(--dash-muted); font-size: 12px; margin-top: 2px;">Mentoria 4D · Bela Nutrição</div>
          </div>
          <button class="dash-btn-icon" data-close-drawer title="Fechar menu" style="width:36px;height:36px;border-radius:10px;">✕</button>
        </div>
        <div style="padding: 12px 18px; border-bottom: 1px solid var(--dash-border);">
          ${this.renderXpBar()}
        </div>
        <div class="dash-drawer-nav">
          ${this.navItems.map(item => `
            <button class="dash-drawer-item ${this.currentNav === item.id ? 'active' : ''}" data-nav-item="${item.id}" style="position:relative;">
              <div class="row">
                <span class="icon">${item.icon}</span>
                <div>
                  <div class="label">${item.label}</div>
                  <div class="sub">${item.sub}</div>
                </div>
              </div>
              ${item.id === 'conquistas' && pendingClaims > 0 ? `<span class="dash-nav-dot">${pendingClaims}</span>` : ''}
            </button>
          `).join('')}
        </div>
        <div class="dash-drawer-foot">
          <button class="dash-toggle ${this.isDark ? '' : 'light'}" data-toggle-theme>
            <span style="font-size: 22px;">${this.isDark ? '☀️' : '🌙'}</span>
            <div style="text-align:left;flex:1;">
              <div style="font-weight:700;font-size:15px;color:${this.isDark ? 'var(--dash-text)' : '#1a1a1a'};">${this.isDark ? 'Modo Claro' : 'Modo Escuro'}</div>
              <div style="font-size:12px;color:${this.isDark ? 'var(--dash-muted)' : '#777'};margin-top:1px;">${this.isDark ? 'Toque para usar tema claro' : 'Toque para usar tema escuro'}</div>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  renderNotificationPanel() {
    const notifications = Array.isArray(this.notifications) ? this.notifications.slice(0, 8) : [];
    return `
      <div class="dash-notification-panel">
        <div class="dash-notification-card">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--dash-border);">
            <div>
              <div style="color:var(--dash-text);font-weight:800;font-size:16px;">Notificações</div>
              <div style="color:var(--dash-muted);font-size:12px;">Histórico recente da sua conta</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="dash-ghost-btn" data-mark-notifications-read style="min-height:34px;padding:8px 10px;border-radius:10px;font-size:12px;">Marcar todas como lidas</button>
              <button data-close-notification-panel aria-label="Fechar notificações" style="width:32px;height:32px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;color:var(--dash-muted);font-size:16px;line-height:1;">✕</button>
            </div>
          </div>
          <div style="max-height:360px;overflow:auto;">
            ${notifications.length ? notifications.map(notification => `
              <div class="notification-swipe-wrapper" data-notification-id="${notification.id || ''}">
                <div class="notification-swipe-bg">
                  <span class="swipe-action-right">↩ Não-lida</span>
                  <span class="swipe-action-left">🗑 Deletar</span>
                </div>
                <div class="dash-notification-item ${notification.read ? '' : 'unread'}" style="padding-left:${notification.read ? '14px' : '20px'};background:var(--dash-bg, #0f0f1a);">
                  <div class="dash-notification-dot">${notification.read ? '✓' : '🔔'}</div>
                  <div style="min-width:0;flex:1;">
                    <div class="dash-notification-title">${this.getNotificationTitle(notification)}</div>
                    <div class="dash-notification-body">${this.getNotificationBody(notification)}</div>
                    <div class="dash-notification-meta">${this.getNotificationTime(notification)}</div>
                  </div>
                </div>
              </div>
            `).join('') : `<div style="padding:18px 16px;color:var(--dash-muted);font-size:13px;">Nenhuma notificação recente.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  renderXpBar() {
    const level = this.getLevel(this.xp);
    const next = this.getNextLevel(level.level);
    const pct = next ? Math.min(100, ((this.xp - level.minXp) / (next.minXp - level.minXp)) * 100) : 100;
    return `
      <div style="display:flex;align-items:center;gap:10px;flex:1;max-width:300px;">
        <div style="width:30px;height:30px;border-radius:8px;background:${level.color}22;border:1px solid ${level.color}44;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ⭐
        </div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:${level.color};font-size:12px;font-weight:800;">Nível ${level.level} · ${level.title}</span>
            <span style="color:var(--dash-muted);font-size:11px;">${this.xp} XP</span>
          </div>
          <div style="height:5px;border-radius:3px;background:${this.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.18)'};overflow:hidden;">
            <div style="height:100%;width:${pct}%;border-radius:3px;background:linear-gradient(90deg,${level.color},#f0059a);box-shadow:0 0 8px ${level.color}66;"></div>
          </div>
        </div>
      </div>
    `;
  }

  getLevel(xp) {
    return [...getLevels()].reverse().find(level => xp >= level.minXp) || getLevels()[0];
  }

  getNextLevel(levelNumber) {
    return getLevels().find(level => level.level === levelNumber + 1) || null;
  }
  renderContent() {
    // Se dados ainda não carregaram do Firestore, mostra skeleton
    if (!this._dataLoaded) {
      return `<div data-loading="${this.currentNav}" class="loading-skeleton-container"></div>`;
    }
    switch (this.currentNav) {
      case 'inicio': return renderInicio(this);
      case 'evolucao': return renderEvolucao(this);
      case 'receitas': return renderRecipes(this);
      case 'exames': return renderExames(this);
      case 'conquistas': return renderConquistas(this);
      case 'chat': return renderChat(this);
      case 'perfil': return renderPerfil(this);
      default: return renderInicio(this);
    }
  }

  _openEmojiPickerModal() {
    const overlay = document.createElement('div');
    overlay.className = 'emoji-picker-overlay';
    overlay.innerHTML = `
      <div class="emoji-picker-modal" role="dialog" aria-label="Escolher emoji do avatar">
        <button class="emoji-picker-close" type="button" aria-label="Fechar">✕</button>
        <h3 class="emoji-picker-title">Escolha seu emoji</h3>
        <div class="emoji-picker-preview" style="background:${this.profileAvatar.color};">
          <span id="emoji-preview-glyph">${this.profileAvatar.emoji || '?'}</span>
        </div>
        <input type="text" class="emoji-picker-input" id="emoji-picker-input" maxlength="8" autocomplete="off" autocapitalize="off" inputmode="text" placeholder="Digite ou cole 1 emoji" />
        <p class="emoji-picker-hint">No celular, use o teclado de emoji. No PC: <strong>Win + .</strong> (Windows) ou <strong>Ctrl + Cmd + Espaço</strong> (Mac).</p>
        <div class="emoji-picker-actions">
          <button type="button" class="dash-ghost-btn" id="emoji-picker-cancel">Cancelar</button>
          <button type="button" class="dash-primary-btn" id="emoji-picker-save" disabled>Salvar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#emoji-picker-input');
    const preview = overlay.querySelector('#emoji-preview-glyph');
    const saveBtn = overlay.querySelector('#emoji-picker-save');

    const isOneEmoji = (s) => {
      const t = (s || '').trim();
      if (!t) return false;
      try {
        const segs = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(t)];
        return segs.length === 1 && /\p{Extended_Pictographic}/u.test(segs[0].segment);
      } catch {
        return t.length <= 4 && t.trim().length > 0;
      }
    };

    input.addEventListener('input', () => {
      const v = input.value.trim();
      const valid = isOneEmoji(v);
      saveBtn.disabled = !valid;
      if (valid) preview.textContent = v;
    });

    const close = () => overlay.remove();
    overlay.querySelector('.emoji-picker-close').addEventListener('click', close);
    overlay.querySelector('#emoji-picker-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#emoji-picker-save').addEventListener('click', () => {
      const v = input.value.trim();
      if (!isOneEmoji(v)) return;
      this.profileAvatar = { ...this.profileAvatar, emoji: v };
      this.mountPreservingScroll();
      close();
    });
    setTimeout(() => input.focus(), 100);
  }

  _setupNavigationListeners() {
    this.element.querySelectorAll('[data-nav-item]').forEach(button => {
      button.addEventListener('click', () => {
        this.currentNav = button.getAttribute('data-nav-item');
        this.sideOpen = false;
        this.mount();
      });
    });

    this.element.querySelector('[data-open-drawer]')?.addEventListener('click', () => {
      this.sideOpen = !this.sideOpen;
      this.mount();
    });

    // attach close listeners to all matching elements (backdrop + close button)
    this.element.querySelectorAll('[data-close-drawer]').forEach(el => {
      el.addEventListener('click', () => {
        this.sideOpen = false;
        this.mount();
      });
    });

    this.element.querySelector('.dash-streak')?.addEventListener('click', () => {
      this.currentNav = 'conquistas';
      this.mount();
    });

    // stable theme toggle (dark <-> light), guarded against rapid multi-clicks
    this.element.querySelectorAll('[data-toggle-theme]').forEach(button => {
      button.addEventListener('click', () => {
        if (this.themeToggleLocked) return;
        this.themeToggleLocked = true;
        this.saveTheme(!this.isDark);
        this.mountPreservingScroll();
        window.setTimeout(() => { this.themeToggleLocked = false; }, 180);
      });
    });

    this.element.querySelectorAll('[data-meal-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        const mealId = button.getAttribute('data-meal-toggle');
        const contentEl = this.element.querySelector('.dash-content');
        const scrollPos = contentEl ? contentEl.scrollTop : 0;
        if (this.homeChecked.has(mealId)) this.homeChecked.delete(mealId);
        else this.homeChecked.add(mealId);
        this.mount();
        // restore scroll after render
        requestAnimationFrame(() => { const el = this.element.querySelector('.dash-content'); if (el) el.scrollTop = scrollPos; });
      });
    });
  }

  _setupNotificationListeners() {
    this.element.querySelector('[data-toggle-notifications]')?.addEventListener('click', () => {
      const panel = this.element.querySelector('.dash-notification-panel');
      const bell = this.element.querySelector('[data-toggle-notifications]');
      if (panel) {
        const isOpen = panel.classList.toggle('is-open');
        if (bell) bell.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    });

    this.element.querySelector('[data-close-notification-panel]')?.addEventListener('click', () => {
      const panel = this.element.querySelector('.dash-notification-panel');
      const bell = this.element.querySelector('[data-toggle-notifications]');
      if (panel) {
        panel.classList.remove('is-open');
        if (bell) bell.setAttribute('aria-expanded', 'false');
      }
    });

    // click-outside handler for notification panel
    if (!this._outsideClickHandler) {
      this._outsideClickHandler = (e) => {
        const panel = this.element.querySelector('.dash-notification-panel');
        const bell = this.element.querySelector('[data-toggle-notifications]');
        const isPanelOpen = panel && panel.classList.contains('is-open');
        const isClickOutside = !panel.contains(e.target) && bell && !bell.contains(e.target);
        if (isPanelOpen && isClickOutside) {
          panel.classList.remove('is-open');
          bell.setAttribute('aria-expanded', 'false');
        }
      };
      document.addEventListener('mousedown', this._outsideClickHandler);
    }
    if (!this._escHandler) {
      this._escHandler = (e) => {
        if (e.key === 'Escape') {
          const panel = this.element.querySelector('.dash-notification-panel');
          if (panel && panel.classList.contains('is-open')) {
            panel.classList.remove('is-open');
          }
        }
      };
      document.addEventListener('keydown', this._escHandler);
    }

    this.element.querySelector('[data-mark-notifications-read]')?.addEventListener('click', async () => {
      await this.markAllNotificationsRead();
      this.mountPreservingScroll();
    });

    // Notification swipe + click handlers
    this.element.querySelectorAll('.notification-swipe-wrapper[data-notification-id]').forEach(wrapper => {
      const item = wrapper.querySelector('.dash-notification-item');
      const id = wrapper.getAttribute('data-notification-id');
      if (!item || !id) return;

      let startX = 0;
      let currentX = 0;
      let dragging = false;
      let pointerDownTime = 0;
      const SWIPE_THRESHOLD = 90;

      const onPointerDown = (e) => {
        startX = e.clientX;
        currentX = 0;
        dragging = true;
        pointerDownTime = Date.now();
        item.style.transition = 'none';
        try { wrapper.setPointerCapture(e.pointerId); } catch {}
      };

      const onPointerMove = (e) => {
        if (!dragging) return;
        currentX = e.clientX - startX;
        if (Math.abs(currentX) > 4) {
          item.style.transform = `translateX(${currentX}px)`;
          wrapper.classList.toggle('swiping-left', currentX < -10);
          wrapper.classList.toggle('swiping-right', currentX > 10);
        }
      };

      const onPointerUp = (e) => {
        if (!dragging) return;
        dragging = false;
        item.style.transition = 'transform 0.2s ease';
        const dragDuration = Date.now() - pointerDownTime;
        const totalDrag = Math.abs(currentX);

        // Treat as click if drag is small and quick
        if (totalDrag < 8 && dragDuration < 300) {
          item.style.transform = '';
          wrapper.classList.remove('swiping-left', 'swiping-right');
          this._handleNotificationClick(id, wrapper, item);
          return;
        }

        if (currentX < -SWIPE_THRESHOLD) {
          // Swipe left = delete
          this._handleNotificationDelete(id, wrapper, item);
        } else if (currentX > SWIPE_THRESHOLD) {
          // Swipe right = mark unread
          this._handleNotificationUnread(id, wrapper, item);
          item.style.transform = '';
          wrapper.classList.remove('swiping-left', 'swiping-right');
        } else {
          // Snap back
          item.style.transform = '';
          wrapper.classList.remove('swiping-left', 'swiping-right');
        }
      };

      wrapper.addEventListener('pointerdown', onPointerDown);
      wrapper.addEventListener('pointermove', onPointerMove);
      wrapper.addEventListener('pointerup', onPointerUp);
      wrapper.addEventListener('pointercancel', onPointerUp);
    });
  }

  _setupAchievementListeners() {
    // Reivindicar conquista — dispara claim + popup XP + animação de confete.
    this.element.querySelectorAll('[data-claim-achievement]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-claim-achievement');
        if (!id) return;
        btn.disabled = true;
        btn.innerHTML = '⏳ Reivindicando...';

        try {
          const achievement = getAchievementsCatalog().find(a => a.id === id);
          const xpGained = achievement?.xp || 0;
          const profileBefore = await firestoreService.getUserProfile(this.currentUser.uid);
          const xpBefore = profileBefore?.xp || 0;
          const levelBefore = profileBefore?.level || 1;

          const ok = await firestoreService.claimAchievement(this.currentUser.uid, id);
          if (ok) {
            const xpAfter = xpBefore + xpGained;
            const levelAfter = this._getLevelForXp(xpAfter);
            this._showXpPopup({ xpBefore, xpAfter, xpGained, levelBefore, levelAfter });
            this._showAchievementConfetti(btn);
            setTimeout(() => {
              if (typeof this.mountPreservingScroll === 'function') this.mountPreservingScroll();
              else this.mount();
            }, 1500);
          } else {
            btn.disabled = false;
            btn.innerHTML = '🎁 Tentar novamente';
          }
        } catch (err) {
          console.error('[Dashboard] claim error:', err);
          btn.disabled = false;
          btn.innerHTML = '🎁 Tentar novamente';
        }
      });
    });

    this.element.querySelectorAll('[data-conquest-tab]').forEach(button => {
      button.addEventListener('click', () => {
        this.communityTab = button.getAttribute('data-conquest-tab');
        this.mount();
      });
    });
  }

  _setupRecipeListeners() {
    const recipeOfHourEl = this.element.querySelector('[data-recipe-of-hour]');
    if (recipeOfHourEl) {
      recipeOfHourEl.addEventListener('click', async (e) => {
        e.stopPropagation();
        const recipeId = recipeOfHourEl.getAttribute('data-recipe-of-hour');
        if (!recipeId) return;
        // Search in user recipes first, then fall back to appConfig recipes
        const pool = [
          ...(Array.isArray(this.recipes) ? this.recipes : []),
          ...getStaticRecipes(),
        ];
        const recipe = pool.find(item => item.id === recipeId);
        if (!recipe) {
          // Try to find by partial match
          const anyRecipe = pool[0];
          if (anyRecipe) {
            this.recipeOriginNav = this.currentNav;
            this.recipesView = 'catalogo';
            this.selectedRecipe = anyRecipe;
            this.currentNav = 'receitas';
            await this.mount();
            return;
          }
          return;
        }
        this.recipeOriginNav = this.currentNav; // captura origem (provavelmente 'inicio')
        this.recipesView = 'catalogo'; // garantir que abre o detalhe, não o planner
        this.selectedRecipe = recipe;
        this.currentNav = 'receitas';
        await this.mount();
        setTimeout(() => {
          const detail = this.element?.querySelector('[class*="recipe-detail"], [class*="receita-detail"]');
          detail?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      });
    }

    this.element.querySelectorAll('[data-recipe-open]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = card.getAttribute('data-recipe-open');
        const pool = (Array.isArray(this.recipes) ? this.recipes : []).concat(getStaticRecipes());
        const recipe = pool.find(r => r.id === id);
        if (!recipe) return;
        this.recipeOriginNav = 'receitas';
        this.selectedRecipe = recipe;
        this.mount();
      });
    });

    this.element.querySelector('[data-recipes-unlock]')?.addEventListener('click', () => {
      this.recipesUnlocked = true;
      this.mount();
    });

    this.element.querySelector('[data-recipe-back]')?.addEventListener('click', () => {
      const target = this.recipeOriginNav || 'receitas';
      this.selectedRecipe = null;
      this.recipeOriginNav = null;
      this.currentNav = target;
      this.mount();
    });

    this.element.querySelectorAll('[data-recipe-edit]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        const recipeCatalog = Array.isArray(this.recipes) && this.recipes.length ? this.recipes : getStaticRecipes();
        const recipe = recipeCatalog.find(item => item.id === button.getAttribute('data-recipe-edit'));
        if (recipe) this.openRecipeEditChat(recipe);
      });
    });

    this.element.querySelectorAll('[data-recipe-remove]').forEach(button => {
      button.addEventListener('click', async event => {
        event.stopPropagation();
        const id = button.getAttribute('data-recipe-remove');
        const pool = [...(Array.isArray(this.recipes) ? this.recipes : []), ...getStaticRecipes()];
        const recipe = pool.find(item => item.id === id);
        if (recipe) await this.removeRecipe(recipe);
      });
    });

    this.element.querySelectorAll('[data-recipe-filter]').forEach(button => {
      button.addEventListener('click', () => {
        this.recipeFilter = button.getAttribute('data-recipe-filter');
        this.selectedRecipe = null;
        this.mount();
      });
    });

    this.element.querySelectorAll('[data-recipes-view]').forEach(button => {
      button.addEventListener('click', () => {
        this.recipesView = button.getAttribute('data-recipes-view') || 'catalogo';
        this.mountPreservingScroll();
      });
    });

    this.element.querySelectorAll('[data-meal-remove]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-meal-remove');
        this.dailyMeals = this.dailyMeals.filter(meal => meal.id !== id);
        this.homeChecked.delete(id);
        State.set('dailyMeals', this.dailyMeals);
        this.persistProfileFields({ dailyMeals: this.dailyMeals }, { silent: true });
        this.mountPreservingScroll();
      });
    });

    this.element.querySelector('[data-meal-draft-icon]')?.addEventListener('input', event => {
      this.mealDraft = { ...this.mealDraft, icon: event.target.value || '🍽️' };
    });

    this.element.querySelector('[data-meal-draft-name]')?.addEventListener('input', event => {
      this.mealDraft = { ...this.mealDraft, nome: event.target.value };
    });

    this.element.querySelector('[data-meal-draft-time]')?.addEventListener('input', event => {
      this.mealDraft = { ...this.mealDraft, hora: event.target.value || '08:00' };
    });

    this.element.querySelector('[data-meal-draft-desc]')?.addEventListener('input', event => {
      this.mealDraft = { ...this.mealDraft, desc: event.target.value };
    });

    this.element.querySelector('[data-meal-add]')?.addEventListener('click', async () => {
      const nome = (this.mealDraft.nome || '').trim();
      const desc = (this.mealDraft.desc || '').trim();
      if (!nome || !desc) {
        const { notificationService } = await import('../modules/notifications.js');
        notificationService.toast('Preencha nome e descrição da refeição.');
        return;
      }
      const id = `m-${Date.now()}`;
      const nextMeal = {
        id,
        icon: (this.mealDraft.icon || '🍽️').trim() || '🍽️',
        nome,
        hora: this.mealDraft.hora || '08:00',
        desc,
      };
      this.dailyMeals = [...this.dailyMeals, nextMeal].sort((a, b) => a.hora.localeCompare(b.hora));
      this.mealDraft = { icon: '🍽️', nome: '', hora: '08:00', desc: '' };
      State.set('dailyMeals', this.dailyMeals);
      await this.persistProfileFields({ dailyMeals: this.dailyMeals });
      this.mountPreservingScroll();
    });

    this.element.querySelectorAll('[data-order-download]').forEach(button => {
      button.addEventListener('click', async () => {
        const orderId = button.getAttribute('data-order-download');
        const order = (this.examOrders || []).find(item => item.id === orderId);
        const isFileReady = Boolean(order?.fileReady || order?.pdfReady || order?.fileUrl || order?.driveFileUrl);
        if (!isFileReady) {
          const { notificationService } = await import('../modules/notifications.js');
          notificationService.toast('Pedido ainda indisponível. Aguarde processamento do n8n.');
          return;
        }
        try {
          const loader = UIComponents.loaderOverlay({ message: 'Preparando PDF do pedido...', color: '#f0059a' });
          document.body.appendChild(loader);
          try {
            const { n8nService } = await import('../services/n8n.js');
            const uid = this.currentUser?.uid;
            const response = uid ? await n8nService.downloadExamPdf(uid, orderId) : null;
            const fileUrl = response?.fileUrl || order.fileUrl || order.driveFileUrl;
            if (fileUrl) {
              const a = document.createElement('a');
              a.href = fileUrl;
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
              a.download = '';
              document.body.appendChild(a);
              a.click();
              a.remove();
            }
          } finally {
            loader.remove();
          }
        } catch (error) {
          console.error('[DashboardV2] order download failed:', error);
          const { notificationService } = await import('../modules/notifications.js');
          notificationService.toast('Não foi possível baixar o pedido agora.');
        }
      });
    });

    this.element.querySelectorAll('[data-exam-tab]').forEach(button => {
      button.addEventListener('click', () => {
        this.examTab = button.getAttribute('data-exam-tab');
        this.mount();
      });
    });
  }

  _setupChatListeners() {
    this.element.querySelector('[data-home-chat-input]')?.addEventListener('input', event => {
      this.homeChatInput = event.target.value;
    });

    this.element.querySelector('[data-home-send]')?.addEventListener('click', () => {
      this.sendDashboardChatMessage(this.homeChatInput);
    });

    this.element.querySelector('[data-chat-input]')?.addEventListener('input', event => {
      this.homeChatInput = event.target.value;
    });

    this.element.querySelector('[data-chat-send]')?.addEventListener('click', () => {
      this.sendDashboardChatMessage(this.homeChatInput);
    });

    this.element.querySelectorAll('[data-chat-suggestion]').forEach(button => {
      button.addEventListener('click', () => {
        this.homeChatInput = button.getAttribute('data-chat-suggestion') || '';
        this.mount();
      });
    });

    this.element.querySelector('[data-clear-chat-context]')?.addEventListener('click', () => {
      this.chatRecipeContext = null;
      this.mountPreservingScroll();
    });
  }

  _setupProfileListeners() {
    this.element.querySelectorAll('[data-avatar-emoji]').forEach(button => {
      button.addEventListener('click', () => {
        this.profileAvatar = { ...this.profileAvatar, emoji: button.getAttribute('data-avatar-emoji') };
        this.mountPreservingScroll();
      });
    });

    this.element.querySelectorAll('[data-avatar-color]').forEach(button => {
      button.addEventListener('click', () => {
        this.profileAvatar = { ...this.profileAvatar, color: button.getAttribute('data-avatar-color') };
        this.mountPreservingScroll();
      });
    });

    this.element.querySelector('[data-avatar-custom]')?.addEventListener('click', () => {
      this._openEmojiPickerModal();
    });

    this.element.querySelector('[data-avatar-color-input]')?.addEventListener('change', event => {
      const color = event.target.value;
      this.profileAvatar = { ...this.profileAvatar, color };
      this.mountPreservingScroll();
    });

    this.element.querySelector('[data-avatar-nick]')?.addEventListener('input', event => {
      this.profileAvatar = { ...this.profileAvatar, nick: event.target.value };
    });

    this.element.querySelector('[data-profile-save]')?.addEventListener('click', () => {
      const nextProfile = {
        ...(this.userProfile || {}),
        avatar: this.profileAvatar.emoji,
        avatarColor: this.profileAvatar.color,
        name: this.profileAvatar.nick.replace(/^@/, ''),
      };
      this.userProfile = nextProfile;
      if (this.currentUser?.uid) {
        firestoreService.saveUserProfile(this.currentUser.uid, nextProfile).catch(error => {
          console.error('[DashboardV2] saveUserProfile failed:', error);
        });
      }
      try { Session.set('avatar', this.profileAvatar.emoji); } catch { /* ignore */ }
      try { Session.set('avatarColor', this.profileAvatar.color); } catch { /* ignore */ }
      try { Session.set('nick', this.profileAvatar.nick); } catch { /* ignore */ }
      State.set('userProfile', nextProfile);
      this.mount();
    });

    this.element.querySelectorAll('[data-theme-mode]').forEach(button => {
      button.addEventListener('click', () => {
        this.saveTheme(button.getAttribute('data-theme-mode') || 'system');
        this.mountPreservingScroll();
      });
    });

    this.element.querySelector('[data-logout]')?.addEventListener('click', async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error('[Dashboard] logout error:', error);
      }
    });
  }

  _setupCommunityListeners() {
    this.element.querySelectorAll('[data-community-like]').forEach(button => {
      button.addEventListener('click', () => {
        const feedId = button.getAttribute('data-community-like');
        this.communityFeed = this.communityFeed.map(item => item.id === feedId ? { ...item, lk: item.liked ? item.lk - 1 : item.lk + 1, liked: !item.liked } : item);
        this.persistProfileFields({ communityFeed: this.communityFeed }, { silent: true });
        this.mountPreservingScroll();
      });
    });

    this.element.querySelectorAll('[data-community-toggle-comment]').forEach(button => {
      button.addEventListener('click', () => {
        const feedId = button.getAttribute('data-community-toggle-comment');
        this.commentOpenId = this.commentOpenId === feedId ? null : feedId;
        this.commentText = '';
        this.mountPreservingScroll();
      });
    });

    this.element.querySelector('[data-community-comment-input]')?.addEventListener('input', event => {
      this.commentText = event.target.value;
    });

    this.element.querySelector('[data-community-comment-send]')?.addEventListener('click', () => {
      if (!this.commentText.trim() || !this.commentOpenId) return;
      this.communityFeed = this.communityFeed.map(item => item.id === this.commentOpenId ? { ...item, cm: [...item.cm, { u: 'Você', t: this.commentText.trim() }] } : item);
      this.commentText = '';
      this.commentOpenId = null;
      this.persistProfileFields({ communityFeed: this.communityFeed });
      this.mountPreservingScroll();
    });

    this.element.querySelector('[data-community-comment-close]')?.addEventListener('click', () => {
      this.commentOpenId = null;
      this.commentText = '';
      this.mountPreservingScroll();
    });

    this.element.querySelectorAll('[data-tip-vote]').forEach(button => {
      button.addEventListener('click', () => {
        const raw = button.getAttribute('data-tip-vote') || '';
        const [tipId, vote] = raw.split(':');
        this.dicas = this.dicas.map(item => {
          if (item.id !== tipId) return item;
          const currentVote = item.myVote || null;
          let likes = Number(item.likes || 0);
          let dislikes = Number(item.dislikes || 0);
          if (currentVote === vote) {
            if (vote === 'like') likes = Math.max(0, likes - 1);
            if (vote === 'dislike') dislikes = Math.max(0, dislikes - 1);
            return { ...item, likes, dislikes, myVote: null };
          }
          if (currentVote === 'like') likes = Math.max(0, likes - 1);
          if (currentVote === 'dislike') dislikes = Math.max(0, dislikes - 1);
          if (vote === 'like') likes += 1;
          if (vote === 'dislike') dislikes += 1;
          return { ...item, likes, dislikes, myVote: vote };
        });
        State.set('belaTips', this.dicas);
        this.persistProfileFields({ belaTips: this.dicas }, { silent: true });
        this.mountPreservingScroll();
      });
    });
  }

  setupEventListeners() {
    this._setupNavigationListeners();
    this._setupNotificationListeners();
    this._setupAchievementListeners();
    this._setupRecipeListeners();
    this._setupChatListeners();
    this._setupProfileListeners();
    this._setupCommunityListeners();
  }
}

function FEED0() {
  return [
    { id: 'f1', u: 'Ana Beatriz', e: '👑', col: '#eab308', b: '🔥', bn: '30 Dias Ativa', t: 'há 2h', lk: 14, cm: [{ u: 'Carla', t: 'Incrível!! 🎉' }, { u: 'Priscila', t: 'Arrasou! 💪' }], liked: false },
    { id: 'f2', u: 'Carla Mendes', e: '🔥', col: '#f0059a', b: '📉', bn: 'Glicemia em Queda', t: 'há 5h', lk: 22, cm: [{ u: 'Ana', t: 'Que conquista!! 🏆' }], liked: true },
    { id: 'f3', u: 'Priscila S.', e: '💎', col: '#a78bfa', b: '📅', bn: '7 Dias no Ritmo', t: 'há 1d', lk: 9, cm: [], liked: false },
  ];
}

export default DashboardScreen;
