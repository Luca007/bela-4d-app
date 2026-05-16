// Application constants
export const APP_NAME = "Programa 4D";
export const APP_ACRONYM = "4D";
export const APP_SUBTITLE = "Bela Nutrição";

// ============================================================
// SCREENS
// ============================================================
export const SCREENS = {
  LOGIN: "login",
  AWAITING: "awaiting",           // Aguardando reunião de onboarding
  EXAM_UPLOAD: "exam-upload",     // Upload do exame de sangue
  HEALTH_FORM: "health-form",     // Formulário de Saúde (Form 1)
  ONBOARDING: "onboarding",       // Onboarding clássico (fallback)
  CARDAPIO: "cardapio",           // Cardápio / Form 3 (semana 3)
  DASHBOARD: "dashboard",
  CHAT: "chat",                   // Chat com IA Guardiã
  RECIPES: "recipes",             // Galeria de Receitas
  FOOD_SEARCH: "food-search",     // Avaliador de Alimentos
  FORMS: "forms",                 // Formulários legados (multi-step)
};

// ============================================================
// USER STATUS — controla o fluxo pós-login
// ============================================================
export const USER_STATUS = {
  // Conta criada mas reunião de onboarding ainda não aconteceu
  AWAITING_ONBOARDING: "awaiting_onboarding",

  // Reunião feita. IA detectou que tem exame → aguardando upload
  PENDING_BLOOD_TEST: "pending_blood_test",

  // Exame enviado, sendo processado pela IA no n8n
  PROCESSING_BLOOD_TEST: "processing_blood_test",

  // Pronto para preencher / confirmar o Formulário de Saúde (Form 1)
  FILLING_HEALTH_FORM: "filling_health_form",

  // Form 1 completo. Aguardando semana 3 para Formulário Pré-Cardápio
  AWAITING_MENU_FORM: "awaiting_menu_form",

  // Semana 3: preenchendo o Formulário Pré-Cardápio (Form 3)
  FILLING_MENU_FORM: "filling_menu_form",

  // Reunião feita, sem exame → pedido gerado para o médico
  EXAM_REQUEST_SENT: "exam_request_sent",

  // Tudo completo — acesso total ao dashboard
  ACTIVE: "active",
};

// ════════════════════════════════════════════════════════════════════════
// GAMIFICAÇÃO — XP por evento
// ════════════════════════════════════════════════════════════════════════
// ⚠️ CANONICAL FALLBACK: dados oficiais vêm do Firestore appConfig/xpEvents.
// Use sempre getXpEvents() — que prioriza State.appConfig.
export const XP_EVENTS = {
  DAILY_LOGIN: 10,
  HEALTH_FORM_COMPLETED: 150,
  BLOOD_TEST_UPLOADED: 200,
  MENU_FORM_COMPLETED: 100,
  CHAT_MESSAGE_SENT: 5,
  RECIPE_SAVED: 15,
  RECIPE_TRIED: 25,
  EXAM_UPLOADED: 50,
  STREAK_7_DAYS: 75,
  STREAK_14_DAYS: 150,
  STREAK_30_DAYS: 300,
  PROFILE_COMPLETE: 50,
  FIRST_RECIPE: 30,
  SHARE_ACHIEVEMENT: 20,
  RECIPE_GENERATED: 15,    // alias compatibilidade (mesmo que RECIPE_SAVED)
  FOOD_EVALUATED: 5,       // avaliação de alimento
};

