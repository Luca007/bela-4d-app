import { BaseScreen } from '../modules/navigator.js';
import { UIComponents } from '../modules/components.js';
import { Colors } from '../config/colors.js';
import { SCREENS, XP_EVENTS } from '../config/constants.js';
import { firestoreService } from '../services/firestore.js';
import { authService } from '../services/auth.js';
import { n8nService } from '../services/n8n.js';
import { notificationService } from '../modules/notifications.js';
import { DOM } from '../utils/helpers.js';


/**
 * ChatScreen — Chat com IA Guardiã
 *
 * Tela interativa do chat em tempo real com a IA.
 * - Exibe histórico de mensagens com visual refatorado
 * - Envia mensagens e recebe respostas com timeout de 60s
 * - Mostra receitas sugeridas dentro do chat (recipe cards)
 * - Banner de receita fixado quando params.recipeId está definido
 * - Animação "Guardiã está pensando..." durante requisição
 * - Trackeia XP ganho por interações
 */
export class ChatScreen extends BaseScreen {
  constructor(params = {}) {
    super(params);

    this.sessionId = `${authService.currentUser?.uid || 'anon'}_${Date.now()}`;
    this.chatHistory = [];
    this.isLoading = false;
    this.unsubscribers = [];

    // New visual-refactor state
    this.thinkingVisible = false;
    this.thinkingAbortController = null;
    this.pinnedRecipe = null;
    this.draftInput = '';
    this.suggestions = [
      'Qual a melhor receita para meu diagnóstico?',
      'Como está meu progresso?',
      'O que comer no café da manhã?',
      'Me dê uma dica para hoje',
    ];
  }

  async mount() {
    // Anexa o elemento ao DOM ANTES de qualquer operação async para que
    // _render() (que depende de this.element) funcione mesmo se algum
    // listener disparar antes do loadChatHistory completar.
    this.container = DOM.byId('app') || DOM.query('main') || document.body;
    this.element = this.render();
    if (this.container) {
      this.container.innerHTML = '';
      this.container.appendChild(this.element);
    }

    try {
      // Handle pinned recipe from params
      if (this.params?.recipeId) {
        this.pinnedRecipe = {
          id: this.params.recipeId,
          name: this.params.recipeName || 'Receita',
          emoji: this.params.recipeEmoji || '🍽️',
        };
        const uid = authService.currentUser?.uid;
        if (uid) this.sessionId = uid + '_recipe_' + this.params.recipeId;
        this.draftInput = `Quero editar esta receita: ${this.params.recipeName || 'receita'}. O que você sugere?`;
      }

      // Carrega histórico do Firestore
      await this.loadChatHistory();

      // Listener em tempo real
      if (authService.currentUser?.uid) {
        this.unsubscribers.push(
          firestoreService.onChatHistoryUpdate?.(authService.currentUser.uid, (messages) => {
            this.chatHistory = messages;
            this._render();
          })
        );
      }

      // Hide suggestions once there are messages
      if (this.chatHistory.length > 0) {
        this.suggestions = [];
      }

      this._render();
    } catch (error) {
      console.error('[ChatScreen] mount error:', error);
      this.showError('Erro ao carregar chat');
    }
  }

  async loadChatHistory() {
    const uid = authService.currentUser?.uid;
    if (!uid) return;
    const messages = await firestoreService.getChatHistory(uid, 50);
    this.chatHistory = messages;
  }

  // ---------------------------------------------------------------------------
  // Cloud function wrapper
  // ---------------------------------------------------------------------------

  async _callChatFunction(message) {
    const uid = authService.currentUser?.uid || 'anon';
    return n8nService.sendChatMessage(uid, message, this.sessionId);
  }

  // ---------------------------------------------------------------------------
  // Send message with 60s timeout + thinking animation
  // ---------------------------------------------------------------------------

