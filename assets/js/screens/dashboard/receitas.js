// Dashboard tab: Receitas
import { getStaticRecipes } from './helpers.js';

export function renderRecipes(dash) {
  const meals = Array.isArray(dash.dailyMeals) && dash.dailyMeals.length ? dash.dailyMeals : [];
  const recipesViewTabs = `
    <div class="dash-chip-row" style="margin-bottom:16px;">
      <button class="dash-chip ${dash.recipesView === 'catalogo' ? 'active' : ''}" data-recipes-view="catalogo">📚 Catálogo</button>
      <button class="dash-chip ${dash.recipesView === 'planner' ? 'active' : ''}" data-recipes-view="planner">🗓️ Refeições do Dia</button>
    </div>
  `;

  if (dash.recipesView === 'planner') {
    return _renderRecipePlanner(dash, meals, recipesViewTabs);
  }

  if (!dash.recipesUnlocked) {
    return `
      <section style="position:relative;min-height:520px;">
        <div class="dash-section-title">🥗 Receitas do seu Cardápio</div>
        <div class="dash-section-subtitle">Todas selecionadas especialmente para o controle glicêmico</div>
        ${recipesViewTabs}
        <div class="dash-card pad" style="position:absolute;inset:0;filter:blur(8px);opacity:0.4;pointer-events:none;padding-top:72px;overflow:hidden;">
          <div class="dash-recipe-grid">
            ${getStaticRecipes().map(recipe => `
              <div class="dash-card dash-recipe-card">
                <div style="font-size:38px;margin-bottom:10px;">${recipe.emoji || recipe.e}</div>
                <div style="color:var(--dash-text);font-weight:700;font-size:15px;margin-bottom:4px;">${recipe.name || recipe.nm}</div>
                <div style="color:var(--dash-muted);font-size:13px;">${recipe.mealType || recipe.ct}</div>
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

  if (dash.selectedRecipe) {
    return _renderRecipeDetail(dash, dash.selectedRecipe);
  }

  return _renderRecipeCatalog(dash, recipesViewTabs);
}

function _renderRecipePlanner(dash, meals, recipesViewTabs) {
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
                <div style="color:var(--dash-text);font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${meal.name || meal.nome}</div>
                <div style="color:var(--dash-muted);font-size:12px;">${meal.time || meal.hora} · ${meal.desc}</div>
              </div>
              <button class="dash-ghost-btn" data-meal-remove="${meal.id}" style="min-height:36px;padding:8px 12px;border-radius:10px;font-size:13px;">Remover</button>
            </div>
          `).join('')}
        </div>
        <div style="display:grid;grid-template-columns:72px 1fr 92px;gap:8px;margin-bottom:8px;">
          <input class="dash-input" data-meal-draft-icon value="${dash.mealDraft.icon}" maxlength="2" placeholder="🍽️" style="text-align:center;padding:10px 8px;" />
          <input class="dash-input" data-meal-draft-name value="${(dash.mealDraft.nome || '').replace(/"/g, '&quot;')}" placeholder="Nome da refeição" style="padding:10px 12px;" />
          <input type="time" class="dash-input" data-meal-draft-time value="${dash.mealDraft.hora}" style="padding:10px 12px;" />
        </div>
        <div style="display:flex;gap:8px;">
          <input class="dash-input" data-meal-draft-desc value="${(dash.mealDraft.desc || '').replace(/"/g, '&quot;')}" placeholder="Descrição da refeição" style="padding:10px 12px;" />
          <button class="dash-primary-btn" data-meal-add style="min-height:42px;padding:10px 14px;border-radius:10px;">Adicionar</button>
        </div>
      </div>
    </section>
  `;
}

function _renderRecipeCatalog(dash, recipesViewTabs) {
  const filters = ['Todas', ...new Set(getStaticRecipes().map(recipe => recipe.mealType || recipe.ct))];
  const filtered = dash.recipeFilter === 'Todas' ? getStaticRecipes() : getStaticRecipes().filter(recipe => (recipe.mealType || recipe.ct) === dash.recipeFilter);
  return `
    <section>
      <div class="dash-section-title">🥗 Receitas do seu Cardápio</div>
      <div class="dash-section-subtitle">Todas selecionadas especialmente para o controle glicêmico</div>
      ${recipesViewTabs}
      <div class="dash-chip-row" style="margin-bottom:18px;">
        ${filters.map(filter => `<button class="dash-chip ${dash.recipeFilter === filter ? 'active' : ''}" data-recipe-filter="${filter}">${filter}</button>`).join('')}
      </div>
      <div class="dash-recipe-grid">
        ${filtered.map(recipe => `
          <div class="dash-card dash-recipe-card" data-recipe-open="${recipe.id}">
            <div style="font-size:38px;margin-bottom:10px;">${recipe.emoji || recipe.e}</div>
            <div style="color:var(--dash-text);font-weight:700;font-size:15px;margin-bottom:4px;">${recipe.name || recipe.nm}</div>
            <div style="color:var(--dash-muted);font-size:13px;margin-bottom:10px;">${recipe.mealType || recipe.ct}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span class="dash-chip" style="padding:4px 10px;font-size:12px;">⏱ ${recipe.time || recipe.tm}</span>
              <span class="dash-chip" style="padding:4px 10px;font-size:12px;">🔥 ${recipe.kcal ?? recipe.kc}</span>
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

function _renderRecipeDetail(dash, recipe) {
  const ingredients = Array.isArray(recipe.ig) ? recipe.ig
    : Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.st) ? recipe.st
    : Array.isArray(recipe.steps) ? recipe.steps : [];
  const time = recipe.time || recipe.tm || recipe.prepTime || '—';
  const kcal = recipe.kcal ?? recipe.kc ?? recipe.macros?.calories ?? recipe.calories ?? '—';
  const category = recipe.mealType || recipe.ct || recipe.category || 'Receita';
  const difficulty = recipe.df || recipe.difficulty || 'Fácil';
  const emoji = recipe.emoji || recipe.e || '🍽️';
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
          ${ingredients.length ? ingredients.map(item => '<div style="display:flex;gap:10px;margin-bottom:9px;"><div style="width:7px;height:7px;border-radius:50%;background:#f0059a;flex-shrink:0;margin-top:8px;"></div><span style="color:var(--dash-muted);font-size:16px;">' + item + '</span></div>').join('') : '<div style="color:var(--dash-muted);font-size:14px;font-style:italic;">Ingredientes ainda não disponíveis para esta receita.</div>'}
        </div>
        <div>
          <div style="color:var(--dash-text);font-weight:800;font-size:18px;margin-bottom:12px;">👩‍🍳 Modo de preparo</div>
          ${steps.length ? steps.map((step, index) => '<div style="display:flex;gap:14px;margin-bottom:16px;"><div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#f0059a,#c0027c);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:13px;font-weight:800;">' + (index + 1) + '</div><span style="color:var(--dash-muted);font-size:15px;line-height:1.7;padding-top:4px;">' + step + '</span></div>').join('') : '<div style="color:var(--dash-muted);font-size:14px;font-style:italic;">Modo de preparo ainda não disponível para esta receita.</div>'}
        </div>
      </div>
    </section>
  `;
}
