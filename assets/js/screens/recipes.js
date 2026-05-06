/**
 * RecipesScreen - Galeria de Receitas Personalizadas
 * 
 * Exibe todas as receitas geradas para o usuário com:
 * - Grid responsivo com cards de receita
 * - Filtros por restrição, tempo de preparo, dificuldade
 * - Modal de detalhe com ingredientes, modo de fazer, nutrição
 * - Favoritos e compartilhamento
 * - Real-time sync com Firestore
 */

class RecipesScreen {
  constructor(app, firestoreService) {
    this.app = app;
    this.firestore = firestoreService;
    this.uid = null;
    this.recipes = [];
    this.favorites = new Set();
    this.filters = {
      mealType: null,
      restriction: null,
      maxPrepTime: null,
      difficulty: null,
      favorite: false
    };
    this.searchQuery = '';
    this.unsubscriber = null;
  }

  async mount(uid) {
    this.uid = uid;
    await this._initializeData();
    this._setupListeners();
    this._render();
    return this.container;
  }

  async _initializeData() {
    try {
      this.recipes = await this.firestore.getAllRecipes(this.uid);
      this.favorites = new Set(await this._getFavorites());
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      this.recipes = [];
    }
  }

  async _getFavorites() {
    try {
      const data = await this.firestore.getUserData(this.uid, 'preferences/favorites');
      return data?.recipeIds || [];
    } catch {
      return [];
    }
  }

  _setupListeners() {
    this.unsubscriber = this.firestore.onRecipesChange(this.uid, (updatedRecipes) => {
      this.recipes = updatedRecipes;
      this._rerenderRecipeGrid();
    });
  }

  _render() {
    this.container = document.createElement('div');
    this.container.className = 'recipes-screen';
    this.container.innerHTML = `
      <div class="recipes-header">
        <div class="recipes-title-section">
          <h1>Minhas Receitas</h1>
          <p class="recipes-subtitle">${this.recipes.length} receitas personalizadas para você</p>
        </div>
        <button class="btn-icon recipes-action-btn" id="recipes-refresh-btn" title="Atualizar">
          <span class="icon">🔄</span>
        </button>
      </div>

      <div class="recipes-toolbar">
        <div class="recipes-search">
          <input 
            type="text" 
            id="recipes-search-input"
            placeholder="Buscar receita..." 
            class="recipes-search-input"
          />
          <span class="icon-search">🔍</span>
        </div>

        <div class="recipes-filters">
          <select id="recipes-filter-meal-type" class="recipes-filter-select">
            <option value="">Tipo de Refeição</option>
            <option value="breakfast">Café da Manhã</option>
            <option value="lunch">Almoço</option>
            <option value="dinner">Jantar</option>
            <option value="snack">Lanche</option>
          </select>

          <select id="recipes-filter-prep-time" class="recipes-filter-select">
            <option value="">Tempo de Preparo</option>
            <option value="15">Até 15 min</option>
            <option value="30">Até 30 min</option>
            <option value="60">Até 1 hora</option>
            <option value="999">Mais de 1 hora</option>
          </select>

          <select id="recipes-filter-difficulty" class="recipes-filter-select">
            <option value="">Dificuldade</option>
            <option value="fácil">Fácil</option>
            <option value="média">Média</option>
            <option value="difícil">Difícil</option>
          </select>

          <label class="recipes-filter-checkbox">
            <input 
              type="checkbox" 
              id="recipes-filter-favorite"
              class="recipes-filter-checkbox-input"
            />
            <span>Apenas Favoritos</span>
          </label>

          <button id="recipes-filter-clear-btn" class="btn-outline recipes-filter-clear">
            Limpar Filtros
          </button>
        </div>
      </div>

      <div class="recipes-content">
        <div id="recipes-grid" class="recipes-grid">
          <!-- Recipe cards rendered here -->
        </div>
        <div id="recipes-empty-state" class="recipes-empty-state" style="display: none;">
          <div class="empty-icon">📚</div>
          <h2>Nenhuma receita encontrada</h2>
          <p>Tente ajustar os filtros ou gere novas receitas no chat</p>
          <button class="btn-primary recipes-chat-btn">Gerar Receita no Chat</button>
        </div>
      </div>
    `;

    this._attachEventListeners();
    this._rerenderRecipeGrid();
  }