  async sendMessage(userMessage) {
    if (!userMessage?.trim() || this.isLoading) return;
    this.isLoading = true;

    // Optimistic user message
    this.chatHistory.push({
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      type: 'text',
    });
    this.suggestions = [];
    this.thinkingVisible = true;
    this._render();
    this._scrollToBottom();

    const ctrl = new AbortController();
    this.thinkingAbortController = ctrl;
    const timeoutId = setTimeout(() => ctrl.abort('timeout'), 60000);

    try {
      const msgToSend = this.pinnedRecipe
        ? `[[RECIPE_EDIT:${this.pinnedRecipe.id}]] ${userMessage}`
        : userMessage;

      const callPromise = this._callChatFunction(msgToSend);
      const result = await Promise.race([
        callPromise,
        new Promise((_, reject) =>
          ctrl.signal.addEventListener('abort', () =>
            reject(new Error(ctrl.signal.reason === 'timeout' ? 'TIMEOUT' : 'CANCELLED'))
          )
        ),
      ]);

      clearTimeout(timeoutId);

      if (result?.success) {
        const aiMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: result.reply,
          type: result.type || 'text',
          recipe: result.recipe || null,
          timestamp: new Date(),
          xpAwarded: result.xpAwarded || 0,
        };

        this.chatHistory.push(aiMessage);

        if (aiMessage.xpAwarded > 0) {
          this.showXPNotification(aiMessage.xpAwarded);
        }

        if (result.type === 'recipe' && result.recipe) {
          notificationService.notify({
            uid: authService.currentUser?.uid,
            title: 'Nova receita gerada',
            message: `A Guardiã criou uma receita: ${result.recipe.title || result.recipe.name}`,
            type: 'success',
            payload: { recipeId: result.recipe.id },
          });
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const isTimeout = error.message === 'TIMEOUT';
      const errorDetail = error?.details?.message || error?.message || 'Erro desconhecido';
      const errorMsg = isTimeout
        ? '⏱️ A Guardiã demorou muito. Tente novamente.'
        : navigator.onLine
          ? `❌ ${errorDetail}`
          : '📵 Sem conexão com a internet.';
      this.chatHistory.push({
        id: `error_${Date.now()}`,
        role: 'system',
        type: 'error',
        content: errorMsg,
        timestamp: new Date(),
      });
      console.error('[ChatScreen] sendMessage error:', error);
    } finally {
      clearTimeout(timeoutId);
      this.isLoading = false;
      this.thinkingVisible = false;
      this.thinkingAbortController = null;
      this._render();
      this._scrollToBottom();
    }
  }

  // ---------------------------------------------------------------------------
  // XP notification (unchanged)
  // ---------------------------------------------------------------------------

  showXPNotification(xp) {
    const notification = document.createElement('div');
    notification.className = 'xp-notification';
    notification.textContent = `+${xp} XP`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${Colors.xp};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  goToRecipe(recipeId) {
    this.params.onNavigate?.(SCREENS.DASHBOARD, {
      initialNav: 'receitas',
      recipeId,
    });
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  _escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Keep backwards-compat alias used in older code paths
  escapeHTML(text) {
    return this._escapeHTML(text);
  }

  formatMessageContent(content) {
    return this._escapeHTML(content)
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  formatTime(date) {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;

    return date.toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  _renderMessages() {
    const messages = this.chatHistory || [];
    return messages.map((msg, i) => {
      const isFirst = i === 0 || messages[i - 1].role !== msg.role;

      if (msg.role === 'user') {
        return `<div class="chat-message--user message user-message${isFirst ? ' is-first' : ''}">
          <div class="message-avatar"></div>
          <div class="message-bubble">${this._escapeHTML(msg.content || '')}</div>
        </div>`;
      }

      if (msg.type === 'error' || msg.role === 'system') {
        return `<div class="chat-message--ai message ai-message is-first">
          <div class="message-avatar">👩‍⚕️</div>
          <div class="message-bubble error-bubble">${this._escapeHTML(msg.content || '')}</div>
        </div>`;
      }

      if (msg.type === 'recipe' && msg.recipe) {
        const r = msg.recipe;
        const macros = r.macros || r.nutrition || {};
        return `<div class="chat-message--ai message ai-message${isFirst ? ' is-first' : ''}">
          <div class="message-avatar">👩‍⚕️</div>
          <div class="chat-recipe-card">
            <span class="recipe-card-emoji">${r.emoji || r.e || '🍽️'}</span>
            <div class="recipe-card-name">${this._escapeHTML(r.name || r.nm || r.title || 'Receita')}</div>
            <div class="recipe-card-macros">
              ${macros.calories || macros.kcal ? `<span class="macro-chip kcal">${macros.calories || macros.kcal} kcal</span>` : ''}
              ${macros.carbs || macros.carbohydrates ? `<span class="macro-chip carb">${macros.carbs || macros.carbohydrates}g carb</span>` : ''}
              ${macros.protein ? `<span class="macro-chip prot">${macros.protein}g prot</span>` : ''}
              ${macros.fat ? `<span class="macro-chip fat">${macros.fat}g fat</span>` : ''}
            </div>
            <button class="recipe-card-btn" data-recipe-id="${this._escapeHTML(r.id || '')}">Ver receita completa</button>
          </div>
        </div>`;
      }

      // Default AI text message
      return `<div class="chat-message--ai message ai-message${isFirst ? ' is-first' : ''}">
        <div class="message-avatar">👩‍⚕️</div>
        <div class="message-bubble">${this.formatMessageContent(msg.content || msg.reply || '')}</div>
      </div>`;
    }).join('');
  }

  _buildHTML() {
    return `
      <div class="chat-screen">

        <!-- Header -->
        <div class="chat-header">
          <button class="chat-back-btn" id="chat-back-btn">←</button>
          <div class="chat-avatar-wrap">
            <div class="chat-avatar">👩‍⚕️</div>
            <div class="chat-online-dot"></div>
          </div>
          <div class="chat-header-info">
            <div class="chat-header-name">Guardiã 4D</div>
            <div class="chat-header-status">Online agora</div>
          </div>
        </div>

        <!-- Pinned recipe banner -->
        ${this.pinnedRecipe ? `
        <div class="chat-recipe-banner">
          <span class="banner-emoji">${this._escapeHTML(this.pinnedRecipe.emoji)}</span>
          <div class="banner-info">
            <span class="banner-label">Editando receita</span>
            <span class="banner-name">${this._escapeHTML(this.pinnedRecipe.name)}</span>
          </div>
          <button class="banner-close" id="banner-close-btn">✕</button>
        </div>
        ` : ''}

        <!-- Messages -->
        <div class="chat-messages" id="chat-messages">
          ${this._renderMessages()}
          ${this.thinkingVisible ? `
          <div class="chat-message--ai message ai-message is-first thinking-bubble">
            <div class="message-avatar">👩‍⚕️</div>
            <div class="thinking-content">
              <span class="thinking-label">Guardiã está pensando</span>
              <div class="thinking-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Suggestion chips -->
        ${this.suggestions?.length ? `
        <div class="chat-suggestions">
          ${this.suggestions.map(s => `<button class="suggestion-chip" data-suggestion="${this._escapeHTML(s)}">${this._escapeHTML(s)}</button>`).join('')}
        </div>
        ` : ''}

        <!-- Input bar -->
        <div class="chat-input-bar">
          <textarea
            class="chat-textarea"
            id="chat-input"
            placeholder="Pergunte à Guardiã 4D..."
            rows="1"
            ${this.isLoading ? 'disabled' : ''}
          >${this._escapeHTML(this.draftInput)}</textarea>
          <button class="chat-send-btn" id="chat-send-btn" ${this.isLoading ? 'disabled' : ''}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>

      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Core render / re-render
  // ---------------------------------------------------------------------------

  /**
   * Called by BaseScreen.mount() on first render.
   * Returns a DOM element that BaseScreen will append to #app.
   */
  render() {
    const el = DOM.create('div');
    el.innerHTML = this._buildHTML();
    // BaseScreen.mount() assigns the return value to this.element
    // We set it here so attachEventListeners can reference it immediately.
    this.element = el;
    this._attachEventListeners(el);
    return el;
  }

  /**
   * Re-render in-place (called after state changes).
   */
  _render() {
    if (!this.element) return;
    this.element.innerHTML = this._buildHTML();
    this._attachEventListeners(this.element);
    this._scrollToBottom();
  }

  // ---------------------------------------------------------------------------
  // Scroll
  // ---------------------------------------------------------------------------

  _scrollToBottom() {
    const messagesArea = this.element
      ? this.element.querySelector('#chat-messages')
      : document.getElementById('chat-messages');
    if (messagesArea) {
      setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }, 0);
    }
  }

  // Keep backwards-compat alias
  scrollToBottom() {
    this._scrollToBottom();
  }

  // ---------------------------------------------------------------------------
  // Event listeners
  // ---------------------------------------------------------------------------

  _attachEventListeners(el) {
    const textarea = el.querySelector('#chat-input');

    // Auto-resize textarea
    if (textarea) {
      const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
      };

      textarea.addEventListener('input', autoResize);

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const val = textarea.value.trim();
          if (val) {
            textarea.value = '';
            textarea.style.height = 'auto';
            this.draftInput = '';
            this.sendMessage(val);
          }
        }
      });

      // Focus with cursor at end if we have a draft
      if (this.draftInput) {
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);
      }
    }

