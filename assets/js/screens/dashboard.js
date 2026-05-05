// Dashboard Screen - Main Application Interface
import { DOM, State } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { NAV_ITEMS } from '../config/constants.js';
import { authService } from '../services/auth.js';
import { firestoreService } from '../services/firestore.js';
import { createHeaderBar, createBreadcrumb, createStatusBadge } from './shared.js';

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
    // Cleanup listeners
    if (this.recipeUnsubscribe) this.recipeUnsubscribe();
    if (this.achievementsUnsubscribe) this.achievementsUnsubscribe();
    if (this.chatUnsubscribe) this.chatUnsubscribe();
    super.destroy();
  }

  render() {
    const screen = DOM.create('div', 'dashboard');
    
    // Sidebar
    const sidebar = DOM.create('div', 'dashboard-sidebar');
    
    // Logo
    const logo = DOM.create('div');
    logo.style.marginBottom = '18px';
    const logocircle = DOM.create('div');
    logocircle.style.width = '32px';
    logocircle.style.height = '32px';
    logocircle.style.borderRadius = '50%';
    logocircle.style.background = 'radial-gradient(circle at 35% 35%, #1a1a2a, #08080d)';
    logocircle.style.border = `2px solid ${Colors.pink}`;
    logocircle.style.display = 'flex';
    logocircle.style.alignItems = 'center';
    logocircle.style.justifyContent = 'center';
    logocircle.style.fontSize = '12px';
    logocircle.style.fontWeight = '900';
    logocircle.style.color = Colors.pink;
    logocircle.style.boxShadow = `0 0 12px ${Colors.pinkGlow}`;
    logocircle.textContent = 'GMP';
    logo.appendChild(logocircle);
    sidebar.appendChild(logo);
    
    // Nav buttons
    const navContainer = DOM.create('div');
    navContainer.style.flex = '1';
    navContainer.style.display = 'flex';
    navContainer.style.flexDirection = 'column';
    navContainer.style.gap = '2px';
    navContainer.style.width = '100%';
    
    NAV_ITEMS.forEach(item => {
      const btn = DOM.create('button');
      btn.style.width = '100%';
      btn.style.height = '50px';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.background = this.currentNav === item.id 
        ? 'rgba(240,5,154,0.2)'
        : 'transparent';
      btn.style.color = this.currentNav === item.id ? Colors.pink : Colors.muted;
      btn.style.boxShadow = this.currentNav === item.id 
        ? `inset 3px 0 0 ${Colors.pink}`
        : 'none';
      btn.style.position = 'relative';
      btn.style.fontSize = '20px';
      btn.style.transition = 'all 0.2s';
      
      btn.title = item.label;
      btn.innerHTML = this.getNavIcon(item.icon);
      
      // Badge for ranking if needed
      if (item.id === 'ranking' && this.currentNav !== item.id) {
        const badge = DOM.create('span');
        badge.style.position = 'absolute';
        badge.style.top = '8px';
        badge.style.right = '12px';
        badge.style.width = '8px';
        badge.style.height = '8px';
        badge.style.borderRadius = '50%';
        badge.style.background = Colors.gold;
        badge.style.boxShadow = `0 0 6px ${Colors.gold}`;
        btn.appendChild(badge);
      }
      
      btn.addEventListener('click', () => {
        this.currentNav = item.id;
        this.element.innerHTML = '';
        this.mount();
      });
      
      navContainer.appendChild(btn);
    });
    
    sidebar.appendChild(navContainer);
    
    // Logout button
    const logoutBtn = DOM.create('button');
    logoutBtn.style.width = '100%';
    logoutBtn.style.height = '50px';
    logoutBtn.style.border = 'none';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.style.display = 'flex';
    logoutBtn.style.alignItems = 'center';
    logoutBtn.style.justifyContent = 'center';
    logoutBtn.style.background = 'transparent';
    logoutBtn.style.color = Colors.muted;
    logoutBtn.style.fontSize = '20px';
    logoutBtn.style.transition = 'all 0.2s';
    logoutBtn.title = 'Sair';
    logoutBtn.innerHTML = '🚪';
    logoutBtn.addEventListener('click', async () => {
      try {
        await authService.logout();
        // Navigation will be handled by auth state change listener in app.js
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    });
    sidebar.appendChild(logoutBtn);
    
    screen.appendChild(sidebar);
    
    // Main content
    const main = DOM.create('div', 'dashboard-main');
    
    // Header
    const header = createHeaderBar(NAV_ITEMS.find(i => i.id === this.currentNav)?.label || 'Home', this.userAvatar);
    main.appendChild(header);
    
    // Breadcrumb
    const breadLabel = NAV_ITEMS.find(i => i.id === this.currentNav)?.label || 'Home';
    const breadcrumb = createBreadcrumb(breadLabel);
    
    if (this.currentNav === 'ranking') {
      breadcrumb.appendChild(createStatusBadge('Você está em #8', Colors.gold));
    } else if (this.currentNav === 'chat') {
      breadcrumb.appendChild(createStatusBadge('IA Online', Colors.success));
    }
    
    main.appendChild(breadcrumb);
    
    // Content
    const content = DOM.create('div', 'dashboard-content');
    content.style.flex = '1';
    content.style.overflow = 'auto';
    content.style.padding = '24px 28px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '20px';
    content.style.animation = 'slideIn 0.25s cubic-bezier(0.4,0,0.2,1)';
    
    // Render screen content
    if (this.currentNav === 'home') {
      this.renderHomeScreen(content);
    } else if (this.currentNav === 'perfil') {
      this.renderProfileScreen(content);
    } else if (this.currentNav === 'receitas') {
      this.renderRecipesScreen(content);
    } else if (this.currentNav === 'avaliador') {
      this.renderEvaluatorScreen(content);
    } else if (this.currentNav === 'exames') {
      this.renderExamsScreen(content);
    } else if (this.currentNav === 'ranking') {
      this.renderRankingScreen(content);
    } else if (this.currentNav === 'chat') {
      this.renderChatScreen(content);
    }
    
    main.appendChild(content);
    screen.appendChild(main);
    
    return screen;
  }

  renderHomeScreen(container) {
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '21px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = 'Bem-vinda ao seu dashboard! 🎉';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.style.marginBottom = '20px';
    subtitle.textContent = 'Acompanhe seu progresso e gerencie seu programa personalizado';
    
    container.appendChild(title);
    container.appendChild(subtitle);
    
    // Stats
    const statsGrid = DOM.create('div');
    statsGrid.style.display = 'grid';
    statsGrid.style.gridTemplateColumns = '1fr 1fr 1fr';
    statsGrid.style.gap = '12px';
    statsGrid.style.marginBottom = '20px';
    
    [
      { label: 'Glicemia', value: '98', unit: 'mg/dL', delta: '▼ 50', color: Colors.success },
      { label: 'Peso', value: '79.6', unit: 'kg', delta: '▼ 4.4', color: Colors.success },
      { label: 'HbA1c', value: '6.1', unit: '%', delta: '▼ 0.8%', color: Colors.success },
    ].forEach(stat => {
      const statCard = UIComponents.statCard(stat.label, stat.value, stat.unit, '📊', stat.color);
      const deltaEl = DOM.create('div');
      deltaEl.style.color = stat.color;
      deltaEl.style.fontSize = '12px';
      deltaEl.style.fontWeight = '700';
      deltaEl.style.marginTop = '5px';
      deltaEl.textContent = stat.delta;
      statCard.appendChild(deltaEl);
      statsGrid.appendChild(statCard);
    });
    
    container.appendChild(statsGrid);
    
    // Info card
    const infoCard = UIComponents.card();
    infoCard.style.background = `linear-gradient(135deg, rgba(240,5,154,0.14) 0%, rgba(192,2,124,0.07) 100%)`;
    infoCard.style.border = `2px solid ${Colors.pinkGlow}`;
    
    const infoTitle = DOM.create('h3');
    infoTitle.style.color = Colors.pink;
    infoTitle.style.fontSize = '16px';
    infoTitle.style.fontWeight = '800';
    infoTitle.style.marginBottom = '10px';
    infoTitle.textContent = '💡 Dica do dia';
    
    const infoText = DOM.create('p');
    infoText.style.color = Colors.muted;
    infoText.style.fontSize = '14px';
    infoText.style.lineHeight = '1.6';
    infoText.textContent = 'Mastigue devagar! A mastigação lenta reduz picos glicêmicos em até 18%.';
    
    infoCard.appendChild(infoTitle);
    infoCard.appendChild(infoText);
    container.appendChild(infoCard);
  }

  renderProfileScreen(container) {
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '21px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '20px';
    title.textContent = '👤 Seu Perfil';
    
    container.appendChild(title);
    
    // Avatar Card
    const avatarCard = UIComponents.card();
    avatarCard.style.textAlign = 'center';
    avatarCard.style.padding = '28px 24px';
    
    const avatar = UIComponents.avatar(this.userAvatar.emoji, this.userAvatar.color, 80);
    avatar.style.margin = '0 auto 14px';
    avatarCard.appendChild(avatar);
    
    const nickEl = DOM.create('div');
    nickEl.style.color = Colors.text;
    nickEl.style.fontWeight = '800';
    nickEl.style.fontSize = '22px';
    nickEl.style.marginBottom = '6px';
    nickEl.textContent = this.userAvatar.nick;
    
    const levelEl = DOM.create('div');
    levelEl.style.color = Colors.pink;
    levelEl.style.fontWeight = '700';
    levelEl.style.fontSize = '14px';
    levelEl.textContent = 'Nível 3 · Disciplinada';
    
    avatarCard.appendChild(nickEl);
    avatarCard.appendChild(levelEl);
    container.appendChild(avatarCard);
  }

  renderRecipesScreen(container) {
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '21px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '🥗 Receitas';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.style.marginBottom = '20px';
    subtitle.textContent = 'Receitas personalizadas para seu cardápio';
    
    container.appendChild(title);
    container.appendChild(subtitle);
    
    const recipeCard = UIComponents.card();
    const content = DOM.create('div');
    content.innerHTML = '<p style="color: var(--color-muted); text-align: center;">As receitas carregadas aqui são personalizadas com base no seu cardápio.</p>';
    recipeCard.appendChild(content);
    container.appendChild(recipeCard);
  }

  renderEvaluatorScreen(container) {
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '21px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '🍽️ Avaliador Alimentar';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.style.marginBottom = '20px';
    subtitle.textContent = 'A IA avalia seus alimentos e cria um plano personalizado';
    
    container.appendChild(title);
    container.appendChild(subtitle);
    
    const card = UIComponents.card();
    const textarea = UIComponents.textarea('Digite seus alimentos aqui...');
    const btn = UIComponents.primaryButton('Avaliar alimentação');
    card.appendChild(DOM.create('label')).textContent = 'Meus alimentos';
    card.appendChild(textarea);
    card.appendChild(btn);
    container.appendChild(card);
  }

  renderExamsScreen(container) {
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '21px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '📊 Exames & Monitoramento';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.style.marginBottom = '20px';
    subtitle.textContent = 'Acompanhe sua evolução clínica ao longo do tempo';
    
    container.appendChild(title);
    container.appendChild(subtitle);
    
    const card = UIComponents.card();
    const text = DOM.create('p');
    text.style.color = Colors.muted;
    text.textContent = 'Visualize seus resultados de exames e evolução dos marcadores clínicos.';
    card.appendChild(text);
    container.appendChild(card);
  }

  renderRankingScreen(container) {
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '21px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '4px';
    title.textContent = '🏆 Ranking';
    
    const subtitle = DOM.create('p');
    subtitle.style.color = Colors.muted;
    subtitle.style.fontSize = '15px';
    subtitle.style.marginBottom = '20px';
    subtitle.textContent = 'Veja como você está na comunidade GMP';
    
    container.appendChild(title);
    container.appendChild(subtitle);
    
    const card = UIComponents.card();
    const badge = DOM.create('div');
    badge.style.background = Colors.glass;
    badge.style.border = `1px solid ${Colors.border}`;
    badge.style.borderRadius = '16px';
    badge.style.padding = '20px';
    badge.style.textAlign = 'center';
    
    const pos = DOM.create('div');
    pos.style.fontSize = '32px';
    pos.style.fontWeight = '900';
    pos.style.color = Colors.pink;
    pos.textContent = '#8';
    
    const text = DOM.create('p');
    text.style.color = Colors.muted;
    text.style.marginTop = '8px';
    text.textContent = 'Você está em 8º lugar com 520 XP';
    
    badge.appendChild(pos);
    badge.appendChild(text);
    card.appendChild(badge);
    container.appendChild(card);
  }

  renderChatScreen(container) {
    const title = DOM.create('h2');
    title.style.color = Colors.text;
    title.style.fontSize = '21px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '20px';
    title.textContent = '💬 Chat IA';
    
    container.appendChild(title);
    
    const chatCard = UIComponents.card();
    chatCard.style.minHeight = '300px';
    chatCard.style.display = 'flex';
    chatCard.style.flexDirection = 'column';
    chatCard.style.justifyContent = 'center';
    chatCard.style.alignItems = 'center';
    
    const chatIcon = DOM.create('div');
    chatIcon.style.fontSize = '48px';
    chatIcon.style.marginBottom = '16px';
    chatIcon.textContent = '✨';
    
    const chatText = DOM.create('p');
    chatText.style.color = Colors.muted;
    chatText.style.textAlign = 'center';
    chatText.textContent = 'Olá! Sou a IA do GMP. Pode me fazer perguntas sobre alimentação, receitas e glicemia.';
    
    chatCard.appendChild(chatIcon);
    chatCard.appendChild(chatText);
    container.appendChild(chatCard);
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
