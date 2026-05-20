/**
 * LoadingStates — helpers de loading transparente
 *
 * Diferente do loaderOverlay() que cobre a tela inteira,
 * estes helpers inserem spinners e skeletons inline no DOM
 * permitindo que o conteúdo carregue por baixo.
 *
 * Uso:
 *   import { dashSkeleton, inlineSpinner, dataLoader } from '../modules/loading-states.js';
 *
 *   // Skeleton para uma seção do dashboard
 *   const skel = dashSkeleton('inicio');
 *   section.appendChild(skel);
 *
 *   // Quando dados chegam, substitui:
 *   skel.replaceWith(realContent);
 *
 *   // Loader automático com timeout
 *   dataLoader(container, async () => {
 *     const data = await fetchSomething();
 *     container.innerHTML = renderData(data);
 *   });
 */

import { DOM } from '../utils/helpers.js';

/**
 * Retorna HTML de skeleton para cada aba do dashboard.
 * @param {'inicio'|'evolucao'|'receitas'|'exames'|'conquistas'|'chat'|'perfil'} tab
 * @returns {HTMLElement}
 */
export function dashSkeleton(tab = 'inicio') {
  const skel = Object.create(null);
  skel.inicio = () => skeletonInicio();
  skel.evolucao = () => skeletonEvolucao();
  skel.receitas = () => skeletonReceitas();
  skel.exames = () => skeletonExames();
  skel.conquistas = () => skeletonConquistas();
  skel.chat = () => skeletonChat();
  skel.perfil = () => skeletonPerfil();

  const fn = skel[tab] || skel.inicio;
  return fn();
}

/** Container principal com classe para estilização. */
function _wrap(innerHTML) {
  const el = DOM.create('div', 'loading-skeleton-container');
  el.innerHTML = innerHTML;
  return el;
}

function skeletonInicio() {
  return _wrap(`
    <div class="skel-greeting">
      <div class="skeleton skeleton-line title" style="width:55%"></div>
      <div class="skeleton skeleton-line medium" style="width:30%;margin-top:6px"></div>
    </div>
    <div class="skel-stats-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0">
      <div class="skeleton skeleton-card" style="height:88px"></div>
      <div class="skeleton skeleton-card" style="height:88px"></div>
      <div class="skeleton skeleton-card" style="height:88px"></div>
    </div>
    <div class="skel-chat-preview" style="margin-top:12px">
      <div class="skeleton skeleton-card" style="height:64px"></div>
      <div class="skeleton skeleton-card" style="height:64px;margin-top:8px"></div>
    </div>
  `);
}

function skeletonEvolucao() {
  return _wrap(`
    <div style="margin-bottom:16px">
      <div class="skeleton skeleton-line title" style="width:40%"></div>
      <div class="skeleton skeleton-line medium" style="width:60%;margin-top:6px"></div>
    </div>
    <div class="skeleton skeleton-card" style="height:180px;margin-bottom:12px"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="skeleton skeleton-card" style="height:60px"></div>
      <div class="skeleton skeleton-card" style="height:60px"></div>
    </div>
  `);
}

function skeletonReceitas() {
  return _wrap(`
    <div style="margin-bottom:16px">
      <div class="skeleton skeleton-line title" style="width:35%"></div>
      <div class="skeleton skeleton-line medium" style="width:50%;margin-top:6px"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="skeleton skeleton-card" style="height:200px"></div>
      <div class="skeleton skeleton-card" style="height:200px"></div>
    </div>
  `);
}

function skeletonExames() {
  return _wrap(`
    <div style="margin-bottom:16px">
      <div class="skeleton skeleton-line title" style="width:30%"></div>
    </div>
    <div class="skeleton skeleton-card" style="height:80px;margin-bottom:8px"></div>
    <div class="skeleton skeleton-card" style="height:80px;margin-bottom:8px"></div>
    <div class="skeleton skeleton-card" style="height:80px"></div>
  `);
}

function skeletonConquistas() {
  return _wrap(`
    <div style="margin-bottom:16px">
      <div class="skeleton skeleton-line title" style="width:45%"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
      <div class="skeleton skeleton-card" style="height:100px"></div>
      <div class="skeleton skeleton-card" style="height:100px"></div>
      <div class="skeleton skeleton-card" style="height:100px"></div>
    </div>
  `);
}

function skeletonChat() {
  return _wrap(`
    <div style="margin-bottom:16px">
      <div class="skeleton skeleton-line title" style="width:25%"></div>
    </div>
    <div class="skeleton skeleton-card" style="height:60px;margin-bottom:8px"></div>
    <div class="skeleton skeleton-card" style="height:60px;margin-bottom:8px;margin-left:40px"></div>
    <div class="skeleton skeleton-card" style="height:60px;margin-bottom:8px"></div>
    <div class="skeleton skeleton-card" style="height:60px;margin-bottom:8px;margin-left:40px"></div>
    <div style="margin-top:12px">
      <div class="skeleton skeleton-card" style="height:44px"></div>
    </div>
  `);
}

function skeletonPerfil() {
  return _wrap(`
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <div class="skeleton" style="width:60px;height:60px;border-radius:50%"></div>
      <div style="flex:1">
        <div class="skeleton skeleton-line title" style="width:50%"></div>
        <div class="skeleton skeleton-line medium" style="width:30%;margin-top:4px"></div>
      </div>
    </div>
    <div class="skeleton skeleton-card" style="height:48px;margin-bottom:8px"></div>
    <div class="skeleton skeleton-card" style="height:48px;margin-bottom:8px"></div>
    <div class="skeleton skeleton-card" style="height:48px"></div>
  `);
}

