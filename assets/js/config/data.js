// Test data and mock responses

export const BADGES = [
  { id: 1, name: "Iniciante", emoji: "🎯", xp: 0, unlocked: true },
  { id: 2, name: "Consistente", emoji: "⭐", xp: 100, unlocked: true },
  { id: 3, name: "Disciplinado", emoji: "💪", xp: 250, unlocked: true },
  { id: 4, name: "Expert", emoji: "🏆", xp: 500, unlocked: false },
  { id: 5, name: "Legend", emoji: "👑", xp: 1000, unlocked: false },
];

export const RANKING = [
  { position: 1, name: "Ana Silva", xp: 1240, streak: 45 },
  { position: 2, name: "Carlos Santos", xp: 1120, streak: 38 },
  { position: 3, name: "Mariana Costa", xp: 980, streak: 32 },
  { position: 4, name: "João Oliveira", xp: 850, streak: 28 },
  { position: 5, name: "Paula Gomes", xp: 720, streak: 24 },
  { position: 6, name: "Felipe Rocha", xp: 680, streak: 20 },
  { position: 7, name: "Lucia Martins", xp: 620, streak: 18 },
  { position: 8, name: "Você", xp: 520, streak: 14 },
  { position: 9, name: "Roberto Lima", xp: 450, streak: 12 },
  { position: 10, name: "Fernanda Dias", xp: 380, streak: 8 },
];

export const RECIPES = [
  {
    id: 1,
    name: "Frango grelhado com vegetais",
    difficulty: "Fácil",
    time: "20 min",
    servings: 2,
    ingredients: ["Peito de frango", "Brócolis", "Abobrinha", "Azeite"],
    steps: ["Temperar o frango", "Grelhar por 15 minutos", "Preparar vegetais", "Servir morno"],
  },
  {
    id: 2,
    name: "Salmão com limão",
    difficulty: "Moderada",
    time: "25 min",
    servings: 2,
    ingredients: ["Filé de salmão", "Limão", "Alho", "Ervas aromáticas"],
    steps: ["Temperar o salmão", "Assar em forno", "Finalizar com limão"],
  },
  {
    id: 3,
    name: "Salada verde com ovos",
    difficulty: "Fácil",
    time: "10 min",
    servings: 1,
    ingredients: ["Rúcula", "Espinafre", "Ovos", "Tomate cereja"],
    steps: ["Lavar folhas", "Cozinhar ovos", "Montar salada"],
  },
];

export const EXAM_DATA = {
  glucose: [
    { month: "Jun", value: 145 },
    { month: "Jul", value: 138 },
    { month: "Ago", value: 125 },
    { month: "Set", value: 118 },
    { month: "Out", value: 105 },
    { month: "Nov", value: 98 },
  ],
  hba1c: [
    { month: "Jun", value: 8.2 },
    { month: "Ago", value: 7.8 },
    { month: "Out", value: 7.1 },
    { month: "Dez", value: 6.1 },
  ],
  weight: [
    { month: "Jun", value: 84 },
    { month: "Jul", value: 83.2 },
    { month: "Ago", value: 82.1 },
    { month: "Set", value: 81 },
    { month: "Out", value: 80.1 },
    { month: "Nov", value: 79.6 },
  ],
};

export const AI_RESPONSES = [
  "Ótimo trabalho mantendo a consistência! Seus valores de glicemia melhoraram muito.",
  "Vi que você variou as refeições. Que tal tentar mais opções de vegetais?",
  "Sua evolução é impressionante! Continue assim no próximo ciclo.",
  "Notei alguns picos. Vamos ajustar os horários das refeições?",
  "Parabéns! Você atingiu 14 dias de consistência! 🎉",
];

export const FOOD_DATABASE = {
  green: [
    { name: "Alface", notes: "Excelente, coma à vontade" },
    { name: "Brócolis", notes: "Ótimo para fibras" },
    { name: "Couve", notes: "Rica em nutrientes" },
    { name: "Espinafre", notes: "Ferro biodisponível" },
    { name: "Rúcula", notes: "Baixo índice glicêmico" },
    { name: "Cenoura roxa", notes: "Antioxidantes extras" },
    { name: "Tomate", notes: "Licopeno benéfico" },
    { name: "Pepino", notes: "Hidratação garantida" },
    { name: "Abacate", notes: "Gordura saudável" },
    { name: "Morango", notes: "Vitamina C natural" },
  ],
  yellow: [
    { name: "Arroz integral", notes: "Porção: 1 colher de sopa" },
    { name: "Batata doce", notes: "Alternativa melhor" },
    { name: "Maçã", notes: "Com moderação" },
    { name: "Banana", notes: "Meia banana por dia" },
    { name: "Laranja", notes: "Uma por dia" },
    { name: "Feijão", notes: "Porção adequada" },
  ],
  red: [
    { name: "Açúcar branco", notes: "Evitar totalmente" },
    { name: "Refrigerante", notes: "Causa picos severos" },
    { name: "Pão branco", notes: "Índice glicêmico alto" },
    { name: "Biscoito doce", notes: "Muito açúcar" },
    { name: "Sorvete", notes: "Açúcar concentrado" },
  ],
};