    // Send button
    el.querySelector('#chat-send-btn')?.addEventListener('click', () => {
      const val = textarea?.value?.trim();
      if (val) {
        textarea.value = '';
        textarea.style.height = 'auto';
        this.draftInput = '';
        this.sendMessage(val);
      }
    });

    // Back button
    el.querySelector('#chat-back-btn')?.addEventListener('click', () => {
      this.params?.onBack?.() || this.params?.onNavigate?.(SCREENS.DASHBOARD);
    });

    // Banner close
    el.querySelector('#banner-close-btn')?.addEventListener('click', () => {
      this.pinnedRecipe = null;
      this._render();
    });

    // Suggestion chips
    el.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.dataset.suggestion;
        if (suggestion) this.sendMessage(suggestion);
      });
    });

    // Recipe card buttons
    el.querySelectorAll('.recipe-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const recipeId = btn.dataset.recipeId;
        if (recipeId) this.goToRecipe(recipeId);
      });
    });
  }

  // BaseScreen.mount() calls setupEventListeners() after render().
  // Override it as a no-op since we handle listeners inside _attachEventListeners.
  setupEventListeners() {}

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  showError(message) {
    if (this.element) {
      this.element.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:40px;color:${Colors.danger};text-align:center;">
          <p>⚠️ ${message}</p>
        </div>
      `;
    }
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy() {
    // Cancel any in-flight request
    if (this.thinkingAbortController) {
      this.thinkingAbortController.abort('CANCELLED');
    }
    this.unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    if (this.element) {
      this.element.remove();
    }
  }
}
