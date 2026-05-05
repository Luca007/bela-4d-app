// Cardápio/Menu Configuration Screen
import { DOM } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { OBJECTIVE_OPTIONS, MEAL_TIMES, RED_LIST } from '../config/constants.js';

const ALLOWED_FOODS = [
  "Filé de frango", "Salmão", "Ovos", "Brócolis", "Abobrinha", "Espinafre",
  "Tomate", "Pepino", "Abacate", "Morango", "Amêndoa", "Castanha-do-Brasil",
  "Azeite", "Manteiga", "Atum natural", "Sardinha", "Couve", "Rúcula"
];

const MODERATE_FOODS = [
  "Arroz integral", "Batata doce", "Iogurte grego", "Queijo minas", "Lentilha",
  "Feijão preto", "Banana", "Laranja", "Maçã", "Kiwi"
];

export class CardapioScreen extends BaseScreen {
  constructor(params) {
    super(params);
    // Auto-fill for testing
    this.selectedObjective = 'Controle glicêmico';
    this.selectedAllowed = ['Filé de frango', 'Salmão', 'Ovos', 'Brócolis'];
    this.selectedModerate = ['Arroz', 'Batata doce'];
    this.selectedForbidden = ['Açúcar branco', 'Refrigerante', 'Pão branco / francês'];
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
    const label = DOM.create('span');
    label.style.color = Colors.muted;
    label.style.fontSize = '14px';
    label.textContent = 'Configuração do Cardápio';
    
    header.appendChild(logo);
    header.appendChild(label);
    content.appendChild(header);
    
    // Card
    const card = UIComponents.card();
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '32px';
    
    // Section 1: Objective
    this.createObjectiveSection(card);
    
    // Section 2: Meal Times
    this.createMealTimesSection(card);
    
    // Section 3: Allowed Foods
    this.createAllowedFoodsSection(card);
    
    // Section 4: Moderate Foods
    this.createModerateFoodsSection(card);
    
    // Section 5: Forbidden Foods
    this.createForbiddenFoodsSection(card);
    
    // Complete Button
    const completeBtn = UIComponents.primaryButton('🌟 Gerar meu cardápio personalizado');
    completeBtn.style.fontSize = '17px';
    completeBtn.addEventListener('click', () => {
      this.params.onNavigate('dashboard');
    });
    card.appendChild(completeBtn);
    
    content.appendChild(card);
    screen.appendChild(content);
    
    return screen;
  }

