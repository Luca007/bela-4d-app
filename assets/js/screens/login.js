// Login Screen
import { DOM } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { authService } from '../services/auth.js';
import { firestoreService } from '../services/firestore.js';
import { notificationService } from '../modules/notifications.js';
import { State, Session } from '../utils/helpers.js';

export class LoginScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.email = '';
    this.password = '';
    this.isLoading = false;
  }

  render() {
    const screen = DOM.create('div', 'screen login-container');
    const form = DOM.create('div', 'login-form');

    form.appendChild(this.renderHeader());
    form.appendChild(this.renderFormFields());
    form.appendChild(this.renderLoginButton());
    form.appendChild(this.renderForgotPassword());
    form.appendChild(this.renderFooter());

    screen.appendChild(form);
    return screen;
  }

  renderHeader() {
    const header = DOM.create('div', 'login-header');
    
    const logoContainer = DOM.create('div', 'logo-container');
    const logoText = DOM.create('span', 'logo-text');
    logoText.textContent = 'GMP';
    logoContainer.appendChild(logoText);
    
    const title = DOM.create('h1');
    DOM.setStyle(title, {
      color: Colors.text,
      fontSize: '26px',
      fontWeight: '800',
      marginBottom: '6px',
    });
    title.textContent = 'Guia Metabólico';
    
    const subtitle = DOM.create('h2');
    DOM.setStyle(subtitle, {
      color: Colors.pink,
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '10px',
    });
    subtitle.textContent = 'Personalizado';
    
    const description = DOM.create('p');
    DOM.setStyle(description, {
      color: Colors.muted,
      fontSize: '15px',
    });
    description.textContent = 'Seu acesso exclusivo ao programa';
    
    header.appendChild(logoContainer);
    header.appendChild(title);
    header.appendChild(subtitle);
    header.appendChild(description);
    return header;
  }

  renderFormFields() {
    const formGroup = DOM.create('div');
    DOM.setStyle(formGroup, {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      marginBottom: '32px',
    });

    // Email
    const emailLabel = UIComponents.label('E-mail');
    const emailInput = UIComponents.emailInput('seu@email.com');
    emailInput.addEventListener('input', (e) => this.email = e.target.value);
    const emailGroup = DOM.create('div');
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    formGroup.appendChild(emailGroup);

    // Password
    const passLabel = UIComponents.label('Senha');
    const passInput = UIComponents.passwordInput('••••••••');
    passInput.addEventListener('input', (e) => this.password = e.target.value);
    const passGroup = DOM.create('div');
    passGroup.appendChild(passLabel);
    passGroup.appendChild(passInput);
    formGroup.appendChild(passGroup);

    return formGroup;
  }

  renderLoginButton() {
    const loginBtn = UIComponents.primaryButton('Entrar na plataforma');
    DOM.setStyle(loginBtn, {
      width: '100%',
      marginBottom: '18px',
      fontSize: '17px',
    });
    loginBtn.addEventListener('click', () => this.handleLogin());
    this.loginBtn = loginBtn;
    return loginBtn;
  }

  renderForgotPassword() {
    const forgotLink = DOM.create('div');
    forgotLink.style.textAlign = 'center';
    
    const forgotBtn = DOM.create('button');
    DOM.setStyle(forgotBtn, {
      background: 'none',
      border: 'none',
      color: Colors.pink,
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
    });
    forgotBtn.textContent = 'Esqueci minha senha';
    
    forgotLink.appendChild(forgotBtn);
    return forgotLink;
  }

  renderFooter() {
    const footer = DOM.create('div');
    DOM.setStyle(footer, {
      marginTop: '44px',
      paddingTop: '24px',
      borderTop: `1px solid ${Colors.border}`,
      display: 'flex',
      justifyContent: 'center',
    });
    footer.appendChild(this.createLogoSmall());
    return footer;
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
    text.style.letterSpacing = '-0.5px';
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

  _friendlyAuthError(rawError) {
    const msg = String(rawError || '').toLowerCase();
    if (!navigator.onLine) return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
    if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found') || msg.includes('invalid-email')) {
      return 'E-mail ou senha incorretos. Verifique seus dados.';
    }
    if (msg.includes('too-many-requests')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    if (msg.includes('network') || msg.includes('timeout')) return 'Erro de conexão. Tente novamente.';
    if (msg.includes('user-disabled')) return 'Esta conta foi desativada. Entre em contato com o suporte.';
    return 'Erro ao entrar. Tente novamente.';
  }

  async handleLogin() {
    if (!this.email || !this.password) {
      this.showError('Por favor, preencha e-mail e senha.');
      return;
    }

    if (!navigator.onLine) {
      this.showError('Sem conexão com a internet. Verifique sua rede.');
      return;
    }

    this.isLoading = true;
    this.loginBtn.disabled = true;
    this.loginBtn.innerHTML = '<span class="spinner" style="margin-right: 8px;"></span>Entrando…';

    try {
      const result = await authService.login(this.email, this.password);

      if (result.success) {
        const userProfile = await firestoreService.getUserProfile(result.uid);

        // Toast efêmero de boas-vindas (não persistir)
        notificationService.toast('Bem-vinda! 🌸', { type: 'success' });

        if (userProfile && userProfile.onboardingCompleted) {
          Session.set('onboardingCompleted', true);
          State.set('userProfile', userProfile);
          this.params.onNavigate('dashboard');
        } else {
          Session.set('onboardingCompleted', false);
          this.params.onNavigate('onboarding');
        }
      } else {
        this.showError(this._friendlyAuthError(result.error));
        this.resetLoginButton();
      }
    } catch (err) {
      this.showError(this._friendlyAuthError(err?.message || err));
      this.resetLoginButton();
    }
  }

  showError(message) {
    const errorDiv = DOM.create('div');
    errorDiv.style.cssText = `
      background: #ff4444;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      text-align: center;
    `;
    errorDiv.textContent = message;
    
    // Insert error message at the top of the form
    const form = this.element.querySelector('.login-form');
    const header = form.querySelector('.login-header');
    form.insertBefore(errorDiv, header.nextSibling);
    
    // Remove error after 5 seconds
    setTimeout(() => {
      try {
        errorDiv.remove();
      } catch (e) {
        // Element already removed
      }
    }, 5000);
  }

  resetLoginButton() {
    this.isLoading = false;
    this.loginBtn.disabled = false;
    this.loginBtn.textContent = 'Entrar na plataforma';
  }

  setupEventListeners() {
    this.element.querySelectorAll('input[type="password"], input[type="email"]').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    });
  }
}

export default LoginScreen;
