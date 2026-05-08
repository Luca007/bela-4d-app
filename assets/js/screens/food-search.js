/**
 * FoodSearchScreen - Avaliador de Alimentos
 * 
 * Permite ao usuário buscar e avaliar alimentos de acordo com:
 * - Seu perfil de saúde (diagnósticos, HbA1c)
 * - Suas restrições alimentares
 * - Seu objetivo (perda peso, controle glicemia, etc)
 * 
 * Retorna classificação verde/amarelo/vermelho com impacto glicêmico e sugestões de alternativas.
 */

class FoodSearchScreen {
  constructor(app, firestoreService, n8nService) {
    this.app = app;
    this.firestore = firestoreService;
    this.n8n = n8nService;
    this.uid = null;
    this.userProfile = null;
    this.evaluationHistory = [];
    this.isLoading = false;
    this.lastEvaluation = null;
  }

  async mount(uid) {
    this.uid = uid;
    await this._initializeUserData();
    this._render();
    return this.container;
  }

  async _initializeUserData() {
    try {
      this.userProfile = await this.firestore.getUserData(this.uid, 'profile');
      this.evaluationHistory = await this.firestore.getFoodEvaluations(this.uid);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      this.userProfile = {};
      this.evaluationHistory = [];
    }
  }

  _render() {
    this.container = document.createElement('div');
    this.container.className = 'food-search-screen';
    this.container.innerHTML = `
      <div class="food-search-header">
        <div class="food-search-title-section">
          <h1>Avaliador de Alimentos</h1>
          <p class="food-search-subtitle">Descubra se o alimento é adequado para você</p>
        </div>
      </div>

      <div class="food-search-input-section">
        <div class="food-search-container">
          <div class="food-search-input-wrapper">
            <input 
              type="text" 
              id="food-search-input"
              placeholder="Digite o nome do alimento..." 
              class="food-search-input"
              autocomplete="off"
            />
            <div class="food-search-icon">🔍</div>
            <button id="food-search-clear-btn" class="food-search-clear-btn" style="display: none;">✕</button>
          </div>
          <div id="food-search-suggestions" class="food-search-suggestions" style="display: none;"></div>
        </div>

        <div class="food-search-info">
          <p class="food-search-profile-hint">
            👤 Avaliando com base em seu perfil:
            <span class="food-search-profile-tags">
              ${this.userProfile?.diagnostics?.slice(0, 2).map(d => 
                `<span class="profile-tag">${d}</span>`
              ).join('') || '<span class="profile-tag">Perfil padrão</span>'}
            </span>
          </p>
        </div>
      </div>

      <div class="food-search-content">
        <div id="food-search-results" class="food-search-results" style="display: none;"></div>
        
        <div id="food-search-empty-state" class="food-search-empty-state">
          <div class="empty-icon">🍎</div>
          <h2>Avaliador de Alimentos</h2>
          <p>Digite o nome de um alimento para descobrir se é adequado para seu perfil</p>
          <div class="food-search-help">
            <h4>📊 Como funciona:</h4>
            <ul>
              <li><strong>🟢 Verde:</strong> Alimento recomendado, pode comer</li>
              <li><strong>🟡 Amarelo:</strong> Alimento moderado, com ressalvas</li>
              <li><strong>🔴 Vermelho:</strong> Evitar, não é adequado para seu perfil</li>
            </ul>
          </div>
        </div>

        <div id="food-search-history" class="food-search-history" style="display: none;">
          <h3>Histórico de Avaliações</h3>
          <div id="food-history-list" class="food-history-list"></div>
        </div>
      </div>

      <div id="food-evaluation-modal" class="food-evaluation-modal" style="display: none;"></div>
    `;

    this._attachEventListeners();
  }

