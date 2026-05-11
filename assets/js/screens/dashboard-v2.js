// Dashboard Screen - JSX-inspired refactor
import { DOM, State, Session } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { authService } from '../services/auth.js';
import { firestoreService } from '../services/firestore.js';
import { ACHIEVEMENTS_CATALOG, LEVELS } from '../config/constants.js';
import { offlineQueue } from '../modules/offline-queue.js';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Início', icon: '🏠', sub: 'Chat · Receita · Cardápio' },
  { id: 'evolucao', label: 'Evolução', icon: '📊', sub: 'Gráficos · Progresso' },
  { id: 'receitas', label: 'Receitas', icon: '🥗', sub: 'Cardápio personalizado' },
  { id: 'exames', label: 'Exames', icon: '🔬', sub: 'Pedidos · Resultados' },
  { id: 'conquistas', label: 'Conquistas', icon: '🏆', sub: 'Ranking · Comunidade' },
  { id: 'chat', label: 'Chat IA', icon: '💬', sub: 'Dúvidas alimentares' },
  { id: 'perfil', label: 'Meu Perfil', icon: '👤', sub: 'Avatar · Configurações' },
];

const REFEICOES_DIA = [
  { id: 'r1', icon: '☀️', nome: 'Café da manhã', hora: '07:00', desc: 'Omelete de espinafre + café sem açúcar' },
  { id: 'r2', icon: '🍎', nome: 'Lanche da manhã', hora: '10:00', desc: '10 amêndoas + queijo minas' },
  { id: 'r3', icon: '🍽️', nome: 'Almoço', hora: '12:30', desc: 'Frango grelhado + brócolis + salada' },
  { id: 'r4', icon: '🌤️', nome: 'Lanche da tarde', hora: '15:30', desc: 'Iogurte natural + morangos' },
  { id: 'r5', icon: '🌙', nome: 'Jantar', hora: '19:00', desc: 'Filé de peixe + abobrinha + tomate' },
  { id: 'r6', icon: '🌛', nome: 'Ceia', hora: '21:30', desc: 'Chá de camomila + castanhas' },
];

const DICAS = [
  { e: '🧠', ti: 'Mastigue devagar', tx: 'Mastigar lentamente reduz picos glicêmicos e melhora a saciedade.' },
  { e: '💧', ti: 'Beba água antes de comer', tx: 'Um copo de água 15 min antes das refeições ajuda a controlar o apetite.' },
  { e: '🌿', ti: 'Comece pelos vegetais', tx: 'Iniciar pelo prato verde reduz a absorção rápida de açúcar.' },
  { e: '⏰', ti: 'Respeite os horários', tx: 'Comer nos mesmos horários todos os dias estabiliza a rotina metabólica.' },
];

const RECIPES = [
  { id: 'r1', e: '🥚', nm: 'Omelete de Legumes', tm: '15 min', kc: 280, ct: 'Café da manhã', df: 'Fácil', ig: ['3 ovos', 'Abobrinha', 'Tomate', 'Sal e ervas'], st: ['Bata os ovos com sal.', 'Refogue legumes no azeite.', 'Despeje e tampe 3 min.', 'Sirva com folhas verdes.'] },
  { id: 'r2', e: '🐟', nm: 'Salmão com Aspargos', tm: '20 min', kc: 380, ct: 'Almoço', df: 'Médio', ig: ['200g salmão', 'Aspargos', 'Azeite', 'Limão'], st: ['Tempere o salmão.', 'Grelhe 4 min/lado.', 'Refogue aspargos.', 'Sirva com limão.'] },
  { id: 'r3', e: '🥗', nm: 'Bowl Low-Carb Frango', tm: '25 min', kc: 320, ct: 'Almoço', df: 'Fácil', ig: ['150g frango', 'Rúcula', 'Abacate', 'Azeite'], st: ['Grelhe o frango.', 'Monte bowl com rúcula.', 'Adicione abacate.', 'Regue com azeite.'] },
  { id: 'r4', e: '🍳', nm: 'Frittata de Espinafre', tm: '20 min', kc: 260, ct: 'Jantar', df: 'Fácil', ig: ['4 ovos', 'Espinafre', 'Queijo minas', 'Alho'], st: ['Refogue espinafre.', 'Bata ovos com queijo.', 'Combine na frigideira.', 'Forno 10 min 180°C.'] },
  { id: 'r5', e: '🥑', nm: 'Mousse de Abacate', tm: '10 min', kc: 200, ct: 'Lanche', df: 'Fácil', ig: ['1 abacate', 'Cacau em pó', 'Stevia'], st: ['Amasse o abacate.', 'Adicione cacau e stevia.', 'Misture bem.', 'Sirva gelado.'] },
  { id: 'r6', e: '🍲', nm: 'Caldo de Frango', tm: '40 min', kc: 180, ct: 'Ceia', df: 'Médio', ig: ['Frango', 'Chuchu', 'Cenoura', 'Ervas'], st: ['Cozinhe frango 30 min.', 'Adicione legumes.', 'Tempere.', 'Coe e sirva.'] },
];

const BADGES = [
  { id: 'b1', e: '🌟', nm: 'Primeiro Passo', ds: 'Completou o cadastro inicial', xp: 50, ct: 'Sistema', ok: true },
  { id: 'b2', e: '📅', nm: '7 Dias no Ritmo', ds: 'Seguiu o cardápio por 7 dias', xp: 150, ct: 'Alimentação', ok: true },
  { id: 'b3', e: '📉', nm: 'Glicemia em Queda', ds: 'Reduziu a glicemia em 20%', xp: 200, ct: 'Saúde', ok: true },
  { id: 'b4', e: '💬', nm: 'Curiosa', ds: 'Fez 10 perguntas ao Chat IA', xp: 80, ct: 'Sistema', ok: true },
  { id: 'b5', e: '🔥', nm: '30 Dias Ativa', ds: 'Usou o sistema por 30 dias', xp: 300, ct: 'Sistema', ok: false },
  { id: 'b6', e: '🏆', nm: 'Top 10', ds: 'Entrou no top 10 do ranking', xp: 250, ct: 'Ranking', ok: false },
  { id: 'b7', e: '💪', nm: 'Semana Vencida', ds: 'Completou a primeira semana', xp: 100, ct: 'Alimentação', ok: true },
  { id: 'b8', e: '📊', nm: 'Monitor Assídua', ds: 'Registrou glicemia por 30 dias', xp: 280, ct: 'Saúde', ok: false },
  { id: 'b9', e: '🌙', nm: 'Sono de Qualidade', ds: 'Registrou sono 5+ por 7 noites', xp: 130, ct: 'Saúde', ok: true },
  { id: 'b10', e: '🤝', nm: 'Comunidade', ds: 'Reagiu a 10 conquistas', xp: 90, ct: 'Social', ok: true },
  { id: 'b11', e: '⚡', nm: 'Velocista', ds: 'Iniciou rapidamente no sistema', xp: 60, ct: 'Sistema', ok: true },
  { id: 'b12', e: '🎯', nm: 'Meta Batida', ds: 'Atingiu primeira meta de peso', xp: 220, ct: 'Saúde', ok: false },
  { id: 'b13', e: '🥕', nm: 'Colorida', ds: 'Completou 5 pratos com vegetais', xp: 90, ct: 'Alimentação', ok: false },
  { id: 'b14', e: '🧊', nm: 'Hidratação em Dia', ds: 'Registrou água por 14 dias', xp: 110, ct: 'Saúde', ok: false },
  { id: 'b15', e: '🚶', nm: 'Passos Firmes', ds: 'Manteve rotina ativa por 10 dias', xp: 130, ct: 'Saúde', ok: false },
  { id: 'b16', e: '🍽️', nm: 'Prato Completo', ds: 'Seguiu o plano completo por 3 dias', xp: 120, ct: 'Alimentação', ok: false },
  { id: 'b17', e: '💤', nm: 'Ritmo do Sono', ds: 'Dormiu 7h+ por 7 noites', xp: 140, ct: 'Saúde', ok: false },
  { id: 'b18', e: '💬', nm: 'Parceira da IA', ds: 'Interagiu 50 vezes com o chat', xp: 180, ct: 'Sistema', ok: false },
  { id: 'b19', e: '🎉', nm: 'Comunidade Ativa', ds: 'Recebeu 25 curtidas em conquistas', xp: 170, ct: 'Social', ok: false },
  { id: 'b20', e: '🚀', nm: 'Virada 4D', ds: 'Ultrapassou 5000 XP', xp: 300, ct: 'Ranking', ok: false },
];

const RANKING = [
  { p: 1, nm: 'Ana Beatriz', nk: '@anabea', e: '👑', col: '#eab308', xp: 1420, st: 45 },
  { p: 2, nm: 'Carla Mendes', nk: '@carlinha', e: '🔥', col: '#f0059a', xp: 1180, st: 38 },
  { p: 3, nm: 'Priscila S.', nk: '@prisilva', e: '💎', col: '#a78bfa', xp: 980, st: 31 },
  { p: 4, nm: 'Fernanda L.', nk: '@ferlima', e: '🌺', col: '#1fcc74', xp: 820, st: 28 },
  { p: 5, nm: 'Juliana C.', nk: '@juju', e: '⭐', col: '#38bdf8', xp: 710, st: 22 },
  { p: 6, nm: 'Mariana A.', nk: '@mari', e: '🌸', col: '#fb7185', xp: 640, st: 19 },
  { p: 7, nm: 'Tatiane R.', nk: '@tati', e: '🦋', col: '#34d399', xp: 580, st: 17 },
  { p: 8, nm: 'Você', nk: '@voce', e: '🌙', col: '#f0059a', xp: 520, st: 14, me: true },
  { p: 9, nm: 'Roberta D.', nk: '@robi', e: '🍀', col: '#fbbf24', xp: 480, st: 12 },
  { p: 10, nm: 'Simone N.', nk: '@sisi', e: '🌿', col: '#6ee7b7', xp: 410, st: 10 },
];

