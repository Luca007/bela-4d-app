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

    // Password with eye toggle
    const passLabel = UIComponents.label('Senha');
    const passInput = UIComponents.passwordInput('••••••••');
    passInput.addEventListener('input', (e) => this.password = e.target.value);

    // Wrap input + toggle button in a relative container
    const passWrap = DOM.create('div');
    DOM.setStyle(passWrap, { position: 'relative', width: '100%' });
    DOM.setStyle(passInput, { paddingRight: '48px', width: '100%', boxSizing: 'border-box' });

    const toggleBtn = DOM.create('button');
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Mostrar/ocultar senha');
    DOM.setStyle(toggleBtn, {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '32px',
      height: '32px',
      border: 'none',
      borderRadius: '8px',
      background: 'transparent',
      color: 'rgba(255,255,255,0.55)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      transition: 'color 0.18s, background 0.18s',
    });
    const eyeOpen = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeClosed = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    toggleBtn.innerHTML = eyeClosed;
    toggleBtn.addEventListener('click', () => {
      const showing = passInput.type === 'text';
      passInput.type = showing ? 'password' : 'text';
      toggleBtn.innerHTML = showing ? eyeClosed : eyeOpen;
      toggleBtn.style.color = showing ? 'rgba(255,255,255,0.55)' : Colors.pink;
    });
    toggleBtn.addEventListener('mouseenter', () => { toggleBtn.style.background = 'rgba(255,255,255,0.06)'; });
    toggleBtn.addEventListener('mouseleave', () => { toggleBtn.style.background = 'transparent'; });

    passWrap.appendChild(passInput);
    passWrap.appendChild(toggleBtn);

    const passGroup = DOM.create('div');
    passGroup.appendChild(passLabel);
    passGroup.appendChild(passWrap);
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
    forgotBtn.addEventListener('click', () => this.openForgotPasswordModal());

    forgotLink.appendChild(forgotBtn);
    return forgotLink;
  }

  openForgotPasswordModal() {
    const overlay = DOM.create('div');
    DOM.setStyle(overlay, {
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      animation: 'fadeIn 200ms ease',
    });

    const modal = DOM.create('div');
    DOM.setStyle(modal, {
      background: 'linear-gradient(180deg, #1a1a22, #15151c)',
      border: `1px solid ${Colors.border}`, borderRadius: '20px',
      padding: '28px', width: 'calc(100vw - 40px)', maxWidth: '400px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    });

    const title = DOM.create('h3');
    title.textContent = 'Recuperar senha';
    DOM.setStyle(title, { color: '#fff', fontSize: '20px', fontWeight: '800', margin: '0 0 8px' });

    const subtitle = DOM.create('p');
    subtitle.textContent = 'Digite seu email cadastrado. Enviaremos um link para você redefinir sua senha.';
    DOM.setStyle(subtitle, { color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.5' });

    const emailInput = UIComponents.emailInput('seu@email.com', this.email || '');
    DOM.setStyle(emailInput, { width: '100%', boxSizing: 'border-box', marginBottom: '8px' });

    const errorMsg = DOM.create('div');
    DOM.setStyle(errorMsg, { color: '#f87171', fontSize: '13px', minHeight: '18px', marginBottom: '12px', fontWeight: '600' });

    const successMsg = DOM.create('div');
    DOM.setStyle(successMsg, { color: '#34d399', fontSize: '13px', minHeight: '18px', marginBottom: '12px', fontWeight: '600' });

    const actions = DOM.create('div');
    DOM.setStyle(actions, { display: 'flex', gap: '10px' });

    const cancelBtn = UIComponents.ghostButton('Cancelar');
    DOM.setStyle(cancelBtn, { flex: '1' });
    cancelBtn.addEventListener('click', () => overlay.remove());

    const sendBtn = UIComponents.primaryButton('Enviar link');
    DOM.setStyle(sendBtn, { flex: '1' });
    sendBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      errorMsg.textContent = '';
      successMsg.textContent = '';
      if (!email) { errorMsg.textContent = 'Digite seu email.'; return; }
      const restore = UIComponents.setButtonLoading(sendBtn, 'Enviando...');
      const result = await authService.sendPasswordReset(email);
      restore();
      if (result.success) {
        successMsg.textContent = '✓ Email enviado! Verifique sua caixa de entrada.';
        sendBtn.disabled = true;
        setTimeout(() => overlay.remove(), 2500);
      } else {
        errorMsg.textContent = result.error || 'Erro ao enviar email.';
      }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(sendBtn);

    modal.appendChild(title);
    modal.appendChild(subtitle);
    modal.appendChild(emailInput);
    modal.appendChild(errorMsg);
    modal.appendChild(successMsg);
    modal.appendChild(actions);
    overlay.appendChild(modal);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function escClose(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escClose); }
    });

    document.body.appendChild(overlay);
    setTimeout(() => emailInput.focus(), 100);
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
    const isOffline = !navigator.onLine;
    const isInvalidCredential = msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found') || msg.includes('invalid-email');
    const isTooManyRequests = msg.includes('too-many-requests');
    const isNetworkError = msg.includes('network') || msg.includes('timeout');
    const isUserDisabled = msg.includes('user-disabled');

    if (isOffline) return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
    if (isInvalidCredential) return 'E-mail ou senha incorretos. Verifique seus dados.';
    if (isTooManyRequests) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    if (isNetworkError) return 'Erro de conexão. Tente novamente.';
    if (isUserDisabled) return 'Esta conta foi desativada. Entre em contato com o suporte.';
    return 'Erro ao entrar. Tente novamente.';
  }

  _validateLoginForm() {
    if (!this.email || !this.password) {
      this.showError('Por favor, preencha e-mail e senha.');
      return false;
    }
    if (!navigator.onLine) {
      this.showError('Sem conexão com a internet. Verifique sua rede.');
      return false;
    }
    return true;
  }

  async handleLogin() {
    if (!this._validateLoginForm()) return;

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