  _attachEventListeners() {
    const searchInput = document.getElementById('food-search-input');
    const clearBtn = document.getElementById('food-search-clear-btn');
    const suggestionsDiv = document.getElementById('food-search-suggestions');

    // Input handler with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearBtn.style.display = query ? 'flex' : 'none';

      clearTimeout(searchTimeout);
      if (query.length >= 2) {
        searchTimeout = setTimeout(() => this._showSuggestions(query), 300);
      } else {
        suggestionsDiv.style.display = 'none';
      }
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      suggestionsDiv.style.display = 'none';
      this._showEmptyState();
    });

    // Enter key
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const food = searchInput.value.trim();
        if (food) {
          this._evaluateFood(food);
        }
      }
    });

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._closeModal();
      }
    });
  }

  _showSuggestions(query) {
    // Common foods database (can be expanded)
    const commonFoods = [
      'Maçã', 'Banana', 'Morango', 'Laranja', 'Melancia',
      'Pão integral', 'Pão branco', 'Arroz integral', 'Arroz branco',
      'Frango', 'Peixe', 'Ovos', 'Carne vermelha', 'Tofu',
      'Brócolis', 'Espinafre', 'Cenoura', 'Abóbora', 'Alface',
      'Leite desnatado', 'Iogurte', 'Queijo', 'Requeijão',
      'Azeite', 'Óleo de soja', 'Manteiga',
      'Chocolate', 'Bolo', 'Sorvete', 'Refrigerante',
      'Café', 'Chá', 'Suco natural', 'Suco industrializado',
      'Pão de queijo', 'Biscoito doce', 'Biscoito salgado'
    ];

    const filtered = commonFoods.filter(food => 
      food.toLowerCase().includes(query.toLowerCase())
    );

    const suggestionsDiv = document.getElementById('food-search-suggestions');
    if (filtered.length > 0) {
      suggestionsDiv.innerHTML = filtered.slice(0, 8).map(food => `
        <div class="food-suggestion-item" data-food="${food}">
          ${food}
        </div>
      `).join('');
      suggestionsDiv.style.display = 'block';

      suggestionsDiv.querySelectorAll('.food-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          document.getElementById('food-search-input').value = item.dataset.food;
          suggestionsDiv.style.display = 'none';
          this._evaluateFood(item.dataset.food);
        });
      });
    } else {
      suggestionsDiv.style.display = 'none';
    }
  }

  async _evaluateFood(foodName) {
    this.isLoading = true;
    const resultsDiv = document.getElementById('food-search-results');
    resultsDiv.innerHTML = `
      <div class="food-loading">
        <div class="spinner"></div>
        <p>Analisando alimento...</p>
      </div>
    `;
    resultsDiv.style.display = 'block';
    document.getElementById('food-search-empty-state').style.display = 'none';

    try {
      // Call Cloud Function which delegates to n8n
      const response = await this.firestore.callCloudFunction('evaluateFood', {
        uid: this.uid,
        foodName: foodName,
        userDiagnostics: this.userProfile?.diagnostics || [],
        userProfile: {
          hba1c: this.userProfile?.hba1c,
          glucoseFasting: this.userProfile?.glucoseFasting,
          objective: this.userProfile?.objective
        }
      });

      this.lastEvaluation = {
        foodName: foodName,
        evaluation: response,
        timestamp: new Date()
      };

      // Save to history
      await this.firestore.saveFoodEvaluation(this.uid, this.lastEvaluation);
      this.evaluationHistory.unshift(this.lastEvaluation);

      // Render result
      this._renderEvaluationResult(response);
    } catch (error) {
      console.error('Erro ao avaliar alimento:', error);
      const offline = !navigator.onLine;
      resultsDiv.innerHTML = `
        <div class="food-error">
          <p>${offline
            ? '📡 Sem conexão. Verifique sua internet e tente novamente.'
            : '❌ Não consegui avaliar este alimento agora. Tente outro nome ou tente novamente.'}</p>
        </div>
      `;
    } finally {
      this.isLoading = false;
    }
  }

  _renderEvaluationResult(evaluation) {
    const verdict = evaluation.evaluation;
    const scoreClass = verdict.score <= 3 ? 'red' : (verdict.score <= 6 ? 'yellow' : 'green');
    const icon = verdict.score <= 3 ? '🔴' : (verdict.score <= 6 ? '🟡' : '🟢');

    const resultsDiv = document.getElementById('food-search-results');
    resultsDiv.innerHTML = `
      <div class="food-result-card">
        <div class="food-result-header ${scoreClass}">
          <div class="food-result-icon">${icon}</div>
          <div class="food-result-verdict">
            <h2>${evaluation.evaluation.verdict}</h2>
            <p>${evaluation.evaluation.food} (${evaluation.evaluation.quantity})</p>
          </div>
          <div class="food-result-score">
            <div class="score-circle">
              <span>${evaluation.evaluation.score}/<span style="opacity: 0.5;">10</span></span>
            </div>
          </div>
        </div>

        <div class="food-result-explanation">
          <p>${evaluation.evaluation.explanation}</p>
        </div>

        <div class="food-result-impact">
          <h3>💭 Impacto Glicêmico</h3>
          <div class="impact-badge ${verdict.glycemicImpact.toLowerCase()}">
            ${verdict.glycemicImpact}
          </div>
          <p class="impact-description">
            ${this._getGlycemicExplanation(verdict.glycemicImpact)}
          </p>
        </div>

        ${evaluation.evaluation.alternatives && evaluation.evaluation.alternatives.length > 0 ? `
          <div class="food-result-alternatives">
            <h3>✨ Alternativas Recomendadas</h3>
            <div class="alternatives-list">
              ${evaluation.evaluation.alternatives.map((alt, idx) => `
                <button class="alternative-item" data-food="${alt}">
                  <span>${alt}</span>
                  <span class="alternative-action">→</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${evaluation.evaluation.whenOk ? `
          <div class="food-result-when-ok">
            <h3>📅 Quando é Aceitável?</h3>
            <p>${evaluation.evaluation.whenOk}</p>
          </div>
        ` : ''}

        <div class="food-result-actions">
          <button class="btn-secondary food-action-save-btn">📌 Salvar</button>
          <button class="btn-secondary food-action-share-btn">📤 Compartilhar</button>
          <button class="btn-primary food-action-evaluate-more">🔄 Avaliar Outro</button>
        </div>
      </div>
    `;

    // Attach handlers
    resultsDiv.querySelectorAll('.alternative-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('food-search-input').value = btn.dataset.food;
        this._evaluateFood(btn.dataset.food);
      });
    });

    resultsDiv.querySelector('.food-action-save-btn')?.addEventListener('click', () => {
      // Could add to favorites or watchlist
      alert('✅ Alimento salvo no seu histórico!');
    });

    resultsDiv.querySelector('.food-action-share-btn')?.addEventListener('click', () => {
      const text = `${verdict.verdict}\n\n${evaluation.evaluation.food}: ${evaluation.evaluation.explanation}\n\nAvaliação feita via Programa 4D da Bela Nutrição`;
      if (navigator.share) {
        navigator.share({ title: 'Avaliação de Alimento', text });
      }
    });

    resultsDiv.querySelector('.food-action-evaluate-more')?.addEventListener('click', () => {
      document.getElementById('food-search-input').value = '';
      document.getElementById('food-search-input').focus();
      resultsDiv.style.display = 'none';
      document.getElementById('food-search-empty-state').style.display = 'flex';
      this._updateHistoryView();
    });

    // Log XP event
    this.firestore.logXPEvent(this.uid, 'FOOD_EVALUATED', {
      foodName: evaluation.evaluation.food,
      score: evaluation.evaluation.score,
      verdict: evaluation.evaluation.verdict
    });
  }

  _getGlycemicExplanation(impact) {
    const explanations = {
      'baixo': 'Este alimento causa um aumento lento e estável da glicemia. Ótimo para controle glicêmico.',
      'moderado': 'Este alimento causa um aumento moderado da glicemia. Pode consumir com moderação.',
      'alto': 'Este alimento causa um pico rápido de glicemia. Evite ou consuma raramente em pequenas porções.'
    };
    return explanations[impact.toLowerCase()] || 'Impacto glicêmico não especificado.';
  }

  _updateHistoryView() {
    const historyDiv = document.getElementById('food-search-history');
    if (this.evaluationHistory.length > 0) {
      const historyList = document.getElementById('food-history-list');
      historyList.innerHTML = this.evaluationHistory.slice(0, 10).map((entry, idx) => {
        const score = entry.evaluation?.evaluation?.score || 0;
        const icon = score <= 3 ? '🔴' : (score <= 6 ? '🟡' : '🟢');
        return `
          <div class="history-item" data-index="${idx}">
            <div class="history-item-icon">${icon}</div>
            <div class="history-item-info">
              <h4>${entry.foodName}</h4>
              <p>${entry.evaluation?.evaluation?.verdict || ''}</p>
            </div>
            <button class="history-item-action">→</button>
          </div>
        `;
      }).join('');

      historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.dataset.index);
          this.lastEvaluation = this.evaluationHistory[idx];
          this._renderEvaluationResult(this.lastEvaluation.evaluation);
        });
      });

      historyDiv.style.display = 'block';
    }
  }

  _showEmptyState() {
    document.getElementById('food-search-results').style.display = 'none';
    document.getElementById('food-search-empty-state').style.display = 'flex';
    this._updateHistoryView();
  }

  _closeModal() {
    const modal = document.getElementById('food-evaluation-modal');
    if (modal) modal.style.display = 'none';
  }

  unmount() {
    if (this.container) this.container.remove();
  }
}

export { FoodSearchScreen };