  _attachEventListeners() {
    // Search
    document.getElementById('recipes-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this._rerenderRecipeGrid();
    });

    // Filters
    document.getElementById('recipes-filter-meal-type')?.addEventListener('change', (e) => {
      this.filters.mealType = e.target.value || null;
      this._rerenderRecipeGrid();
    });

    document.getElementById('recipes-filter-prep-time')?.addEventListener('change', (e) => {
      this.filters.maxPrepTime = e.target.value ? parseInt(e.target.value) : null;
      this._rerenderRecipeGrid();
    });

    document.getElementById('recipes-filter-difficulty')?.addEventListener('change', (e) => {
      this.filters.difficulty = e.target.value || null;
      this._rerenderRecipeGrid();
    });

    document.getElementById('recipes-filter-favorite')?.addEventListener('change', (e) => {
      this.filters.favorite = e.target.checked;
      this._rerenderRecipeGrid();
    });

    // Clear filters
    document.getElementById('recipes-filter-clear-btn')?.addEventListener('click', () => {
      this.filters = {
        mealType: null,
        restriction: null,
        maxPrepTime: null,
        difficulty: null,
        favorite: false
      };
      this.searchQuery = '';
      document.getElementById('recipes-search-input').value = '';
      document.getElementById('recipes-filter-meal-type').value = '';
      document.getElementById('recipes-filter-prep-time').value = '';
      document.getElementById('recipes-filter-difficulty').value = '';
      document.getElementById('recipes-filter-favorite').checked = false;
      this._rerenderRecipeGrid();
    });

    // Refresh
    document.getElementById('recipes-refresh-btn')?.addEventListener('click', async () => {
      await this._initializeData();
      this._rerenderRecipeGrid();
    });

