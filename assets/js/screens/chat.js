import { BaseScreen } from '../modules/navigator.js';
import { UIComponents } from '../modules/components.js';
import { Colors } from '../config/colors.js';
import { SCREENS, XP_EVENTS } from '../config/constants.js';
import { firestoreService } from '../services/firestore.js';
import { authService } from '../services/auth.js';
import { getFunctions } from '../config/firebase.js';
import { buildChatPayload } from '../config/n8n.js';
import { notificationService } from '../modules/notifications.js';

let chatFunction = null;

/**
 * ChatScreen — Chat com IA Guardiã
 * 
 * Tela interativa do chat em tempo real com a IA.
 * - Exibe histórico de mensagens
 * - Envia mensagens e recebe respostas
 * - Mostra receitas sugeridas dentro do chat
 * - Trackeia XP ganho por interações
 * - Estados: loading, error, success
 */
export class ChatScreen extends BaseScreen {
  constructor(params = {}) {
    super(params);

    this.sessionId = `${authService.currentUser?.uid || 'anon'}_${Date.now()}`;
    this.chatHistory = [];
    this.isLoading = false;
    this.unsubscribers = [];
  }

  async mount() {
    try {
      // Inicializa Cloud Function reference
      if (!chatFunction) {
        const functions = getFunctions();
        chatFunction = functions.httpsCallable('agentChatMessage');
      }

      // Carrega histórico do Firestore
      await this.loadChatHistory();

      // Listener em tempo real
      this.unsubscribers.push(
        firestoreService.onChatHistoryUpdate?.(authService.currentUser.uid, (messages) => {
          this.chatHistory = messages;
          this.render();
        })
      );

      // Se é primeira mensagem, mostra placeholder com sugestões
      if (this.chatHistory.length === 0) {
        this.showInitialSuggestions();
      }

      this.render();
    } catch (error) {
      console.error('[ChatScreen] mount error:', error);
      this.showError('Erro ao carregar chat');
    }
  }

  async loadChatHistory() {
    const uid = authService.currentUser.uid;
    const messages = await firestoreService.getChatHistory(uid, 50);
    this.chatHistory = messages;
  }

  showInitialSuggestions() {
    const suggestionArea = document.getElementById('chat-suggestions');
    if (!suggestionArea) return;

    const suggestions = [
      { text: '💬 Qual é a melhor receita para meu diagnóstico?', emoji: '🍽️' },
      { text: '📊 Como está meu progresso?', emoji: '📈' },
      { text: '❓ O que comer no café da manhã?', emoji: '🥣' },
      { text: '💡 Me dê uma dica para hoje', emoji: '⭐' },
    ];

    suggestionArea.innerHTML = suggestions.map(s => `
      <button class="chat-suggestion-btn" data-message="${s.text}">
        ${s.emoji} ${s.text}
      </button>
    `).join('');

    suggestionArea.addEventListener('click', (e) => {
      if (e.target.classList.contains('chat-suggestion-btn')) {
        const message = e.target.dataset.message;
        this.sendMessage(message);
      }
    });
  }

  async sendMessage(userMessage) {
    if (!userMessage?.trim() || this.isLoading) return;

    this.isLoading = true;

    // Adiciona mensagem do user ao histórico imediatamente (optimistic update)
    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      type: 'text',
    };
    this.chatHistory.push(userMsg);
    this.render();

