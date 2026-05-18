// ============================================================
// Mock / Fallback Data — Importado pelo dashboard-v2.js
// Campo mantido com nomes curtos compatíveis com os templates
// ============================================================

// --- Refeições do Dia (fallback quando não há cardápio personalizado) ---
export const REFEICOES_DIA = [
  { id: 'r1', icon: '☀️', nome: 'Café da manhã', hora: '07:00', desc: 'Omelete de espinafre + café sem açúcar' },
  { id: 'r2', icon: '🍎', nome: 'Lanche da manhã', hora: '10:00', desc: '10 amêndoas + queijo minas' },
  { id: 'r3', icon: '🍽️', nome: 'Almoço', hora: '12:30', desc: 'Frango grelhado + brócolis + salada' },
  { id: 'r4', icon: '🌤️', nome: 'Lanche da tarde', hora: '15:30', desc: 'Iogurte natural + morangos' },
  { id: 'r5', icon: '🌙', nome: 'Jantar', hora: '19:00', desc: 'Filé de peixe + abobrinha + tomate' },
  { id: 'r6', icon: '🌛', nome: 'Ceia', hora: '21:30', desc: 'Chá de camomila + castanhas' },
];

// --- Dicas da Home (fallback) ---
export const DICAS = [
  { e: '🧠', ti: 'Mastigue devagar', tx: 'Mastigar lentamente reduz picos glicêmicos e melhora a saciedade.' },
  { e: '💧', ti: 'Beba água antes de comer', tx: 'Um copo de água 15 min antes das refeições ajuda a controlar o apetite.' },
  { e: '🌿', ti: 'Comece pelos vegetais', tx: 'Iniciar pelo prato verde reduz a absorção rápida de açúcar.' },
  { e: '⏰', ti: 'Respeite os horários', tx: 'Comer nos mesmos horários todos os dias estabiliza a rotina metabólica.' },
];

// --- Receitas (catálogo estático, fallback para quando não há receitas do usuário) ---
export const RECIPES = [
  { id: 'r1', e: '🥚', nm: 'Omelete de Legumes', tm: '15 min', kc: 280, ct: 'Café da manhã', df: 'Fácil', ig: ['3 ovos', 'Abobrinha', 'Tomate', 'Sal e ervas'], st: ['Bata os ovos com sal.', 'Refogue legumes no azeite.', 'Despeje e tampe 3 min.', 'Sirva com folhas verdes.'] },
  { id: 'r2', e: '🐟', nm: 'Salmão com Aspargos', tm: '20 min', kc: 380, ct: 'Almoço', df: 'Médio', ig: ['200g salmão', 'Aspargos', 'Azeite', 'Limão'], st: ['Tempere o salmão.', 'Grelhe 4 min/lado.', 'Refogue aspargos.', 'Sirva com limão.'] },
  { id: 'r3', e: '🥗', nm: 'Bowl Low-Carb Frango', tm: '25 min', kc: 320, ct: 'Almoço', df: 'Fácil', ig: ['150g frango', 'Rúcula', 'Abacate', 'Azeite'], st: ['Grelhe o frango.', 'Monte bowl com rúcula.', 'Adicione abacate.', 'Regue com azeite.'] },
  { id: 'r4', e: '🍳', nm: 'Frittata de Espinafre', tm: '20 min', kc: 260, ct: 'Jantar', df: 'Fácil', ig: ['4 ovos', 'Espinafre', 'Queijo minas', 'Alho'], st: ['Refogue espinafre.', 'Bata ovos com queijo.', 'Combine na frigideira.', 'Forno 10 min 180°C.'] },
  { id: 'r5', e: '🥑', nm: 'Mousse de Abacate', tm: '10 min', kc: 200, ct: 'Lanche', df: 'Fácil', ig: ['1 abacate', 'Cacau em pó', 'Stevia'], st: ['Amasse o abacate.', 'Adicione cacau e stevia.', 'Misture bem.', 'Sirva gelado.'] },
  { id: 'r6', e: '🍲', nm: 'Caldo de Frango', tm: '40 min', kc: 180, ct: 'Ceia', df: 'Médio', ig: ['Frango', 'Chuchu', 'Cenoura', 'Ervas'], st: ['Cozinhe frango 30 min.', 'Adicione legumes.', 'Tempere.', 'Coe e sirva.'] },
];

