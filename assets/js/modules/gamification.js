/**
 * Gamification Components - XP Counter, Levels, Achievements
 * 
 * Componentes reutilizáveis para:
 * - XP Progress Header (animado)
 * - Level Badge com próximo nível
 * - Achievements Modal com filtros
 */

import { LEVELS, ACHIEVEMENTS_CATALOG } from '../config/constants.js';

// ═══════════════════════════════════════════════════════════════════════════
// 1. XP PROGRESS HEADER
// ═══════════════════════════════════════════════════════════════════════════

export class XPProgressHeader {
  constructor(userProfile = {}) {
    this.userProfile = userProfile;
    this.container = null;
  }

  /**
   * Renderiza o header com XP e progresso para próximo nível
   */
  render() {
    const xp = this.userProfile.xp || 0;
    const level = this._getLevelInfo(xp);
    const nextLevel = this._getNextLevelInfo(xp);
    const progress = nextLevel 
      ? ((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100 
      : 100;

    this.container = document.createElement('div');
    this.container.className = 'xp-progress-header';
    this.container.innerHTML = `
      <div class="xp-header-content">
        <div class="xp-level-info">
          <div class="xp-current-level">
            <span class="xp-level-badge ${level.rarity || 'common'}">
              <span class="xp-level-number">${level.level}</span>
              <span class="xp-level-name">${level.name}</span>
            </span>
          </div>
          <div class="xp-stats">
            <div class="xp-stat">
              <span class="xp-stat-label">XP</span>
              <span class="xp-stat-value">${xp}</span>
            </div>
            <div class="xp-stat">
              <span class="xp-stat-label">Próximo</span>
              <span class="xp-stat-value">${nextLevel ? nextLevel.minXp - xp : '✓'}</span>
            </div>
          </div>
        </div>

        <div class="xp-progress-section">
          <div class="xp-progress-bar-container">
            <div class="xp-progress-bar">
              <div class="xp-progress-fill" style="width: ${progress}%"></div>
              <span class="xp-progress-label">${Math.round(progress)}%</span>
            </div>
          </div>
          <div class="xp-level-range">
            <span class="xp-range-start">${level.minXp}</span>
            <span class="xp-range-end">${nextLevel?.minXp || '∞'}</span>
          </div>
        </div>
      </div>
    `;

    return this.container;
  }

  update(userProfile) {
    this.userProfile = userProfile;
    if (this.container && this.container.parentElement) {
      const newContainer = this.render();
      this.container.parentElement.replaceChild(newContainer, this.container);
      this.container = newContainer;
    }
  }

  _getLevelInfo(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) return LEVELS[i];
    }
    return LEVELS[0];
  }