    // Navigate to chat
    document.querySelector('.recipes-chat-btn')?.addEventListener('click', () => {
      this.app.navigate(USER_STATUS.ACTIVE, 'chat');
    });
  }

  _getFilteredRecipes() {
    return this.recipes.filter(recipe => {
      // Search
      if (this.searchQuery) {
        const titleMatch = recipe.title?.toLowerCase().includes(this.searchQuery);
        const ingredientMatch = recipe.ingredients?.some(ing => 
          ing.name?.toLowerCase().includes(this.searchQuery)
        );
        if (!titleMatch && !ingredientMatch) return false;
      }

      // Meal type
      if (this.filters.mealType && recipe.mealType !== this.filters.mealType) return false;

      // Prep time
      if (this.filters.maxPrepTime && recipe.prepTime > this.filters.maxPrepTime) return false;

      // Difficulty
      if (this.filters.difficulty && recipe.difficulty !== this.filters.difficulty) return false;

      // Favorite
      if (this.filters.favorite && !this.favorites.has(recipe.id)) return false;

      return true;
    });
  }

  _rerenderRecipeGrid() {
    const filtered = this._getFilteredRecipes();
    const grid = document.getElementById('recipes-grid');
    const emptyState = document.getElementById('recipes-empty-state');

    if (filtered.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = filtered.map(recipe => this._createRecipeCard(recipe)).join('');

    // Attach card click handlers
    grid.querySelectorAll('.recipe-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.recipe-favorite-btn')) return; // Don't open modal on favorite click
        const recipeId = card.dataset.recipeId;
        this._showRecipeDetail(recipeId);
      });
    });

    // Attach favorite button handlers
    grid.querySelectorAll('.recipe-favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const recipeId = btn.closest('.recipe-card').dataset.recipeId;
        this._toggleFavorite(recipeId);
      });
    });
  }

  _createRecipeCard(recipe) {
    const isFavorite = this.favorites.has(recipe.id);
    const mealTypeLabel = {
      breakfast: '🌅',
      lunch: '🍽️',
      dinner: '🌙',
      snack: '🥤'
    }[recipe.mealType] || '🍽️';

    return `
      <div class="recipe-card" data-recipe-id="${recipe.id}">
        <div class="recipe-card-image">
          <img src="${recipe.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'}" 
               alt="${recipe.title}" 
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
          <div class="recipe-card-badges">
            <span class="recipe-badge-meal">${mealTypeLabel}</span>
            <span class="recipe-badge-time">⏱️ ${recipe.prepTime}min</span>
          </div>
          <button class="recipe-favorite-btn ${isFavorite ? 'favorite' : ''}" title="Favoritar">
            ${isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="recipe-card-content">
          <h3 class="recipe-card-title">${recipe.title}</h3>
          <p class="recipe-card-subtitle">${recipe.difficulty || 'média'}</p>
          <div class="recipe-card-nutrition">
            <div class="nutrition-mini">
              <span class="nutrition-value">${recipe.nutrition?.calories || '--'}</span>
              <span class="nutrition-label">kcal</span>
            </div>
            <div class="nutrition-mini">
              <span class="nutrition-value">${recipe.nutrition?.proteins || '--'}g</span>
              <span class="nutrition-label">proteína</span>
            </div>
            <div class="nutrition-mini">
              <span class="nutrition-value">${recipe.nutrition?.carbs || '--'}g</span>
              <span class="nutrition-label">carb</span>
            </div>
            <div class="nutrition-mini">
              <span class="nutrition-value">${recipe.nutrition?.fats || '--'}g</span>
              <span class="nutrition-label">gord</span>
            </div>
          </div>
          <div class="recipe-card-tags">
            ${(recipe.tags || []).slice(0, 2).map(tag => 
              `<span class="recipe-tag">${tag}</span>`
            ).join('')}
            ${(recipe.tags || []).length > 2 ? `<span class="recipe-tag">+${(recipe.tags || []).length - 2}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async _showRecipeDetail(recipeId) {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const modal = this._createRecipeModal(recipe);
    document.body.appendChild(modal);

    // Attach event listeners to modal
    modal.querySelector('.recipe-modal-close')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.recipe-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) modal.remove();
    });

    modal.querySelector('.recipe-modal-favorite-btn')?.addEventListener('click', () => {
      this._toggleFavorite(recipeId);
      const isFavorite = this.favorites.has(recipeId);
      modal.querySelector('.recipe-modal-favorite-btn').textContent = isFavorite ? '❤️ Remover Favorito' : '🤍 Adicionar Favorito';
    });

    modal.querySelector('.recipe-modal-share-btn')?.addEventListener('click', () => {
      this._shareRecipe(recipe);
    });

    modal.querySelector('.recipe-modal-cook-btn')?.addEventListener('click', () => {
      // Log XP event for cooking
      this.firestore.logXPEvent(this.uid, XP_EVENTS.RECIPE_VIEWED, {
        recipeId,
        title: recipe.title
      });
      modal.remove();
      // Could navigate to cooking timer/step view here
    });
  }

  _createRecipeModal(recipe) {
    const isFavorite = this.favorites.has(recipe.id);

    const modal = document.createElement('div');
    modal.className = 'recipe-modal-overlay';
    modal.innerHTML = `
      <div class="recipe-modal">
        <div class="recipe-modal-header">
          <div class="recipe-modal-title-section">
            <h1>${recipe.title}</h1>
            <p class="recipe-modal-subtitle">
              ${recipe.difficulty} • ${recipe.prepTime} min • ${recipe.servings} ${recipe.servings > 1 ? 'porções' : 'porção'}
            </p>
          </div>
          <button class="recipe-modal-close">✕</button>
        </div>

        <div class="recipe-modal-content">
          <div class="recipe-modal-image">
            <img src="${recipe.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22300%22/%3E%3C/svg%3E'}" 
                 alt="${recipe.title}">
          </div>

          <div class="recipe-modal-nutrition">
            <h3>Informação Nutricional</h3>
            <div class="recipe-nutrition-grid">
              <div class="nutrition-stat">
                <div class="nutrition-stat-value">${recipe.nutrition?.calories || '--'}</div>
                <div class="nutrition-stat-label">Kcal</div>
              </div>
              <div class="nutrition-stat">
                <div class="nutrition-stat-value">${recipe.nutrition?.proteins || '--'}g</div>
                <div class="nutrition-stat-label">Proteína</div>
              </div>
              <div class="nutrition-stat">
                <div class="nutrition-stat-value">${recipe.nutrition?.carbs || '--'}g</div>
                <div class="nutrition-stat-label">Carboidratos</div>
              </div>
              <div class="nutrition-stat">
                <div class="nutrition-stat-value">${recipe.nutrition?.fats || '--'}g</div>
                <div class="nutrition-stat-label">Gordura</div>
              </div>
              <div class="nutrition-stat">
                <div class="nutrition-stat-value">${recipe.nutrition?.glycemicIndex || '--'}</div>
                <div class="nutrition-stat-label">IG</div>
              </div>
            </div>
          </div>

          <div class="recipe-modal-ingredients">
            <h3>Ingredientes</h3>
            <ul class="recipe-ingredients-list">
              ${(recipe.ingredients || []).map(ing => `
                <li class="recipe-ingredient-item">
                  <span class="ingredient-checkbox">☐</span>
                  <span class="ingredient-name">${ing.name}</span>
                  <span class="ingredient-quantity">${ing.quantity} ${ing.unit}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="recipe-modal-instructions">
            <h3>Modo de Fazer</h3>
            <ol class="recipe-instructions-list">
              ${(recipe.instructions || []).map((instruction, idx) => `
                <li class="recipe-instruction-item">
                  <span class="instruction-number">${idx + 1}</span>
                  <span class="instruction-text">${instruction}</span>
                </li>
              `).join('')}
            </ol>
          </div>

          ${recipe.tips ? `
            <div class="recipe-modal-tips">
              <h3>💡 Dica</h3>
              <p>${recipe.tips}</p>
            </div>
          ` : ''}

          ${recipe.tags && recipe.tags.length > 0 ? `
            <div class="recipe-modal-tags">
              <h3>Tags</h3>
              <div class="recipe-tags-list">
                ${recipe.tags.map(tag => `<span class="recipe-tag-large">${tag}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="recipe-modal-actions">
          <button class="btn-secondary recipe-modal-favorite-btn">
            ${isFavorite ? '❤️ Remover Favorito' : '🤍 Adicionar Favorito'}
          </button>
          <button class="btn-secondary recipe-modal-share-btn">
            📤 Compartilhar
          </button>
          <button class="btn-primary recipe-modal-cook-btn">
            👨‍🍳 Preparar Receita
          </button>
        </div>
      </div>
    `;

    return modal;
  }

  async _toggleFavorite(recipeId) {
    if (this.favorites.has(recipeId)) {
      this.favorites.delete(recipeId);
    } else {
      this.favorites.add(recipeId);
    }

    try {
      await this.firestore.saveUserData(this.uid, 'preferences/favorites', {
        recipeIds: Array.from(this.favorites),
        updatedAt: new Date()
      });
      this._rerenderRecipeGrid();
    } catch (error) {
      console.error('Erro ao salvar favorito:', error);
    }
  }

  _shareRecipe(recipe) {
    const text = `📖 Receita: ${recipe.title}\n\n⏱️ Tempo: ${recipe.prepTime} min\n💪 Proteína: ${recipe.nutrition?.proteins || '--'}g\n🍽️ ${recipe.servings} porção(ões)\n\nGerada pelo Programa 4D da Bela Nutrição`;

    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: text
      }).catch(err => console.log('Share error:', err));
    } else {
      // Fallback: copy to clipboard
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Receita copiada para a área de transferência!');
    }
  }

  unmount() {
    if (this.unsubscriber) this.unsubscriber();
    if (this.container) this.container.remove();
  }
}

export { RecipesScreen };