const EXAM_RESULTS = {
  glicemia: [{ m: 'Nov', v: 165 }, { m: 'Dez', v: 148 }, { m: 'Jan', v: 132 }, { m: 'Fev', v: 121 }, { m: 'Mar', v: 109 }, { m: 'Abr', v: 98 }],
  hba1c: [{ m: 'Nov', v: 8.1 }, { m: 'Jan', v: 7.4 }, { m: 'Mar', v: 6.8 }, { m: 'Abr', v: 6.1 }],
  peso: [{ m: 'Nov', v: 84.0 }, { m: 'Dez', v: 83.2 }, { m: 'Jan', v: 82.1 }, { m: 'Fev', v: 81.4 }, { m: 'Mar', v: 80.1 }, { m: 'Abr', v: 79.6 }],
};

const EXAM_ORDERS = [
  { id: 'eo1', dt: '28/04/2026', st: 'Pendente', ex: ['Glicemia em jejum', 'HbA1c', 'Insulina em jejum', 'Peptídeo C'], ins: 'Jejum mínimo 12h. Coletar pela manhã.', fileReady: false, fileUrl: '' },
  { id: 'eo2', dt: '15/03/2026', st: 'Realizado', ex: ['Perfil lipídico', 'TSH', 'T4 livre', 'Ferritina', 'Vitamina D'], ins: 'Jejum de 12 horas.', fileReady: true, fileUrl: '' },
  { id: 'eo3', dt: '10/01/2026', st: 'Realizado', ex: ['Glicemia', 'HbA1c', 'Urina tipo 1', 'Creatinina'], ins: 'Coleta em laboratório credenciado.', fileReady: false, fileUrl: '' },
];

const CHAT_RESP = [
  'Com frango, abobrinha e ovos você pode fazer uma fritata proteica! Refogue a abobrinha, cubra com os ovos batidos e tampe. Pronto em 15 min e mantém a glicemia estável 🍳',
  'Sua glicemia está em queda consistente - parabéns! Continue focada no cardápio 📊✨',
  'Esse alimento está liberado para você! Quer sugestão de preparo? 🥗',
  'Para o seu lanche: 10 amêndoas + queijo minas + água com limão 💪',
  'Sua HbA1c caiu de 8,1% para 6,1% - resultado extraordinário! Continue assim 💕',
  'Ótima pergunta! Para controle glicêmico, sempre combine proteína com fibras. Isso retarda a absorção do açúcar e reduz os picos 🌿',
];

const PROFILE_AVATARS = ['🌸', '⚡', '🦋', '🌺', '💎', '🔥', '🌙', '⭐', '🌿', '🦁', '🌊', '🍀'];
const PROFILE_COLORS = ['#f0059a', '#a78bfa', '#1fcc74', '#f59e0b', '#38bdf8', '#fb7185', '#34d399', '#fbbf24'];
const XP_LEVELS = [
  { level: 1, title: 'Iniciante', minXp: 0, color: '#8a8aa0' },
  { level: 2, title: 'Aprendiz', minXp: 500, color: '#10b981' },
  { level: 3, title: 'Comprometida', minXp: 1200, color: '#38bdf8' },
  { level: 4, title: 'Disciplinada', minXp: 2200, color: '#a78bfa' },
  { level: 5, title: 'Consistente', minXp: 3400, color: '#f59e0b' },
  { level: 6, title: 'Referência', minXp: 4800, color: '#f43f5e' },
  { level: 7, title: 'Elite 4D', minXp: 6500, color: '#14b8a6' },
  { level: 8, title: 'Mestre 4D', minXp: 8500, color: '#eab308' },
];

function normalizeAvatarEmoji(value, fallback = '🌙') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '??' || trimmed.includes('?')) return fallback;
  return trimmed;
}