  createObjectiveSection(card) {
    const section = DOM.create('div');
    
    const title = DOM.create('h3');
    title.style.color = Colors.text;
    title.style.fontSize = '19px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '🎯 Objetivo principal';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '14px';
    subtitle.style.marginBottom = '16px';
    subtitle.textContent = 'O que você quer priorizar neste ciclo?';
    
    const grid = DOM.create('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '12px';
    
    OBJECTIVE_OPTIONS.forEach(option => {
      const btn = DOM.create('button');
      btn.style.padding = '20px 16px';
      btn.style.borderRadius = '14px';
      btn.style.cursor = 'pointer';
      btn.style.display = 'flex';
      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'center';
      btn.style.gap = '10px';
      btn.style.background = this.selectedObjective === option.label 
        ? 'rgba(240,5,154,0.13)'
        : 'rgba(255,255,255,0.04)';
      btn.style.border = `1.5px solid ${this.selectedObjective === option.label ? Colors.pink : Colors.border}`;
      btn.style.color = this.selectedObjective === option.label ? Colors.pinkLight : Colors.muted;
      btn.style.fontWeight = '700';
      btn.style.fontSize = '14px';
      btn.style.boxShadow = this.selectedObjective === option.label ? `0 4px 20px ${Colors.pinkGlow}` : 'none';
      
      const icon = DOM.create('span');
      icon.style.fontSize = '22px';
      icon.style.color = this.selectedObjective === option.label ? Colors.pink : Colors.muted;
      icon.textContent = option.icon;
      
      btn.appendChild(icon);
      btn.appendChild(DOM.create('span')).textContent = option.label;
      btn.addEventListener('click', () => {
        this.selectedObjective = option.label;
        this.element.innerHTML = '';
        this.mount();
      });
      
      grid.appendChild(btn);
    });
    
    section.appendChild(title);
    section.appendChild(subtitle);
    section.appendChild(grid);
    card.appendChild(section);
  }

  createMealTimesSection(card) {
    const section = DOM.create('div');
    
    const title = DOM.create('h3');
    title.style.color = Colors.text;
    title.style.fontSize = '19px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '🕐 Suas refeições';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '14px';
    subtitle.style.marginBottom = '16px';
    subtitle.textContent = 'Ative e ajuste os horários da sua rotina';
    
    const mealsContainer = DOM.create('div');
    mealsContainer.style.display = 'flex';
    mealsContainer.style.flexDirection = 'column';
    mealsContainer.style.gap = '10px';
    
    MEAL_TIMES.forEach(meal => {
      const mealEl = DOM.create('div');
      mealEl.style.background = Colors.glass;
      mealEl.style.border = `1px solid ${Colors.border}`;
      mealEl.style.borderRadius = '14px';
      mealEl.style.padding = '14px 18px';
      mealEl.style.display = 'flex';
      mealEl.style.alignItems = 'center';
      mealEl.style.gap = '14px';
      
      const icon = DOM.create('span');
      icon.style.fontSize = '22px';
      icon.textContent = meal.icon;
      
      const label = DOM.create('span');
      label.style.color = Colors.text;
      label.style.fontWeight = '600';
      label.style.fontSize = '15px';
      label.style.flex = '1';
      label.textContent = meal.label;
      
      const time = DOM.create('input');
      time.type = 'time';
      time.value = meal.time;
      time.style.background = Colors.glass;
      time.style.border = `1.5px solid ${Colors.border}`;
      time.style.borderRadius = '12px';
      time.style.padding = '8px 12px';
      time.style.fontSize = '14px';
      time.style.color = Colors.pink;
      time.style.fontWeight = '700';
      time.style.width = 'auto';
      
      const toggle = DOM.create('div');
      toggle.style.width = '44px';
      toggle.style.height = '24px';
      toggle.style.borderRadius = '12px';
      toggle.style.cursor = 'pointer';
      toggle.style.position = 'relative';
      toggle.style.background = `linear-gradient(135deg, ${Colors.pink}, #c0027c)`;
      toggle.style.flexShrink = '0';
      toggle.style.transition = 'background 0.3s';
      
      const toggleDot = DOM.create('div');
      toggleDot.style.position = 'absolute';
      toggleDot.style.width = '18px';
      toggleDot.style.height = '18px';
      toggleDot.style.borderRadius = '50%';
      toggleDot.style.background = '#fff';
      toggleDot.style.top = '3px';
      toggleDot.style.left = '23px';
      toggleDot.style.transition = 'left 0.3s';
      
      toggle.appendChild(toggleDot);
      
      mealEl.appendChild(icon);
      mealEl.appendChild(label);
      mealEl.appendChild(time);
      mealEl.appendChild(toggle);
      mealsContainer.appendChild(mealEl);
    });
    
    section.appendChild(title);
    section.appendChild(subtitle);
    section.appendChild(mealsContainer);
    card.appendChild(section);
  }

  createAllowedFoodsSection(card) {
    const section = DOM.create('div');
    
    const title = DOM.create('h3');
    title.style.color = Colors.text;
    title.style.fontSize = '19px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '🟢 Lista Verde — Liberados';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '14px';
    subtitle.style.marginBottom = '16px';
    subtitle.textContent = 'Selecione o que você gosta e come com frequência';
    
    const foodsContainer = DOM.create('div');
    foodsContainer.style.display = 'flex';
    foodsContainer.style.flexWrap = 'wrap';
    foodsContainer.style.gap = '8px';
    
    ALLOWED_FOODS.forEach(food => {
      const btn = DOM.create('button');
      btn.style.padding = '9px 16px';
      btn.style.borderRadius = '22px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '14px';
      btn.style.fontWeight = '600';
      btn.style.background = this.selectedAllowed.includes(food) 
        ? `${Colors.success}20`
        : 'rgba(255,255,255,0.05)';
      btn.style.border = `1.5px solid ${this.selectedAllowed.includes(food) ? Colors.success : Colors.border}`;
      btn.style.color = this.selectedAllowed.includes(food) ? Colors.success : Colors.muted;
      btn.style.transition = 'all 0.2s';
      
      btn.textContent = (this.selectedAllowed.includes(food) ? '✓ ' : '') + food;
      
      btn.addEventListener('click', () => {
        if (this.selectedAllowed.includes(food)) {
          this.selectedAllowed = this.selectedAllowed.filter(f => f !== food);
        } else {
          this.selectedAllowed.push(food);
        }
        this.element.innerHTML = '';
        this.mount();
      });
      
      foodsContainer.appendChild(btn);
    });
    
    section.appendChild(title);
    section.appendChild(subtitle);
    section.appendChild(foodsContainer);
    card.appendChild(section);
  }

  createModerateFoodsSection(card) {
    const section = DOM.create('div');
    
    const title = DOM.create('h3');
    title.style.color = Colors.text;
    title.style.fontSize = '19px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '🟡 Lista Amarela — Moderação';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '14px';
    subtitle.style.marginBottom = '16px';
    subtitle.textContent = 'Itens que pode consumir em pequenas quantidades';
    
    const foodsContainer = DOM.create('div');
    foodsContainer.style.display = 'flex';
    foodsContainer.style.flexWrap = 'wrap';
    foodsContainer.style.gap = '8px';
    
    MODERATE_FOODS.forEach(food => {
      const btn = DOM.create('button');
      btn.style.padding = '9px 16px';
      btn.style.borderRadius = '22px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '14px';
      btn.style.fontWeight = '600';
      btn.style.background = this.selectedModerate.includes(food) 
        ? `${Colors.warning}20`
        : 'rgba(255,255,255,0.05)';
      btn.style.border = `1.5px solid ${this.selectedModerate.includes(food) ? Colors.warning : Colors.border}`;
      btn.style.color = this.selectedModerate.includes(food) ? Colors.warning : Colors.muted;
      
      btn.textContent = (this.selectedModerate.includes(food) ? '✓ ' : '') + food;
      
      btn.addEventListener('click', () => {
        if (this.selectedModerate.includes(food)) {
          this.selectedModerate = this.selectedModerate.filter(f => f !== food);
        } else {
          this.selectedModerate.push(food);
        }
        this.element.innerHTML = '';
        this.mount();
      });
      
      foodsContainer.appendChild(btn);
    });
    
    section.appendChild(title);
    section.appendChild(subtitle);
    section.appendChild(foodsContainer);
    card.appendChild(section);
  }

  createForbiddenFoodsSection(card) {
    const section = DOM.create('div');
    
    const title = DOM.create('h3');
    title.style.color = Colors.text;
    title.style.fontSize = '19px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '🔴 Lista Vermelha — Contraindicados';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '14px';
    subtitle.style.marginBottom = '16px';
    subtitle.textContent = 'Selecione o que costuma comer — será justificado no plano';
    
    const alert = DOM.create('div');
    alert.style.background = 'rgba(244,63,94,0.04)';
    alert.style.border = `1px solid rgba(244,63,94,0.25)`;
    alert.style.borderRadius = '12px';
    alert.style.padding = '12px 16px';
    alert.style.marginBottom = '14px';
    
    const alertText = DOM.create('p');
    alertText.style.color = Colors.muted;
    alertText.style.fontSize = '14px';
    alertText.innerHTML = `<span style="color: ${Colors.danger}; font-weight: 700; margin-right: 5px;">⚠️</span>
    Estes alimentos serão avaliados pela IA, que explicará porque foram excluídos e sugerirá alternativas.`;
    
    alert.appendChild(alertText);
    
    const foodsContainer = DOM.create('div');
    foodsContainer.style.display = 'flex';
    foodsContainer.style.flexWrap = 'wrap';
    foodsContainer.style.gap = '8px';
    
    RED_LIST.forEach(food => {
      const btn = DOM.create('button');
      btn.style.padding = '9px 16px';
      btn.style.borderRadius = '22px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '14px';
      btn.style.fontWeight = '600';
      btn.style.background = this.selectedForbidden.includes(food) 
        ? 'rgba(244,63,94,0.18)'
        : 'rgba(255,255,255,0.04)';
      btn.style.border = `1.5px solid ${this.selectedForbidden.includes(food) ? Colors.danger : Colors.border}`;
      btn.style.color = this.selectedForbidden.includes(food) ? Colors.danger : Colors.muted;
      
      btn.textContent = (this.selectedForbidden.includes(food) ? '⚠️ ' : '') + food;
      
      btn.addEventListener('click', () => {
        if (this.selectedForbidden.includes(food)) {
          this.selectedForbidden = this.selectedForbidden.filter(f => f !== food);
        } else {
          this.selectedForbidden.push(food);
        }
        this.element.innerHTML = '';
        this.mount();
      });
      
      foodsContainer.appendChild(btn);
    });
    
    section.appendChild(title);
    section.appendChild(subtitle);
    section.appendChild(alert);
    section.appendChild(foodsContainer);
    card.appendChild(section);
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
    
    return container;
  }
}

export default CardapioScreen;
