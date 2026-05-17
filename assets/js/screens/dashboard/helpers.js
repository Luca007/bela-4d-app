// Dashboard Helpers — funções puras, sem dependência de this
import { State } from '../../utils/helpers.js';

export function getStaticRefeicoes() {
  return State.get('appConfig')?.refeicoes || [];
}
export function getStaticDicas() {
  return State.get('appConfig')?.dicas || [];
}
export function getStaticRecipes() {
  return State.get('appConfig')?.recipes || [];
}
export function getStaticRanking() {
  return State.get('appConfig')?.ranking || [];
}

export function normalizeAvatarEmoji(value, fallback = '🌙') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  const isInvalidEmoji = !trimmed || trimmed === '??' || trimmed.includes('?');
  if (isInvalidEmoji) return fallback;
  return trimmed;
}

export function normalizeAchievement(item) {
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

export function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function parseRecipeEditMarker(content = '') {
  const text = String(content || '');
  const match = text.match(/^\[\[RECIPE_EDIT:([^\]]+)\]\]\s*/);
  if (!match) return { text, recipeId: null };
  return {
    text: text.replace(match[0], ''),
    recipeId: match[1],
  };
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getRecipeOfHour(recipes) {
  const pool = Array.isArray(recipes) && recipes.length ? recipes : getStaticRecipes();
  const h = new Date().getHours();
  const idx = h < 10 ? 0 : h < 12 ? Math.min(4, pool.length - 1) : h < 15 ? Math.min(2, pool.length - 1) : h < 18 ? Math.min(4, pool.length - 1) : h < 21 ? Math.min(3, pool.length - 1) : Math.min(5, pool.length - 1);
  return pool[idx] || pool[0] || getStaticRecipes()[0];
}

export function renderSparkline(points, color, height = 110, labelColor = 'var(--dash-muted)') {
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

export function _achCategory(id) {
  const journey = ['first_step', 'organized', 'scientist', 'forms_finished', 'veteran', 'iron_will', 'gmp_master', 'gmp_legend'];
  const engagement = ['conversationalist', 'chat_marathoner', 'explorer', 'food_explorer_pro', 'chef_formation', 'chef_confirmed', 'recipe_curator', 'consistent', 'iron_fire', 'streak_breaker', 'night_owl', 'early_bird', 'polymath'];
  if (journey.includes(id)) return 'jornada';
  if (engagement.includes(id)) return 'engajamento';
  return 'social';
}
