// Dashboard tab: Inicio
import { getStaticRefeicoes, getStaticRecipes, getRecipeOfHour, getGreeting, getStaticDicas } from './helpers.js';
import { Colors } from '../../config/colors.js';

export function render(dash) {
  const recipe = getRecipeOfHour(dash.recipes);
  const meals = Array.isArray(dash.dailyMeals) && dash.dailyMeals.length ? dash.dailyMeals : getStaticRefeicoes();
  const checkedCount = [...dash.homeChecked].filter(id => meals.some(meal => meal.id === id)).length;
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
          ${dash.homeChatMessages.map(msg => `
            <div style="display:flex;justify-content:${msg.r === 'user' ? 'flex-end' : 'flex-start'};gap:8px;">
              ${msg.r === 'ai' ? '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f0059a,#c0027c);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">✨</div>' : ''}
              <div style="max-width:78%;padding:11px 15px;border-radius:${msg.r === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};background:${msg.r === 'user' ? 'linear-gradient(135deg,#f0059a,#c0027c)' : 'rgba(255,255,255,0.05)'};border:${msg.r === 'ai' ? '1px solid var(--dash-border)' : 'none'};color:var(--dash-text);font-size:15px;line-height:1.5;">${msg.t}</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:10px;border-top:1px solid var(--dash-border);padding-top:12px;">
          <input class="dash-input" data-home-chat-input value="${(dash.homeChatInput || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" placeholder="Ex: Me sugira uma receita com frango e brócolis..." style="flex:1;padding:12px 16px;font-size:15px;" />
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
        <div style="font-size:44px;line-height:1;flex-shrink:0;">${recipe.emoji || recipe.e}</div>
        <div style="flex:1;">
          <div style="color:var(--dash-text);font-weight:800;font-size:18px;margin-bottom:4px;">${recipe.name || recipe.nm}</div>
          <div style="color:var(--dash-muted);font-size:14px;margin-bottom:10px;">${recipe.mealType || recipe.ct}</div>
          <div class="dash-chip-row">
            <span class="dash-chip" style="background:rgba(240,5,154,0.1);border-color:rgba(240,5,154,0.25);color:#f0059a;">⏱ ${recipe.time || recipe.tm}</span>
            <span class="dash-chip" style="background:rgba(31,204,116,0.12);border-color:rgba(31,204,116,0.25);color:#1fcc74;">🔥 ${recipe.kcal ?? recipe.kc} kcal</span>
            <span class="dash-chip">${recipe.difficulty || recipe.df}</span>
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
          const done = dash.homeChecked.has(meal.id);
          const [h, m] = (meal.hora || '00:00').split(':').map(Number);
          const minutes = h * 60 + m;
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const isCurrent = Math.abs(currentMinutes - minutes) < 90;
          return `
            <div class="dash-meal ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}" data-meal-toggle="${meal.id}" style="background:${isCurrent && !done ? 'rgba(240,5,154,0.06)' : 'transparent'};">
              <div class="dash-meal-icon" style="background:${done ? 'rgba(31,204,116,0.15)' : isCurrent ? 'rgba(240,5,154,0.12)' : 'rgba(255,255,255,0.04)'}; border-color:${done ? 'rgba(31,204,116,0.5)' : isCurrent ? 'rgba(240,5,154,0.44)' : 'var(--dash-border)'}; border-style:solid; border-width:1.5px;">${done ? '✓' : meal.icon}</div>
              <div style="flex:1;">
                <div class="title" style="color:${done ? 'var(--dash-muted)' : isCurrent ? '#f0059a' : 'var(--dash-text)'}; font-weight:${done ? 500 : 700}; font-size:16px;">${meal.name || meal.nome}</div>
                <div style="color:var(--dash-muted); font-size:13px;">${meal.time || meal.hora} · ${meal.desc}</div>
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
        ${dash.dicas.map(dica => `
          <div class="dash-card pad" style="display:flex;gap:14px;">
            <span style="font-size:26px;flex-shrink:0;">${dica.emoji || dica.e}</span>
            <div style="flex:1;">
              <div style="color:var(--dash-text);font-weight:700;font-size:15px;margin-bottom:3px;">${dica.title || dica.ti}</div>
              <div style="color:var(--dash-muted);font-size:14px;line-height:1.5;">${dica.text || dica.tx}</div>
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