function normalizeAchievement(item) {
  if (!item) return null;
  const unlocked = item.ok ?? Boolean(item.unlockedAt || item.completedAt || item.unlocked);
  return {
    id: item.id || item.slug || item.title || item.nm,
    e: item.e || item.icon || '🏅',
    nm: item.nm || item.title || 'Conquista',
    ds: item.ds || item.description || '',
    xp: Number(item.xp ?? item.xpReward ?? 0),
    ct: item.ct || item.category || 'Sistema',
    ok: unlocked,
    unlockedAt: item.unlockedAt || item.completedAt || null,
  };
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseRecipeEditMarker(content = '') {
  const text = String(content || '');
  const match = text.match(/^\[\[RECIPE_EDIT:([^\]]+)\]\]\s*/);
  if (!match) return { text, recipeId: null };
  return {
    text: text.replace(match[0], ''),
    recipeId: match[1],
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getRecipeOfHour(recipes) {
  const pool = Array.isArray(recipes) && recipes.length ? recipes : RECIPES;
  const h = new Date().getHours();
  const idx = h < 10 ? 0 : h < 12 ? Math.min(4, pool.length - 1) : h < 15 ? Math.min(2, pool.length - 1) : h < 18 ? Math.min(4, pool.length - 1) : h < 21 ? Math.min(3, pool.length - 1) : Math.min(5, pool.length - 1);
  return pool[idx] || pool[0] || RECIPES[0];
}

function renderSparkline(points, color, height = 110, labelColor = 'var(--dash-muted)') {
  if (!points || points.length < 2) return '';
  const width = 300;
  const viewHeight = height + 18;
  const values = points.map(point => point.v);
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const px = index => (index / (points.length - 1)) * (width - 24) + 12;
  const py = value => height - ((value - min) / (max - min)) * (height - 16) - 4;
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${px(index)} ${py(point.v)}`).join(' ');
  const gid = `spark-${color.replace('#', '')}-${height}`;

  return `
    <svg viewBox="0 0 ${width} ${viewHeight}" class="dash-sparkline" style="color:${labelColor};">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.3"></stop>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.02"></stop>
        </linearGradient>
      </defs>
      <path d="${path} L ${px(points.length - 1)} ${height} L ${px(0)} ${height} Z" fill="url(#${gid})"></path>
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points.map((point, index) => `<g><circle cx="${px(index)}" cy="${py(point.v)}" r="${index === points.length - 1 ? 5 : 3}" fill="${color}" opacity="${index === points.length - 1 ? 1 : 0.5}"></circle><text x="${px(index)}" y="${height + 12}" text-anchor="middle" fill="currentColor" font-size="10">${point.m}</text></g>`).join('')}
    </svg>
  `;
}

function _achCategory(id) {
  const journey = ['first_step', 'organized', 'scientist', 'forms_finished', 'veteran', 'iron_will', 'gmp_master', 'gmp_legend'];
  const engagement = ['conversationalist', 'chat_marathoner', 'explorer', 'food_explorer_pro', 'chef_formation', 'chef_confirmed', 'recipe_curator', 'consistent', 'iron_fire', 'streak_breaker', 'night_owl', 'early_bird', 'polymath'];
  if (journey.includes(id)) return 'jornada';
  if (engagement.includes(id)) return 'engajamento';
  return 'social';
}

export class DashboardScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.currentNav = params.initialNav || 'inicio';
    this.currentUser = authService.getCurrentUser();
    this.userProfile = State.get('userProfile') || {};
    this.recipes = State.get('recipes') || RECIPES;
    this.achievements = State.get('achievements') || BADGES;
    this.chatHistory = State.get('chatHistory') || [];
    this.dailyMeals = State.get('dailyMeals') || this.userProfile.dailyMeals || REFEICOES_DIA;
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
    this.selectedRecipe = initialRecipeId ? RECIPES.find(recipe => recipe.id === initialRecipeId) || null : null;
    this.recipeOriginNav = null;
    this.themeToggleLocked = false;
    this.examOrders = Array.isArray(this.userProfile?.examOrders) && this.userProfile.examOrders.length ? this.userProfile.examOrders : EXAM_ORDERS;
    this.dicas = State.get('belaTips') || this.userProfile.belaTips || DICAS.map((dica, index) => ({ ...dica, id: `dica-${index + 1}`, likes: 0, dislikes: 0, myVote: null }));
    this.ranking = State.get('ranking') || RANKING;
    this.examResults = State.get('examResults') || EXAM_RESULTS;
    this._dataLoaded = false;
    this._dataLoading = false;
    this.themeMode = this.loadThemeMode();
    this.isDark = this.resolveThemeIsDark(this.themeMode);

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

  async persistProfileFields(fields = {}) {
    if (!this.currentUser?.uid) return;
    const nextProfile = { ...(this.userProfile || {}), ...fields };
    this.userProfile = nextProfile;
    const loader = UIComponents.loaderOverlay({ message: 'Salvando alterações...', color: '#f0059a' });
    document.body.appendChild(loader);
    try {
      await firestoreService.saveUserProfile(this.currentUser.uid, nextProfile);
      State.set('userProfile', nextProfile);
    } catch (error) {
      console.error('[DashboardV2] persistProfileFields failed:', error);
    } finally {
      loader.remove();
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
    if (!this._dataLoaded) {
      await this._loadFirestoreData();
    }
  }

  async _loadFirestoreData() {
    if (this._dataLoading || this._dataLoaded) return;
    this._dataLoading = true;
    if (!this.currentUser?.uid) { this._dataLoading = false; return; }
    const uid = this.currentUser.uid;

    const [ranking, latestExam, latestRequest, menuForm, chatHistory] = await Promise.allSettled([
      firestoreService.getTopRanking?.(20),
      firestoreService.getLatestBloodTest?.(uid),
      firestoreService.getLatestExamRequest?.(uid),
      firestoreService.getMenuForm?.(uid),
      firestoreService.getChatHistory?.(uid, 3),
    ]);

    let needsRefresh = false;

    if (ranking.status === 'fulfilled' && Array.isArray(ranking.value) && ranking.value.length) {
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

    if (latestExam.status === 'fulfilled' && latestExam.value?.extractedData) {
      this.examResults = latestExam.value.extractedData;
      needsRefresh = true;
    }

    if (latestRequest.status === 'fulfilled' && latestRequest.value) {
      this.examOrders = [latestRequest.value, ...(this.examOrders || []).filter(o => o.id !== latestRequest.value?.id)];
      needsRefresh = true;
    }

    if (menuForm.status === 'fulfilled' && Array.isArray(menuForm.value?.mealTimes) && menuForm.value.mealTimes.length) {
      this.dailyMeals = menuForm.value.mealTimes.filter(m => m.enabled !== false);
      needsRefresh = true;
    }

    if (chatHistory.status === 'fulfilled' && Array.isArray(chatHistory.value) && chatHistory.value.length) {
      const msgs = chatHistory.value.map(m => ({ r: m.role === 'user' ? 'user' : 'ai', t: m.content }));
      if (msgs.length) this.homeChatMessages = msgs;
      needsRefresh = true;
    }

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
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) return LEVELS[i].level;
    }
    return 1;
  }

  _showXpPopup({ xpBefore, xpAfter, xpGained, levelBefore, levelAfter }) {
    const leveledUp = levelAfter > levelBefore;
    const levelData = LEVELS.find(l => l.level === levelAfter) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.level === levelAfter + 1);
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
      recipeName: recipe.nm || recipe.name,
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
    const confirmed = window.confirm(`Remover a receita "${recipe.nm}" do seu cardápio?`);
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
        this.chatHistory = [...this.chatHistory, { role: 'ai', content: CHAT_RESP[this.chatHistory.length % CHAT_RESP.length] }];
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
        <div class="dash-title">
          <div class="top">Guia Metabólico</div>
          <div class="bottom">Personalizado</div>
        </div>
        <div class="dash-streak" style="cursor:pointer;" title="Ver conquistas"><span>🔥</span><span>${this.streak}</span></div>
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

    const current = NAV_ITEMS.find(item => item.id === this.currentNav) || NAV_ITEMS[0];
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
          ${NAV_ITEMS.map(item => `
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
    return [...XP_LEVELS].reverse().find(level => xp >= level.minXp) || XP_LEVELS[0];
  }

  getNextLevel(levelNumber) {
    return XP_LEVELS.find(level => level.level === levelNumber + 1) || null;
  }

  renderContent() {
    switch (this.currentNav) {
      case 'inicio': return this.renderHome();
      case 'evolucao': return this.renderEvolution();
      case 'receitas': return this.renderRecipes();
      case 'exames': return this.renderExams();
      case 'conquistas': return this.renderConquests();
      case 'chat': return this.renderChat();
      case 'perfil': return this.renderProfile();
      default: return this.renderHome();
    }
  }

  renderHome() {
    const recipe = getRecipeOfHour(this.recipes);
    const meals = Array.isArray(this.dailyMeals) && this.dailyMeals.length ? this.dailyMeals : REFEICOES_DIA;
    const checkedCount = [...this.homeChecked].filter(id => meals.some(meal => meal.id === id)).length;
    const checkPct = meals.length ? Math.round((checkedCount / meals.length) * 100) : 0;

    return `
      <section>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="width:38px;height:38px;border-radius:12px;background:${Colors.pinkGlow};border:1px solid ${Colors.pink}33;display:flex;align-items:center;justify-content:center;">💬</div>
          <div>
            <div style="color:var(--dash-text);font-weight:700;font-size:17px;">Chat com a IA</div>
            <div style="color:var(--dash-muted);font-size:13px;">Peça uma receita ou tire dúvidas</div>
          </div>
        </div>
        <div class="dash-card pad">
          <div style="max-height:220px;overflow-y:auto;padding:4px 0 14px;display:flex;flex-direction:column;gap:10px;" data-home-chat-list>
            ${this.homeChatMessages.map(msg => `
              <div style="display:flex;justify-content:${msg.r === 'user' ? 'flex-end' : 'flex-start'};gap:8px;">
                ${msg.r === 'ai' ? '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f0059a,#c0027c);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">✨</div>' : ''}
                <div style="max-width:78%;padding:11px 15px;border-radius:${msg.r === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};background:${msg.r === 'user' ? 'linear-gradient(135deg,#f0059a,#c0027c)' : 'rgba(255,255,255,0.05)'};border:${msg.r === 'ai' ? `1px solid var(--dash-border)` : 'none'};color:var(--dash-text);font-size:15px;line-height:1.5;">${msg.t}</div>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:10px;border-top:1px solid var(--dash-border);padding-top:12px;">
            <input class="dash-input" data-home-chat-input value="${this.homeChatInput.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" placeholder="Ex: Me sugira uma receita com frango e brócolis..." style="flex:1;padding:12px 16px;font-size:15px;" />
            <button class="dash-primary-btn" data-home-send style="border-radius:12px;padding:12px 16px;min-height:46px;box-shadow:none;font-size:14px;">➤</button>
          </div>
        </div>
      </section>

      <section>
        <div style="display:flex;align-items:center;gap:10px;margin:18px 0 14px;">
          <div style="width:38px;height:38px;border-radius:12px;background:rgba(31,204,116,0.12);border:1px solid rgba(31,204,116,0.25);display:flex;align-items:center;justify-content:center;">⏱</div>
          <div>
            <div style="color:var(--dash-text);font-weight:700;font-size:17px;">Receita indicada agora</div>
            <div style="color:var(--dash-muted);font-size:13px;">Baseada no horário atual</div>
          </div>
        </div>
        <div class="dash-card pad" data-recipe-of-hour="${recipe.id}" style="border-color: rgba(31,204,116,0.2); background: rgba(31,204,116,0.04); display:flex; gap:16px; align-items:flex-start; cursor:pointer;">
          <div style="font-size:44px;line-height:1;flex-shrink:0;">${recipe.e}</div>
          <div style="flex:1;">
            <div style="color:var(--dash-text);font-weight:800;font-size:18px;margin-bottom:4px;">${recipe.nm}</div>
            <div style="color:var(--dash-muted);font-size:14px;margin-bottom:10px;">${recipe.ct}</div>
            <div class="dash-chip-row">
              <span class="dash-chip" style="background:rgba(240,5,154,0.1);border-color:rgba(240,5,154,0.25);color:#f0059a;">⏱ ${recipe.tm}</span>
              <span class="dash-chip" style="background:rgba(31,204,116,0.12);border-color:rgba(31,204,116,0.25);color:#1fcc74;">🔥 ${recipe.kc} kcal</span>
              <span class="dash-chip">${recipe.df}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div style="display:flex;align-items:center;gap:10px;margin:18px 0 14px;">
          <div style="width:38px;height:38px;border-radius:12px;background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.25);display:flex;align-items:center;justify-content:center;">✅</div>
          <div>
            <div style="color:var(--dash-text);font-weight:700;font-size:17px;">Cardápio de hoje</div>
            <div style="color:var(--dash-muted);font-size:13px;">${checkedCount}/${meals.length} refeições realizadas</div>
          </div>
          <div style="margin-left:auto;background:rgba(234,179,8,0.2);border:1px solid rgba(234,179,8,0.44);border-radius:8px;padding:4px 10px;color:#eab308;font-size:13px;font-weight:700;">${checkPct}%</div>
        </div>
        <div class="dash-card" style="overflow:hidden;">
          ${meals.map((meal, index) => {
            const done = this.homeChecked.has(meal.id);
            const [h, m] = meal.hora.split(':').map(Number);
            const minutes = h * 60 + m;
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const isCurrent = Math.abs(currentMinutes - minutes) < 90;
            return `
              <div class="dash-meal ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}" data-meal-toggle="${meal.id}" style="background:${isCurrent && !done ? 'rgba(240,5,154,0.06)' : 'transparent'};">
                <div class="dash-meal-icon" style="background:${done ? 'rgba(31,204,116,0.15)' : isCurrent ? 'rgba(240,5,154,0.12)' : 'rgba(255,255,255,0.04)'}; border-color:${done ? 'rgba(31,204,116,0.5)' : isCurrent ? 'rgba(240,5,154,0.44)' : 'var(--dash-border)'}; border-style:solid; border-width:1.5px;">${done ? '✓' : meal.icon}</div>
                <div style="flex:1;">
                  <div class="title" style="color:${done ? 'var(--dash-muted)' : isCurrent ? '#f0059a' : 'var(--dash-text)'}; font-weight:${done ? 500 : 700}; font-size:16px;">${meal.nome}</div>
                  <div style="color:var(--dash-muted); font-size:13px;">${meal.hora} · ${meal.desc}</div>
                </div>
                ${isCurrent && !done ? '<span style="background:rgba(240,5,154,0.12);border:1px solid rgba(240,5,154,0.35);border-radius:6px;padding:3px 8px;color:#f0059a;font-size:12px;font-weight:700;">Agora</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <section>
        <div style="display:flex;align-items:center;gap:10px;margin:18px 0 14px;">
          <div style="width:38px;height:38px;border-radius:12px;background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.25);display:flex;align-items:center;justify-content:center;">✨</div>
          <div style="color:var(--dash-text);font-weight:700;font-size:17px;">Dicas da Bela</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${this.dicas.map(dica => `
            <div class="dash-card pad" style="display:flex;gap:14px;">
              <span style="font-size:26px;flex-shrink:0;">${dica.e}</span>
              <div style="flex:1;">
                <div style="color:var(--dash-text);font-weight:700;font-size:15px;margin-bottom:3px;">${dica.ti}</div>
                <div style="color:var(--dash-muted);font-size:14px;line-height:1.5;">${dica.tx}</div>
                <div style="display:flex;gap:8px;margin-top:10px;">
                  <button class="dash-chip ${dica.myVote === 'like' ? 'active' : ''}" data-tip-vote="${dica.id}:like" style="padding:6px 10px;font-size:12px;">👍 ${dica.likes}</button>
                  <button class="dash-chip ${dica.myVote === 'dislike' ? 'active' : ''}" data-tip-vote="${dica.id}:dislike" style="padding:6px 10px;font-size:12px;">👎 ${dica.dislikes}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  renderEvolution() {
    const cards = [
      { label: 'Glicemia', value: '98', unit: 'mg/dL', delta: '▼ 50', color: '#1fcc74' },
      { label: 'Peso', value: '79.6', unit: 'kg', delta: '▼ 4.4', color: '#1fcc74' },
      { label: 'HbA1c', value: '6.1', unit: '%', delta: '▼ 0.8%', color: '#1fcc74' },
    ];

    const graphs = [
      { key: 'glicemia', title: 'Glicemia em Jejum', ref: 'Ref: 70-99 mg/dL', color: '#f0059a', unit: 'mg/dL' },
      { key: 'hba1c', title: 'Hemoglobina Glicada (HbA1c)', ref: 'Ref: &lt; 5,7%', color: '#a78bfa', unit: '%' },
      { key: 'peso', title: 'Peso Corporal', ref: '', color: '#38bdf8', unit: 'kg' },
    ];

    return `
      <section>
        <div class="dash-section-title">📊 Minha Evolução</div>
        <div class="dash-section-subtitle">Acompanhe o progresso dos seus resultados ao longo do programa</div>
        <div class="dash-grid-3" style="margin-bottom:20px;">
          ${cards.map(card => `
            <div class="dash-card dash-stat">
              <div class="dash-stat-label">${card.label}</div>
              <div class="dash-stat-value">${card.value}<span style="font-size:11px;color:var(--dash-muted);margin-left:2px;">${card.unit}</span></div>
              <div class="dash-stat-delta" style="color:${card.color};">${card.delta}</div>
            </div>
          `).join('')}
        </div>
        ${graphs.map(graph => `
          <div class="dash-card pad" style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
              <div>
                <div style="color:var(--dash-text);font-weight:800;font-size:18px;">${graph.title}</div>
                ${graph.ref ? `<div style="color:var(--dash-muted);font-size:13px;margin-top:2px;">${graph.ref}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div style="color:${graph.color};font-weight:800;font-size:28px;">${((this.examResults||EXAM_RESULTS)[graph.key])[((this.examResults||EXAM_RESULTS)[graph.key]).length - 1].v}<span style="font-size:14px;margin-left:3px;">${graph.unit}</span></div>
              </div>
            </div>
            ${renderSparkline(((this.examResults||EXAM_RESULTS)[graph.key]), graph.color, 110, 'var(--dash-muted)')}
          </div>
        `).join('')}
      </section>
    `;
  }

  _renderRecipePlanner(meals, recipesViewTabs) {
    return `
      <section>
        <div class="dash-section-title">🗓️ Refeições do Dia</div>
        <div class="dash-section-subtitle">Personalize quantas refeições quer exibir no seu painel inicial</div>
        ${recipesViewTabs}
        <div class="dash-card pad" style="margin-bottom:12px;">
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
            ${meals.map(meal => `
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;">${meal.icon}</div>
                <div style="flex:1;min-width:0;">
                  <div style="color:var(--dash-text);font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${meal.nome}</div>
                  <div style="color:var(--dash-muted);font-size:12px;">${meal.hora} · ${meal.desc}</div>
                </div>
                <button class="dash-ghost-btn" data-meal-remove="${meal.id}" style="min-height:36px;padding:8px 12px;border-radius:10px;font-size:13px;">Remover</button>
              </div>
            `).join('')}
          </div>
          <div style="display:grid;grid-template-columns:72px 1fr 92px;gap:8px;margin-bottom:8px;">
            <input class="dash-input" data-meal-draft-icon value="${this.mealDraft.icon}" maxlength="2" placeholder="🍽️" style="text-align:center;padding:10px 8px;" />
            <input class="dash-input" data-meal-draft-name value="${this.mealDraft.nome.replace(/"/g, '&quot;')}" placeholder="Nome da refeição" style="padding:10px 12px;" />
            <input type="time" class="dash-input" data-meal-draft-time value="${this.mealDraft.hora}" style="padding:10px 12px;" />
          </div>
          <div style="display:flex;gap:8px;">
            <input class="dash-input" data-meal-draft-desc value="${this.mealDraft.desc.replace(/"/g, '&quot;')}" placeholder="Descrição da refeição" style="padding:10px 12px;" />
            <button class="dash-primary-btn" data-meal-add style="min-height:42px;padding:10px 14px;border-radius:10px;">Adicionar</button>
          </div>
        </div>
      </section>
    `;
  }

  _renderRecipeDetail(recipe) {
    const ingredients = Array.isArray(recipe.ig) ? recipe.ig
      : Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const steps = Array.isArray(recipe.st) ? recipe.st
      : Array.isArray(recipe.steps) ? recipe.steps : [];
    const time = recipe.tm || recipe.prepTime || '—';
    const kcal = recipe.kc ?? recipe.macros?.calories ?? recipe.calories ?? '—';
    const category = recipe.ct || recipe.category || 'Receita';
    const difficulty = recipe.df || recipe.difficulty || 'Fácil';
    const emoji = recipe.e || recipe.emoji || '🍽️';
    const name = recipe.nm || recipe.name || 'Receita';
    return `
      <section>
        <button class="dash-ghost-btn" data-recipe-back style="margin-bottom:20px;padding:10px 18px;min-height:44px;border-radius:12px;">← Voltar às receitas</button>
        <div class="dash-card pad">
          <div style="font-size:52px;margin-bottom:12px;">${emoji}</div>
          <div class="dash-section-title" style="font-size:23px;">${name}</div>
          <div class="dash-chip-row" style="margin: 0 0 22px;">
            <span class="dash-chip" style="background:rgba(240,5,154,0.1);border-color:rgba(240,5,154,0.25);color:#f0059a;">⏱ ${time}</span>
            <span class="dash-chip" style="background:rgba(31,204,116,0.12);border-color:rgba(31,204,116,0.25);color:#1fcc74;">🔥 ${kcal} kcal</span>
            <span class="dash-chip">${category}</span>
            <span class="dash-chip">${difficulty}</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
            <button class="dash-primary-btn" data-recipe-edit="${recipe.id}" style="min-height:44px;padding:10px 14px;border-radius:10px;">✏️ Editar receita</button>
            <button class="dash-ghost-btn" data-recipe-remove="${recipe.id}" style="min-height:44px;padding:10px 14px;border-radius:10px;border-color:rgba(244,63,94,0.25);color:#f43f5e;">🗑 Remover receita</button>
          </div>
          <div style="background:rgba(240,5,154,0.06);border:1px solid rgba(240,5,154,0.16);border-radius:14px;padding:12px 14px;margin-bottom:18px;">
            <div style="color:#f0059a;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;">Receita #${recipe.id}</div>
            <div style="color:var(--dash-muted);font-size:13px;margin-top:4px;">Esse marcador único vai junto quando você mandar a receita para edição no chat.</div>
          </div>
          <div style="margin-bottom:22px;">
            <div style="color:var(--dash-text);font-weight:800;font-size:18px;margin-bottom:12px;">🥘 Ingredientes</div>
            ${ingredients.length ? ingredients.map(item => `<div style="display:flex;gap:10px;margin-bottom:9px;"><div style="width:7px;height:7px;border-radius:50%;background:#f0059a;flex-shrink:0;margin-top:8px;"></div><span style="color:var(--dash-muted);font-size:16px;">${item}</span></div>`).join('') : `<div style="color:var(--dash-muted);font-size:14px;font-style:italic;">Ingredientes ainda não disponíveis para esta receita.</div>`}
          </div>
          <div>
            <div style="color:var(--dash-text);font-weight:800;font-size:18px;margin-bottom:12px;">👩‍🍳 Modo de preparo</div>
            ${steps.length ? steps.map((step, index) => `<div style="display:flex;gap:14px;margin-bottom:16px;"><div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#f0059a,#c0027c);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:13px;font-weight:800;">${index + 1}</div><span style="color:var(--dash-muted);font-size:15px;line-height:1.7;padding-top:4px;">${step}</span></div>`).join('') : `<div style="color:var(--dash-muted);font-size:14px;font-style:italic;">Modo de preparo ainda não disponível para esta receita.</div>`}
          </div>
        </div>
      </section>
    `;
  }

  _renderRecipeCatalog(recipesViewTabs) {
    const filters = ['Todas', ...new Set(RECIPES.map(recipe => recipe.ct))];
    const filtered = this.recipeFilter === 'Todas' ? RECIPES : RECIPES.filter(recipe => recipe.ct === this.recipeFilter);
    return `
      <section>
        <div class="dash-section-title">🥗 Receitas do seu Cardápio</div>
        <div class="dash-section-subtitle">Todas selecionadas especialmente para o controle glicêmico</div>
        ${recipesViewTabs}
        <div class="dash-chip-row" style="margin-bottom:18px;">
          ${filters.map(filter => `<button class="dash-chip ${this.recipeFilter === filter ? 'active' : ''}" data-recipe-filter="${filter}">${filter}</button>`).join('')}
        </div>
        <div class="dash-recipe-grid">
          ${filtered.map(recipe => `
            <div class="dash-card dash-recipe-card" data-recipe-open="${recipe.id}">
              <div style="font-size:38px;margin-bottom:10px;">${recipe.e}</div>
              <div style="color:var(--dash-text);font-weight:700;font-size:15px;margin-bottom:4px;">${recipe.nm}</div>
              <div style="color:var(--dash-muted);font-size:13px;margin-bottom:10px;">${recipe.ct}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <span class="dash-chip" style="padding:4px 10px;font-size:12px;">⏱ ${recipe.tm}</span>
                <span class="dash-chip" style="padding:4px 10px;font-size:12px;">🔥 ${recipe.kc}</span>
              </div>
              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                <button class="dash-ghost-btn" data-recipe-edit="${recipe.id}" style="min-height:36px;padding:8px 12px;border-radius:10px;font-size:13px;">✏️ Editar</button>
                <button class="dash-ghost-btn" data-recipe-remove="${recipe.id}" style="min-height:36px;padding:8px 12px;border-radius:10px;font-size:13px;border-color:rgba(244,63,94,0.25);color:#f43f5e;">🗑 Remover</button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  renderRecipes() {
    const meals = Array.isArray(this.dailyMeals) && this.dailyMeals.length ? this.dailyMeals : [];
    const recipesViewTabs = `
      <div class="dash-chip-row" style="margin-bottom:16px;">
        <button class="dash-chip ${this.recipesView === 'catalogo' ? 'active' : ''}" data-recipes-view="catalogo">📚 Catálogo</button>
        <button class="dash-chip ${this.recipesView === 'planner' ? 'active' : ''}" data-recipes-view="planner">🗓️ Refeições do Dia</button>
      </div>
    `;

    if (this.recipesView === 'planner') {
      return this._renderRecipePlanner(meals, recipesViewTabs);
    }

    if (!this.recipesUnlocked) {
      return `
        <section style="position:relative;min-height:520px;">
          <div class="dash-section-title">🥗 Receitas do seu Cardápio</div>
          <div class="dash-section-subtitle">Todas selecionadas especialmente para o controle glicêmico</div>
          ${recipesViewTabs}
          <div class="dash-card pad" style="position:absolute;inset:0;filter:blur(8px);opacity:0.4;pointer-events:none;padding-top:72px;overflow:hidden;">
            <div class="dash-recipe-grid">
              ${RECIPES.map(recipe => `
                <div class="dash-card dash-recipe-card">
                  <div style="font-size:38px;margin-bottom:10px;">${recipe.e}</div>
                  <div style="color:var(--dash-text);font-weight:700;font-size:15px;margin-bottom:4px;">${recipe.nm}</div>
                  <div style="color:var(--dash-muted);font-size:13px;">${recipe.ct}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="dash-lock-panel">
            <div class="dash-lock-card">
              <div style="width:72px;height:72px;border-radius:50%;background:rgba(240,5,154,0.12);border:2px solid rgba(240,5,154,0.28);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">🔒</div>
              <div style="color:var(--dash-text);font-weight:800;font-size:20px;margin-bottom:12px;">Recurso Bloqueado</div>
              <p style="color:var(--dash-muted);font-size:15px;line-height:1.7;margin-bottom:28px;">Suas receitas e cardápio personalizado serão liberados automaticamente após sua Sessão Individual de Diagnóstico com a Guardiã.</p>
              <div style="background:rgba(240,5,154,0.08);border:1px solid rgba(240,5,154,0.2);border-radius:14px;padding:12px 16px;margin-bottom:20px;">
                <div style="color:#f0059a;font-size:14px;font-weight:600;">📅 Aguardando Sessão Individual de Diagnóstico</div>
              </div>
              <button class="dash-ghost-btn" data-recipes-unlock style="width:100%;font-size:14px;padding:12px;min-height:46px;">🔓 Demonstração (desbloquear para teste)</button>
            </div>
          </div>
        </section>
      `;
    }

    if (this.selectedRecipe) {
      return this._renderRecipeDetail(this.selectedRecipe);
    }

    return this._renderRecipeCatalog(recipesViewTabs);
  }

  renderExams() {
    const examChart = this.examTab === 'resultados' ? (this.examResults||EXAM_RESULTS) : null;
    return `
      <section>
        <div class="dash-section-title">🔬 Exames e Resultados</div>
        <div class="dash-section-subtitle">Pedidos da Dra. Jessica Benevides e seus resultados</div>
        <div class="dash-chip-row" style="margin-bottom:22px;">
          <button class="dash-chip ${this.examTab === 'pedidos' ? 'active' : ''}" data-exam-tab="pedidos">📋 Pedidos da Dra.</button>
          <button class="dash-chip ${this.examTab === 'resultados' ? 'active' : ''}" data-exam-tab="resultados">📊 Meus Resultados</button>
        </div>
        ${this.examTab === 'pedidos' ? `
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="dash-card pad" style="border-color: rgba(240,5,154,0.18); background: rgba(240,5,154,0.06);">
              <p style="color:var(--dash-muted);font-size:14px;"><span style="color:#f0059a;font-weight:700;">Dra. Jessica Benevides</span> · CRM-SP 145.832 · Endocrinologista parceira da Mentoria 4D</p>
            </div>
            ${this.examOrders.map(order => {
              const fileReady = Boolean(order.fileReady || order.pdfReady || order.fileUrl || order.driveFileUrl);
              return `
              <div class="dash-card pad">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                  <div>
                    <div style="color:var(--dash-text);font-weight:800;font-size:16px;">Pedido de ${order.dt}</div>
                    <div style="color:var(--dash-muted);font-size:14px;margin-top:2px;">Dra. Jessica Benevides</div>
                  </div>
                  <span style="background:${order.st === 'Pendente' ? 'rgba(240,5,154,0.15)' : 'rgba(31,204,116,0.12)'};border:1px solid ${order.st === 'Pendente' ? 'rgba(240,5,154,0.28)' : 'rgba(31,204,116,0.32)'};border-radius:8px;padding:5px 12px;color:${order.st === 'Pendente' ? '#f0059a' : '#1fcc74'};font-size:13px;font-weight:700;">${order.st}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:14px;">${order.ex.map(exam => `<div style="display:flex;gap:10px;align-items:center;"><div style="width:6px;height:6px;border-radius:50%;background:#f0059a;flex-shrink:0;"></div><span style="color:var(--dash-text);font-size:15px;">${exam}</span></div>`).join('')}</div>
                <div class="dash-card pad" style="padding:10px 14px;border-radius:10px;">📋 <strong style="color:var(--dash-text);">Instruções:</strong> <span style="color:var(--dash-muted);font-size:14px;">${order.ins}</span></div>
                <div style="margin-top:12px;display:flex;justify-content:flex-end;">
                  <button class="dash-primary-btn ${fileReady ? '' : 'dash-hide-disabled'}" data-order-download="${order.id}" ${fileReady ? '' : 'disabled'} style="min-height:42px;padding:10px 14px;border-radius:10px;opacity:${fileReady ? 1 : 0.5};cursor:${fileReady ? 'pointer' : 'not-allowed'};">
                    ${fileReady ? '📥 Baixar pedido (PDF)' : '🔒 Pedido indisponível'}
                  </button>
                </div>
              </div>
            `;
            }).join('')}
          </div>
        ` : `
          <div class="dash-card pad" style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
              <div>
                <div style="color:var(--dash-text);font-weight:800;font-size:18px;">Glicemia em Jejum</div>
                <div style="color:var(--dash-muted);font-size:13px;margin-top:2px;">Ref: 70-99 mg/dL</div>
              </div>
              <div style="text-align:right;">
                <div style="color:#1fcc74;font-weight:800;font-size:28px;">98<span style="font-size:14px;margin-left:3px;">mg/dL</span></div>
              </div>
            </div>
            ${renderSparkline((this.examResults||EXAM_RESULTS).glicemia, '#f0059a', 110, 'var(--dash-muted)')}
          </div>
          <div class="dash-card pad" style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
              <div>
                <div style="color:var(--dash-text);font-weight:800;font-size:18px;">Hemoglobina Glicada (HbA1c)</div>
                <div style="color:var(--dash-muted);font-size:13px;margin-top:2px;">Ref: &lt; 5,7%</div>
              </div>
              <div style="text-align:right;">
                <div style="color:#a78bfa;font-weight:800;font-size:28px;">6.1<span style="font-size:14px;margin-left:3px;">%</span></div>
              </div>
            </div>
            ${renderSparkline((this.examResults||EXAM_RESULTS).hba1c, '#a78bfa', 110, 'var(--dash-muted)')}
          </div>
          <div class="dash-card pad">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
              <div>
                <div style="color:var(--dash-text);font-weight:800;font-size:18px;">Peso Corporal</div>
              </div>
              <div style="text-align:right;">
                <div style="color:#38bdf8;font-weight:800;font-size:28px;">79.6<span style="font-size:14px;margin-left:3px;">kg</span></div>
              </div>
            </div>
            ${renderSparkline((this.examResults||EXAM_RESULTS).peso, '#38bdf8', 110, 'var(--dash-muted)')}
          </div>
        `}
      </section>
    `;
  }

  _renderAchievementCounter(claimedCount, totalCount) {
    const pct = totalCount > 0 ? (claimedCount / totalCount) * 100 : 0;
    return `
      <div class="dash-ach-counter" style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(240,5,154,0.08),rgba(155,2,200,0.08));border:1px solid rgba(240,5,154,0.2);border-radius:14px;padding:14px 18px;margin-bottom:18px;">
        <div style="font-size:32px;font-weight:900;color:#f0059a;">${claimedCount}<span style="font-size:18px;color:var(--dash-muted);font-weight:700;">/${totalCount}</span></div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--dash-text);margin-bottom:6px;">Conquistas reivindicadas</div>
          <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#f0059a,#9b02c8);border-radius:3px;transition:width 0.4s ease;box-shadow:0 0 8px rgba(240,5,154,0.5);"></div>
          </div>
        </div>
      </div>
    `;
  }

  _renderPlatinumBadge(claimedCount, totalCount) {
    if (claimedCount !== totalCount || totalCount === 0) return '';
    return `
      <div class="dash-platinum-badge" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);border-radius:18px;padding:24px;margin-bottom:20px;text-align:center;animation:achPlatinumShine 3s infinite;color:#1a1500;">
        <div style="font-size:48px;margin-bottom:6px;">💎</div>
        <div style="font-size:20px;font-weight:900;letter-spacing:2px;margin-bottom:4px;">PLATINA DESBLOQUEADA</div>
        <div style="font-size:13px;font-weight:700;opacity:0.85;">Você reivindicou todas as ${totalCount} conquistas, incluindo as ocultas!</div>
      </div>
    `;
  }

  _renderAchievementCard(a) {
    const bg = a.ok
      ? (a.claimed ? 'linear-gradient(180deg,rgba(240,5,154,0.08),rgba(240,5,154,0.02))' : 'linear-gradient(180deg,rgba(240,5,154,0.18),rgba(240,5,154,0.06))')
      : 'rgba(255,255,255,0.03)';
    const borderColor = (a.ok && !a.claimed) ? 'rgba(240,5,154,0.6)' : (a.ok ? 'rgba(240,5,154,0.2)' : 'rgba(255,255,255,0.07)');
    const animation = (a.ok && !a.claimed) ? 'animation:achGlowPulse 2s infinite;' : '';
    let actionHTML;
    if (a.ok && !a.claimed) {
      actionHTML = `<button class="ach-claim-btn" data-claim-achievement="${a.id}" style="width:100%;margin-top:6px;padding:8px 10px;background:linear-gradient(135deg,#f0059a,#c0027c);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 2px 10px rgba(240,5,154,0.4);transition:transform 0.15s;">🎁 Reivindicar +${a.xp} XP</button>`;
    } else if (a.ok && a.claimed) {
      actionHTML = `<div style="font-size:11px;color:#34d399;font-weight:700;margin-top:4px;">✓ Reivindicado +${a.xp} XP</div>`;
    } else if (a.hidden) {
      actionHTML = `<div style="font-size:10px;color:var(--dash-muted);font-weight:600;margin-top:4px;">🔒 Oculta</div>`;
    } else {
      actionHTML = `<div style="font-size:10px;color:var(--dash-muted);font-weight:600;margin-top:4px;">+${a.xp} XP</div>`;
    }
    return `
      <div class="dash-achievement-card ${a.ok ? 'unlocked' : ''} ${a.hidden ? 'hidden-locked' : ''} ${a.ok && !a.claimed ? 'pending-claim' : ''}" data-achievement-id="${a.id}" style="position:relative;background:${bg};border:1px solid ${borderColor};border-radius:16px;padding:16px 14px;text-align:center;transition:all 0.2s;${animation}">
        <div style="font-size:34px;margin-bottom:8px;filter:${a.ok ? 'none' : 'grayscale(0.7)'};opacity:${a.ok ? 1 : 0.6};">${a.e}</div>
        <div style="font-size:13px;font-weight:800;color:${a.ok ? 'var(--dash-text)' : 'rgba(255,255,255,0.6)'};margin-bottom:4px;line-height:1.2;">${a.t}</div>
        <div style="font-size:11px;color:var(--dash-muted);line-height:1.35;margin-bottom:${a.ok ? '10px' : '6px'};">${a.d}</div>
        ${actionHTML}
      </div>
    `;
  }

  renderConquests() {
    const rankList = Array.isArray(this.ranking) && this.ranking.length ? this.ranking : RANKING;
    const me = { ...(rankList.find(user => user.me) || rankList[Math.min(7, rankList.length - 1)] || {}), xp: this.xp, st: this.streak };
    const topThree = rankList.length >= 3 ? [rankList[1], rankList[0], rankList[2]] : rankList.slice(0, 3);
    // Build merged list: catalog is source of truth, user's unlocked data provides status
    const unlockedMap = new Map((this.achievements || []).map(a => [a.id || a.achievementId, a]));

    const allAchievements = ACHIEVEMENTS_CATALOG.map(catalog => {
      const userData = unlockedMap.get(catalog.id);
      const isUnlocked = !!userData;
      const isClaimed = !!(userData?.claimed);
      const isHidden = !!catalog.hidden && !isUnlocked;
      return {
        id: catalog.id,
        e: isHidden ? '❓' : catalog.icon,
        t: isHidden ? 'Conquista oculta' : catalog.title,
        d: isHidden ? 'Continue jogando para descobrir...' : catalog.description,
        ct: _achCategory(catalog.id),
        xp: catalog.xp,
        ok: isUnlocked,
        claimed: isClaimed,
        hidden: isHidden,
      };
    });

    // Mostrar TODAS — ocultas viram placeholder com ❓.
    const visibleAchievements = allAchievements;
    const totalCount = ACHIEVEMENTS_CATALOG.length;
    const claimedCount = allAchievements.filter(a => a.claimed).length;
    const pendingClaims = allAchievements.filter(a => a.ok && !a.claimed).length;
    const unlockedCount = allAchievements.filter(a => a.ok).length;

    return `
      <section>
        <div class="dash-section-title">🏆 Conquistas & Ranking</div>
        ${this._renderAchievementCounter(claimedCount, totalCount)}
        ${this._renderPlatinumBadge(claimedCount, totalCount)}
        <div class="dash-card pad" style="margin-bottom:20px;border-color: rgba(240,5,154,0.15); background: rgba(240,5,154,0.06); display:flex;align-items:center;gap:14px;">
          <div class="dash-avatar" style="width:48px;height:48px;background:${me.col}22;border:2px solid ${me.col}55;">${me.e}</div>
          <div style="flex:1;">
            <div style="color:var(--dash-muted);font-size:13px;margin-bottom:2px;">Sua posição no ranking</div>
            <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#f0059a;font-size:32px;font-weight:900;">#${me.p}</span><span style="color:var(--dash-text);font-size:16px;font-weight:700;">${me.nm}</span></div>
          </div>
          <div style="text-align:right;"><div style="color:#eab308;font-weight:800;font-size:18px;">${me.xp} XP</div><div style="color:var(--dash-muted);font-size:12px;">🔥 ${me.st} dias</div></div>
        </div>
        <div class="dash-grid-3" style="margin-bottom:18px;">
          ${[
            { l: 'XP Total', v: this.xp },
            { l: 'Conquistas', v: unlockedCount },
            { l: 'Streak', v: `${this.streak} dias` },
          ].map(stat => `<div class="dash-card pad"><div style="color:var(--dash-muted);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">${stat.l}</div><div style="color:var(--dash-text);font-weight:800;font-size:22px;line-height:1;">${stat.v}</div></div>`).join('')}
        </div>
        <div class="dash-chip-row" style="margin-bottom:20px;">
          <button class="dash-chip ${this.communityTab === 'badges' ? 'active' : ''}" data-conquest-tab="badges">🏅 Minhas Medalhas</button>
          <button class="dash-chip ${this.communityTab === 'ranking' ? 'active' : ''}" data-conquest-tab="ranking">🏆 Ranking</button>
          <button class="dash-chip ${this.communityTab === 'comunidade' ? 'active' : ''}" data-conquest-tab="comunidade">🤝 Comunidade</button>
        </div>
        ${this.communityTab === 'badges' ? `
          <div>
            ${['jornada', 'engajamento', 'social'].map(category => {
              const categoryItems = visibleAchievements.filter(a => a.ct === category);
              if (!categoryItems.length) return '';
              return `
              <div style="margin-bottom:18px;">
                <div style="color:var(--dash-muted);font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">${category}</div>
                <div class="dash-grid-2">
                  ${categoryItems.map(a => this._renderAchievementCard(a)).join('')}
                </div>
              </div>
            `}).join('')}
          </div>
        ` : this.communityTab === 'ranking' ? `
          <div>
            <div class="dash-card pad" style="margin-bottom:4px;">
              <div style="text-align:center;color:var(--dash-muted);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:18px;">🏆 Pódio do Mês</div>
              <div style="display:flex;justify-content:center;align-items:flex-end;gap:14px;">
                ${topThree.map((user, index) => {
                  const colors = ['#94a3b8', '#eab308', '#b45309'];
                  const heights = [90, 124, 76];
                  const medals = ['🥈', '👑', '🥉'];
                  return `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:7px;">
                      <div class="dash-avatar" style="width:48px;height:48px;background:${user.col}22;border:2px solid ${user.col}55;">${user.e}</div>
                      <div style="font-weight:800;font-size:13px;color:var(--dash-text);text-align:center;max-width:70px;">${user.nm.split(' ')[0]}</div>
                      <div style="color:${colors[index]};font-size:11px;font-weight:600;">${user.xp} XP</div>
                      <div style="width:68px;height:${heights[index]}px;border-radius:8px 8px 0 0;background:linear-gradient(180deg,${colors[index]}30,${colors[index]}10);border:1px solid ${colors[index]}40;display:flex;align-items:center;justify-content:center;"><span style="font-size:26px;">${medals[index]}</span></div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${rankList.map(user => `
                <div class="dash-card pad" style="display:flex;align-items:center;gap:12px;border-color:${user.me ? 'rgba(240,5,154,0.3)' : 'var(--dash-border)'};background:${user.me ? 'rgba(240,5,154,0.06)' : 'var(--dash-surface)'};">
                  <div style="width:26px;text-align:center;">${user.p <= 3 ? ['🥇', '🥈', '🥉'][user.p - 1] : `<span style="color:${user.me ? '#f0059a' : 'var(--dash-muted)'};font-weight:800;font-size:14px;">#${user.p}</span>`}</div>
                  <div class="dash-avatar" style="width:38px;height:38px;background:${user.col}22;border:2px solid ${user.col}55;">${user.e}</div>
                  <div style="flex:1;"><div style="color:${user.me ? '#f0059a' : 'var(--dash-text)'};font-weight:700;font-size:15px;">${user.nm}${user.me ? ' (você)' : ''}</div><div style="color:var(--dash-muted);font-size:12px;">${user.nk} · 🔥${user.st}d</div></div>
                  <div style="text-align:right;"><div style="color:${user.p === 1 ? '#eab308' : user.p === 2 ? '#94a3b8' : user.p === 3 ? '#b45309' : 'var(--dash-text)'};font-weight:800;font-size:15px;">${user.xp}</div><div style="color:var(--dash-muted);font-size:11px;">XP</div></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <p style="color:var(--dash-muted);font-size:14px;margin-bottom:4px;">Celebre as conquistas da comunidade! 💕</p>
            ${this.communityFeed.map(item => `
              <div class="dash-card pad">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                  <div class="dash-avatar" style="width:40px;height:40px;background:${item.col}22;border:2px solid ${item.col}55;">${item.e}</div>
                  <div><div style="color:var(--dash-text);font-weight:700;font-size:15px;">${item.u}</div><div style="color:var(--dash-muted);font-size:12px;">${item.t}</div></div>
                </div>
                <div class="dash-card pad" style="background:rgba(240,5,154,0.06);border-color:rgba(240,5,154,0.18);padding:12px 16px;margin-bottom:12px;display:flex;gap:12px;align-items:center;">
                  <span style="font-size:26px;">${item.b}</span>
                  <div><div style="color:var(--dash-muted);font-size:11px;font-weight:600;text-transform:uppercase;">Nova conquista</div><div style="color:#f0059a;font-weight:700;font-size:15px;">${item.bn}</div></div>
                </div>
                ${item.cm.length > 0 ? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">${item.cm.map(comment => `<div style="display:flex;gap:8px;"><div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dash-muted);font-weight:700;flex-shrink:0;">${comment.u[0]}</div><div style="background:rgba(255,255,255,0.05);border-radius:0 10px 10px 10px;padding:6px 12px;"><span style="color:#f0059a;font-weight:700;font-size:13px;">${comment.u}: </span><span style="color:var(--dash-muted);font-size:13px;">${comment.t}</span></div></div>`).join('')}</div>` : ''}
                ${this.commentOpenId === item.id ? `<div style="display:flex;gap:8px;margin-bottom:10px;"><input class="dash-input" data-community-comment-input placeholder="Escreva um comentário..." value="${this.commentText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" style="flex:1;padding:9px 14px;font-size:14px;" /><button class="dash-primary-btn" data-community-comment-send style="border-radius:10px;padding:9px 14px;min-height:44px;font-size:14px;box-shadow:none;">➤</button><button class="dash-ghost-btn" data-community-comment-close style="padding:9px 12px;min-height:44px;border-radius:10px;">✕</button></div>` : ''}
                <div style="display:flex;gap:8px;">
                  <button class="dash-ghost-btn ${item.liked ? 'active' : ''}" data-community-like="${item.id}" style="padding:8px 16px;min-height:38px;border-radius:11px;background:${item.liked ? 'rgba(240,5,154,0.14)' : 'transparent'};border-color:${item.liked ? 'rgba(240,5,154,0.35)' : 'var(--dash-border)'};color:${item.liked ? '#f0059a' : 'var(--dash-text)'};">❤ ${item.lk}</button>
                  <button class="dash-ghost-btn" data-community-toggle-comment="${item.id}" style="padding:8px 16px;min-height:38px;border-radius:11px;">💬 ${item.cm.length}</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </section>
    `;
  }

  renderChat() {
    const suggestions = ['O que posso comer agora?', 'Como está minha glicemia?', 'Sugestão para o jantar', 'Tenho fome fora do horário', 'Me ensine uma receita fácil'];
    const markerCard = this.chatRecipeContext ? `
      <div class="dash-card pad" style="margin:10px 14px 0;background:rgba(240,5,154,0.08);border-color:rgba(240,5,154,0.18);display:flex;gap:12px;align-items:center;">
        <div style="width:42px;height:42px;border-radius:14px;background:rgba(240,5,154,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${this.chatRecipeContext.emoji}</div>
        <div style="flex:1;min-width:0;">
          <div style="color:#f0059a;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;">Editando receita</div>
          <div style="color:var(--dash-text);font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(this.chatRecipeContext.name)}</div>
          <div style="color:var(--dash-muted);font-size:12px;margin-top:2px;">Marcador: [[RECIPE_EDIT:${escapeHTML(this.chatRecipeContext.id)}]]</div>
        </div>
        <button class="dash-ghost-btn" data-clear-chat-context style="min-height:36px;padding:8px 10px;border-radius:10px;font-size:12px;">Limpar</button>
      </div>
    ` : '';

    const messagesHTML = this.chatHistory.length > 0
      ? this.chatHistory.map(msg => {
          const parsed = msg.role === 'user'
            ? parseRecipeEditMarker(msg.content)
            : { text: msg.content || msg.t || msg.text || msg.message || '', recipeId: null };
          const isUser = msg.role === 'user';
          const text = isUser && parsed.recipeId ? parsed.text : (msg.content || msg.t || msg.text || msg.message || '');
          return `
            <div class="message ${isUser ? 'user-message' : 'ai-message'} is-first">
              <div class="message-avatar">${isUser ? '' : '👩‍⚕️'}</div>
              <div class="message-bubble">${parsed.recipeId ? `<div style="background:rgba(240,5,154,0.12);border:1px solid rgba(240,5,154,0.24);color:#f0059a;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:800;display:inline-block;margin-bottom:6px;">Editando receita #${escapeHTML(parsed.recipeId)}</div><br/>` : ''}${escapeHTML(text)}</div>
            </div>
          `;
        }).join('')
      : this.homeChatMessages.map(msg => {
          const isUser = msg.r === 'user';
          return `
            <div class="message ${isUser ? 'user-message' : 'ai-message'} is-first">
              <div class="message-avatar">${isUser ? '' : '👩‍⚕️'}</div>
              <div class="message-bubble">${escapeHTML(msg.t)}</div>
            </div>
          `;
        }).join('');

    const placeholder = this.chatRecipeContext
      ? `Explique o que quer editar na receita #${this.chatRecipeContext.id}...`
      : 'Escreva sua dúvida à IA da Mentoria 4D...';

    return `
      <div class="chat-screen-embedded">
        <div class="chat-suggestions">
          ${suggestions.map(suggestion => `<button class="suggestion-chip" data-chat-suggestion="${escapeHTML(suggestion)}">${escapeHTML(suggestion)}</button>`).join('')}
        </div>
        ${markerCard}
        <div class="chat-messages" data-chat-list>
          ${messagesHTML}
        </div>
        <div class="chat-input-area">
          <textarea class="chat-textarea" data-chat-input rows="1" placeholder="${escapeHTML(placeholder)}">${escapeHTML(this.homeChatInput)}</textarea>
          <button class="chat-send-btn" data-chat-send aria-label="Enviar mensagem">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  renderProfile() {
    const achievementCards = (Array.isArray(this.achievements) && this.achievements.length ? this.achievements : BADGES)
      .map(normalizeAchievement)
      .filter(Boolean);
    const unlockedCount = achievementCards.filter(badge => badge.ok).length;
    return `
      <section>
        <div class="dash-card pad" style="margin-bottom:20px;background:rgba(240,5,154,0.06);border-color:rgba(240,5,154,0.18);display:flex;flex-direction:column;align-items:center;gap:14px;">
          <div class="dash-avatar" style="width:80px;height:80px;background:${this.profileAvatar.color}22;border:2px solid ${this.profileAvatar.color}55;font-size:40px;">${this.profileAvatar.emoji}</div>
          <div style="text-align:center;">
            <div style="color:var(--dash-text);font-weight:800;font-size:22px;">Você</div>
            <div style="color:var(--dash-muted);font-size:15px;">${this.profileAvatar.nick}</div>
            <div style="color:${this.getLevel(this.xp).color};font-weight:700;font-size:14px;margin-top:4px;">Nível ${this.getLevel(this.xp).level} · ${this.getLevel(this.xp).title}</div>
          </div>
          <div style="display:flex;gap:24px;text-align:center;flex-wrap:wrap;justify-content:center;">
            ${[{ l: 'XP Total', v: this.xp }, { l: 'Conquistas', v: unlockedCount }, { l: 'Streak', v: `${this.streak}🔥` }].map(stat => `<div><div style="color:var(--dash-text);font-weight:800;font-size:20px;">${stat.v}</div><div style="color:var(--dash-muted);font-size:13px;">${stat.l}</div></div>`).join('')}
          </div>
        </div>
        <div class="dash-card pad">
          <div style="color:var(--dash-text);font-weight:700;font-size:16px;margin-bottom:14px;">🎨 Escolha seu avatar</div>
          <div class="dash-grid-3" style="grid-template-columns: repeat(6, minmax(0, 1fr)); margin-bottom:16px;">
            ${PROFILE_AVATARS.map(emoji => `<button class="dash-chip ${this.profileAvatar.emoji === emoji ? 'active' : ''}" data-avatar-emoji="${emoji}" style="aspect-ratio:1;border-radius:14px;font-size:24px;display:flex;align-items:center;justify-content:center;">${emoji}</button>`).join('')}
            <button class="dash-chip" data-avatar-custom style="aspect-ratio:1;border-radius:14px;font-size:20px;display:flex;align-items:center;justify-content:center;">+</button>
          </div>
          <div style="color:var(--dash-text);font-weight:600;font-size:14px;margin-bottom:10px;">Cor do avatar</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;align-items:center;">
            ${PROFILE_COLORS.map(color => `<button class="dash-chip" data-avatar-color="${color}" style="width:40px;height:40px;padding:0;border-radius:50%;background:${color}33;border:3px solid ${this.profileAvatar.color === color ? color : 'transparent'};display:flex;align-items:center;justify-content:center;">${this.profileAvatar.color === color ? '✓' : ''}</button>`).join('')}
            <label class="dash-chip dash-chip-chroma" style="position:relative;width:40px;height:40px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:3px solid ${!PROFILE_COLORS.includes(this.profileAvatar.color) ? this.profileAvatar.color : 'transparent'};background:conic-gradient(from 0deg,#ff0033,#ff8800,#ffee00,#26ff00,#00ffe1,#0066ff,#9900ff,#ff0077,#ff0033);flex-shrink:0;">
              <span style="width:24px;height:24px;border-radius:50%;background:${this.profileAvatar.color};border:2px solid rgba(255,255,255,0.35);display:block;"></span>
              <input type="color" data-avatar-color-input value="${this.profileAvatar.color}" style="position:absolute;width:1px;height:1px;opacity:0;border:0;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;" />
            </label>
          </div>
          <div style="color:var(--dash-text);font-weight:600;font-size:14px;margin-bottom:8px;">Apelido público</div>
          <input class="dash-input" data-avatar-nick value="${this.profileAvatar.nick}" placeholder="@seunome" maxlength="25" />
        </div>
        <button class="dash-primary-btn" data-profile-save style="width:100%;font-size:16px;margin:14px 0;">✓ Salvar meu perfil</button>
        <div style="color:var(--dash-text);font-weight:700;font-size:16px;margin:14px 0 10px;">🎛️ Tema</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          ${[
            { mode: 'light', icon: '☀️', label: 'Claro' },
            { mode: 'dark', icon: '🌙', label: 'Escuro' },
            { mode: 'system', icon: '🖥️', label: 'Sistema' },
          ].map(option => `
            <button class="dash-chip ${this.themeMode === option.mode ? 'active' : ''}" data-theme-mode="${option.mode}" style="min-height:40px;padding:10px 14px;border-radius:12px;flex:1;justify-content:center;display:flex;align-items:center;gap:8px;${this.themeMode === option.mode ? 'color:#fff;' : ''}">${option.icon} ${option.label}</button>
          `).join('')}
        </div>
        <button class="dash-card pad" data-logout style="width:100%;padding:14px 18px;border-radius:14px;border:1px solid rgba(244,63,94,0.25);background:rgba(244,63,94,0.07);cursor:pointer;display:flex;align-items:center;gap:12px;">
          <span style="font-size:18px;color:#f43f5e;">🚪</span>
          <div style="text-align:left;">
            <div style="font-weight:700;font-size:15px;color:#f43f5e;">Sair da conta</div>
            <div style="font-size:12px;color:rgba(244,63,94,0.6);margin-top:1px;">Encerrar sessão atual</div>
          </div>
        </button>
      </section>
    `;
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

  setupEventListeners() {
    this.element.querySelectorAll('[data-nav-item]').forEach(button => {
      button.addEventListener('click', () => {
        this.currentNav = button.getAttribute('data-nav-item');
        this.sideOpen = false;
        this.mount();
      });
    });

    // Reivindicar conquista — dispara claim + popup XP + animação de confete.
    this.element.querySelectorAll('[data-claim-achievement]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-claim-achievement');
        if (!id) return;
        btn.disabled = true;
        btn.innerHTML = '⏳ Reivindicando...';

        try {
          const achievement = ACHIEVEMENTS_CATALOG.find(a => a.id === id);
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

    this.element.querySelector('[data-open-drawer]')?.addEventListener('click', () => {
      this.sideOpen = !this.sideOpen;
      this.mount();
    });

    this.element.querySelector('.dash-streak')?.addEventListener('click', () => {
      this.currentNav = 'conquistas';
      this.mount();
    });

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
        if (panel && panel.classList.contains('is-open') && !panel.contains(e.target) && bell && !bell.contains(e.target)) {
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

    // attach close listeners to all matching elements (backdrop + close button)
    this.element.querySelectorAll('[data-close-drawer]').forEach(el => {
      el.addEventListener('click', () => {
        this.sideOpen = false;
        this.mount();
      });
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

    this.element.querySelector('[data-home-chat-input]')?.addEventListener('input', event => {
      this.homeChatInput = event.target.value;
    });

    this.element.querySelector('[data-home-send]')?.addEventListener('click', () => {
      this.sendDashboardChatMessage(this.homeChatInput);
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

    const recipeOfHourEl = this.element.querySelector('[data-recipe-of-hour]');
    if (recipeOfHourEl) {
      recipeOfHourEl.addEventListener('click', async (e) => {
        e.stopPropagation();
        const recipeId = recipeOfHourEl.getAttribute('data-recipe-of-hour');
        if (!recipeId) return;
        // Search in user recipes first, then fall back to static RECIPES catalog
        const pool = [
          ...(Array.isArray(this.recipes) ? this.recipes : []),
          ...RECIPES,
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
        const pool = (Array.isArray(this.recipes) ? this.recipes : []).concat(RECIPES);
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
        const recipeCatalog = Array.isArray(this.recipes) && this.recipes.length ? this.recipes : RECIPES;
        const recipe = recipeCatalog.find(item => item.id === button.getAttribute('data-recipe-edit'));
        if (recipe) this.openRecipeEditChat(recipe);
      });
    });

    this.element.querySelectorAll('[data-recipe-remove]').forEach(button => {
      button.addEventListener('click', async event => {
        event.stopPropagation();
        const id = button.getAttribute('data-recipe-remove');
        const pool = [...(Array.isArray(this.recipes) ? this.recipes : []), ...RECIPES];
        const recipe = pool.find(item => item.id === id);
        if (recipe) await this.removeRecipe(recipe);
      });
    });

    this.element.querySelectorAll('[data-exam-tab]').forEach(button => {
      button.addEventListener('click', () => {
        this.examTab = button.getAttribute('data-exam-tab');
        this.mount();
      });
    });

    this.element.querySelectorAll('[data-conquest-tab]').forEach(button => {
      button.addEventListener('click', () => {
        this.communityTab = button.getAttribute('data-conquest-tab');
        this.mount();
      });
    });

    this.element.querySelectorAll('[data-community-like]').forEach(button => {
      button.addEventListener('click', () => {
        const feedId = button.getAttribute('data-community-like');
        this.communityFeed = this.communityFeed.map(item => item.id === feedId ? { ...item, lk: item.liked ? item.lk - 1 : item.lk + 1, liked: !item.liked } : item);
        this.persistProfileFields({ communityFeed: this.communityFeed });
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
        this.persistProfileFields({ belaTips: this.dicas });
        this.mountPreservingScroll();
      });
    });

    this.element.querySelectorAll('[data-meal-remove]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-meal-remove');
        this.dailyMeals = this.dailyMeals.filter(meal => meal.id !== id);
        this.homeChecked.delete(id);
        State.set('dailyMeals', this.dailyMeals);
        this.persistProfileFields({ dailyMeals: this.dailyMeals });
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
        const ready = Boolean(order?.fileReady || order?.pdfReady || order?.fileUrl || order?.driveFileUrl);
        if (!ready) {
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
}

function FEED0() {
  return [
    { id: 'f1', u: 'Ana Beatriz', e: '👑', col: '#eab308', b: '🔥', bn: '30 Dias Ativa', t: 'há 2h', lk: 14, cm: [{ u: 'Carla', t: 'Incrível!! 🎉' }, { u: 'Priscila', t: 'Arrasou! 💪' }], liked: false },
    { id: 'f2', u: 'Carla Mendes', e: '🔥', col: '#f0059a', b: '📉', bn: 'Glicemia em Queda', t: 'há 5h', lk: 22, cm: [{ u: 'Ana', t: 'Que conquista!! 🏆' }], liked: true },
    { id: 'f3', u: 'Priscila S.', e: '💎', col: '#a78bfa', b: '📅', bn: '7 Dias no Ritmo', t: 'há 1d', lk: 9, cm: [], liked: false },
  ];
}

export default DashboardScreen;