// ════════════════════════════════════════════════════════════════════════
// NÍVEIS DE PROGRESSÃO — 8 tiers unificados
// ════════════════════════════════════════════════════════════════════════
// ⚠️ CANONICAL FALLBACK: os dados oficiais vêm do Firestore appConfig/levels.
// Esta constante é usada apenas como fallback quando o appConfig ainda não
// foi carregado do Firestore (ex: primeiros ms após login, modo offline).
// Para ler os níveis, use sempre getLevels() — que prioriza State.appConfig.
// Campos: level, title, name (alias), shortName, minXp, maxXp, color, emoji, icon (alias), rarity
export const LEVELS = [
  { level: 1, title: "Iniciante",    name: "Iniciante",    shortName: "Inic.",     minXp: 0,    maxXp: 499,   color: "#8a8aa0", emoji: "🌱", icon: "🌱", rarity: "common" },
  { level: 2, title: "Aprendiz",     name: "Aprendiz",     shortName: "Apr.",      minXp: 500,  maxXp: 1199,  color: "#10b981", emoji: "🌿", icon: "🌿", rarity: "common" },
  { level: 3, title: "Comprometida", name: "Comprometida", shortName: "Comp.",     minXp: 1200, maxXp: 2199,  color: "#38bdf8", emoji: "💪", icon: "💪", rarity: "uncommon" },
  { level: 4, title: "Disciplinada", name: "Disciplinada", shortName: "Disc.",     minXp: 2200, maxXp: 3399,  color: "#a78bfa", emoji: "🔥", icon: "🔥", rarity: "uncommon" },
  { level: 5, title: "Consistente",  name: "Consistente",  shortName: "Consis.",   minXp: 3400, maxXp: 4799,  color: "#f59e0b", emoji: "⭐", icon: "⭐", rarity: "rare" },
  { level: 6, title: "Referência",   name: "Referência",   shortName: "Ref.",      minXp: 4800, maxXp: 6499,  color: "#f43f5e", emoji: "🏆", icon: "🏆", rarity: "rare" },
  { level: 7, title: "Elite 4D",     name: "Elite 4D",     shortName: "Elite",     minXp: 6500, maxXp: 8499,  color: "#14b8a6", emoji: "💎", icon: "💎", rarity: "epic" },
  { level: 8, title: "Mestra 4D",    name: "Mestra 4D",    shortName: "Mestra",    minXp: 8500, maxXp: 99999, color: "#eab308", emoji: "👑", icon: "👑", rarity: "legendary" },
];

// ════════════════════════════════════════════════════════════════════════
// CONQUISTAS — 22 achievements (12 visíveis + 10 hidden) com XP, condições e descrições
// ════════════════════════════════════════════════════════════════════════
// ⚠️ CANONICAL FALLBACK: os dados oficiais vêm do Firestore appConfig/achievementsCatalog.
// Use sempre getAchievementsCatalog() — que prioriza State.appConfig.
export const ACHIEVEMENTS_CATALOG = [
  {
    id: "first_step",
    title: "Primeiro Passo",
    description: "Completar onboarding",
    xp: 100,
    icon: "🎉",
    condition: { event: "ONBOARDING_COMPLETED" },
  },
  {
    id: "organized",
    title: "Organizado",
    description: "Preencher todos os 5 formulários",
    xp: 200,
    icon: "📋",
    condition: { event: "ALL_FORMS_COMPLETED" },
  },
  {
    id: "scientist",
    title: "Cientista",
    description: "Upload do primeiro exame",
    xp: 50,
    icon: "🔬",
    condition: { event: "FIRST_EXAM_UPLOADED" },
  },
  {
    id: "chef_formation",
    title: "Chef em Formação",
    description: "Gerar 3 receitas",
    xp: 75,
    icon: "👨‍🍳",
    condition: { event: "RECIPES_GENERATED", count: 3 },
  },
  {
    id: "chef_confirmed",
    title: "Chef Confirmado",
    description: "Gerar 10 receitas",
    xp: 150,
    icon: "🍽️",
    condition: { event: "RECIPES_GENERATED", count: 10 },
  },
  {
    id: "conversationalist",
    title: "Conversador",
    description: "Enviar 10 mensagens no chat",
    xp: 50,
    icon: "💬",
    condition: { event: "CHAT_MESSAGES", count: 10 },
  },
  {
    id: "consistent",
    title: "Consistente",
    description: "Login por 7 dias seguidos",
    xp: 100,
    icon: "📅",
    condition: { event: "STREAK_DAYS", count: 7 },
  },
  {
    id: "iron_fire",
    title: "Ferro e Fogo",
    description: "Login por 30 dias seguidos",
    xp: 500,
    icon: "🔥",
    condition: { event: "STREAK_DAYS", count: 30 },
  },
  {
    id: "explorer",
    title: "Explorador",
    description: "Usar Avaliador Alimentar 5 vezes",
    xp: 75,
    icon: "🧭",
    condition: { event: "FOOD_EVALUATIONS", count: 5 },
  },
  {
    id: "top_10",
    title: "Comunidade Top 10",
    description: "Entrar no top 10 do ranking",
    xp: 200,
    icon: "🏆",
    condition: { event: "TOP_RANKING", rank: 10 },
  },
  {
    id: "veteran",
    title: "Veterano",
    description: "90 dias de conta ativa",
    xp: 1000,
    icon: "🎖️",
    condition: { event: "ACCOUNT_AGE_DAYS", count: 90 },
  },
  {
    id: "gmp_master",
    title: "Mestre GMP",
    description: "Atingir nível 8 (Mestra 4D)",
    xp: 1000,
    icon: "👑",
    condition: { event: "LEVEL_REACHED", level: 8 },
  },
  // Hidden achievements — only revealed after unlock
  {
    id: "night_owl",
    title: "Coruja Noturna",
    description: "Acessar o app entre 23h e 5h em 3 dias diferentes",
    xp: 75,
    icon: "🦉",
    hidden: true,
    condition: { event: "NIGHT_ACCESS_DAYS", count: 3 },
  },
  {
    id: "early_bird",
    title: "Madrugadora",
    description: "Acessar o app entre 5h e 7h em 5 dias diferentes",
    xp: 75,
    icon: "🌅",
    hidden: true,
    condition: { event: "EARLY_ACCESS_DAYS", count: 5 },
  },
  {
    id: "recipe_curator",
    title: "Curadora",
    description: "Favoritar 5 receitas",
    xp: 100,
    icon: "❤️",
    hidden: true,
    condition: { event: "RECIPES_FAVORITED", count: 5 },
  },
  {
    id: "food_explorer_pro",
    title: "Exploradora Pro",
    description: "Avaliar 25 alimentos diferentes",
    xp: 200,
    icon: "🔍",
    hidden: true,
    condition: { event: "FOOD_EVALUATIONS_UNIQUE", count: 25 },
  },
  {
    id: "streak_breaker",
    title: "Persistente",
    description: "Retomar o app após perder um dia de streak",
    xp: 50,
    icon: "💪",
    hidden: true,
    condition: { event: "STREAK_RECOVERED" },
  },
  {
    id: "polymath",
    title: "Polivalente",
    description: "Usar 5 abas diferentes do app em menos de 24 horas",
    xp: 80,
    icon: "🌐",
    hidden: true,
    condition: { event: "SECTIONS_VISITED_24H", count: 5 },
  },
  {
    id: "chat_marathoner",
    title: "Maratonista",
    description: "Enviar 30 mensagens para a Guardiã em um único dia",
    xp: 150,
    icon: "🏃",
    hidden: true,
    condition: { event: "CHAT_MESSAGES_24H", count: 30 },
  },
  {
    id: "forms_finished",
    title: "Formulários em Dia",
    description: "Completar o formulário de saúde e o cardápio",
    xp: 200,
    icon: "✅",
    hidden: true,
    condition: { event: "HEALTH_AND_MENU_FORMS_COMPLETE" },
  },
  {
    id: "iron_will",
    title: "Vontade de Ferro",
    description: "Fazer login 60 vezes no total",
    xp: 600,
    icon: "🛡️",
    hidden: true,
    condition: { event: "TOTAL_LOGINS", count: 60 },
  },
  {
    id: "gmp_legend",
    title: "Lenda 4D",
    description: "Acumular 5000 XP",
    xp: 1500,
    icon: "🌟",
    hidden: true,
    condition: { event: "TOTAL_XP", count: 5000 },
  },
];