// --- Conquistas (fallback, mock para preview) ---
export const BADGES = [
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

// --- Ranking (mock, fallback quando não há dados do Firestore) ---
export const RANKING = [
  { p: 1, nm: 'Ana Beatriz', nk: '@anabea', e: '👑', col: '#eab308', xp: 1420, st: 45 },
  { p: 2, nm: 'Carla Mendes', nk: '@carlinha', e: '🔥', col: '#f0059a', xp: 1180, st: 38 },
  { p: 3, nm: 'Priscila S.', nk: '@prisilva', e: '🌟', col: '#a78bfa', xp: 980, st: 31 },
  { p: 4, nm: 'Fernanda L.', nk: '@ferlima', e: '🌺', col: '#1fcc74', xp: 820, st: 28 },
  { p: 5, nm: 'Juliana C.', nk: '@juju', e: '⭐', col: '#38bdf8', xp: 710, st: 22 },
  { p: 6, nm: 'Mariana A.', nk: '@mari', e: '🌸', col: '#fb7185', xp: 640, st: 19 },
  { p: 7, nm: 'Tatiane R.', nk: '@tati', e: '🦋', col: '#34d399', xp: 580, st: 17 },
  { p: 8, nm: 'Você', nk: '@voce', e: '🌙', col: '#f0059a', xp: 520, st: 14, me: true },
  { p: 9, nm: 'Roberta D.', nk: '@robi', e: '🍀', col: '#fbbf24', xp: 480, st: 12 },
  { p: 10, nm: 'Simone N.', nk: '@sisi', e: '🌿', col: '#6ee7b7', xp: 410, st: 10 },
];

// --- Resultados de Exames (mock) ---
export const EXAM_RESULTS = {
  glicemia: [{ m: 'Nov', v: 165 }, { m: 'Dez', v: 148 }, { m: 'Jan', v: 132 }, { m: 'Fev', v: 121 }, { m: 'Mar', v: 109 }, { m: 'Abr', v: 98 }],
  hba1c: [{ m: 'Nov', v: 8.1 }, { m: 'Jan', v: 7.4 }, { m: 'Mar', v: 6.8 }, { m: 'Abr', v: 6.1 }],
  peso: [{ m: 'Nov', v: 84.0 }, { m: 'Dez', v: 83.2 }, { m: 'Jan', v: 82.1 }, { m: 'Fev', v: 81.4 }, { m: 'Mar', v: 80.1 }, { m: 'Abr', v: 79.6 }],
};

// --- Pedidos de Exames (mock) ---
export const EXAM_ORDERS = [
  { id: 'eo1', dt: '28/04/2026', st: 'Pendente', ex: ['Glicemia em jejum', 'HbA1c', 'Insulina em jejum', 'Peptídeo C'], ins: 'Jejum mínimo 12h. Coletar pela manhã.', fileReady: false, fileUrl: '' },
  { id: 'eo2', dt: '15/03/2026', st: 'Realizado', ex: ['Perfil lipídico', 'TSH', 'T4 livre', 'Ferritina', 'Vitamina D'], ins: 'Jejum de 12 horas.', fileReady: true, fileUrl: '' },
  { id: 'eo3', dt: '10/01/2026', st: 'Realizado', ex: ['Glicemia', 'HbA1c', 'Urina tipo 1', 'Creatinina'], ins: 'Coleta em laboratório credenciado.', fileReady: false, fileUrl: '' },
];

// --- Cores e avatares disponíveis ---
export const PROFILE_AVATARS = ['🌸', '⚡', '🦋', '🌺', '🌟', '🔥', '🌙', '⭐', '🌿', '🦁', '🌊', '🍀'];
export const PROFILE_COLORS = ['#f0059a', '#a78bfa', '#1fcc74', '#f59e0b', '#38bdf8', '#fb7185', '#34d399', '#fbbf24'];

// ============================================================
// Dados adicionais (podem ser usados por outros módulos futuramente)
// ============================================================

// --- Banco de Alimentos (Lista Verde / Amarela / Vermelha) ---
export const FOOD_DATABASE = {
  frango: { status: 'g', note: 'Proteína magra ideal — base do programa' },
  peixe: { status: 'g', note: 'Ômega-3 anti-inflamatório e proteína de alto valor' },
  salmão: { status: 'g', note: 'Ômega-3 que melhora sensibilidade à insulina' },
  atum: { status: 'g', note: 'Proteína sem carboidratos' },
  sardinha: { status: 'g', note: 'Cálcio, ômega-3 e proteína' },
  tilápia: { status: 'g', note: 'Peixe branco magro, ótimo para o programa' },
  ovo: { status: 'g', note: 'Proteína completa, zero impacto glicêmico' },
  ovos: { status: 'g', note: 'Proteína completa, zero impacto glicêmico' },
  brócolis: { status: 'g', note: 'Fibras e antioxidantes que regulam a glicemia' },
  abobrinha: { status: 'g', note: 'Vegetal de baixíssimo índice glicêmico' },
  espinafre: { status: 'g', note: 'Magnésio melhora sensibilidade à insulina' },
  couve: { status: 'g', note: 'Fibras reguladoras e alto valor nutricional' },
  rúcula: { status: 'g', note: 'Baixo IG, rico em nutrientes' },
  tomate: { status: 'g', note: 'Licopeno e baixo índice glicêmico' },
  abacate: { status: 'g', note: 'Gordura boa que suaviza picos glicêmicos' },
  morango: { status: 'g', note: 'Fruta de baixo IG, rica em vitamina C' },
  amêndoa: { status: 'g', note: 'Gordura e proteína que estabilizam a glicose' },
  azeite: { status: 'g', note: 'Anti-inflamatório, melhora perfil lipídico' },
  arroz: { status: 'a', note: 'Prefira integral — máx. 2 colheres de sopa por refeição' },
  batata_doce: { status: 'a', note: 'IG médio — 1 unidade pequena com proteína' },
  banana: { status: 'a', note: 'IG moderado — 1 unidade pequena com oleaginosas' },
  maçã: { status: 'a', note: '1 unidade média com amêndoas' },
  laranja: { status: 'a', note: 'Vitamina C, mas frutose — 1 unidade por vez' },
  iogurte: { status: 'a', note: 'Preferir natural sem açúcar ou grego' },
  queijo: { status: 'a', note: 'Laticínio — 1 a 2 fatias por refeição' },
  feijão: { status: 'a', note: 'Fibras boas — máx. 4 colheres de sopa' },
  lentilha: { status: 'a', note: 'Carboidrato de baixo IG em porção controlada' },
  açúcar: { status: 'r', note: 'Eleva a glicemia imediatamente. Substituir por stevia' },
  refrigerante: { status: 'r', note: 'Alto teor de açúcar — fortemente contraindicado' },
  pão: { status: 'r', note: 'Se branco/francês, IG altíssimo. Use pão de sementes' },
  farinha: { status: 'r', note: 'Carboidrato refinado — usar farinha de amêndoa' },
  macarrão: { status: 'r', note: 'Carboidrato refinado de alto IG' },
  bolo: { status: 'r', note: 'Açúcar + farinha refinada = pico glicêmico elevado' },
  biscoito: { status: 'r', note: 'Ultra processado com açúcar oculto' },
  sorvete: { status: 'r', note: 'Açúcar + gordura = pico de insulina' },
  chocolate: { status: 'r', note: 'Se ao leite ou branco, alto açúcar. Use 70%+ cacau' },
  margarina: { status: 'r', note: 'Gordura trans — substituir por manteiga ou azeite' },
  salsicha: { status: 'r', note: 'Ultra processado com conservantes inflamatórios' },
  mel: { status: 'r', note: 'Açúcar natural de alto IG — substituir por stevia' },
  suco: { status: 'r', note: 'Remove fibras e concentra o açúcar da fruta' },
  cerveja: { status: 'r', note: 'Carboidrato líquido + álcool que interferem na glicose' },
  tapioca: { status: 'r', note: 'Amido puro com IG altíssimo — evitar' },
  pizza: { status: 'r', note: 'Farinha refinada + gordura elevam glicemia' },
  fritura: { status: 'r', note: 'Gordura trans e oxidação aumentam inflamação' },
  miojo: { status: 'r', note: 'Ultra processado — sódio alto e carboidrato refinado' },
};

// --- Cardápio Semanal (mock) ---
export const MEAL_PLAN = [
  {
    day: 'Dia 1',
    meals: [
      { icon: '☀️', name: 'Café', items: '2 ovos mexidos + folhas verdes + azeite' },
      { icon: '🍎', name: 'Lanche', items: '10 amêndoas + 1 fatia queijo minas' },
      { icon: '🍽️', name: 'Almoço', items: 'Frango grelhado + brócolis + salada rúcula' },
      { icon: '🌤️', name: 'Tarde', items: 'Iogurte grego natural + morangos' },
      { icon: '🌙', name: 'Jantar', items: 'Filé de peixe + abobrinha + tomate' },
    ],
  },
  {
    day: 'Dia 2',
    meals: [
      { icon: '☀️', name: 'Café', items: 'Omelete de espinafre + café sem açúcar' },
      { icon: '🍎', name: 'Lanche', items: 'Castanhas + 1 fatia de queijo' },
      { icon: '🍽️', name: 'Almoço', items: 'Salmão grelhado + aspargos + salada verde' },
      { icon: '🌤️', name: 'Tarde', items: 'Abacate com limão e sal' },
      { icon: '🌙', name: 'Jantar', items: 'Omelete de frango + couve refogada' },
    ],
  },
  {
    day: 'Dia 3',
    meals: [
      { icon: '☀️', name: 'Café', items: 'Ovos cozidos + rúcula + tomate + azeite' },
      { icon: '🍎', name: 'Lanche', items: 'Pasta de amendoim + pepino fatiado' },
      { icon: '🍽️', name: 'Almoço', items: 'Frango assado + salada de brócolis + pepino' },
      { icon: '🌤️', name: 'Tarde', items: 'Iogurte grego + amêndoas laminadas' },
      { icon: '🌙', name: 'Jantar', items: 'Tilápia grelhada + espinafre ao alho' },
    ],
  },
];