// ── Inline spinner ───────────────────────────────────────

/**
 * Spinner inline pequeno, ideal para botões ou ao lado de texto.
 * @param {number} size Em px
 * @param {string} color CSS color
 * @returns {HTMLElement}
 */
export function inlineSpinner(size = 18, color = 'var(--color-primary, #f0059a)') {
  const el = DOM.create('span', 'inline-loading-spinner');
  DOM.setStyle(el, {
    display: 'inline-block',
    width: size + 'px',
    height: size + 'px',
    border: `2.5px solid rgba(128,128,128,0.15)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    verticalAlign: 'middle',
  });
  return el;
}

// ── DataLoader pattern ───────────────────────────────────

/**
 * Pattern: insere skeleton, carrega dados, substitui.
 * @param {HTMLElement} container — elemento para inserir o loading
 * @param {Function} loader — async () => { return elementoRenderizado }
 * @param {object} options
 * @param {string} [options.tab] — aba do dashboard (para skeleton)
 * @param {number} [options.timeout] — ms para timeout (default 15s)
 * @param {boolean} [options.keepSkeletonOnError] — manter skeleton se falhar?
 * @returns {Promise<HTMLElement|null>} elemento renderizado ou null
 */
export async function dataLoader(container, loader, options = {}) {
  const { tab = 'inicio', timeout = 15000, keepSkeletonOnError = true } = options;

  // Insere skeleton
  const skeleton = dashSkeleton(tab);
  container.innerHTML = '';
  container.appendChild(skeleton);

  // Timeout
  const timer = setTimeout(() => {
    if (!keepSkeletonOnError) return;
    // Se quiser, pode adicionar hint de timeout aqui
  }, timeout);

  try {
    const result = await loader();
    clearTimeout(timer);
    container.innerHTML = '';
    if (result) {
      if (typeof result === 'string') {
        container.innerHTML = result;
      } else {
        container.appendChild(result);
      }
    }
    return result;
  } catch (err) {
    clearTimeout(timer);
    console.error('[Loading] dataLoader error:', err);
    if (!keepSkeletonOnError) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">Não foi possível carregar os dados.</div>
      </div>`;
    }
    return null;
  }
}

// ── Inline overlay (transparente, não full-screen) ───────

/**
 * Overlay sutil, não full-screen — ideal para um card ou seção.
 * @param {string} message
 * @returns {HTMLElement}
 */
export function subtleOverlay(message = 'Carregando...') {
  const el = DOM.create('div', 'subtle-loader-overlay');
  DOM.setStyle(el, {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 'inherit',
    zIndex: 10,
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  });
  const box = DOM.create('div');
  DOM.setStyle(box, {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    background: 'rgba(20,20,30,0.8)',
    padding: '10px 18px',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
  });
  box.appendChild(inlineSpinner(20, '#f0059a'));
  if (message) {
    const txt = DOM.create('span');
    txt.textContent = message;
    box.appendChild(txt);
  }
  el.appendChild(box);
  return el;
}

// ── N8N / AI action loading wrappers ─────────────────────

/**
 * Mensagens de loading específicas para cada ação de IA/n8n.
 * Mapeia nome da função → texto exibido no loader.
 */
const AI_LOADING_MESSAGES = {
  generateRecipe:     '👩‍🍳 A Guardiã está preparando sua receita...',
  processBloodTest:   '🔬 Analisando seu exame...',
  agentChatMessage:   '💬 A IA está processando sua pergunta...',
  evaluateFood:       '🍽️ Avaliando o alimento...',
  default:            '⏳ Processando...',
};

/**
 * Envolve uma chamada n8n/IA com loader transparente.
 * Exibe o loader apropriado baseado no nome da ação.
 *
 * @param {string} actionName — nome da ação (ex: 'generateRecipe')
 * @param {Function} fn — async () => resultado
 * @returns {Promise<any>} resultado da fn
 *
 * Uso:
 *   const recipe = await aiLoading('generateRecipe', () => n8nService.generateRecipe(uid, prefs));
 */
export async function aiLoading(actionName, fn) {
  const message = AI_LOADING_MESSAGES[actionName] || AI_LOADING_MESSAGES.default;
  const loader = await UIComponents_loaderOverlay(message);
  document.body.appendChild(loader);

  try {
    const result = await fn();
    return result;
  } finally {
    loader.remove();
  }
}

/**
 * Versão leve: spinner inline ao lado de um elemento alvo.
 * @param {HTMLElement} target — elemento ao lado do qual inserir spinner
 * @param {string} actionName — nome da ação IA
 * @returns {{ spinner: HTMLElement, done: () => void }}
 */
export function inlineAiSpinner(target, actionName = 'default') {
  const message = AI_LOADING_MESSAGES[actionName] || AI_LOADING_MESSAGES.default;
  const wrapper = DOM.create('span', 'inline-ai-spinner-wrap');
  DOM.setStyle(wrapper, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '8px',
    fontSize: '12px',
    color: 'var(--color-muted, #888)',
    fontStyle: 'italic',
  });

  const spin = inlineSpinner(14, '#f0059a');
  const label = DOM.create('span');
  label.textContent = message;
  wrapper.appendChild(spin);
  wrapper.appendChild(label);

  if (target && target.parentNode) {
    target.insertAdjacentElement('afterend', wrapper);
  }

  return {
    spinner: wrapper,
    done: () => wrapper.remove(),
  };
}

// Lazy import to avoid circular dependency
async function UIComponents_loaderOverlay(message) {
  const mod = await import('../modules/components.js');
  return mod.UIComponents.loaderOverlay({ message, color: '#f0059a' });
}
