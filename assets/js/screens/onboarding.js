// Onboarding Screen
import { DOM } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { State, Session } from '../utils/helpers.js';
import { authService } from '../services/auth.js';
import { firestoreService } from '../services/firestore.js';
import {
  ONBOARDING_STEPS,
  DIAGNOSTIC_OPTIONS,
  GENDER_OPTIONS,
  ACTIVITY_LEVELS
} from '../config/constants.js';
import { notificationService } from '../modules/notifications.js';

export class OnboardingScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.currentStep = 0;
    this.formData = {
      name: '',
      birthDate: '',
      gender: '',
      weight: '',
      height: '',
      waist: '',
      diagnostics: [],
      otherConditions: '',
      medications: '',
      glucose: '',
      hba1c: '',
      sleep: 3,
      stress: 2,
      activity: ''
    };
  }

  render() {
    const screen = DOM.create('div', 'onboarding-container');
    const content = DOM.create('div', 'onboarding-content');
    
    // Header
    const header = DOM.create('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '28px';
    
    const logo = this.createLogoSmall();
    const stepLabel = DOM.create('span');
    stepLabel.style.color = Colors.muted;
    stepLabel.style.fontSize = '14px';
    stepLabel.textContent = `Etapa ${this.currentStep + 1} de ${ONBOARDING_STEPS.length}`;
    
    header.appendChild(logo);
    header.appendChild(stepLabel);
    content.appendChild(header);
    
    // Card
    const card = UIComponents.card();
    
    // Progress Steps
    const progressSteps = this.createProgressSteps();
    card.appendChild(progressSteps);
    
    // Step Content
    const stepContent = this.createStepContent();
    stepContent.style.minHeight = '380px';
    stepContent.style.marginBottom = '28px';
    card.appendChild(stepContent);
    
    // Navigation Buttons
    const navButtons = DOM.create('div');
    navButtons.style.display = 'flex';
    navButtons.style.gap = '12px';
    
    if (this.currentStep > 0) {
      const backBtn = UIComponents.secondaryButton('← Voltar');
      backBtn.style.flex = '1';
      backBtn.addEventListener('click', () => this.previousStep());
      navButtons.appendChild(backBtn);
    }
    
    const nextText = this.currentStep < ONBOARDING_STEPS.length - 1 ? 'Próximo →' : '✨ Concluir';
    const nextBtn = UIComponents.primaryButton(nextText);
    nextBtn.style.flex = this.currentStep > 0 ? '2' : '1';
    nextBtn.addEventListener('click', () => this.nextStep());
    navButtons.appendChild(nextBtn);
    
    card.appendChild(navButtons);
    content.appendChild(card);
    screen.appendChild(content);
    
    this.stepContent = stepContent;
    this.nextBtn = nextBtn;
    
    return screen;
  }

  createProgressSteps() {
    const container = DOM.create('div', 'progress-steps');
    
    ONBOARDING_STEPS.forEach((step, index) => {
      const stepEl = DOM.create('div', 'step');
      if (index === this.currentStep) stepEl.classList.add('active');
      if (index < this.currentStep) stepEl.classList.add('completed');
      
      const circle = DOM.create('div', 'step-circle');
      if (index < this.currentStep) {
        circle.innerHTML = '✓';
        circle.style.display = 'flex';
        circle.style.alignItems = 'center';
        circle.style.justifyContent = 'center';
      } else {
        circle.textContent = index + 1;
      }
      
      const label = DOM.create('span', 'step-label');
      label.textContent = step;
      
      stepEl.appendChild(circle);
      stepEl.appendChild(label);
      container.appendChild(stepEl);
      
      if (index < ONBOARDING_STEPS.length - 1) {
        const line = DOM.create('div', 'step-line');
        if (index < this.currentStep) line.style.background = Colors.pink;
        container.appendChild(line);
      }
    });
    
    return container;
  }

  createStepContent() {
    const container = DOM.create('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '20px';
    container.style.animation = 'fadeUp 0.35s ease';
    
    switch (this.currentStep) {
      case 0:
        this.createStep1(container);
        break;
      case 1:
        this.createStep2(container);
        break;
      case 2:
        this.createStep3(container);
        break;
      case 3:
        this.createStep4(container);
        break;
    }
    
    return container;
  }

  createStep1(container) {
    // Title
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '22px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '6px';
    title.textContent = '👤 Identificação';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.textContent = 'Seus dados básicos para personalizar o programa';
    
    container.appendChild(title);
    container.appendChild(subtitle);
    
    // Name
    const nameLabel = UIComponents.label('Nome completo');
    const nameInput = UIComponents.textInput('Seu nome completo', this.formData.name);
    nameInput.addEventListener('input', (e) => this.formData.name = e.target.value);
    container.appendChild(nameLabel);
    container.appendChild(nameInput);
    
    // Birth Date
    const dateLabel = UIComponents.label('Data de nascimento');
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    const fmtIso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dateInput = UIComponents.dateInput(this.formData.birthDate, {
      min: fmtIso(minDate),
      max: fmtIso(maxDate),
    });
    dateInput.addEventListener('change', (e) => this.formData.birthDate = e.target.value);
    container.appendChild(dateLabel);
    container.appendChild(dateInput);
    
    // Gender
    const genderLabel = UIComponents.label('Sexo');
    const genderContainer = DOM.create('div');
    genderContainer.style.display = 'flex';
    genderContainer.style.gap = '12px';
    
    GENDER_OPTIONS.forEach(gender => {
      const btn = DOM.create('button', 'btn btn-sm');
      btn.style.flex = '1';
      btn.textContent = gender;
      btn.style.background = this.formData.gender === gender 
        ? `linear-gradient(135deg, ${Colors.pink}, #c0027c)`
        : 'rgba(255,255,255,0.05)';
      btn.style.color = this.formData.gender === gender ? '#fff' : Colors.muted;
      btn.style.border = `1.5px solid ${this.formData.gender === gender ? Colors.pink : Colors.border}`;
      btn.style.boxShadow = this.formData.gender === gender ? `0 4px 20px ${Colors.pinkGlow}` : 'none';
      
      btn.addEventListener('click', () => {
        this.formData.gender = gender;
        this.mount();
      });
      
      genderContainer.appendChild(btn);
    });
    
    container.appendChild(genderLabel);
    container.appendChild(genderContainer);
    
    // Physical Measurements
    const measurementsGrid = DOM.create('div');
    measurementsGrid.style.display = 'grid';
    measurementsGrid.style.gridTemplateColumns = '1fr 1fr 1fr';
    measurementsGrid.style.gap = '12px';
    
    [
      { label: 'Peso (kg)', key: 'weight', placeholder: 'Ex: 75' },
      { label: 'Altura (cm)', key: 'height', placeholder: 'Ex: 165' },
      { label: 'Cintura (cm)', key: 'waist', placeholder: 'Ex: 90' },
    ].forEach(field => {
      const fieldContainer = DOM.create('div');
      const label = UIComponents.label(field.label);
      const input = UIComponents.numberInput(field.placeholder, this.formData[field.key]);
      input.addEventListener('input', (e) => this.formData[field.key] = e.target.value);
      fieldContainer.appendChild(label);
      fieldContainer.appendChild(input);
      measurementsGrid.appendChild(fieldContainer);
    });
    
    container.appendChild(measurementsGrid);
  }

  createStep2(container) {
    // Title
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '22px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '6px';
    title.textContent = '🩺 Histórico Clínico';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.textContent = 'Marque os diagnósticos confirmados por médico';
    
    container.appendChild(title);
    container.appendChild(subtitle);
    
    // Diagnostics Grid
    const diagGrid = DOM.create('div');
    diagGrid.style.display = 'grid';
    diagGrid.style.gridTemplateColumns = '1fr 1fr';
    diagGrid.style.gap = '8px';
    
    DIAGNOSTIC_OPTIONS.forEach(diagnostic => {
      const btn = DOM.create('button');
      btn.style.padding = '13px 14px';
      btn.style.borderRadius = '12px';
      btn.style.cursor = 'pointer';
      btn.style.textAlign = 'left';
      btn.style.background = this.formData.diagnostics.includes(diagnostic) 
        ? 'rgba(240,5,154,0.14)'
        : 'rgba(255,255,255,0.04)';
      btn.style.border = `1.5px solid ${this.formData.diagnostics.includes(diagnostic) ? Colors.pink : Colors.border}`;
      btn.style.color = this.formData.diagnostics.includes(diagnostic) ? Colors.pinkLight : Colors.muted;
      btn.style.fontSize = '14px';
      btn.style.fontWeight = '600';
      btn.textContent = (this.formData.diagnostics.includes(diagnostic) ? '✓ ' : '') + diagnostic;
      
      btn.addEventListener('click', () => {
        if (this.formData.diagnostics.includes(diagnostic)) {
          this.formData.diagnostics = this.formData.diagnostics.filter(d => d !== diagnostic);
        } else {
          this.formData.diagnostics.push(diagnostic);
        }
        this.mount();
      });
      
      diagGrid.appendChild(btn);
    });
    
    container.appendChild(diagGrid);
    
    // Other Conditions
    const otherLabel = UIComponents.label('Outras condições — escreva com suas palavras');
    const otherInput = UIComponents.textarea('Ex: Tenho refluxo, sofri cirurgia em 2022...', this.formData.otherConditions);
    otherInput.addEventListener('input', (e) => this.formData.otherConditions = e.target.value);
    container.appendChild(otherLabel);
    container.appendChild(otherInput);
    
    // Medications
    const medLabel = UIComponents.label('Medicamentos e suplementos contínuos');
    const medInput = UIComponents.textarea('Ex: Metformina 850mg — 2x ao dia', this.formData.medications);
    medInput.addEventListener('input', (e) => this.formData.medications = e.target.value);
    container.appendChild(medLabel);
    container.appendChild(medInput);
  }

  createStep3(container) {
    // Title
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '22px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '6px';
    title.textContent = '📊 Controle Glicêmico';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.textContent = 'Seus valores habituais — preencha o que souber';
    
    container.appendChild(title);
    container.appendChild(subtitle);
    
    // Glucose and HbA1c
    [
      { label: 'Glicemia em Jejum', key: 'glucose', unit: 'mg/dL', placeholder: '000' },
      { label: 'Hemoglobina Glicada (HbA1c)', key: 'hba1c', unit: '%', placeholder: '0.0' },
    ].forEach(field => {
      const card = UIComponents.card();
      card.style.borderRadius = '16px';
      card.style.padding = '22px';
      
      const header = DOM.create('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.gap = '12px';
      header.style.marginBottom = '16px';
      
      const icon = DOM.create('div');
      icon.style.width = '40px';
      icon.style.height = '40px';
      icon.style.borderRadius = '12px';
      icon.style.background = 'rgba(240,5,154,0.12)';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      icon.style.justifyContent = 'center';
      icon.textContent = field.key === 'glucose' ? '💧' : '📊';
      
      const label = DOM.create('div');
      label.style.color = Colors.text;
      label.style.fontWeight = '700';
      label.style.fontSize = '16px';
      label.textContent = field.label;
      
      header.appendChild(icon);
      header.appendChild(label);
      card.appendChild(header);
      
      const inputWrapper = DOM.create('div');
      inputWrapper.style.display = 'flex';
      inputWrapper.style.alignItems = 'center';
      inputWrapper.style.gap = '12px';
      
      const input = UIComponents.numberInput(field.placeholder, this.formData[field.key]);
      input.style.fontSize = '30px';
      input.style.fontWeight = '800';
      input.style.color = Colors.pink;
      input.style.textAlign = 'center';
      input.style.padding = '12px 16px';
      input.addEventListener('input', (e) => this.formData[field.key] = e.target.value);
      
      const unitLabel = DOM.create('span');
      unitLabel.style.color = Colors.muted;
      unitLabel.style.fontSize = '16px';
      unitLabel.style.fontWeight = '600';
      unitLabel.style.whiteSpace = 'nowrap';
      unitLabel.textContent = field.unit;
      
      inputWrapper.appendChild(input);
      inputWrapper.appendChild(unitLabel);
      card.appendChild(inputWrapper);
      
      container.appendChild(card);
    });
  }

  _createSliderCard(slider) {
    const card = UIComponents.card();
    card.style.borderRadius = '16px';
    card.style.padding = '22px';

    const header = DOM.create('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '12px';
    header.style.marginBottom = '16px';

    const icon = DOM.create('div');
    icon.style.width = '40px';
    icon.style.height = '40px';
    icon.style.borderRadius = '12px';
    icon.style.background = 'rgba(240,5,154,0.12)';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.justifyContent = 'center';
    icon.style.fontSize = '20px';
    icon.textContent = slider.icon;

    const label = DOM.create('div');
    label.style.color = Colors.text;
    label.style.fontWeight = '700';
    label.style.fontSize = '16px';
    label.style.flex = '1';
    label.textContent = slider.label;

    const value = DOM.create('div');
    value.style.background = `linear-gradient(135deg, ${Colors.pink}, #c0027c)`;
    value.style.borderRadius = '10px';
    value.style.padding = '6px 16px';
    value.style.color = '#fff';
    value.style.fontWeight = '800';
    value.style.fontSize = '20px';
    value.textContent = this.formData[slider.key];

    header.appendChild(icon);
    header.appendChild(label);
    header.appendChild(value);
    card.appendChild(header);

    const input = DOM.create('input');
    input.type = 'range';
    input.min = '1';
    input.max = '5';
    input.value = this.formData[slider.key];
    input.style.width = '100%';
    input.addEventListener('input', (e) => {
      this.formData[slider.key] = parseInt(e.target.value);
      value.textContent = this.formData[slider.key];
    });
    card.appendChild(input);

    const labels = DOM.create('div');
    labels.style.display = 'flex';
    labels.style.justifyContent = 'space-between';
    labels.style.marginTop = '6px';
    slider.options.forEach(opt => {
      const labelEl = DOM.create('span');
      labelEl.style.color = Colors.muted;
      labelEl.style.fontSize = '12px';
      labelEl.textContent = opt;
      labels.appendChild(labelEl);
    });
    card.appendChild(labels);

    return card;
  }

  _createActivitySection() {
    const actLabel = UIComponents.label('Atividade Física Atual');
    const actContainer = DOM.create('div');
    actContainer.style.display = 'flex';
    actContainer.style.flexDirection = 'column';
    actContainer.style.gap = '8px';

    ACTIVITY_LEVELS.forEach(activity => {
      const btn = DOM.create('button');
      btn.style.padding = '14px 18px';
      btn.style.borderRadius = '12px';
      btn.style.cursor = 'pointer';
      btn.style.textAlign = 'left';
      btn.style.background = this.formData.activity === activity
        ? 'rgba(240,5,154,0.12)'
        : 'rgba(255,255,255,0.04)';
      btn.style.border = `1.5px solid ${this.formData.activity === activity ? Colors.pink : Colors.border}`;
      btn.style.color = this.formData.activity === activity ? Colors.pinkLight : Colors.muted;
      btn.style.fontSize = '15px';
      btn.style.fontWeight = '600';
      btn.textContent = activity;

      btn.addEventListener('click', () => {
        this.formData.activity = activity;
        this.mount();
      });

      actContainer.appendChild(btn);
    });

    const wrap = DOM.create('div');
    wrap.appendChild(actLabel);
    wrap.appendChild(actContainer);
    return wrap;
  }

  createStep4(container) {
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '22px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '6px';
    title.textContent = '🌙 Estilo de Vida';

    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.textContent = 'Como você se sente no dia a dia';

    container.appendChild(title);
    container.appendChild(subtitle);

    const sliders = [
      {
        label: 'Qualidade do Sono',
        key: 'sleep',
        icon: '🌙',
        options: ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente']
      },
      {
        label: 'Nível de Estresse',
        key: 'stress',
        icon: '⚡',
        options: ['Muito baixo', 'Baixo', 'Moderado', 'Alto', 'Extremo']
      },
    ];
    sliders.forEach(slider => container.appendChild(this._createSliderCard(slider)));

    container.appendChild(this._createActivitySection());
  }

  createLogoSmall() {
    const container = DOM.create('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '12px';
    
    const circle = DOM.create('div');
    circle.style.width = '30px';
    circle.style.height = '30px';
    circle.style.borderRadius = '50%';
    circle.style.background = 'radial-gradient(circle at 35% 35%, #1a1a2a, #08080d)';
    circle.style.border = `2px solid ${Colors.pink}`;
    circle.style.display = 'flex';
    circle.style.alignItems = 'center';
    circle.style.justifyContent = 'center';
    circle.style.flexShrink = '0';
    circle.style.boxShadow = `0 0 15px ${Colors.pinkGlow}`;
    
    const text = DOM.create('span');
    text.style.color = Colors.pink;
    text.style.fontWeight = '900';
    text.style.fontSize = '10px';
    text.textContent = 'GMP';
    
    circle.appendChild(text);
    container.appendChild(circle);
    
    const info = DOM.create('div');
    const appName = DOM.create('div');
    appName.style.color = Colors.text;
    appName.style.fontWeight = '800';
    appName.style.fontSize = '13px';
    appName.style.lineHeight = '1.1';
    appName.textContent = 'Guia Metabólico';
    
    const appDesc = DOM.create('div');
    appDesc.style.color = Colors.pink;
    appDesc.style.fontWeight = '600';
    appDesc.style.fontSize = '11px';
    appDesc.textContent = 'Personalizado';
    
    info.appendChild(appName);
    info.appendChild(appDesc);
    container.appendChild(info);
    
    return container;
  }

  async nextStep() {
    if (!this._validateCurrentStep()) return;

    if (this.currentStep < ONBOARDING_STEPS.length - 1) {
      // Move to next step
      this.currentStep++;
      this.element.querySelector('.onboarding-content').innerHTML = '';
      this.mount();
    } else {
      // Onboarding completed - save to Firestore
      await this.completeOnboarding();
    }
  }

  _isFieldEmpty(value) {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'string' && !value.trim()) return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }

  _clearFieldErrors() {
    if (!this.element) return;
    this.element.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
    this.element.querySelectorAll('.field-error-message').forEach(el => el.remove());
  }

  _highlightFieldError(fieldKey) {
    const input = this.element?.querySelector(
      `[data-field="${fieldKey}"], [name="${fieldKey}"], #${fieldKey}`
    );
    if (!input) return;
    input.classList.add('field-error');
    const msg = document.createElement('span');
    msg.className = 'field-error-message';
    msg.textContent = 'Campo obrigatório';
    input.parentNode?.appendChild(msg);
  }

  _validateCurrentStep() {
    this._clearFieldErrors();

    // Required fields per step index:
    //   step 0 (createStep1): Identificação — name, birthDate, gender, weight, height
    //   step 1 (createStep2): Histórico Clínico — diagnostics (array >= 1)
    //   step 2 (createStep3): Controle Glicêmico — optional
    //   step 3 (createStep4): Estilo de Vida — optional
    const fieldLabels = {
      name: 'Nome completo',
      birthDate: 'Data de nascimento',
      gender: 'Sexo',
      weight: 'Peso',
      height: 'Altura',
      diagnostics: 'Diagnóstico',
    };

    const requiredByStep = [
      ['name', 'birthDate', 'gender', 'weight', 'height'], // step 0
      ['diagnostics'],                                       // step 1
      [],                                                    // step 2 — optional
      [],                                                    // step 3 — optional
    ];

    const required = requiredByStep[this.currentStep] || [];
    const errors = [];

    for (const fieldKey of required) {
      if (this._isFieldEmpty(this.formData?.[fieldKey])) {
        errors.push(fieldKey);
        this._highlightFieldError(fieldKey);
      }
    }

    if (errors.length > 0) {
      const labels = errors.map(f => fieldLabels[f] || f).join(', ');
      notificationService.toast(`Preencha: ${labels}`, { type: 'warning' });
      return false;
    }

    return true;
  }

  async completeOnboarding() {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        this.showError('Erro: Usuário não autenticado');
        return;
      }

      // Show loading state
      const nextBtn = this.nextBtn;
      nextBtn.disabled = true;
      nextBtn.innerHTML = '<span class="spinner" style="margin-right: 8px;"></span>Salvando dados…';

      // Save onboarding data to Firestore
      const success = await firestoreService.saveOnboardingData(user.uid, {
        ...this.formData,
        completedAt: new Date(),
      });

      if (!success) {
        throw new Error('Erro ao salvar dados');
      }

      // Update user profile with onboarding status
      await firestoreService.saveUserProfile(user.uid, {
        onboardingCompleted: true,
        lastUpdated: new Date(),
      });

      // Update local session
      Session.set('onboardingCompleted', true);
      Session.set('onboardingData', this.formData);
      State.set('onboardingData', this.formData);

      // Navigate to next screen
      setTimeout(() => {
        this.params.onNavigate('cardapio', this.formData);
      }, 300);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      this.showError('Erro ao salvar dados. Tente novamente.');
      
      // Reset button
      const nextBtn = this.nextBtn;
      nextBtn.disabled = false;
      nextBtn.innerHTML = '✨ Concluir';
    }
  }

  showError(message) {
    // Show error message
    const errorDiv = DOM.create('div');
    errorDiv.style.cssText = `
      background: #ff4444;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      text-align: center;
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Remove after 4 seconds
    setTimeout(() => {
      try {
        errorDiv.remove();
      } catch (e) {
        // Element already removed
      }
    }, 4000);
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.element.querySelector('.onboarding-content').innerHTML = '';
      this.mount();
    }
  }
}

export default OnboardingScreen;
