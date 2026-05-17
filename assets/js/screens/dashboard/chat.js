// Dashboard tab: Chat (inline)
import { escapeHTML, parseRecipeEditMarker } from './helpers.js';

export function render(dash) {
  const suggestions = ['O que posso comer agora?', 'Como está minha glicemia?', 'Sugestão para o jantar', 'Tenho fome fora do horário', 'Me ensine uma receita fácil'];
  const markerCard = dash.chatRecipeContext ? `
    <div class="dash-card pad" style="margin:10px 14px 0;background:rgba(240,5,154,0.08);border-color:rgba(240,5,154,0.18);display:flex;gap:12px;align-items:center;">
      <div style="width:42px;height:42px;border-radius:14px;background:rgba(240,5,154,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${dash.chatRecipeContext.emoji}</div>
      <div style="flex:1;min-width:0;">
        <div style="color:#f0059a;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;">Editando receita</div>
        <div style="color:var(--dash-text);font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(dash.chatRecipeContext.name)}</div>
        <div style="color:var(--dash-muted);font-size:12px;margin-top:2px;">Marcador: [[RECIPE_EDIT:${escapeHTML(dash.chatRecipeContext.id)}]]</div>
      </div>
      <button class="dash-ghost-btn" data-clear-chat-context style="min-height:36px;padding:8px 10px;border-radius:10px;font-size:12px;">Limpar</button>
    </div>
  ` : '';

  const messagesHTML = dash.chatHistory.length > 0
    ? dash.chatHistory.map(msg => {
        const parsed = msg.role === 'user'
          ? parseRecipeEditMarker(msg.content)
          : { text: msg.content || msg.t || msg.text || msg.message || '', recipeId: null };
        const isUser = msg.role === 'user';
        const text = isUser && parsed.recipeId ? parsed.text : (msg.content || msg.t || msg.text || msg.message || '');
        return `
          <div class="message ${isUser ? 'user-message' : 'ai-message'} is-first">
            <div class="message-avatar">${isUser ? '' : '👩‍⚕️'}</div>
            <div class="message-bubble">${parsed.recipeId ? '<div style="background:rgba(240,5,154,0.12);border:1px solid rgba(240,5,154,0.24);color:#f0059a;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:800;display:inline-block;margin-bottom:6px;">Editando receita #' + escapeHTML(parsed.recipeId) + '</div><br/>' : ''}${escapeHTML(text)}</div>
          </div>
        `;
      }).join('')
    : dash.homeChatMessages.map(msg => {
        const isUser = msg.r === 'user';
        return `
          <div class="message ${isUser ? 'user-message' : 'ai-message'} is-first">
            <div class="message-avatar">${isUser ? '' : '👩‍⚕️'}</div>
            <div class="message-bubble">${escapeHTML(msg.t)}</div>
          </div>
        `;
      }).join('');

  const placeholder = dash.chatRecipeContext
    ? 'Explique o que quer editar na receita #' + dash.chatRecipeContext.id + '...'
    : 'Escreva sua dúvida à IA da Mentoria 4D...';

  return `
    <div class="chat-screen-embedded">
      <div class="chat-suggestions">
        ${suggestions.map(suggestion => '<button class="suggestion-chip" data-chat-suggestion="' + escapeHTML(suggestion) + '">' + escapeHTML(suggestion) + '</button>').join('')}
      </div>
      ${markerCard}
      <div class="chat-messages" data-chat-list>
        ${messagesHTML}
      </div>
      <div class="chat-input-area">
        <textarea class="chat-textarea" data-chat-input rows="1" placeholder="${escapeHTML(placeholder)}">${escapeHTML(dash.homeChatInput)}</textarea>
        <button class="chat-send-btn" data-chat-send aria-label="Enviar mensagem">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `;
}
