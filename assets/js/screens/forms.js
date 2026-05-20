// Forms Screen - Multi-step questionnaire system
import { DOM, State, Session } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { SCREENS } from '../config/constants.js';
import { firestoreService } from '../services/firestore.js';

export class FormsScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.currentFormStep = 0; // 0..4
    this.formData = {
      form1: {},
      form2: {},
      form3: {},
      form4: { customFoods: [] },
      examUpload: { file: null, uploadedAt: null, examType: null }
    };
    this.userId = Session.get('userId');
    this.aiEndpoint = '/api/classify-foods'; // backend endpoint (adjust as needed)

    try { this.loadSavedData().catch(() => {}); } catch (e) {}
  }

  async loadSavedData() {
    try {
      const saved = await firestoreService.getFormProgress(this.userId);
      if (saved) {
        this.formData = { ...this.formData, ...saved };
        this.currentFormStep = saved.currentStep || 0;
      }
    } catch (e) { /* ignore in tests */ }
  }

  render() {
    const screen = DOM.create('div', 'forms-container');
    screen.appendChild(this.createHeader());
    screen.appendChild(this.createProgressIndicator());

    const content = DOM.create('div', 'forms-content');
    switch (this.currentFormStep) {
      case 0: this.renderForm1(content); break;
      case 1: this.renderExamUpload(content); break;
      case 2: this.renderForm2(content); break;
      case 3: this.renderForm3(content); break;
      case 4: this.renderForm4(content); break;
      default: this.renderForm1(content);
    }

    screen.appendChild(content);
    screen.appendChild(this.createNavigationButtons());
    return screen;
  }

  createHeader() {
    // OLD: padding/border/margin inline + cores via Colors hard-coded — substituído pelo CSS
    // .forms-header / .forms-header h1 / .forms-header p (forms.css), com tokens --color-*.
    const header = DOM.create('div', 'forms-header');

    const title = DOM.create('h1');

    const stepTitles = [
      '📋 Saúde e Histórico',
      '🩺 Resultado dos Exames',
      '🟢 Alimentos Liberados',
      '🟡 Alimentos com Moderação',
      '🔴 Alimentos Proibidos (Adicionar manualmente)'
    ];

    title.textContent = stepTitles[this.currentFormStep] || stepTitles[0];
    header.appendChild(title);

    const subtitle = DOM.create('p');
    subtitle.textContent = `Etapa ${this.currentFormStep + 1} de ${stepTitles.length}`;
    header.appendChild(subtitle);
    return header;
  }

  createProgressIndicator() {
    // OLD: estilos inline hard-coded (Colors.pink/muted/border/pinkGlow) — quebrava no tema claro.
    // Agora apenas estrutura + classes (.active/.completed) + ARIA. Toda a aparência vem do CSS
    // (.form-progress-steps / .fp-step* em forms.css), consumindo tokens --color-* do variables.css.

    const labels = [
      { full: 'Saúde e Histórico', short: 'Saúde' },
      { full: 'Exames', short: 'Exames' },
      { full: 'Alimentos Liberados', short: 'Liberados' },
      { full: 'Com Moderação', short: 'Moderação' },
      { full: 'Alimentos Proibidos', short: 'Proibidos' }
    ];

    const wrapper = DOM.create('div');
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', 'Progresso do formulário de onboarding');

    const container = DOM.create('ol', 'form-progress-steps');
    container.setAttribute('role', 'list');

    labels.forEach((label, index) => {
      const isActive = index === this.currentFormStep;
      const isCompleted = index < this.currentFormStep;

      const stepEl = DOM.create('li', 'fp-step');
      if (isActive) stepEl.classList.add('active');
      if (isCompleted) stepEl.classList.add('completed');
      if (isActive) stepEl.setAttribute('aria-current', 'step');

      // Circle (numerado, ou check quando completed)
      const circle = DOM.create('div', 'fp-step-circle');
      circle.setAttribute('aria-hidden', 'true');
      if (isCompleted) {
        circle.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else {
        circle.textContent = String(index + 1);
      }

      // Label (full/short — CSS escolhe via media query)
      const labelEl = DOM.create('span', 'fp-step-label');
      labelEl.setAttribute('data-full', label.full);
      labelEl.setAttribute('data-short', label.short);
      labelEl.textContent = label.full;

      // a11y: descrição completa de cada etapa (lida pelo screen reader)
      const srStatus = isCompleted ? 'concluída' : (isActive ? 'em andamento' : 'pendente');
      stepEl.setAttribute('aria-label', `Etapa ${index + 1} de ${labels.length}: ${label.full} — ${srStatus}`);

      stepEl.appendChild(circle);
      stepEl.appendChild(labelEl);
      container.appendChild(stepEl);

      // Connector line entre etapas (preenche quando a etapa anterior foi completada)
      if (index < labels.length - 1) {
        const lineWrapper = DOM.create('li', 'fp-step-line-wrapper');
        lineWrapper.setAttribute('aria-hidden', 'true');
        const line = DOM.create('div', 'fp-step-line');
        if (isCompleted) line.classList.add('is-filled');
        lineWrapper.appendChild(line);
        container.appendChild(lineWrapper);
      }
    });

    wrapper.appendChild(container);

    // Caption da etapa atual (visível apenas no mobile via CSS)
    const caption = DOM.create('div', 'fp-step-current-caption');
    caption.innerHTML = `<span class="fp-step-current-prefix">Etapa ${this.currentFormStep + 1}/${labels.length}</span>${labels[this.currentFormStep]?.full || ''}`;
    wrapper.appendChild(caption);

    return wrapper;
  }

  renderForm1(container) {
    const card = UIComponents.card(); card.style.padding = '28px';
    this.addFormSection(card, '👤 Identificação e Medidas', [
      { type: 'text', label: 'Nome completo', key: 'name', placeholder: 'Seu nome completo' },
      { type: 'date', label: 'Data de nascimento', key: 'birthDate' },
      { type: 'select', label: 'Sexo', key: 'gender', options: ['Feminino','Masculino','Outro'] }
    ]);

    // Measurements
    const measurementsGrid = DOM.create('div'); measurementsGrid.style.display = 'grid'; measurementsGrid.style.gridTemplateColumns = '1fr 1fr 1fr'; measurementsGrid.style.gap = '12px'; measurementsGrid.style.marginBottom = '24px';
    [{ label: 'Peso (kg)', key: 'weight', placeholder: '75' },{ label: 'Altura (cm)', key: 'height', placeholder: '165' },{ label: 'Cintura (cm)', key: 'waist', placeholder: '80' }].forEach(field => {
      const fieldContainer = DOM.create('div'); const label = UIComponents.label(field.label); const input = UIComponents.numberInput(field.placeholder, this.formData.form1[field.key] || ''); input.addEventListener('change', (e) => { this.formData.form1[field.key] = e.target.value; this.saveTempData(); }); fieldContainer.appendChild(label); fieldContainer.appendChild(input); measurementsGrid.appendChild(fieldContainer);
    });
    card.appendChild(measurementsGrid);

    this.addFormSection(card, '🎯 Objetivo', [{ type: 'checkbox-group', label: 'Qual é o seu objetivo principal neste ciclo?', key: 'goal', options: ['Perda de peso','Melhora da energia e disposição','Manutenção do peso — foco em controle glicêmico','Ganho de massa muscular','Outro'] }]);
    this.addFormSection(card, '🏃 Atividade Física', [{ type: 'select', label: 'Nível de atividade física atual', key: 'activityLevel', options: ['Sedentário — sem exercício','Levemente ativo — 1 a 2x por semana','Moderadamente ativo — 3 a 4x por semana','Muito ativo — 5 ou mais vezes por semana'] }]);

    this.addFormSection(card, '🥛 Intolerâncias e Alergias', [{ type: 'select', label: 'Intolerância à lactose', key: 'lactoseIntolerance', options: ['Não','Leve / moderada — laticínios sem lactose são ok','Grave — eliminar todos os laticínios'] },{ type: 'textarea', label: 'Alergias / intolerâncias (além de lactose)', key: 'otherAllergies', placeholder: 'Ex: Amendoim, frutos do mar...' }]);

    this.addFormSection(card, '🕐 Refeições e Rotina', [{ type: 'textarea', label: 'Quais refeições e horários?', key: 'mealSchedule', placeholder: 'Ex: Café 7:30, Almoço 12:30, Jantar 19:30' },{ type: 'select', label: 'Tempo disponível para preparar refeições', key: 'prepTime', options: ['Pouco — até 20 min','Moderado — até 40 min','Tenho tempo — receitas elaboradas'] },{ type: 'textarea', label: 'Preferência de cozinha/tempero', key: 'cuisinePreference', placeholder: 'Ex: mediterrânea, sem muito sal...' }]);

    this.addFormSection(card, '🩺 Diagnóstico', [{ type: 'checkbox-group', label: 'Diagnósticos confirmados', key: 'diagnostics', options: ['Diabetes tipo 2','Pré-diabetes','Resistência à insulina','Hipertensão arterial','Colesterol elevado','Hipotireoidismo','Nenhum'] }]);
    this.addFormSection(card, '💊 Medicamentos', [{ type: 'textarea', label: 'Medicamentos contínuos (dose e horário)', key: 'medications', placeholder: 'Ex: Metformina 850mg - 2x ao dia' }]);
    this.addFormSection(card, '🌙 Estilo de Vida', [{ type: 'range', label: 'Qualidade do sono (1-5)', key: 'sleepQuality', min: 1, max: 5 },{ type: 'range', label: 'Nível de estresse (1-5)', key: 'stressLevel', min: 1, max: 5 },{ type: 'select', label: 'Atividade física', key: 'physicalActivity', options: ['Sedentário','Levemente ativo (1-2x/semana)','Moderadamente ativo (3-4x/semana)','Muito ativo (5+ vezes/semana)'] }]);

    container.appendChild(card);
  }

  renderExamUpload(container) {
    const card = UIComponents.card(); card.style.padding = '28px';
    // OLD: message com Colors.pink/Colors.text hard-coded — substituído por var(--color-*).
    // OLD: const message = DOM.create('div'); message.style.background = `rgba(34,197,94,0.04)`; message.style.border = `1px solid ${Colors.pink}`; message.style.borderRadius = '12px'; message.style.padding = '16px'; message.style.marginBottom = '24px'; message.style.color = Colors.text; message.innerHTML = `<p style="margin:0;font-size:14px;line-height:1.6;"><strong>📌 Por que precisamos dos exames?</strong><br/>Os resultados dos seus exames (glicemia, HbA1c, colesterol, etc.) serão usados pela IA para personalizar o seu plano alimentar.</p>`; card.appendChild(message);
    const message = DOM.create('div');
    message.style.background = 'rgba(34,197,94,0.04)';
    message.style.border = '1px solid var(--color-pink)';
    message.style.borderRadius = '12px';
    message.style.padding = '16px';
    message.style.marginBottom = '24px';
    message.style.color = 'var(--color-text)';
    message.innerHTML = `<p style="margin:0;font-size:14px;line-height:1.6;"><strong>📌 Por que precisamos dos exames?</strong><br/>Os resultados dos seus exames (glicemia, HbA1c, colesterol, etc.) serão usados pela IA para personalizar o seu plano alimentar.</p>`;
    card.appendChild(message);

    // OLD: uploadLabel.style.color = Colors.text — substituído pelo CSS .forms-content h3 / var(--color-text)
    // OLD: const uploadSection = DOM.create('div'); uploadSection.style.marginBottom = '24px'; const uploadLabel = DOM.create('h3'); uploadLabel.style.color = Colors.text; uploadLabel.style.fontSize = '16px'; uploadLabel.style.fontWeight = '700'; uploadLabel.style.marginBottom = '12px'; uploadLabel.textContent = '📎 Anexe o resultado dos seus exames'; uploadSection.appendChild(uploadLabel);
    const uploadSection = DOM.create('div');
    uploadSection.style.marginBottom = '24px';
    const uploadLabel = DOM.create('h3');
    // .forms-content h3 já fornece color: var(--color-text), font-size 16, font-weight 700, margin-bottom 16 (override aqui p/ 12)
    uploadLabel.style.marginBottom = '12px';
    uploadLabel.textContent = '📎 Anexe o resultado dos seus exames';
    uploadSection.appendChild(uploadLabel);

    // OLD: uploadArea border/uploadText.color usavam Colors.border / Colors.muted — substituídos por var(--color-*).
    // OLD: const uploadArea = DOM.create('div'); uploadArea.style.border = `2px dashed ${Colors.border}`; ...; const uploadText = ...; uploadText.style.color = Colors.muted; ...
    const uploadArea = DOM.create('div');
    uploadArea.style.border = '2px dashed var(--color-border)';
    uploadArea.style.borderRadius = '12px';
    uploadArea.style.padding = '32px';
    uploadArea.style.textAlign = 'center';
    uploadArea.style.cursor = 'pointer';
    uploadArea.style.transition = 'all 0.3s ease';
    const uploadInput = DOM.create('input');
    uploadInput.type = 'file';
    uploadInput.accept = 'image/*,.pdf';
    uploadInput.style.display = 'none';
    const uploadText = DOM.create('p');
    uploadText.style.color = 'var(--color-muted)';
    uploadText.style.fontSize = '14px';
    uploadText.style.margin = '0';
    uploadText.textContent = '🖼️ Clique ou arraste o arquivo aqui (PDF ou imagem)';
    uploadArea.appendChild(uploadText);
    uploadArea.appendChild(uploadInput);

    uploadArea.addEventListener('click', () => uploadInput.click());
    // OLD: dragover usava Colors.border literal — substituído por var(--color-glass) (mais sutil e tema-aware)
    // OLD: uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.background = Colors.border; });
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.background = 'var(--color-glass)'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.background = 'transparent'; });
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.style.background='transparent'; if (e.dataTransfer.files.length>0){ uploadInput.files = e.dataTransfer.files; this.handleFileUpload(uploadInput.files[0]); } });
    uploadInput.addEventListener('change', (e) => { if (e.target.files.length>0) this.handleFileUpload(e.target.files[0]); });

    uploadSection.appendChild(uploadArea); card.appendChild(uploadSection);
    if (this.formData.examUpload && this.formData.examUpload.uploadedAt) { const statusMsg = DOM.create('div'); statusMsg.style.background = `rgba(34,197,94,0.1)`; statusMsg.style.border = `1px solid rgb(34,197,94)`; statusMsg.style.borderRadius='12px'; statusMsg.style.padding='12px'; statusMsg.style.color='rgb(34,197,94)'; statusMsg.style.fontSize='14px'; statusMsg.textContent = `✅ Arquivo anexado em ${new Date(this.formData.examUpload.uploadedAt).toLocaleDateString('pt-BR')}`; card.appendChild(statusMsg); }
    container.appendChild(card);
  }

  _renderFoodCategoryGrid(category, formKey, checkedColor) {
    const categoryDiv = DOM.create('div');
    categoryDiv.style.marginBottom = '24px';
    // OLD: categoryTitle.style.color = Colors.text; (+ fontSize/fontWeight inline)
    // Substituído pelo CSS .forms-content h4 (forms.css) que aplica color: var(--color-text),
    // font-size 14, font-weight 700. Mantemos apenas o textContent + margin-bottom.
    const categoryTitle = DOM.create('h4');
    categoryTitle.style.marginBottom = '12px';
    categoryTitle.textContent = category.name;
    categoryDiv.appendChild(categoryTitle);

    const foodsGrid = DOM.create('div');
    foodsGrid.style.display = 'grid';
    foodsGrid.style.gridTemplateColumns = '1fr 1fr';
    foodsGrid.style.gap = '12px';

    category.foods.forEach(food => {
      const label = DOM.create('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.style.cursor = 'pointer';
      label.style.padding = '8px';
      label.style.borderRadius = '8px';
      label.style.transition = 'background 0.2s';
      const checkbox = DOM.create('input');
      checkbox.type = 'checkbox';
      checkbox.value = food;
      const key = `${category.name}-${food}`;
      checkbox.checked = this.formData[formKey][key] || false;
      const checkedBg = checkedColor;
      const uncheckedBg = 'transparent';
      label.style.background = checkbox.checked ? checkedBg : uncheckedBg;
      checkbox.addEventListener('change', (e) => {
        this.formData[formKey][key] = e.target.checked;
        this.saveTempData();
        label.style.background = e.target.checked ? checkedBg : uncheckedBg;
      });
      label.appendChild(checkbox);
      const span = DOM.create('span');
      span.textContent = food;
      label.appendChild(span);
      foodsGrid.appendChild(label);
    });

    categoryDiv.appendChild(foodsGrid);
    return categoryDiv;
  }

  renderForm2(container) {
    const card = UIComponents.card(); card.style.padding = '28px';
    // OLD: title/subtitle com Colors.text/Colors.muted inline — substituído pelos seletores
    //      .forms-content h3 / .forms-content p (forms.css) que já aplicam var(--color-*).
    // OLD: const title = DOM.create('h3'); title.style.color = Colors.text; title.style.fontSize = '18px'; title.style.fontWeight = '700'; title.style.marginBottom = '16px'; ...
    // OLD: const subtitle = DOM.create('p'); subtitle.style.color = Colors.muted; subtitle.style.fontSize = '14px'; subtitle.style.marginBottom = '20px'; ...
    const title = DOM.create('h3');
    title.style.fontSize = '18px'; // override do CSS .forms-content h3 (16px) — destaque da etapa
    title.textContent = '🟢 Lista Verde - Alimentos Liberados';
    card.appendChild(title);
    const subtitle = DOM.create('p');
    subtitle.textContent = 'Marque os alimentos que você GOSTA e come com frequência. Eles terão prioridade no seu cardápio.';
    card.appendChild(subtitle);

    // OLD: pinkRgb derivado de Colors.pink via slice/parseInt — substituído por literal universal.
    // OLD: const pinkRgb = `rgba(${parseInt(Colors.pink.slice(1,3),16)}, ${parseInt(Colors.pink.slice(3,5),16)}, ${parseInt(Colors.pink.slice(5,7),16)}, 0.1)`;
    // O highlight rosa para "alimento marcado" funciona bem nos dois temas.
    const pinkRgb = 'rgba(240, 5, 154, 0.1)';
    const categories = [
      { name: '🥩 Carnes e Proteínas', foods: ['Frango','Peixe','Carne bovina','Ovos','Camarão','Atum'] },
      { name: '🥬 Vegetais Folhosos', foods: ['Alface','Espinafre','Rúcula','Couve','Agrião','Almeirão'] },
      { name: '🥦 Outros Vegetais', foods: ['Brócolis','Couve-flor','Abobrinha','Pimentão','Tomate','Cenoura'] },
      { name: '🫐 Frutas', foods: ['Abacate','Morango','Mirtilo','Maracujá','Limão','Acerola'] },
      { name: '🥜 Nozes e Sementes', foods: ['Amêndoa','Castanha do Brasil','Noz','Semente de girassol','Pasta de amendoim'] },
      { name: '🧈 Gorduras', foods: ['Azeite de oliva','Manteiga','Óleo de coco','Banha de porco'] }
    ];
    categories.forEach(category => card.appendChild(this._renderFoodCategoryGrid(category, 'form2', pinkRgb)));
    container.appendChild(card);
  }

  renderForm3(container) {
    const card = UIComponents.card(); card.style.padding = '28px';
    // OLD: title/subtitle com Colors.text/Colors.muted inline — substituído pelos seletores CSS tema-aware.
    // OLD: const title = DOM.create('h3'); title.style.color = Colors.text; title.style.fontSize = '18px'; title.style.fontWeight = '700'; title.style.marginBottom = '16px'; ...
    // OLD: const subtitle = DOM.create('p'); subtitle.style.color = Colors.muted; subtitle.style.fontSize = '14px'; subtitle.style.marginBottom = '20px'; ...
    const title = DOM.create('h3');
    title.style.fontSize = '18px';
    title.textContent = '🟡 Lista Amarela - Consumo com Moderação';
    card.appendChild(title);
    const subtitle = DOM.create('p');
    subtitle.textContent = 'Marque os alimentos que você gostaria de incluir em PEQUENAS QUANTIDADES no cardápio.';
    card.appendChild(subtitle);

    const yellowBg = 'rgba(255, 193, 7, 0.1)';
    const categories = [
      { name: '🧀 Laticínios', foods: ['Iogurte grego','Queijo minas frescal','Queijo muçarela','Queijo parmesão','Creme de ricota'] },
      { name: '🍊 Frutas', foods: ['Laranja','Maçã','Pera','Melancia','Cereja','Kiwi','Tangerina'] },
      { name: '🫘 Leguminosas', foods: ['Feijão preto','Feijão carioca','Lentilha','Grão de bico','Ervilha'] },
      { name: '🌾 Cereais e Tubérculos', foods: ['Batata doce','Arroz integral','Quinoa','Batata comum','Mandioca'] }
    ];
    categories.forEach(category => card.appendChild(this._renderFoodCategoryGrid(category, 'form3', yellowBg)));
    container.appendChild(card);
  }

  renderForm4(container) {
    const card = UIComponents.card(); card.style.padding = '28px';
    // OLD: title/subtitle inline com Colors.text/Colors.muted — agora usam CSS .forms-content h3/p tema-aware.
    // OLD: const title = DOM.create('h3'); title.style.color = Colors.text; title.style.fontSize = '18px'; title.style.fontWeight = '700'; title.style.marginBottom = '12px'; ...
    // OLD: const subtitle = DOM.create('p'); subtitle.style.color = Colors.muted; subtitle.style.fontSize = '14px'; subtitle.style.marginBottom = '16px'; ...
    const title = DOM.create('h3');
    title.style.fontSize = '18px';
    title.style.marginBottom = '12px';
    title.textContent = '🔴 Lista Vermelha - Alimentos Proibidos';
    card.appendChild(title);
    const subtitle = DOM.create('p');
    subtitle.style.marginBottom = '16px';
    subtitle.textContent = 'Adicione alimentos que você NÃO quer no seu cardápio. A IA irá classificar e sugerir substituições.';
    card.appendChild(subtitle);

    const addRow = DOM.create('div'); addRow.style.display = 'flex'; addRow.style.gap = '8px'; addRow.style.marginBottom = '12px';
    // OLD: input.style.border = `1.5px solid ${Colors.border}` — substituído por var(--color-border) (tema-aware).
    // OLD: const input = DOM.create('input'); input.type = 'text'; ...; input.style.border = `1.5px solid ${Colors.border}`;
    const input = DOM.create('input');
    input.type = 'text';
    input.placeholder = 'Adicionar alimento proibido (ex: Refrigerante)';
    input.style.flex = '1';
    input.style.padding = '10px';
    input.style.borderRadius = '8px';
    input.style.border = '1.5px solid var(--color-border)';
    const addBtn = UIComponents.primaryButton('Adicionar'); addBtn.addEventListener('click', () => { const val = input.value.trim(); if (!val) return; this.formData.form4.customFoods = this.formData.form4.customFoods || []; this.formData.form4.customFoods.push({ name: val, status: 'pending' }); input.value = ''; this.saveTempData(); this.element.innerHTML = ''; this.element.appendChild(this.render()); });
    addRow.appendChild(input); addRow.appendChild(addBtn); card.appendChild(addRow);

    const list = DOM.create('div'); list.style.display = 'grid'; list.style.gap = '8px'; (this.formData.form4.customFoods || []).forEach((item, idx) => {
      // OLD: row.style.border = `1px solid ${Colors.border}` — substituído por var(--color-border).
      // OLD: const row = DOM.create('div'); row.style.display = 'flex'; ...; row.style.border = `1px solid ${Colors.border}`; ...
      const row = DOM.create('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'stretch';
      row.style.padding = '8px';
      row.style.border = '1px solid var(--color-border)';
      row.style.borderRadius = '8px';
      const top = DOM.create('div'); top.style.display = 'flex'; top.style.justifyContent = 'space-between'; top.style.alignItems = 'center';
      // OLD: name.style.color = Colors.text — substituído por var(--color-text).
      // OLD: const name = DOM.create('div'); name.textContent = ...; name.style.color = Colors.text;
      const name = DOM.create('div');
      name.textContent = item.name + (item.status === 'pending' ? ' (pendente - IA decidirá cor)' : ` (${item.status})`);
      name.style.color = 'var(--color-text)';
      const actions = DOM.create('div'); actions.style.display = 'flex'; actions.style.gap = '8px'; const removeBtn = UIComponents.secondaryButton('Remover'); removeBtn.addEventListener('click', () => { this.formData.form4.customFoods.splice(idx, 1); this.saveTempData(); this.element.innerHTML = ''; this.element.appendChild(this.render()); });
      top.appendChild(name); actions.appendChild(removeBtn); top.appendChild(actions);
      row.appendChild(top);

      // substitutions / explanation area
      if (item.substitutions || item.explanation) {
        // OLD: info.style.color = Colors.muted — substituído por var(--color-muted).
        // OLD: const info = DOM.create('div'); info.style.marginTop = '8px'; info.style.fontSize = '13px'; info.style.color = Colors.muted; ...
        const info = DOM.create('div');
        info.style.marginTop = '8px';
        info.style.fontSize = '13px';
        info.style.color = 'var(--color-muted)';
        if (item.substitutions && item.substitutions.length) { const subs = DOM.create('div'); subs.style.marginBottom = '6px'; subs.textContent = 'Sugestões: ' + item.substitutions.map(s => s.name).join(', '); info.appendChild(subs); }
        if (item.explanation) { const expl = DOM.create('div'); expl.textContent = item.explanation; info.appendChild(expl); }
        row.appendChild(info);
      }

      list.appendChild(row);
    });

    card.appendChild(list);

    // Enviar para IA button
    const actionsRow = DOM.create('div'); actionsRow.style.display = 'flex'; actionsRow.style.justifyContent = 'flex-end'; actionsRow.style.marginTop = '12px';
    const sendBtn = UIComponents.primaryButton('Enviar para IA');
    sendBtn.addEventListener('click', async () => { await this.classifyRedListItems(); });
    // disable if nothing to send
    if (!(this.formData.form4.customFoods || []).length) sendBtn.disabled = true;
    actionsRow.appendChild(sendBtn); card.appendChild(actionsRow);
    container.appendChild(card);
  }

  async classifyRedListItems() {
    const foods = (this.formData.form4.customFoods || []).map(f => ({ name: f.name }));
    if (!foods.length) return;
    try {
      const resp = await fetch(this.aiEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: this.userId, foods })
      });
      if (!resp.ok) throw new Error('IA endpoint returned ' + resp.status);
      const data = await resp.json();
      // expected: [{ name, color, substitutions: [{name, reason}], explanation }]
      data.forEach(result => {
        const idx = this.formData.form4.customFoods.findIndex(f => f.name.toLowerCase() === result.name.toLowerCase());
        if (idx >= 0) {
          this.formData.form4.customFoods[idx].status = result.color || 'unknown';
          if (result.substitutions) this.formData.form4.customFoods[idx].substitutions = result.substitutions;
          if (result.explanation) this.formData.form4.customFoods[idx].explanation = result.explanation;
        }
      });
      await this.saveTempData();
      this.element.innerHTML = ''; this.element.appendChild(this.render());
      alert('IA: classificação aplicada. Verifique as sugestões.');
    } catch (error) {
      console.error('Erro ao chamar IA:', error);
      alert('Erro ao comunicar com o serviço de IA. Tente novamente mais tarde.');
    }
  }

  addFormSection(card, title, fields) {
    // OLD: sectionTitle.style.color = Colors.text (+ fontSize/fontWeight/marginBottom inline)
    // Substituído pelo CSS .forms-content h3 (forms.css) — usa var(--color-text), font-size 16, font-weight 700, margin-bottom 16.
    // OLD: const section = DOM.create('div'); section.style.marginBottom = '24px'; const sectionTitle = DOM.create('h3'); sectionTitle.style.color = Colors.text; sectionTitle.style.fontSize = '16px'; sectionTitle.style.fontWeight = '700'; sectionTitle.style.marginBottom = '16px'; ...
    const section = DOM.create('div');
    section.style.marginBottom = '24px';
    const sectionTitle = DOM.create('h3');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);
    fields.forEach(field => {
      const fieldContainer = DOM.create('div'); fieldContainer.style.marginBottom = '16px'; const label = UIComponents.label(field.label); fieldContainer.appendChild(label);
      if (field.type === 'text' || field.type === 'date') {
        // OLD: estilos inline hard-coded (Colors.border/text + rgba dark) — quebravam no tema claro
        // Agora os estilos vêm de .forms-content input[type=...] em forms.css, via var(--color-*).
        const input = field.type === 'date' ? DOM.create('input') : UIComponents.textInput(field.placeholder || '', this.formData.form1[field.key] || '');
        if (field.type === 'date') {
          input.type = 'date';
          input.value = this.formData.form1[field.key] || '';
        }
        input.addEventListener('change', (e) => { this.formData.form1[field.key] = e.target.value; this.saveTempData(); }); fieldContainer.appendChild(input);
      } else if (field.type === 'select') {
        // OLD: estilos inline hard-coded — substituídos pelo CSS de .forms-content select (forms.css).
        const select = DOM.create('select');
        const emptyOption = DOM.create('option'); emptyOption.textContent = 'Selecione...'; emptyOption.value = ''; select.appendChild(emptyOption);
        field.options.forEach(option => { const opt = DOM.create('option'); opt.value = option; opt.textContent = option; select.appendChild(opt); });
        select.value = this.formData.form1[field.key] || '';
        select.addEventListener('change', (e) => { this.formData.form1[field.key] = e.target.value; this.saveTempData(); });
        fieldContainer.appendChild(select);
      } else if (field.type === 'textarea') {
        const textarea = UIComponents.textarea(field.placeholder || '', this.formData.form1[field.key] || ''); textarea.addEventListener('change', (e) => { this.formData.form1[field.key] = e.target.value; this.saveTempData(); }); fieldContainer.appendChild(textarea);
      } else if (field.type === 'range') {
        // OLD: valueDisplay.style.color = Colors.pink — substituído por var(--color-pink) (já é tema-agnóstico via variables.css).
        // OLD: const rangeContainer = DOM.create('div'); const rangeInput = DOM.create('input'); ...; const valueDisplay = DOM.create('span'); valueDisplay.style.marginLeft = '12px'; valueDisplay.style.color = Colors.pink; valueDisplay.style.fontWeight = '700'; ...
        const rangeContainer = DOM.create('div');
        const rangeInput = DOM.create('input');
        rangeInput.type = 'range';
        rangeInput.min = field.min || 1;
        rangeInput.max = field.max || 5;
        rangeInput.value = this.formData.form1[field.key] || field.min || 1;
        rangeInput.style.width = '100%';
        rangeInput.style.cursor = 'pointer';
        const valueDisplay = DOM.create('span');
        valueDisplay.style.marginLeft = '12px';
        valueDisplay.style.color = 'var(--color-pink)';
        valueDisplay.style.fontWeight = '700';
        valueDisplay.textContent = rangeInput.value;
        rangeInput.addEventListener('input', (e) => { this.formData.form1[field.key] = e.target.value; valueDisplay.textContent = e.target.value; this.saveTempData(); });
        rangeContainer.appendChild(rangeInput);
        rangeContainer.appendChild(valueDisplay);
        fieldContainer.appendChild(rangeContainer);
      } else if (field.type === 'checkbox-group') {
        const checkboxContainer = DOM.create('div'); checkboxContainer.style.display = 'grid'; checkboxContainer.style.gridTemplateColumns = '1fr 1fr'; checkboxContainer.style.gap = '12px'; field.options.forEach(option => { const label = DOM.create('label'); label.style.display = 'flex'; label.style.alignItems = 'center'; label.style.gap = '8px'; label.style.cursor = 'pointer'; const checkbox = DOM.create('input'); checkbox.type = 'checkbox'; checkbox.value = option; const key = `${field.key}-${option}`; checkbox.checked = this.formData.form1[key] || false; checkbox.addEventListener('change', (e) => { this.formData.form1[key] = e.target.checked; this.saveTempData(); }); label.appendChild(checkbox); const span = DOM.create('span'); span.textContent = option; label.appendChild(span); checkboxContainer.appendChild(label); }); fieldContainer.appendChild(checkboxContainer);
      }
      section.appendChild(fieldContainer);
    });
    card.appendChild(section);
  }

  createNavigationButtons() {
    // OLD: border-top inline com Colors.border + padding/display/gap inline — substituído pelo CSS .forms-nav (forms.css).
    const navContainer = DOM.create('div', 'forms-nav');
    if (this.currentFormStep > 0) { const backBtn = UIComponents.secondaryButton('← Voltar'); backBtn.style.flex = '1'; backBtn.addEventListener('click', () => this.previousStep()); navContainer.appendChild(backBtn); }
    const isLast = this.currentFormStep === 4; const nextText = isLast ? '✨ Finalizar' : 'Próximo →'; const nextBtn = UIComponents.primaryButton(nextText); nextBtn.style.flex = this.currentFormStep > 0 ? '2' : '1'; nextBtn.addEventListener('click', () => { if (isLast) { this.submitAllForms(); } else { this.nextStep(); } }); navContainer.appendChild(nextBtn);
    return navContainer;
  }

  nextStep() { if (this.currentFormStep < 4) { this.currentFormStep++; this.saveTempData(); this.element.innerHTML = ''; this.element.appendChild(this.render()); } }
  previousStep() { if (this.currentFormStep > 0) { this.currentFormStep--; this.saveTempData(); this.element.innerHTML = ''; this.element.appendChild(this.render()); } }

  async handleFileUpload(file) { this.formData.examUpload.file = file; this.formData.examUpload.uploadedAt = new Date().toISOString(); this.saveTempData(); this.element.innerHTML = ''; this.element.appendChild(this.render()); }

  async saveTempData() {
    try { await firestoreService.saveFormProgress(this.userId, { ...this.formData, currentStep: this.currentFormStep, lastUpdated: new Date().toISOString() }); } catch (error) { console.error('Error saving form progress:', error); }
  }

  async submitAllForms() {
    try { await firestoreService.submitFormsComplete(this.userId, this.formData); alert('✅ Formulários enviados com sucesso!\n\nSua inscrição foi concluída. Em breve você receberá contato da nossa equipe.'); this.params.onNavigate(SCREENS.DASHBOARD); } catch (error) { console.error('Error submitting forms:', error); alert('Erro ao enviar formulários. Tente novamente.'); }
  }
}
