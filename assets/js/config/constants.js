// Application constants
export const APP_NAME = "Guia Metabólico Personalizado";
export const APP_ACRONYM = "GMP";

export const SCREENS = {
  LOGIN: "login",
  ONBOARDING: "onboarding",
  CARDAPIO: "cardapio",
  DASHBOARD: "dashboard",
};

export const ONBOARDING_STEPS = [
  "Identificação",
  "Clínico",
  "Glicemia",
  "Estilo de Vida",
];

export const DIAGNOSTIC_OPTIONS = [
  "Diabetes tipo 2",
  "Pré-diabetes",
  "Resistência à insulina",
  "Hipertensão arterial",
  "Colesterol elevado",
  "Hipotireoidismo",
  "SOP",
  "Doença renal crônica",
  "Doença cardíaca",
  "Esteatose hepática",
];

export const GENDER_OPTIONS = ["Feminino", "Masculino"];

export const ACTIVITY_LEVELS = [
  "Sedentário — sem exercício",
  "Caminhada leve eventual",
  "Regular 1 a 2× por semana",
  "Regular 3 a 4× por semana",
  "Treino intenso 5+ vezes/semana",
];

export const OBJECTIVE_OPTIONS = [
  { icon: "📉", label: "Perda de peso" },
  { icon: "💪", label: "Ganho de massa" },
  { icon: "📊", label: "Controle glicêmico" },
  { icon: "⚡", label: "Mais energia" },
];

export const MEAL_TIMES = [
  { icon: "☀️", label: "Café da manhã", time: "07:00" },
  { icon: "🍎", label: "Lanche manhã", time: "10:00" },
  { icon: "🍽️", label: "Almoço", time: "12:30" },
  { icon: "🌤️", label: "Lanche tarde", time: "15:30" },
  { icon: "🌙", label: "Jantar", time: "19:00" },
  { icon: "🌛", label: "Ceia", time: "21:30" },
];

export const RED_LIST = [
  "Açúcar branco", "Refrigerante", "Pão branco / francês",
  "Farinha branca", "Macarrão comum", "Biscoito / bolacha",
  "Bolo e doces", "Sorvete", "Margarina", "Salsicha / linguiça",
  "Mel", "Suco de fruta coado", "Cerveja / álcool", "Tapioca",
  "Cuscuz", "Pizza", "Hambúrguer", "Miojo", "Achocolatado",
  "Leite condensado",
];

export const AVATAR_EMOJIS = ["🌸", "⚡", "🦋", "🌺", "💎", "🔥", "🌙", "⭐", "🌿", "🦁", "🌊", "🍀"];

export const AVATAR_COLORS = [
  "#f0059a", // pink
  "#a78bfa", // purple
  "#1fcc74", // success
  "#f59e0b", // warning
  "#38bdf8", // blue
  "#fb7185",
  "#34d399",
  "#fbbf24",
];

export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "perfil", label: "Perfil", icon: "user" },
  { id: "receitas", label: "Receitas", icon: "book-open" },
  { id: "avaliador", label: "Avaliador", icon: "utensils" },
  { id: "exames", label: "Exames", icon: "bar-chart-2" },
  { id: "ranking", label: "Ranking", icon: "trophy" },
  { id: "chat", label: "Chat IA", icon: "message-circle" },
];