    try {
      // Chama Cloud Function
      const result = await chatFunction({
        message: userMessage,
        sessionId: this.sessionId,
      });

      if (result.data.success) {
        const aiMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: result.data.reply,
          type: result.data.type || 'text',
          recipe: result.data.recipe || null,
          timestamp: new Date(),
          xpAwarded: result.data.xpAwarded || 0,
        };

        // Adiciona resposta da IA
        this.chatHistory.push(aiMessage);

        // Se ganhou XP, mostra notificação
        if (aiMessage.xpAwarded > 0) {
          this.showXPNotification(aiMessage.xpAwarded);
        }

        // Se a IA sugeriu uma receita, mostra inline
        if (result.data.type === 'recipe' && result.data.recipe) {
          notificationService.notify({
            uid: authService.currentUser.uid,
            title: 'Nova receita gerada',
            message: `A Guardiã criou uma receita: ${result.data.recipe.title}`,
            type: 'success',
            payload: { recipeId: result.data.recipe.id },
          });
          this.showRecipeInChat(result.data.recipe);
        }

        this.render();
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('[ChatScreen] sendMessage error:', error);
      const offline = !navigator.onLine;
      const errorMessage = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: offline
          ? 'Sem conexão com a internet. Verifique sua rede e tente novamente.'
          : 'Não consegui responder agora. Tente novamente em instantes.',
        type: 'error',
        timestamp: new Date(),
      };
      this.chatHistory.push(errorMessage);
      this.render();
    } finally {
      this.isLoading = false;
    }
  }

  showRecipeInChat(recipe) {
    // Implementar card de receita inline no chat
    const recipeMsg = {
      id: `recipe_${Date.now()}`,
      role: 'assistant',
      content: 'Que tal tentar esta receita?',
      type: 'recipe',
      recipe,
      timestamp: new Date(),
    };
    this.chatHistory.push(recipeMsg);
  }

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

  scrollToBottom() {
    const messagesArea = document.getElementById('chat-messages');
    if (messagesArea) {
      setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }, 0);
    }
  }

  render() {
    if (this.element) {
      // Re-render in-place (updates from sendMessage / onSnapshot)
      this.element.innerHTML = this.renderHTML();
      this.attachEventListeners();
      this.scrollToBottom();
      return this.element;
    }
    // First render: create the root element for BaseScreen.mount()
    const el = DOM.create('div', 'chat-screen');
    el.innerHTML = this.renderHTML();
    return el;
  }

  renderHTML() {
    return `
      <div class="chat-container">
        <!-- Header com status da guardiã -->
        <div class="chat-header">
          <div class="guardian-status">
            <div class="guardian-avatar">👩‍⚕️</div>
            <div class="guardian-info">
              <h2>Guardiã 4D</h2>
              <span class="status-badge">Online</span>
            </div>
          </div>
        </div>

        <!-- Messages area -->
        <div id="chat-messages" class="chat-messages">
          ${this.renderMessages()}
        </div>

        <!-- Initial suggestions (mostrado se vazio) -->
        ${this.chatHistory.length === 0 ? `
          <div id="chat-suggestions" class="chat-suggestions"></div>
        ` : ''}

        <!-- Input area -->
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <input 
              type="text" 
              id="chat-input" 
              class="chat-input" 
              placeholder="Digite sua mensagem... (ex: O que posso comer agora?)"
              ${this.isLoading ? 'disabled' : ''}
            />
            <button 
              id="chat-send-btn" 
              class="chat-send-btn"
              ${this.isLoading ? 'disabled' : ''}
            >
              ${this.isLoading ? '⏳' : '➤'}
            </button>
          </div>
          <div class="chat-input-hint">
            💡 A Guardiã sabe sobre sua saúde, seus exames e pode gerar receitas personalizadas
          </div>
        </div>

        <!-- Typing indicator -->
        ${this.isLoading ? `
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderMessages() {
    return this.chatHistory.map(msg => {
      if (msg.role === 'user') {
        return `
          <div class="message user-message">
            <div class="message-content">${this.escapeHTML(msg.content)}</div>
            <div class="message-time">${this.formatTime(msg.timestamp)}</div>
          </div>
        `;
      } else if (msg.role === 'assistant') {
        if (msg.type === 'recipe' && msg.recipe) {
          return this.renderRecipeMessage(msg);
        } else {
          return `
            <div class="message ai-message">
              <div class="message-avatar">👩‍⚕️</div>
              <div class="message-wrapper">
                <div class="message-content">${this.formatMessageContent(msg.content)}</div>
                <div class="message-time">${this.formatTime(msg.timestamp)}</div>
              </div>
              ${msg.xpAwarded ? `<div class="message-xp">+${msg.xpAwarded} XP</div>` : ''}
            </div>
          `;
        }
      } else if (msg.role === 'system') {
        return `
          <div class="message system-message">
            <div class="message-content">${this.escapeHTML(msg.content)}</div>
          </div>
        `;
      }
    }).join('');
  }

  renderRecipeMessage(msg) {
    const recipe = msg.recipe;
    return `
      <div class="message ai-message recipe-message">
        <div class="message-avatar">👩‍⚕️</div>
        <div class="message-wrapper">
          <div class="recipe-card">
            <div class="recipe-header">
              <h3>${this.escapeHTML(recipe.title)}</h3>
              ${recipe.difficulty ? `<span class="difficulty-badge">${recipe.difficulty}</span>` : ''}
            </div>

            <div class="recipe-meta">
              ${recipe.prepTimeMin ? `<span>⏱️ ${recipe.prepTimeMin}min</span>` : ''}
              ${recipe.servings ? `<span>🍽️ ${recipe.servings} porção(ões)</span>` : ''}
            </div>

            ${recipe.macros ? `
              <div class="recipe-macros">
                <div class="macro">
                  <span class="macro-label">Proteína</span>
                  <span class="macro-value">${recipe.macros.protein}g</span>
                </div>
                <div class="macro">
                  <span class="macro-label">Carbos</span>
                  <span class="macro-value">${recipe.macros.carbs}g</span>
                </div>
                <div class="macro">
                  <span class="macro-label">Gordura</span>
                  <span class="macro-value">${recipe.macros.fat}g</span>
                </div>
                <div class="macro">
                  <span class="macro-label">Cal</span>
                  <span class="macro-value">${recipe.macros.calories}</span>
                </div>
              </div>
            ` : ''}

            ${recipe.ingredients && recipe.ingredients.length ? `
              <div class="recipe-ingredients">
                <h4>Ingredientes:</h4>
                <ul>
                  ${recipe.ingredients.map(ing => `
                    <li>${ing.quantity} ${ing.unit} ${this.escapeHTML(ing.name)}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}

            <button class="recipe-action-btn" data-recipe-id="${recipe.id}">
              ✨ Tentar Esta Receita
            </button>
          </div>
          <div class="message-time">${this.formatTime(msg.timestamp)}</div>
        </div>
      </div>
    `;
  }

  formatMessageContent(content) {
    // Básico markdown: *negrito*, _itálico_, links
    return content
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

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  attachEventListeners() {
    const inputEl = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    if (inputEl && sendBtn) {
      inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !this.isLoading) {
          this.sendMessage(inputEl.value);
          inputEl.value = '';
        }
      });

      sendBtn.addEventListener('click', () => {
        this.sendMessage(inputEl.value);
        inputEl.value = '';
      });
    }

    // Recipe action buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('recipe-action-btn')) {
        const recipeId = e.target.dataset.recipeId;
        this.goToRecipe(recipeId);
      }
    });
  }

  goToRecipe(recipeId) {
    this.params.onNavigate?.(SCREENS.DASHBOARD, {
      initialNav: 'receitas',
      recipeId,
    });
  }

  showError(message) {
    if (this.element) {
      this.element.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:40px;color:${Colors.danger};text-align:center;">
          <p>⚠️ ${message}</p>
        </div>
      `;
    }
  }

  destroy() {
    this.unsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
  }
}
