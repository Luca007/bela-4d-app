#!/usr/bin/env node
/**
 * Seed appConfig no Firestore — Programa 4D
 *
 * Popula a collection appConfig com dados de referência que antes eram
 * hardcoded nos arquivos JS. Fonte: dashboard-v2.js (versão mais atual).
 *
 * Uso:
 *   node scripts/seed-app-config.js [--emulator]
 *
 * Documentos criados:
 *   appConfig/levels              → XP_LEVELS (8 níveis)
 *   appConfig/achievementsCatalog → BADGES (20 conquistas)
 *   appConfig/navItems            → NAV_ITEMS (7 itens de navegação)
 *   appConfig/recipes             → RECIPES (6 receitas de exemplo)
 *   appConfig/ranking             → RANKING (10 posições)
 *   appConfig/dicas               → DICAS (4 dicas metabólicas)
 *   appConfig/refeicoes           → REFEICOES_DIA (6 refeições do dia)
 *   appConfig/chatSuggestions     → Chat suggestions
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ─── Init ──────────────────────────────────────────────────────────────────────
const USE_EMULATOR = process.argv.includes('--emulator');

if (!getApps().length) {
  if (USE_EMULATOR || process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'bela-4d-app' });
    console.log('[Seed] Usando emulador Firestore');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ credential: cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)) });
  } else {
    try {
      const sa = require('../firebase/service-account.json');
      initializeApp({ credential: cert(sa) });
    } catch {
      console.error('[Seed] Sem credenciais. Use --emulator ou configure GOOGLE_APPLICATION_CREDENTIALS.');
      process.exit(1);
    }
  }
}

const db = getFirestore();

// ─── DATA (fonte: dashboard-v2.js) ────────────────────────────────────────────

const LEVELS = [
  { level: 1, title: 'Iniciante',    name: 'Iniciante',    shortName: 'Inic.',   minXp: 0,    maxXp: 499,   color: '#8a8aa0', emoji: '🌱', icon: '🌱', rarity: 'common' },
  { level: 2, title: 'Aprendiz',     name: 'Aprendiz',     shortName: 'Apr.',    minXp: 500,  maxXp: 1199,  color: '#10b981', emoji: '🌿', icon: '🌿', rarity: 'common' },
  { level: 3, title: 'Comprometida', name: 'Comprometida', shortName: 'Comp.',   minXp: 1200, maxXp: 2199,  color: '#38bdf8', emoji: '💪', icon: '💪', rarity: 'uncommon' },
  { level: 4, title: 'Disciplinada', name: 'Disciplinada', shortName: 'Disc.',   minXp: 2200, maxXp: 3399,  color: '#a78bfa', emoji: '🔥', icon: '🔥', rarity: 'uncommon' },
  { level: 5, title: 'Consistente',  name: 'Consistente',  shortName: 'Consis.', minXp: 3400, maxXp: 4799,  color: '#f59e0b', emoji: '⭐', icon: '⭐', rarity: 'rare' },
  { level: 6, title: 'Referência',   name: 'Referência',   shortName: 'Ref.',    minXp: 4800, maxXp: 6499,  color: '#f43f5e', emoji: '🏆', icon: '🏆', rarity: 'rare' },
  { level: 7, title: 'Elite 4D',     name: 'Elite 4D',     shortName: 'Elite',   minXp: 6500, maxXp: 8499,  color: '#14b8a6', emoji: '💎', icon: '💎', rarity: 'epic' },
  { level: 8, title: 'Mestra 4D',    name: 'Mestra 4D',    shortName: 'Mestra',  minXp: 8500, maxXp: 99999, color: '#eab308', emoji: '👑', icon: '👑', rarity: 'legendary' },
];

const ACHIEVEMENTS = [
  { id: 'b1',  emoji: '🌟', name: 'Primeiro Passo',    description: 'Completou o cadastro inicial',            xp: 50,  category: 'Sistema',      unlocked: true },
  { id: 'b2',  emoji: '📅', name: '7 Dias no Ritmo',    description: 'Seguiu o cardápio por 7 dias',             xp: 150, category: 'Alimentação',  unlocked: true },
  { id: 'b3',  emoji: '📉', name: 'Glicemia em Queda',  description: 'Reduziu a glicemia em 20%',               xp: 200, category: 'Saúde',        unlocked: true },
  { id: 'b4',  emoji: '💬', name: 'Curiosa',            description: 'Fez 10 perguntas ao Chat IA',             xp: 80,  category: 'Sistema',      unlocked: true },
  { id: 'b5',  emoji: '🔥', name: '30 Dias Ativa',      description: 'Usou o sistema por 30 dias',              xp: 300, category: 'Sistema',      unlocked: false },
  { id: 'b6',  emoji: '🏆', name: 'Top 10',             description: 'Entrou no top 10 do ranking',             xp: 250, category: 'Ranking',       unlocked: false },
  { id: 'b7',  emoji: '💪', name: 'Semana Vencida',     description: 'Completou a primeira semana',             xp: 100, category: 'Alimentação',  unlocked: true },
  { id: 'b8',  emoji: '📊', name: 'Monitor Assídua',    description: 'Registrou glicemia por 30 dias',          xp: 280, category: 'Saúde',        unlocked: false },
  { id: 'b9',  emoji: '🌙', name: 'Sono de Qualidade',  description: 'Registrou sono 5+ por 7 noites',          xp: 130, category: 'Saúde',        unlocked: true },
  { id: 'b10', emoji: '🤝', name: 'Comunidade',         description: 'Reagiu a 10 conquistas',                  xp: 90,  category: 'Social',       unlocked: true },
  { id: 'b11', emoji: '⚡', name: 'Velocista',          description: 'Iniciou rapidamente no sistema',          xp: 60,  category: 'Sistema',      unlocked: true },
  { id: 'b12', emoji: '🎯', name: 'Meta Batida',        description: 'Atingiu primeira meta de peso',           xp: 220, category: 'Saúde',        unlocked: false },
  { id: 'b13', emoji: '🥕', name: 'Colorida',           description: 'Completou 5 pratos com vegetais',         xp: 90,  category: 'Alimentação',  unlocked: false },
  { id: 'b14', emoji: '🧊', name: 'Hidratação em Dia',  description: 'Registrou água por 14 dias',              xp: 110, category: 'Saúde',        unlocked: false },
  { id: 'b15', emoji: '🚶', name: 'Passos Firmes',      description: 'Manteve rotina ativa por 10 dias',        xp: 130, category: 'Saúde',        unlocked: false },
  { id: 'b16', emoji: '🍽️', name: 'Prato Completo',     description: 'Seguiu o plano completo por 3 dias',      xp: 120, category: 'Alimentação',  unlocked: false },
  { id: 'b17', emoji: '💤', name: 'Ritmo do Sono',      description: 'Dormiu 7h+ por 7 noites',                xp: 140, category: 'Saúde',        unlocked: false },
  { id: 'b18', emoji: '💬', name: 'Parceira da IA',     description: 'Interagiu 50 vezes com o chat',           xp: 180, category: 'Sistema',      unlocked: false },
  { id: 'b19', emoji: '🎉', name: 'Comunidade Ativa',   description: 'Recebeu 25 curtidas em conquistas',       xp: 170, category: 'Social',       unlocked: false },
  { id: 'b20', emoji: '🚀', name: 'Virada 4D',          description: 'Ultrapassou 5000 XP',                     xp: 300, category: 'Ranking',      unlocked: false },
];

const NAV_ITEMS = [
  { id: 'inicio',     label: 'Início',     icon: '🏠', sub: 'Chat · Receita · Cardápio' },
  { id: 'evolucao',   label: 'Evolução',   icon: '📊', sub: 'Gráficos · Progresso' },
  { id: 'receitas',   label: 'Receitas',   icon: '🥗', sub: 'Cardápio personalizado' },
  { id: 'exames',     label: 'Exames',     icon: '🔬', sub: 'Pedidos · Resultados' },
  { id: 'conquistas', label: 'Conquistas', icon: '🏆', sub: 'Ranking · Comunidade' },
  { id: 'chat',       label: 'Chat IA',    icon: '💬', sub: 'Dúvidas alimentares' },
  { id: 'perfil',     label: 'Meu Perfil', icon: '👤', sub: 'Avatar · Configurações' },
];

const RECIPES = [
  { id: 'r1', emoji: '🥚', name: 'Omelete de Legumes',      time: '15 min', kcal: 280, mealType: 'Café da manhã', difficulty: 'Fácil', ingredients: ['3 ovos','Abobrinha','Tomate','Sal e ervas'], steps: ['Bata os ovos com sal.','Refogue legumes no azeite.','Despeje e tampe 3 min.','Sirva com folhas verdes.'] },
  { id: 'r2', emoji: '🐟', name: 'Salmão com Aspargos',     time: '20 min', kcal: 380, mealType: 'Almoço',       difficulty: 'Médio', ingredients: ['200g salmão','Aspargos','Azeite','Limão'],        steps: ['Tempere o salmão.','Grelhe 4 min/lado.','Refogue aspargos.','Sirva com limão.'] },
  { id: 'r3', emoji: '🥗', name: 'Bowl Low-Carb Frango',    time: '25 min', kcal: 320, mealType: 'Almoço',       difficulty: 'Fácil', ingredients: ['150g frango','Rúcula','Abacate','Azeite'],         steps: ['Grelhe o frango.','Monte bowl com rúcula.','Adicione abacate.','Regue com azeite.'] },
  { id: 'r4', emoji: '🍳', name: 'Frittata de Espinafre',   time: '20 min', kcal: 260, mealType: 'Jantar',       difficulty: 'Fácil', ingredients: ['4 ovos','Espinafre','Queijo minas','Alho'],        steps: ['Refogue espinafre.','Bata ovos com queijo.','Combine na frigideira.','Forno 10 min 180°C.'] },
  { id: 'r5', emoji: '🥑', name: 'Mousse de Abacate',       time: '10 min', kcal: 200, mealType: 'Lanche',       difficulty: 'Fácil', ingredients: ['1 abacate','Cacau em pó','Stevia'],                steps: ['Amasse o abacate.','Adicione cacau e stevia.','Misture bem.','Sirva gelado.'] },
  { id: 'r6', emoji: '🍲', name: 'Caldo de Frango',         time: '40 min', kcal: 180, mealType: 'Ceia',         difficulty: 'Médio', ingredients: ['Frango','Chuchu','Cenoura','Ervas'],               steps: ['Cozinhe frango 30 min.','Adicione legumes.','Tempere.','Coe e sirva.'] },
];

const RANKING = [
  { position: 1,  name: 'Ana Beatriz', nick: '@anabea',   emoji: '👑', color: '#eab308', xp: 1420, streak: 45 },
  { position: 2,  name: 'Carla Mendes', nick: '@carlinha', emoji: '🔥', color: '#f0059a', xp: 1180, streak: 38 },
  { position: 3,  name: 'Priscila S.',  nick: '@prisilva', emoji: '💎', color: '#a78bfa', xp: 980,  streak: 31 },
  { position: 4,  name: 'Fernanda L.',  nick: '@ferlima',  emoji: '🌺', color: '#1fcc74', xp: 820,  streak: 28 },
  { position: 5,  name: 'Juliana C.',   nick: '@juju',     emoji: '⭐', color: '#38bdf8', xp: 710,  streak: 22 },
  { position: 6,  name: 'Mariana A.',   nick: '@mari',     emoji: '🌸', color: '#fb7185', xp: 640,  streak: 19 },
  { position: 7,  name: 'Tatiane R.',   nick: '@tati',     emoji: '🦋', color: '#34d399', xp: 580,  streak: 17 },
  { position: 8,  name: 'Você',         nick: '@voce',     emoji: '🌙', color: '#f0059a', xp: 520,  streak: 14, isCurrentUser: true },
  { position: 9,  name: 'Roberta D.',   nick: '@robi',     emoji: '🍀', color: '#fbbf24', xp: 480,  streak: 12 },
  { position: 10, name: 'Simone N.',    nick: '@sisi',     emoji: '🌿', color: '#6ee7b7', xp: 410,  streak: 10 },
];

const DICAS = [
  { emoji: '🧠', title: 'Mastigue devagar',   text: 'Mastigar lentamente reduz picos glicêmicos e melhora a saciedade.' },
  { emoji: '💧', title: 'Beba água antes',    text: 'Um copo de água 15 min antes das refeições ajuda a controlar o apetite.' },
  { emoji: '🌿', title: 'Comece pelos vegetais', text: 'Iniciar pelo prato verde reduz a absorção rápida de açúcar.' },
  { emoji: '⏰', title: 'Respeite os horários', text: 'Comer nos mesmos horários todos os dias estabiliza a rotina metabólica.' },
];

const REFEICOES_DIA = [
  { id: 'r1', icon: '☀️', name: 'Café da manhã',     time: '07:00', desc: 'Omelete de espinafre + café sem açúcar' },
  { id: 'r2', icon: '🍎', name: 'Lanche da manhã',   time: '10:00', desc: '10 amêndoas + queijo minas' },
  { id: 'r3', icon: '🍽️', name: 'Almoço',            time: '12:30', desc: 'Frango grelhado + brócolis + salada' },
  { id: 'r4', icon: '🌤️', name: 'Lanche da tarde',   time: '15:30', desc: 'Iogurte natural + morangos' },
  { id: 'r5', icon: '🌙', name: 'Jantar',             time: '19:00', desc: 'Filé de peixe + abobrinha + tomate' },
  { id: 'r6', icon: '🌛', name: 'Ceia',               time: '21:30', desc: 'Chá de camomila + castanhas' },
];

const CHAT_SUGGESTIONS = [
  'Qual a melhor receita para meu diagnóstico?',
  'Como está meu progresso?',
  'O que comer no café da manhã?',
  'Me dê uma dica para hoje',
];

const XP_EVENTS = {
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

// ─── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('[Seed] Populando appConfig no Firestore...\n');

  const configs = {
    levels:              { data: LEVELS,              description: 'Sistema de níveis (8 níveis)' },
    achievementsCatalog: { data: ACHIEVEMENTS,         description: 'Catálogo de conquistas (20)' },
    xpEvents:            { data: XP_EVENTS,            description: 'Eventos de XP e recompensas' },
    navItems:            { data: NAV_ITEMS,            description: 'Itens de navegação (7)' },
    recipes:             { data: RECIPES,              description: 'Receitas de exemplo (6)' },
    ranking:             { data: RANKING,              description: 'Ranking global (10 posições)' },
    dicas:               { data: DICAS,               description: 'Dicas metabólicas (4)' },
    refeicoes:           { data: REFEICOES_DIA,        description: 'Refeições do dia (6)' },
    chatSuggestions:     { data: CHAT_SUGGESTIONS,     description: 'Sugestões do chat (4)' },
  };

  const batch = db.batch();
  const timestamp = FieldValue.serverTimestamp();

  for (const [docId, { data, description }] of Object.entries(configs)) {
    const ref = db.collection('appConfig').doc(docId);
    batch.set(ref, {
      docId,
      data,
      description,
      version: 1,
      source: 'dashboard-v2.js',
      createdAt: timestamp,
      updatedAt: timestamp,
    }, { merge: true });
    console.log(`  ✓ appConfig/${docId} — ${description} (${data.length} itens)`);
  }

  await batch.commit();

  console.log('\n✅ appConfig populado com sucesso!');
  console.log('📋 Collection: appConfig');
  console.log(`   Documents: ${Object.keys(configs).length}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  await seed();
  process.exit(0);
})().catch(err => {
  console.error('[Seed] Erro:', err.message);
  process.exit(1);
});