export const MEAL_PLAN = [
  {
    day: "Segunda",
    meals: [
      { name: "Café da manhã", foods: ["Ovos", "Pão integral", "Café com leite"] },
      { name: "Lanche", foods: ["Maçã", "Amêndoas"] },
      { name: "Almoço", foods: ["Frango grelhado", "Arroz integral", "Vegetais"] },
      { name: "Lanche", foods: ["Iogurte grego"] },
      { name: "Jantar", foods: ["Salmão", "Batata doce", "Salada"] },
    ],
  },
  {
    day: "Terça",
    meals: [
      { name: "Café da manhã", foods: ["Iogurte", "Granola", "Morango"] },
      { name: "Lanche", foods: ["Castanhas do Brasil"] },
      { name: "Almoço", foods: ["Bife magro", "Macarrão integral", "Tomate"] },
      { name: "Lanche", foods: ["Maçã"] },
      { name: "Jantar", foods: ["Tilápia", "Arroz", "Brócolis"] },
    ],
  },
  {
    day: "Quarta",
    meals: [
      { name: "Café da manhã", foods: ["Aveia", "Banana", "Mel"] },
      { name: "Lanche", foods: ["Laranja"] },
      { name: "Almoço", foods: ["Frango ao molho", "Legumes", "Arroz"] },
      { name: "Lanche", foods: ["Castanha"] },
      { name: "Jantar", foods: ["Atum", "Batata doce", "Salada"] },
    ],
  },
];

export const LEVELS = [
  { level: 1, name: "Iniciante", minXP: 0, icon: "🎯" },
  { level: 2, name: "Consistente", minXP: 100, icon: "⭐" },
  { level: 3, name: "Disciplinado", minXP: 250, icon: "💪" },
  { level: 4, name: "Expert", minXP: 500, icon: "🏆" },
  { level: 5, name: "Legend", minXP: 1000, icon: "👑" },
];
export const BADGES = [
  { id: "b1", emoji: "🌟", name: "Primeiro Passo", description: "Completou o onboarding", xp: 50, category: "Sistema", unlocked: true },
  { id: "b2", emoji: "📅", name: "7 Dias no Ritmo", description: "Seguiu o cardápio por 7 dias", xp: 150, category: "Alimentação", unlocked: true },
  { id: "b3", emoji: "📉", name: "Queda de 20%", description: "Reduziu a glicemia em 20%", xp: 200, category: "Saúde", unlocked: true },
  { id: "b4", emoji: "💬", name: "Perguntadora", description: "Fez 10 perguntas ao Chat IA", xp: 80, category: "Sistema", unlocked: true },
  { id: "b5", emoji: "🔥", name: "30 Dias Ativa", description: "Usou o sistema por 30 dias", xp: 300, category: "Sistema", unlocked: false },
  { id: "b6", emoji: "🏆", name: "Top 10", description: "Entrou no top 10 do ranking", xp: 250, category: "Ranking", unlocked: false },
];

export const RANKING = [
  { position: 1, name: "Ana Beatriz", nick: "@anabea", emoji: "👑", color: "#eab308", xp: 1420, streak: 45 },
  { position: 2, name: "Carla Mendes", nick: "@carlinha", emoji: "🔥", color: "#f0059a", xp: 1180, streak: 38 },
  { position: 3, name: "Priscila S.", nick: "@prisilva", emoji: "💎", color: "#a78bfa", xp: 980, streak: 31 },
  { position: 4, name: "Fernanda L.", nick: "@ferlima", emoji: "🌺", color: "#1fcc74", xp: 820, streak: 28 },
  { position: 5, name: "Juliana C.", nick: "@juju", emoji: "⭐", color: "#38bdf8", xp: 710, streak: 22 },
  { position: 6, name: "Mariana A.", nick: "@mari", emoji: "🌸", color: "#fb7185", xp: 640, streak: 19 },
  { position: 7, name: "Tatiane R.", nick: "@tati", emoji: "🦋", color: "#34d399", xp: 580, streak: 17 },
  { position: 8, name: "Você", nick: "@voce", emoji: "🌙", color: "#f0059a", xp: 520, streak: 14, isYou: true },
  { position: 9, name: "Roberta D.", nick: "@robi", emoji: "🍀", color: "#fbbf24", xp: 480, streak: 12 },
  { position: 10, name: "Simone N.", nick: "@sisi", emoji: "🌿", color: "#6ee7b7", xp: 410, streak: 10 },
];

