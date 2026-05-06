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

// ============================================================
// GAMIFICAÇÃO — XP por evento
// ============================================================
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
};

// Níveis de progressão
export const LEVELS = [
  { level: 1, title: "Iniciante",          minXp: 0,     maxXp: 499,   color: "#6b7280", emoji: "🌱" },
  { level: 2, title: "Aprendiz",           minXp: 500,   maxXp: 1499,  color: "#10b981", emoji: "🌿" },
  { level: 3, title: "Comprometido",       minXp: 1500,  maxXp: 2999,  color: "#3b82f6", emoji: "💪" },
  { level: 4, title: "Disciplinado",       minXp: 3000,  maxXp: 4999,  color: "#8b5cf6", emoji: "🔥" },
  { level: 5, title: "Mestre do Programa", minXp: 5000,  maxXp: 99999, color: "#f59e0b", emoji: "⭐" },
];

// ============================================================
// CONQUISTAS — 12 achievements com XP e descrições
// ============================================================
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
    description: "Atingir nível 5",
    xp: 1000,
    icon: "👑",
    condition: { event: "LEVEL_REACHED", level: 5 },
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
  'Miel concentrado',
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