// ============================================================
// HEALTH FORM — Formulário de Saúde (7 seções)
// ============================================================
export const HEALTH_FORM_SECTIONS = [
  { icon: '📝', title: 'Identificação e Medidas' },
  { icon: '🩺', title: 'Diagnóstico e Medicamentos' },
  { icon: '📋', title: 'Histórico de Saúde' },
  { icon: '📊', title: 'Controle Glicêmico' },
  { icon: '🏃', title: 'Estilo de Vida' },
  { icon: '👥', title: 'Contexto de Vida' },
  { icon: '⚕️', title: 'Médico e Suporte' },
];

// Diagnósticos que podem ser selecionados no Form 1
export const DIAGNOSTIC_OPTIONS = [
  'Diabetes tipo 1',
  'Diabetes tipo 2',
  'Pré-diabetes',
  'Hipertensão arterial',
  'Obesidade',
  'Sobrepeso',
  'Síndrome metabólica',
  'SOP',
  'Colesterol alto',
  'Triglicerídeos altos',
  'Doença cardiovascular',
  'Asma',
  'Artrite',
  'Osteoporose',
  'Depressão',
  'Ansiedade',
  'Insônia',
  'Hipotireoidismo',
  'Hipertireoidismo',
];

// Opções de gênero para onboarding
export const GENDER_OPTIONS = [
  'Feminino',
  'Masculino',
  'Outro',
];

// Níveis de atividade física
export const ACTIVITY_LEVELS = [
  'Sedentário',
  'Leve (1-2 dias/semana)',
  'Moderado (3-4 dias/semana)',
  'Intenso (5-6 dias/semana)',
  'Atleta (7 dias/semana)',
];