export const RECIPES = [
  {
    id: "r1",
    emoji: "🥚",
    name: "Omelete de Legumes",
    time: "15 min",
    kcal: 280,
    meal: "Café da manhã",
    difficulty: "Fácil",
    ingredients: ["3 ovos", "Abobrinha", "Tomate", "Sal e ervas"],
    steps: ["Bata os ovos com sal.", "Refogue os legumes no azeite.", "Despeje os ovos e tampe 3 min.", "Sirva com folhas verdes."],
  },
  {
    id: "r2",
    emoji: "🐟",
    name: "Salmão com Aspargos",
    time: "20 min",
    kcal: 380,
    meal: "Almoço",
    difficulty: "Médio",
    ingredients: ["200g salmão", "Aspargos", "Azeite", "Limão"],
    steps: ["Tempere o salmão.", "Grelhe 4 min de cada lado.", "Refogue aspargos.", "Sirva com limão."],
  },
  {
    id: "r3",
    emoji: "🥗",
    name: "Bowl Low-Carb Frango",
    time: "25 min",
    kcal: 320,
    meal: "Almoço",
    difficulty: "Fácil",
    ingredients: ["150g frango", "Rúcula", "Abacate", "Azeite e limão"],
    steps: ["Grelhe o frango.", "Monte bowl com rúcula.", "Adicione abacate.", "Regue com azeite."],
  },
];

export const EXAM_DATA = {
  glicemia: [
    { month: "Nov", value: 165 },
    { month: "Dez", value: 148 },
    { month: "Jan", value: 132 },
    { month: "Fev", value: 121 },
    { month: "Mar", value: 109 },
    { month: "Abr", value: 98 },
  ],
  hba1c: [
    { month: "Nov", value: 8.1 },
    { month: "Jan", value: 7.4 },
    { month: "Mar", value: 6.8 },
    { month: "Abr", value: 6.1 },
  ],
  weight: [
    { month: "Nov", value: 84.0 },
    { month: "Dez", value: 83.2 },
    { month: "Jan", value: 82.1 },
    { month: "Fev", value: 81.4 },
    { month: "Mar", value: 80.1 },
    { month: "Abr", value: 79.6 },
  ],
};

export const AI_RESPONSES = [
  "Com frango, abobrinha e ovos você pode fazer uma fritata proteica! Refogue a abobrinha, adicione frango desfiado e cubra com ovos batidos.",
  "Baseado no seu histórico, sua glicemia está em queda consistente. Continue focada — você está no caminho certo 📊✨",
  "Esse alimento está na sua Lista Verde — pode consumir com liberdade! Quer sugestões de preparo? 🥗",
  "Para o lanche da tarde: 10 amêndoas + queijo minas + água com limão. Proteína e gordura boa para segurar até o jantar 💪",
  "Sua HbA1c caiu de 8,1% para 6,1% em 5 meses — isso é extraordinário! Continue assim 💕",
];