  _getNextLevelInfo(xp) {
    for (let i = 0; i < LEVELS.length; i++) {
      if (xp < LEVELS[i].minXp) return LEVELS[i];
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. LEVEL BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export class LevelBadge {
  constructor(userProfile = {}) {
    this.userProfile = userProfile;
  }

  render() {
    const level = this._getLevelInfo(this.userProfile.xp || 0);
    
    const container = document.createElement('div');
    container.className = `level-badge level-badge-${level.rarity || 'common'}`;
    container.title = `Nível ${level.level}: ${level.name}`;
    container.innerHTML = `
      <div class="level-badge-inner">
        <span class="level-badge-number">${level.level}</span>
        <span class="level-badge-icon">${level.icon || '⭐'}</span>
        <span class="level-badge-name">${level.shortName || level.name}</span>
      </div>
    `;

    return container;
  }

  _getLevelInfo(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) return LEVELS[i];
    }
    return LEVELS[0];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. ACHIEVEMENTS MODAL
// ═══════════════════════════════════════════════════════════════════════════

export class AchievementsModal {
  constructor(userProfile = {}, unlockedAchievementIds = []) {
    this.userProfile = userProfile;
    this.unlockedIds = new Set(unlockedAchievementIds);
    this.filterCategory = null;
    this.container = null;
    this.modal = null;
  }

  /**
   * Abre o modal de conquistas
   */
  open() {
    this.modal = this._createModal();
    document.body.appendChild(this.modal);
    this._attachEventListeners();
    this.modal.style.display = 'flex';
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  _createModal() {
    const modal = document.createElement('div');
    modal.className = 'achievements-modal-overlay';
    
    const categories = ['Todos', ...new Set(ACHIEVEMENTS_CATALOG.map(a => a.category))];
    const stats = this._calculateStats();

    modal.innerHTML = `
      <div class="achievements-modal">
        <div class="achievements-modal-header">
          <div class="achievements-title-section">
            <h1>Minhas Conquistas</h1>
            <p class="achievements-progress">${stats.unlocked} de ${stats.total} desbloqueadas</p>
          </div>
          <button class="achievements-modal-close" aria-label="Fechar">✕</button>
        </div>

        <div class="achievements-filters">
          ${categories.map(cat => `
            <button class="achievements-filter-btn ${cat === 'Todos' ? 'active' : ''}" data-category="${cat}">
              ${cat}
            </button>
          `).join('')}
        </div>

        <div class="achievements-grid" id="achievements-grid">
          ${this._renderAchievements()}
        </div>

        <div class="achievements-progress-bar">
          <div class="progress-fill" style="width: ${(stats.unlocked / stats.total) * 100}%"></div>
        </div>
      </div>
    `;

    return modal;
  }

  _renderAchievements() {
    const filtered = this.filterCategory && this.filterCategory !== 'Todos'
      ? ACHIEVEMENTS_CATALOG.filter(a => a.category === this.filterCategory)
      : ACHIEVEMENTS_CATALOG;

    return filtered.map((achievement, idx) => {
      const isUnlocked = this.unlockedIds.has(achievement.id);
      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}" data-id="${achievement.id}">
          <div class="achievement-image">
            <span class="achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</span>
            ${isUnlocked ? '<div class="achievement-check">✓</div>' : ''}
          </div>
          <div class="achievement-content">
            <h3 class="achievement-name">${achievement.name}</h3>
            <p class="achievement-description">${achievement.description}</p>
            <span class="achievement-reward">+${achievement.xpReward} XP</span>
          </div>
          <button class="achievement-share-btn" data-name="${achievement.name}" title="Compartilhar">
            📤
          </button>
        </div>
      `;
    }).join('');
  }

  _attachEventListeners() {
    // Close button
    this.modal.querySelector('.achievements-modal-close')?.addEventListener('click', () => {
      this.close();
    });

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget || e.target === this.modal) {
        this.close();
      }
    });

    // Filter buttons
    this.modal.querySelectorAll('.achievements-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.modal.querySelectorAll('.achievements-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        this.filterCategory = e.target.dataset.category;
        const grid = this.modal.querySelector('#achievements-grid');
        grid.innerHTML = this._renderAchievements();
        
        // Re-attach event listeners for new elements
        this._attachShareListeners();
      });
    });

    // Share buttons
    this._attachShareListeners();
  }

  _attachShareListeners() {
    this.modal.querySelectorAll('.achievement-share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const achievementName = btn.dataset.name;
        const text = `🏆 Desbloqueei a conquista "${achievementName}" no Programa 4D da Bela Nutrição!`;
        
        if (navigator.share) {
          navigator.share({ title: 'Conquista', text });
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          alert('Compartilhamento copiado!');
        }
      });
    });
  }

  _calculateStats() {
    const total = ACHIEVEMENTS_CATALOG.length;
    const unlocked = this.unlockedIds.size;
    return { total, unlocked };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. XP NOTIFICATION TOAST
// ═══════════════════════════════════════════════════════════════════════════

export class XPNotificationToast {
  static show(xpAmount, eventName = 'XP Ganho', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'xp-notification-toast';
    toast.innerHTML = `
      <div class="xp-toast-content">
        <span class="xp-toast-icon">⭐</span>
        <div class="xp-toast-text">
          <p class="xp-toast-event">${eventName}</p>
          <p class="xp-toast-amount">+${xpAmount} XP</p>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. MINI STATS CARD (para dashboard)
// ═══════════════════════════════════════════════════════════════════════════

export class GamificationStatsCard {
  constructor(userProfile = {}) {
    this.userProfile = userProfile;
  }

  render() {
    const level = this._getLevelInfo(this.userProfile.xp || 0);
    const stats = {
      totalChatMessages: this.userProfile.totalChatMessages || 0,
      totalRecipes: this.userProfile.totalRecipes || 0,
      streak: this.userProfile.streak || 0,
      xp: this.userProfile.xp || 0,
      level: level.level
    };

    const container = document.createElement('div');
    container.className = 'gamification-stats-card';
    container.innerHTML = `
      <div class="gamification-stats-grid">
        <div class="gamification-stat-item">
          <span class="stat-icon">⭐</span>
          <div class="stat-info">
            <p class="stat-label">Nível</p>
            <p class="stat-value">${stats.level}</p>
          </div>
        </div>
        <div class="gamification-stat-item">
          <span class="stat-icon">💬</span>
          <div class="stat-info">
            <p class="stat-label">Chat</p>
            <p class="stat-value">${stats.totalChatMessages}</p>
          </div>
        </div>
        <div class="gamification-stat-item">
          <span class="stat-icon">📖</span>
          <div class="stat-info">
            <p class="stat-label">Receitas</p>
            <p class="stat-value">${stats.totalRecipes}</p>
          </div>
        </div>
        <div class="gamification-stat-item">
          <span class="stat-icon">🔥</span>
          <div class="stat-info">
            <p class="stat-label">Sequência</p>
            <p class="stat-value">${stats.streak}d</p>
          </div>
        </div>
      </div>
    `;

    return container;
  }

  _getLevelInfo(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) return LEVELS[i];
    }
    return LEVELS[0];
  }
}
