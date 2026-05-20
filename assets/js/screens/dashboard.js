// Dashboard Screen - Main Application Interface
import { DOM, State } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { SCREENS } from '../config/constants.js';
import { authService } from '../services/auth.js';
import { firestoreService } from '../services/firestore.js';
import { createHeaderBar, createBreadcrumb, createStatusBadge } from './shared.js';

// NAV_ITEMS local — a constante foi removida de constants.js (substituída por getNavItems()
// que lê do Firestore). Esta tela legada (dashboard.js) mantém seu próprio array.
const NAV_ITEMS = [
  { id: 'home', label: 'Início', icon: 'home' },
  { id: 'perfil', label: 'Meu Perfil', icon: 'user' },
  { id: 'receitas', label: 'Receitas', icon: 'book-open' },
  { id: 'avaliador', label: 'Avaliador', icon: 'utensils' },
  { id: 'exames', label: 'Exames', icon: 'bar-chart-2' },
  { id: 'ranking', label: 'Ranking', icon: 'trophy' },
  { id: 'chat', label: 'Chat', icon: 'message-circle' },
];

export class DashboardScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.currentNav = 'home';
    this.currentUser = authService.getCurrentUser();
    this.userProfile = State.get('userProfile') || {};
    this.recipes = State.get('recipes') || [];
    this.achievements = State.get('achievements') || [];
    this.chatMessages = [];
    
    this.userAvatar = {
      emoji: this.userProfile.avatar || '🌙',
      color: this.userProfile.avatarColor || Colors.pink,
      nick: this.userProfile.name ? `@${this.userProfile.name.split(' ')[0].toLowerCase()}` : '@você',
    };
    this.xp = this.userProfile.xp || 520;
    
    // Setup listeners
    this.setupFirestoreListeners();
    
    // Subscribe to state changes
    State.subscribe((data) => {
      if (data.recipes) this.recipes = data.recipes;
      if (data.achievements) this.achievements = data.achievements;
    });
  }

  setupFirestoreListeners() {
    if (!this.currentUser) return;

    // Listen to recipes changes
    this.recipeUnsubscribe = firestoreService.onRecipesChange(
      this.currentUser.uid,
      (recipes) => {
        this.recipes = recipes;
        State.set('recipes', recipes);
      }
    );

    // Listen to achievements changes
    this.achievementsUnsubscribe = firestoreService.onAchievementsChange(
      this.currentUser.uid,
      (achievements) => {
        this.achievements = achievements;
        State.set('achievements', achievements);
      }
    );

    // Listen to chat history
    this.chatUnsubscribe = firestoreService.onChatHistoryChange(
      this.currentUser.uid,
      (messages) => {
        this.chatMessages = messages;
      }
    );
  }

  destroy() {
    if (this.recipeUnsubscribe) this.recipeUnsubscribe();
    if (this.achievementsUnsubscribe) this.achievementsUnsubscribe();
    if (this.chatUnsubscribe) this.chatUnsubscribe();
    super.destroy();
  }

  // Helper to create title + subtitle
  createTitle(text, fontSize = '21px') {
    const title = DOM.create('h2');
    DOM.setStyle(title, {
      color: Colors.text,
      fontSize,
      fontWeight: '800',
      marginBottom: '4px',
    });
    title.textContent = text;
    return title;
  }

  createSubtitle(text) {
    const subtitle = DOM.create('p');
    DOM.setStyle(subtitle, {
      color: Colors.muted,
      fontSize: '15px',
      marginBottom: '20px',
    });
    subtitle.textContent = text;
    return subtitle;
  }

  createScreenHeader(title, subtitle = '') {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(this.createTitle(title));
    if (subtitle) fragment.appendChild(this.createSubtitle(subtitle));
    return fragment;
  }

  render() {
    const screen = DOM.create('div', 'dashboard');
    screen.appendChild(this.renderSidebar());
    screen.appendChild(this.renderMainContent());
    return screen;
  }

  renderSidebar() {
    const sidebar = DOM.create('div', 'dashboard-sidebar');
    sidebar.appendChild(this.createLogoSection());
    sidebar.appendChild(this.createNavButtons());
    
    // Add forms button
    const formsBtn = DOM.create('button');
    formsBtn.title = 'Formulários';
    formsBtn.style.width = '56px';
    formsBtn.style.height = '56px';
    formsBtn.style.border = 'none';
    formsBtn.style.background = 'rgba(255,255,255,0.1)';
    formsBtn.style.color = Colors.pink;
    formsBtn.style.borderRadius = '12px';
    formsBtn.style.cursor = 'pointer';
    formsBtn.style.fontSize = '24px';
    formsBtn.style.display = 'flex';
    formsBtn.style.alignItems = 'center';
    formsBtn.style.justifyContent = 'center';
    formsBtn.style.transition = 'all 0.3s';
    formsBtn.textContent = '📋';
    formsBtn.addEventListener('click', () => this.params.onNavigate(SCREENS.FORMS));
    formsBtn.addEventListener('mouseover', () => {
      formsBtn.style.background = 'rgba(240, 5, 154, 0.2)';
      formsBtn.style.transform = 'scale(1.05)';
    });
    formsBtn.addEventListener('mouseout', () => {
      formsBtn.style.background = 'rgba(255,255,255,0.1)';
      formsBtn.style.transform = 'scale(1)';
    });
    sidebar.style.marginTop = 'auto';
    sidebar.appendChild(formsBtn);
    
    sidebar.appendChild(this.createLogoutButton());
    return sidebar;
  }

  createLogoSection() {
    const logo = DOM.create('div');
    logo.style.marginBottom = '18px';
    const circle = DOM.create('div');
    DOM.setStyle(circle, {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, #1a1a2a, #08080d)',
      border: `2px solid ${Colors.pink}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '900',
      color: Colors.pink,
      boxShadow: `0 0 12px ${Colors.pinkGlow}`,
    });
    circle.textContent = 'GMP';
    logo.appendChild(circle);
    return logo;
  }

  createNavButtons() {
    const container = DOM.create('div');
    DOM.setStyle(container, {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      width: '100%',
    });

    NAV_ITEMS.forEach(item => {
      const btn = DOM.create('button');
      const isActive = this.currentNav === item.id;
      DOM.setStyle(btn, {
        width: '100%',
        height: '50px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isActive ? 'rgba(240,5,154,0.2)' : 'transparent',
        color: isActive ? Colors.pink : Colors.muted,
        boxShadow: isActive ? `inset 3px 0 0 ${Colors.pink}` : 'none',
        position: 'relative',
        fontSize: '20px',
        transition: 'all 0.2s',
      });

      btn.title = item.label;
      btn.innerHTML = this.getNavIcon(item.icon);

      if (item.id === 'ranking' && !isActive) {
        const badge = DOM.create('span');
        DOM.setStyle(badge, {
          position: 'absolute',
          top: '8px',
          right: '12px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: Colors.gold,
          boxShadow: `0 0 6px ${Colors.gold}`,
        });
        btn.appendChild(badge);
      }

      btn.addEventListener('click', () => {
        this.currentNav = item.id;
        this.element.innerHTML = '';
        this.mount();
      });

      container.appendChild(btn);
    });

    return container;
  }

  createLogoutButton() {
    const btn = DOM.create('button');
    DOM.setStyle(btn, {
      width: '100%',
      height: '50px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      color: Colors.muted,
      fontSize: '20px',
      transition: 'all 0.2s',
    });

    btn.title = 'Sair';
    btn.innerHTML = '🚪';
    btn.addEventListener('click', async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    });

    return btn;
  }

  renderMainContent() {
    const main = DOM.create('div', 'dashboard-main');
    const navLabel = NAV_ITEMS.find(i => i.id === this.currentNav)?.label || 'Home';
    
    main.appendChild(createHeaderBar(navLabel, this.userAvatar));
    main.appendChild(this.createBreadcrumbSection(navLabel));
    main.appendChild(this.renderContent(navLabel));
    
    return main;
  }

  createBreadcrumbSection(navLabel) {
    const breadcrumb = createBreadcrumb(navLabel);
    if (this.currentNav === 'ranking') {
      breadcrumb.appendChild(createStatusBadge('Você está em #8', Colors.gold));
    } else if (this.currentNav === 'chat') {
      breadcrumb.appendChild(createStatusBadge('IA Online', Colors.success));
    }
    return breadcrumb;
  }

  renderContent(navLabel) {
    const content = DOM.create('div', 'dashboard-content');
    DOM.setStyle(content, {
      flex: '1',
      overflow: 'auto',
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      animation: 'slideIn 0.25s cubic-bezier(0.4,0,0.2,1)',
    });

    const screenMap = {
      'home': () => this.renderHomeScreen(content),
      'perfil': () => this.renderProfileScreen(content),
      'receitas': () => this.renderRecipesScreen(content),
      'avaliador': () => this.renderEvaluatorScreen(content),
      'exames': () => this.renderExamsScreen(content),
      'ranking': () => this.renderRankingScreen(content),
      'chat': () => this.renderChatScreen(content),
    };

    const renderer = screenMap[this.currentNav];
    if (renderer) renderer();

    return content;
  }

  renderHomeScreen(container) {
    container.appendChild(this.createScreenHeader('Bem-vinda ao seu dashboard! 🎉', 'Acompanhe seu progresso e gerencie seu programa personalizado'));
    container.appendChild(this.createStatsGrid());
    container.appendChild(this.createTipsCard());
  }

  createStatsGrid() {
    const grid = DOM.create('div');
    DOM.setStyle(grid, {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '12px',
      marginBottom: '20px',
    });

    const stats = [
      { label: 'Glicemia', value: '98', unit: 'mg/dL', delta: '▼ 50', color: Colors.success },
      { label: 'Peso', value: '79.6', unit: 'kg', delta: '▼ 4.4', color: Colors.success },
      { label: 'HbA1c', value: '6.1', unit: '%', delta: '▼ 0.8%', color: Colors.success },
    ];

    stats.forEach(stat => {
      const card = UIComponents.statCard({ label: stat.label, value: stat.value, unit: stat.unit, icon: '📊', color: stat.color });
      const delta = DOM.create('div');
      DOM.setStyle(delta, {
        color: stat.color,
        fontSize: '12px',
        fontWeight: '700',
        marginTop: '5px',
      });
      delta.textContent = stat.delta;
      card.appendChild(delta);
      grid.appendChild(card);
    });

    return grid;
  }

  createTipsCard() {
    const card = UIComponents.card();
    DOM.setStyle(card, {
      background: `linear-gradient(135deg, rgba(240,5,154,0.14) 0%, rgba(192,2,124,0.07) 100%)`,
      border: `2px solid ${Colors.pinkGlow}`,
    });

    const title = DOM.create('h3');
    DOM.setStyle(title, {
      color: Colors.pink,
      fontSize: '16px',
      fontWeight: '800',
      marginBottom: '10px',
    });
    title.textContent = '💡 Dica do dia';

    const text = DOM.create('p');
    DOM.setStyle(text, {
      color: Colors.muted,
      fontSize: '14px',
      lineHeight: '1.6',
    });
    text.textContent = 'Mastigue devagar! A mastigação lenta reduz picos glicêmicos em até 18%.';

    card.appendChild(title);
    card.appendChild(text);
    return card;
  }

  renderProfileScreen(container) {
    container.appendChild(this.createTitle('👤 Seu Perfil'));
    const card = UIComponents.card();
    DOM.setStyle(card, {
      textAlign: 'center',
      padding: '28px 24px',
    });

    const avatar = UIComponents.avatar(this.userAvatar.emoji, this.userAvatar.color, 80);
    avatar.style.margin = '0 auto 14px';
    card.appendChild(avatar);

    const nick = DOM.create('div');
    DOM.setStyle(nick, {
      color: Colors.text,
      fontWeight: '800',
      fontSize: '22px',
      marginBottom: '6px',
    });
    nick.textContent = this.userAvatar.nick;

    const level = DOM.create('div');
    DOM.setStyle(level, {
      color: Colors.pink,
      fontWeight: '700',
      fontSize: '14px',
    });
    level.textContent = 'Nível 3 · Disciplinada';

    card.appendChild(nick);
    card.appendChild(level);
    container.appendChild(card);
  }

  renderRecipesScreen(container) {
    container.appendChild(this.createScreenHeader('🥗 Receitas', 'Receitas personalizadas para seu cardápio'));
    const card = UIComponents.card();
    const msg = DOM.create('p');
    DOM.setStyle(msg, { color: Colors.muted, textAlign: 'center' });
    msg.textContent = 'As receitas carregadas aqui são personalizadas com base no seu cardápio.';
    card.appendChild(msg);
    container.appendChild(card);
  }

  renderEvaluatorScreen(container) {
    container.appendChild(this.createScreenHeader('🍽️ Avaliador Alimentar', 'A IA avalia seus alimentos e cria um plano personalizado'));
    const card = UIComponents.card();
    card.appendChild(DOM.create('label')).textContent = 'Meus alimentos';
    card.appendChild(UIComponents.textarea('Digite seus alimentos aqui...'));
    card.appendChild(UIComponents.primaryButton('Avaliar alimentação'));
    container.appendChild(card);
  }

  renderExamsScreen(container) {
    container.appendChild(this.createScreenHeader('📊 Exames & Monitoramento', 'Acompanhe sua evolução clínica ao longo do tempo'));
    const card = UIComponents.card();
    const text = DOM.create('p');
    text.style.color = Colors.muted;
    text.textContent = 'Visualize seus resultados de exames e evolução dos marcadores clínicos.';
    card.appendChild(text);
    container.appendChild(card);
  }

  renderRankingScreen(container) {
    container.appendChild(this.createScreenHeader('🏆 Ranking', 'Veja como você está na comunidade GMP'));
    const card = UIComponents.card();
    const badge = DOM.create('div');
    DOM.setStyle(badge, {
      background: Colors.glass,
      border: `1px solid ${Colors.border}`,
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
    });

    const pos = DOM.create('div');
    DOM.setStyle(pos, {
      fontSize: '32px',
      fontWeight: '900',
      color: Colors.pink,
    });
    pos.textContent = '#8';

    const text = DOM.create('p');
    DOM.setStyle(text, {
      color: Colors.muted,
      marginTop: '8px',
    });
    text.textContent = 'Você está em 8º lugar com 520 XP';

    badge.appendChild(pos);
    badge.appendChild(text);
    card.appendChild(badge);
    container.appendChild(card);
  }

  renderChatScreen(container) {
    container.appendChild(this.createTitle('💬 Chat IA'));
    const card = UIComponents.card();
    DOM.setStyle(card, {
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    });

    const icon = DOM.create('div');
    DOM.setStyle(icon, {
      fontSize: '48px',
      marginBottom: '16px',
    });
    icon.textContent = '✨';

    const text = DOM.create('p');
    DOM.setStyle(text, {
      color: Colors.muted,
      textAlign: 'center',
    });
    text.textContent = 'Olá! Sou a IA do GMP. Pode me fazer perguntas sobre alimentação, receitas e glicemia.';

    card.appendChild(icon);
    card.appendChild(text);
    container.appendChild(card);
  }

  getNavIcon(name) {
    const icons = {
      home: '🏠',
      user: '👤',
      'book-open': '📚',
      utensils: '🍽️',
      'bar-chart-2': '📊',
      trophy: '🏆',
      'message-circle': '💬',
    };
    return icons[name] || '•';
  }
}

export default DashboardScreen;