// Etapas do onboarding
export const ONBOARDING_STEPS = [
  '👤 Identificação',
  '🩺 Histórico Clínico',
  '📊 Controle Glicêmico',
  '🌙 Estilo de Vida',
];

// ============================================================
// CARDÁPIO/MENU FORM — Formulário Pré-Cardápio (Form 3)
// ============================================================

// Objetivos de saúde para o programa
export const OBJECTIVE_OPTIONS = [
  { icon: '🎯', label: 'Perder peso' },
  { icon: '💪', label: 'Ganhar massa' },
  { icon: '⚖️', label: 'Manter peso' },
  { icon: '🩺', label: 'Controlar diabetes' },
];

// Refeições do dia com horários padrão
export const MEAL_TIMES = [
  { icon: '☀️', label: 'Café da manhã', time: '08:00' },
  { icon: '🥗', label: 'Lanche da manhã', time: '10:00' },
  { icon: '🍽️', label: 'Almoço', time: '12:30' },
  { icon: '🍌', label: 'Lanche da tarde', time: '15:00' },
  { icon: '🍴', label: 'Jantar', time: '19:00' },
  { icon: '🌙', label: 'Ceia (opcional)', time: '21:00' },
];

// Alimentos proibidos (lista vermelha)
export const RED_LIST = [
  'Refrigerante normal',
  'Açúcar refinado',
  'Alimentos fritos',
  'Chocolates e doces',
  'Massas brancas',
  'Pão branco',
  'Biscoitos doces',
  'Sucos industrializados',
  'Cerveja',
  'Bebidas açucaradas',
  'Alimentos processados',
  'Fast food',
  'Sorvete industrializado',
  'Leite condensado',
  'Mel concentrado',
];

// ============================================================
// DASHBOARD NAVIGATION
// ============================================================
export const NAV_ITEMS = [
  { id: 'home', label: 'Início', icon: 'home' },
  { id: 'perfil', label: 'Meu Perfil', icon: 'user' },
  { id: 'receitas', label: 'Receitas', icon: 'book-open' },
  { id: 'avaliador', label: 'Avaliador', icon: 'utensils' },
  { id: 'exames', label: 'Exames', icon: 'bar-chart-2' },
  { id: 'ranking', label: 'Ranking', icon: 'trophy' },
  { id: 'chat', label: 'Chat', icon: 'message-circle' },
];

// ════════════════════════════════════════════════════════════════════════
// HELPERS — leem do Firestore (State.appConfig) com fallback para as
// constantes hardcoded acima. Use SEMPRE estas funções; nunca acesse
// LEVELS, ACHIEVEMENTS_CATALOG ou XP_EVENTS diretamente.
// ════════════════════════════════════════════════════════════════════════

/**
 * Retorna array de níveis. Prioriza Firestore (State.appConfig.levels);
 * fallback para a constante LEVELS.
 * @returns {Array}
 */
export function getLevels() {
  try {
    const appConfig = window.State?.data?.appConfig;
    if (appConfig?.levels && Array.isArray(appConfig.levels) && appConfig.levels.length > 0) {
      return appConfig.levels;
    }
  } catch (_) { /* State ainda não inicializado */ }
  return LEVELS;
}

/**
 * Retorna array de conquistas. Prioriza Firestore (State.appConfig.achievementsCatalog);
 * fallback para a constante ACHIEVEMENTS_CATALOG.
 * @returns {Array}
 */
export function getAchievementsCatalog() {
  try {
    const appConfig = window.State?.data?.appConfig;
    if (appConfig?.achievementsCatalog && Array.isArray(appConfig.achievementsCatalog) && appConfig.achievementsCatalog.length > 0) {
      return appConfig.achievementsCatalog;
    }
  } catch (_) { /* State ainda não inicializado */ }
  return ACHIEVEMENTS_CATALOG;
}

/**
 * Retorna objeto de eventos XP. Prioriza Firestore (State.appConfig.xpEvents);
 * fallback para a constante XP_EVENTS.
 * @returns {Object}
 */
export function getXpEvents() {
  try {
    const appConfig = window.State?.data?.appConfig;
    if (appConfig?.xpEvents && typeof appConfig.xpEvents === 'object' && Object.keys(appConfig.xpEvents).length > 0) {
      return appConfig.xpEvents;
    }
  } catch (_) { /* State ainda não inicializado */ }
  return XP_EVENTS;
}