export const FOOD_DATABASE = {
  // Green list foods
  frango: { status: "g", note: "Proteína magra ideal — base do programa" },
  peixe: { status: "g", note: "Ômega-3 anti-inflamatório e proteína de alto valor" },
  salmão: { status: "g", note: "Ômega-3 que melhora sensibilidade à insulina" },
  atum: { status: "g", note: "Proteína sem carboidratos" },
  sardinha: { status: "g", note: "Cálcio, ômega-3 e proteína" },
  tilápia: { status: "g", note: "Peixe branco magro, ótimo para o programa" },
  ovo: { status: "g", note: "Proteína completa, zero impacto glicêmico" },
  ovos: { status: "g", note: "Proteína completa, zero impacto glicêmico" },
  brócolis: { status: "g", note: "Fibras e antioxidantes que regulam a glicemia" },
  abobrinha: { status: "g", note: "Vegetal de baixíssimo índice glicêmico" },
  espinafre: { status: "g", note: "Magnésio melhora sensibilidade à insulina" },
  couve: { status: "g", note: "Fibras reguladoras e alto valor nutricional" },
  rúcula: { status: "g", note: "Baixo IG, rico em nutrientes" },
  tomate: { status: "g", note: "Licopeno e baixo índice glicêmico" },
  abacate: { status: "g", note: "Gordura boa que suaviza picos glicêmicos" },
  morango: { status: "g", note: "Fruta de baixo IG, rica em vitamina C" },
  amêndoa: { status: "g", note: "Gordura e proteína que estabilizam a glicose" },
  azeite: { status: "g", note: "Anti-inflamatório, melhora perfil lipídico" },
  
  // Yellow list foods
  arroz: { status: "a", note: "Prefira integral — máx. 2 colheres de sopa por refeição" },
  batata_doce: { status: "a", note: "IG médio — 1 unidade pequena com proteína" },
  banana: { status: "a", note: "IG moderado — 1 unidade pequena com oleaginosas" },
  maçã: { status: "a", note: "1 unidade média com amêndoas" },
  laranja: { status: "a", note: "Vitamina C, mas frutose — 1 unidade por vez" },
  iogurte: { status: "a", note: "Preferir natural sem açúcar ou grego" },
  queijo: { status: "a", note: "Laticínio — 1 a 2 fatias por refeição" },
  feijão: { status: "a", note: "Fibras boas — máx. 4 colheres de sopa" },
  lentilha: { status: "a", note: "Carboidrato de baixo IG em porção controlada" },
  
  // Red list foods
  açúcar: { status: "r", note: "Eleva a glicemia imediatamente. Substituir por stevia" },
  refrigerante: { status: "r", note: "Alto teor de açúcar — fortemente contraindicado" },
  pão: { status: "r", note: "Se branco/francês, IG altíssimo. Use pão de sementes" },
  farinha: { status: "r", note: "Carboidrato refinado — usar farinha de amêndoa" },
  macarrão: { status: "r", note: "Carboidrato refinado de alto IG" },
  bolo: { status: "r", note: "Açúcar + farinha refinada = pico glicêmico elevado" },
  biscoito: { status: "r", note: "Ultra processado com açúcar oculto" },
  sorvete: { status: "r", note: "Açúcar + gordura = pico de insulina" },
  chocolate: { status: "r", note: "Se ao leite ou branco, alto açúcar. Use 70%+ cacau" },
  margarina: { status: "r", note: "Gordura trans — substituir por manteiga ou azeite" },
  salsicha: { status: "r", note: "Ultra processado com conservantes inflamatórios" },
  mel: { status: "r", note: "Açúcar natural de alto IG — substituir por stevia" },
  suco: { status: "r", note: "Remove fibras e concentra o açúcar da fruta" },
  cerveja: { status: "r", note: "Carboidrato líquido + álcool que interferem na glicose" },
  tapioca: { status: "r", note: "Amido puro com IG altíssimo — evitar" },
  pizza: { status: "r", note: "Farinha refinada + gordura elevam glicemia" },
  fritura: { status: "r", note: "Gordura trans e oxidação aumentam inflamação" },
  miojo: { status: "r", note: "Ultra processado — sódio alto e carboidrato refinado" },
};

export const MEAL_PLAN = [
  {
    day: "Dia 1",
    meals: [
      { icon: "☀️", name: "Café", items: "2 ovos mexidos + folhas verdes + azeite" },
      { icon: "🍎", name: "Lanche", items: "10 amêndoas + 1 fatia queijo minas" },
      { icon: "🍽️", name: "Almoço", items: "Frango grelhado + brócolis + salada rúcula" },
      { icon: "🌤️", name: "Tarde", items: "Iogurte grego natural + morangos" },
      { icon: "🌙", name: "Jantar", items: "Filé de peixe + abobrinha + tomate" },
    ],
  },
  {
    day: "Dia 2",
    meals: [
      { icon: "☀️", name: "Café", items: "Omelete de espinafre + café sem açúcar" },
      { icon: "🍎", name: "Lanche", items: "Castanhas + 1 fatia de queijo" },
      { icon: "🍽️", name: "Almoço", items: "Salmão grelhado + aspargos + salada verde" },
      { icon: "🌤️", name: "Tarde", items: "Abacate com limão e sal" },
      { icon: "🌙", name: "Jantar", items: "Omelete de frango + couve refogada" },
    ],
  },
  {
    day: "Dia 3",
    meals: [
      { icon: "☀️", name: "Café", items: "Ovos cozidos + rúcula + tomate + azeite" },
      { icon: "🍎", name: "Lanche", items: "Pasta de amendoim + pepino fatiado" },
      { icon: "🍽️", name: "Almoço", items: "Frango assado + salada de brócolis + pepino" },
      { icon: "🌤️", name: "Tarde", items: "Iogurte grego + amêndoas laminadas" },
      { icon: "🌙", name: "Jantar", items: "Tilápia grelhada + espinafre ao alho" },
    ],
  },
];

export const LEVELS = [
  { number: 1, name: "Iniciante", minXp: 0 },
  { number: 2, name: "Comprometida", minXp: 100 },
  { number: 3, name: "Disciplinada", minXp: 300 },
  { number: 4, name: "Guerreira", minXp: 600 },
  { number: 5, name: "Campeã GMP", minXp: 1000 },
];

export const HOME_TIPS = [
  { icon: "🧠", title: "Mastigue devagar", text: "A mastigação lenta reduz picos glicêmicos em até 18%." },
  { icon: "💧", title: "Hidrate-se bem", text: "2 litros de água por dia — registre pelo app!" },
  { icon: "🌿", title: "Fibras primeiro", text: "Comece a refeição pelos vegetais para retardar a absorção do açúcar." },
];
