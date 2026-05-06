// Forms Screen - Multi-step questionnaire system
import { DOM } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { State, Session } from '../utils/helpers.js';
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
    const header = DOM.create('div', 'forms-header');
    header.style.padding = '24px';
    header.style.borderBottom = `1px solid ${Colors.border}`;
    header.style.marginBottom = '24px';

    const title = DOM.create('h1');
    title.style.color = Colors.text; title.style.fontSize = '28px'; title.style.fontWeight = '800'; title.style.marginBottom = '8px';

    const stepTitles = [
      '📋 Saúde e Histórico',
      '🩺 Resultado dos Exames',
      '🟢 Alimentos Liberados',
      '🟡 Alimentos com Moderação',
      '🔴 Alimentos Proibidos (Adicionar manualmente)'
    ];

    title.textContent = stepTitles[this.currentFormStep] || stepTitles[0];
    header.appendChild(title);

    const subtitle = DOM.create('p'); subtitle.style.color = Colors.muted; subtitle.style.fontSize = '14px'; subtitle.textContent = `Etapa ${this.currentFormStep + 1} de ${stepTitles.length}`;
    header.appendChild(subtitle);
    return header;
  }

  createProgressIndicator() {
    const container = DOM.create('div', 'progress-steps'); container.style.padding = '0 24px 24px 24px'; container.style.display = 'flex'; container.style.gap = '8px'; container.style.alignItems = 'center';
    for (let i = 0; i < 5; i++) {
      const step = DOM.create('div'); step.style.flex = '1'; step.style.height = '4px'; step.style.borderRadius = '2px'; step.style.background = i <= this.currentFormStep ? Colors.pink : Colors.border; step.style.transition = 'background 0.3s ease'; container.appendChild(step);
    }
    return container;
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
    const message = DOM.create('div'); message.style.background = `rgba(34,197,94,0.04)`; message.style.border = `1px solid ${Colors.pink}`; message.style.borderRadius = '12px'; message.style.padding = '16px'; message.style.marginBottom = '24px'; message.style.color = Colors.text; message.innerHTML = `<p style="margin:0;font-size:14px;line-height:1.6;"><strong>📌 Por que precisamos dos exames?</strong><br/>Os resultados dos seus exames (glicemia, HbA1c, colesterol, etc.) serão usados pela IA para personalizar o seu plano alimentar.</p>`; card.appendChild(message);

    const uploadSection = DOM.create('div'); uploadSection.style.marginBottom = '24px'; const uploadLabel = DOM.create('h3'); uploadLabel.style.color = Colors.text; uploadLabel.style.fontSize = '16px'; uploadLabel.style.fontWeight = '700'; uploadLabel.style.marginBottom = '12px'; uploadLabel.textContent = '📎 Anexe o resultado dos seus exames'; uploadSection.appendChild(uploadLabel);
    const uploadArea = DOM.create('div'); uploadArea.style.border = `2px dashed ${Colors.border}`; uploadArea.style.borderRadius = '12px'; uploadArea.style.padding = '32px'; uploadArea.style.textAlign = 'center'; uploadArea.style.cursor = 'pointer'; uploadArea.style.transition = 'all 0.3s ease'; const uploadInput = DOM.create('input'); uploadInput.type = 'file'; uploadInput.accept = 'image/*,.pdf'; uploadInput.style.display = 'none'; const uploadText = DOM.create('p'); uploadText.style.color = Colors.muted; uploadText.style.fontSize = '14px'; uploadText.style.margin = '0'; uploadText.textContent = '🖼️ Clique ou arraste o arquivo aqui (PDF ou imagem)'; uploadArea.appendChild(uploadText); uploadArea.appendChild(uploadInput);

    uploadArea.addEventListener('click', () => uploadInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.background = Colors.border; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.background = 'transparent'; });
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.style.background='transparent'; if (e.dataTransfer.files.length>0){ uploadInput.files = e.dataTransfer.files; this.handleFileUpload(uploadInput.files[0]); } });
    uploadInput.addEventListener('change', (e) => { if (e.target.files.length>0) this.handleFileUpload(e.target.files[0]); });

    uploadSection.appendChild(uploadArea); card.appendChild(uploadSection);
    if (this.formData.examUpload && this.formData.examUpload.uploadedAt) { const statusMsg = DOM.create('div'); statusMsg.style.background = `rgba(34,197,94,0.1)`; statusMsg.style.border = `1px solid rgb(34,197,94)`; statusMsg.style.borderRadius='12px'; statusMsg.style.padding='12px'; statusMsg.style.color='rgb(34,197,94)'; statusMsg.style.fontSize='14px'; statusMsg.textContent = `✅ Arquivo anexado em ${new Date(this.formData.examUpload.uploadedAt).toLocaleDateString('pt-BR')}`; card.appendChild(statusMsg); }
    container.appendChild(card);
  }

  renderForm2(container) {
    const card = UIComponents.card(); card.style.padding = '28px'; const title = DOM.create('h3'); title.style.color = Colors.text; title.style.fontSize = '18px'; title.style.fontWeight = '700'; title.style.marginBottom = '16px'; title.textContent = '🟢 Lista Verde - Alimentos Liberados'; card.appendChild(title);
    const subtitle = DOM.create('p'); subtitle.style.color = Colors.muted; subtitle.style.fontSize = '14px'; subtitle.style.marginBottom = '20px'; subtitle.textContent = 'Marque os alimentos que você GOSTA e come com frequência. Eles terão prioridade no seu cardápio.'; card.appendChild(subtitle);

    const categories = [ { name: '🥩 Carnes e Proteínas', foods: ['Frango','Peixe','Carne bovina','Ovos','Camarão','Atum'] }, { name: '🥬 Vegetais Folhosos', foods: ['Alface','Espinafre','Rúcula','Couve','Agrião','Almeirão'] }, { name: '🥦 Outros Vegetais', foods: ['Brócolis','Couve-flor','Abobrinha','Pimentão','Tomate','Cenoura'] }, { name: '🫐 Frutas', foods: ['Abacate','Morango','Mirtilo','Maracujá','Limão','Acerola'] }, { name: '🥜 Nozes e Sementes', foods: ['Amêndoa','Castanha do Brasil','Noz','Semente de girassol','Pasta de amendoim'] }, { name: '🧈 Gorduras', foods: ['Azeite de oliva','Manteiga','Óleo de coco','Banha de porco'] } ];

    categories.forEach(category => {
      const categoryDiv = DOM.create('div'); categoryDiv.style.marginBottom = '24px'; const categoryTitle = DOM.create('h4'); categoryTitle.style.color = Colors.text; categoryTitle.style.fontSize = '14px'; categoryTitle.style.fontWeight = '700'; categoryTitle.style.marginBottom = '12px'; categoryTitle.textContent = category.name; categoryDiv.appendChild(categoryTitle);
      const foodsGrid = DOM.create('div'); foodsGrid.style.display = 'grid'; foodsGrid.style.gridTemplateColumns = '1fr 1fr'; foodsGrid.style.gap = '12px';
      category.foods.forEach(food => { const label = DOM.create('label'); label.style.display = 'flex'; label.style.alignItems = 'center'; label.style.gap = '8px'; label.style.cursor = 'pointer'; label.style.padding = '8px'; label.style.borderRadius = '8px'; label.style.transition = 'background 0.2s'; const checkbox = DOM.create('input'); checkbox.type = 'checkbox'; checkbox.value = food; const key = `${category.name}-${food}`; checkbox.checked = this.formData.form2[key] || false; checkbox.addEventListener('change', (e) => { this.formData.form2[key] = e.target.checked; this.saveTempData(); label.style.background = e.target.checked ? `rgba(${parseInt(Colors.pink.slice(1,3),16)}, ${parseInt(Colors.pink.slice(3,5),16)}, ${parseInt(Colors.pink.slice(5,7),16)}, 0.1)` : 'transparent'; }); label.appendChild(checkbox); const span = DOM.create('span'); span.textContent = food; label.appendChild(span); label.style.background = checkbox.checked ? `rgba(${parseInt(Colors.pink.slice(1,3),16)}, ${parseInt(Colors.pink.slice(3,5),16)}, ${parseInt(Colors.pink.slice(5,7),16)}, 0.1)` : 'transparent'; foodsGrid.appendChild(label); });
      categoryDiv.appendChild(foodsGrid); card.appendChild(categoryDiv);
    });
    container.appendChild(card);
  }

  renderForm3(container) {
    const card = UIComponents.card(); card.style.padding = '28px'; const title = DOM.create('h3'); title.style.color = Colors.text; title.style.fontSize = '18px'; title.style.fontWeight = '700'; title.style.marginBottom = '16px'; title.textContent = '🟡 Lista Amarela - Consumo com Moderação'; card.appendChild(title);
    const subtitle = DOM.create('p'); subtitle.style.color = Colors.muted; subtitle.style.fontSize = '14px'; subtitle.style.marginBottom = '20px'; subtitle.textContent = 'Marque os alimentos que você gostaria de incluir em PEQUENAS QUANTIDADES no cardápio.'; card.appendChild(subtitle);

    const categories = [ { name: '🧀 Laticínios', foods: ['Iogurte grego','Queijo minas frescal','Queijo muçarela','Queijo parmesão','Creme de ricota'] },{ name: '🍊 Frutas', foods: ['Laranja','Maçã','Pera','Melancia','Cereja','Kiwi','Tangerina'] },{ name: '🫘 Leguminosas', foods: ['Feijão preto','Feijão carioca','Lentilha','Grão de bico','Ervilha'] },{ name: '🌾 Cereais e Tubérculos', foods: ['Batata doce','Arroz integral','Quinoa','Batata comum','Mandioca'] } ];

    categories.forEach(category => { const categoryDiv = DOM.create('div'); categoryDiv.style.marginBottom = '24px'; const categoryTitle = DOM.create('h4'); categoryTitle.style.color = Colors.text; categoryTitle.style.fontSize = '14px'; categoryTitle.style.fontWeight = '700'; categoryTitle.style.marginBottom = '12px'; categoryTitle.textContent = category.name; categoryDiv.appendChild(categoryTitle); const foodsGrid = DOM.create('div'); foodsGrid.style.display = 'grid'; foodsGrid.style.gridTemplateColumns = '1fr 1fr'; foodsGrid.style.gap = '12px'; category.foods.forEach(food => { const label = DOM.create('label'); label.style.display = 'flex'; label.style.alignItems = 'center'; label.style.gap = '8px'; label.style.cursor = 'pointer'; label.style.padding = '8px'; label.style.borderRadius = '8px'; label.style.transition = 'background 0.2s'; const checkbox = DOM.create('input'); checkbox.type = 'checkbox'; checkbox.value = food; const key = `${category.name}-${food}`; checkbox.checked = this.formData.form3[key] || false; checkbox.addEventListener('change', (e) => { this.formData.form3[key] = e.target.checked; this.saveTempData(); label.style.background = e.target.checked ? `rgba(255, 193, 7, 0.1)` : 'transparent'; }); label.appendChild(checkbox); const span = DOM.create('span'); span.textContent = food; label.appendChild(span); label.style.background = checkbox.checked ? `rgba(255, 193, 7, 0.1)` : 'transparent'; foodsGrid.appendChild(label); }); categoryDiv.appendChild(foodsGrid); card.appendChild(categoryDiv); });
    container.appendChild(card);
  }

  renderForm4(container) {
    const card = UIComponents.card(); card.style.padding = '28px'; const title = DOM.create('h3'); title.style.color = Colors.text; title.style.fontSize = '18px'; title.style.fontWeight = '700'; title.style.marginBottom = '12px'; title.textContent = '🔴 Lista Vermelha - Alimentos Proibidos'; card.appendChild(title);
    const subtitle = DOM.create('p'); subtitle.style.color = Colors.muted; subtitle.style.fontSize = '14px'; subtitle.style.marginBottom = '16px'; subtitle.textContent = 'Adicione alimentos que você NÃO quer no seu cardápio. A IA irá classificar e sugerir substituições.'; card.appendChild(subtitle);

    const addRow = DOM.create('div'); addRow.style.display = 'flex'; addRow.style.gap = '8px'; addRow.style.marginBottom = '12px';
    const input = DOM.create('input'); input.type = 'text'; input.placeholder = 'Adicionar alimento proibido (ex: Refrigerante)'; input.style.flex = '1'; input.style.padding = '10px'; input.style.borderRadius = '8px'; input.style.border = `1.5px solid ${Colors.border}`;
    const addBtn = UIComponents.primaryButton('Adicionar'); addBtn.addEventListener('click', () => { const val = input.value.trim(); if (!val) return; this.formData.form4.customFoods = this.formData.form4.customFoods || []; this.formData.form4.customFoods.push({ name: val, status: 'pending' }); input.value = ''; this.saveTempData(); this.element.innerHTML = ''; this.element.appendChild(this.render()); });
    addRow.appendChild(input); addRow.appendChild(addBtn); card.appendChild(addRow);

    const list = DOM.create('div'); list.style.display = 'grid'; list.style.gap = '8px'; (this.formData.form4.customFoods || []).forEach((item, idx) => {
      const row = DOM.create('div'); row.style.display = 'flex'; row.style.flexDirection = 'column'; row.style.justifyContent = 'space-between'; row.style.alignItems = 'stretch'; row.style.padding = '8px'; row.style.border = `1px solid ${Colors.border}`; row.style.borderRadius = '8px';
      const top = DOM.create('div'); top.style.display = 'flex'; top.style.justifyContent = 'space-between'; top.style.alignItems = 'center';
      const name = DOM.create('div'); name.textContent = item.name + (item.status === 'pending' ? ' (pendente - IA decidirá cor)' : ` (${item.status})`); name.style.color = Colors.text;
      const actions = DOM.create('div'); actions.style.display = 'flex'; actions.style.gap = '8px'; const removeBtn = UIComponents.secondaryButton('Remover'); removeBtn.addEventListener('click', () => { this.formData.form4.customFoods.splice(idx, 1); this.saveTempData(); this.element.innerHTML = ''; this.element.appendChild(this.render()); });
      top.appendChild(name); actions.appendChild(removeBtn); top.appendChild(actions);
      row.appendChild(top);

      // substitutions / explanation area
      if (item.substitutions || item.explanation) {
        const info = DOM.create('div'); info.style.marginTop = '8px'; info.style.fontSize = '13px'; info.style.color = Colors.muted; if (item.substitutions && item.substitutions.length) { const subs = DOM.create('div'); subs.style.marginBottom = '6px'; subs.textContent = 'Sugestões: ' + item.substitutions.map(s => s.name).join(', '); info.appendChild(subs); }
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
    const section = DOM.create('div'); section.style.marginBottom = '24px'; const sectionTitle = DOM.create('h3'); sectionTitle.style.color = Colors.text; sectionTitle.style.fontSize = '16px'; sectionTitle.style.fontWeight = '700'; sectionTitle.style.marginBottom = '16px'; sectionTitle.textContent = title; section.appendChild(sectionTitle);
    fields.forEach(field => {
      const fieldContainer = DOM.create('div'); fieldContainer.style.marginBottom = '16px'; const label = UIComponents.label(field.label); fieldContainer.appendChild(label);
      if (field.type === 'text' || field.type === 'date') {
        const input = field.type === 'date' ? DOM.create('input') : UIComponents.textInput(field.placeholder || '', this.formData.form1[field.key] || ''); if (field.type === 'date') { input.type = 'date'; input.value = this.formData.form1[field.key] || ''; input.style.padding = '12px 14px'; input.style.borderRadius = '12px'; input.style.border = `1.5px solid ${Colors.border}`; input.style.background = 'rgba(255,255,255,0.05)'; input.style.color = Colors.text; input.style.width = '100%'; input.style.fontSize = '14px'; }
        input.addEventListener('change', (e) => { this.formData.form1[field.key] = e.target.value; this.saveTempData(); }); fieldContainer.appendChild(input);
      } else if (field.type === 'select') {
        const select = DOM.create('select'); select.style.padding = '12px 14px'; select.style.borderRadius = '12px'; select.style.border = `1.5px solid ${Colors.border}`; select.style.background = 'rgba(255,255,255,0.05)'; select.style.color = Colors.text; select.style.width = '100%'; select.style.fontSize = '14px'; select.style.cursor = 'pointer'; const emptyOption = DOM.create('option'); emptyOption.textContent = 'Selecione...'; emptyOption.value = ''; select.appendChild(emptyOption); field.options.forEach(option => { const opt = DOM.create('option'); opt.value = option; opt.textContent = option; select.appendChild(opt); }); select.value = this.formData.form1[field.key] || ''; select.addEventListener('change', (e) => { this.formData.form1[field.key] = e.target.value; this.saveTempData(); }); fieldContainer.appendChild(select);
      } else if (field.type === 'textarea') {
        const textarea = UIComponents.textarea(field.placeholder || '', this.formData.form1[field.key] || ''); textarea.addEventListener('change', (e) => { this.formData.form1[field.key] = e.target.value; this.saveTempData(); }); fieldContainer.appendChild(textarea);
      } else if (field.type === 'range') {
        const rangeContainer = DOM.create('div'); const rangeInput = DOM.create('input'); rangeInput.type = 'range'; rangeInput.min = field.min || 1; rangeInput.max = field.max || 5; rangeInput.value = this.formData.form1[field.key] || field.min || 1; rangeInput.style.width = '100%'; rangeInput.style.cursor = 'pointer'; const valueDisplay = DOM.create('span'); valueDisplay.style.marginLeft = '12px'; valueDisplay.style.color = Colors.pink; valueDisplay.style.fontWeight = '700'; valueDisplay.textContent = rangeInput.value; rangeInput.addEventListener('input', (e) => { this.formData.form1[field.key] = e.target.value; valueDisplay.textContent = e.target.value; this.saveTempData(); }); rangeContainer.appendChild(rangeInput); rangeContainer.appendChild(valueDisplay); fieldContainer.appendChild(rangeContainer);
      } else if (field.type === 'checkbox-group') {
        const checkboxContainer = DOM.create('div'); checkboxContainer.style.display = 'grid'; checkboxContainer.style.gridTemplateColumns = '1fr 1fr'; checkboxContainer.style.gap = '12px'; field.options.forEach(option => { const label = DOM.create('label'); label.style.display = 'flex'; label.style.alignItems = 'center'; label.style.gap = '8px'; label.style.cursor = 'pointer'; const checkbox = DOM.create('input'); checkbox.type = 'checkbox'; checkbox.value = option; const key = `${field.key}-${option}`; checkbox.checked = this.formData.form1[key] || false; checkbox.addEventListener('change', (e) => { this.formData.form1[key] = e.target.checked; this.saveTempData(); }); label.appendChild(checkbox); const span = DOM.create('span'); span.textContent = option; label.appendChild(span); checkboxContainer.appendChild(label); }); fieldContainer.appendChild(checkboxContainer);
      }
      section.appendChild(fieldContainer);
    });
    card.appendChild(section);
  }

  createNavigationButtons() {
    const navContainer = DOM.create('div', 'forms-nav'); navContainer.style.padding = '24px'; navContainer.style.display = 'flex'; navContainer.style.gap = '12px'; navContainer.style.borderTop = `1px solid ${Colors.border}`;
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
    try { await firestoreService.submitFormsComplete(this.userId, this.formData); alert('✅ Formulários enviados com sucesso!\n\nSua inscrição foi concluída. Em breve você receberá contato da nossa equipe.'); this.app.navigate('dashboard'); } catch (error) { console.error('Error submitting forms:', error); alert('Erro ao enviar formulários. Tente novamente.'); }
  }
}
