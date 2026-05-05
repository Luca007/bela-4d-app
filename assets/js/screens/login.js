// Login Screen
import { DOM } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { authService } from '../services/auth.js';
import { firestoreService } from '../services/firestore.js';
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
    
    // Header
    const header = DOM.create('div', 'login-header');
    
    const logoContainer = DOM.create('div', 'logo-container');
    const logoText = DOM.create('span', 'logo-text');
    logoText.textContent = 'GMP';
    logoContainer.appendChild(logoText);
    
    const title = DOM.create('h1');
    title.style.color = Colors.text;
    title.style.fontSize = '26px';
    title.style.fontWeight = '800';
    title.style.marginBottom = '6px';
    title.textContent = 'Guia Metabólico';
    
    const subtitle = DOM.create('h2');
    subtitle.style.color = Colors.pink;
    subtitle.style.fontSize = '18px';
    subtitle.style.fontWeight = '700';
    subtitle.style.marginBottom = '10px';
    subtitle.textContent = 'Personalizado';
    
    const description = DOM.create('p');
    description.style.color = Colors.muted;
    description.style.fontSize = '15px';
    description.textContent = 'Seu acesso exclusivo ao programa';
    
    header.appendChild(logoContainer);
    header.appendChild(title);
    header.appendChild(subtitle);
    header.appendChild(description);
    
    form.appendChild(header);
    
    // Form Fields
    const formGroup = DOM.create('div');
    formGroup.style.display = 'flex';
    formGroup.style.flexDirection = 'column';
    formGroup.style.gap = '20px';
    formGroup.style.marginBottom = '32px';
    
    // Email field
    const emailLabel = UIComponents.label('E-mail');
    const emailInput = UIComponents.emailInput('seu@email.com');
    emailInput.addEventListener('input', (e) => this.email = e.target.value);
    
    const emailGroup = DOM.create('div');
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    formGroup.appendChild(emailGroup);
    
    // Password field
    const passLabel = UIComponents.label('Senha');
    const passInput = UIComponents.passwordInput('••••••••');
    passInput.addEventListener('input', (e) => this.password = e.target.value);
    
    const passGroup = DOM.create('div');
    passGroup.appendChild(passLabel);
    passGroup.appendChild(passInput);
    formGroup.appendChild(passGroup);
    
    form.appendChild(formGroup);
    
    // Login Button
    const loginBtn = UIComponents.primaryButton('Entrar na plataforma');
    loginBtn.style.width = '100%';
    loginBtn.style.marginBottom = '18px';
    loginBtn.style.fontSize = '17px';
    loginBtn.addEventListener('click', () => this.handleLogin());
    
    form.appendChild(loginBtn);
    
    // Forgot Password
    const forgotLink = DOM.create('div');
    forgotLink.style.textAlign = 'center';
    
    const forgotBtn = DOM.create('button');
    forgotBtn.style.background = 'none';
    forgotBtn.style.border = 'none';
    forgotBtn.style.color = Colors.pink;
    forgotBtn.style.cursor = 'pointer';
    forgotBtn.style.fontSize = '15px';
    forgotBtn.style.fontWeight = '600';
    forgotBtn.textContent = 'Esqueci minha senha';
    
    forgotLink.appendChild(forgotBtn);
    form.appendChild(forgotLink);
    
    // Footer
    const footer = DOM.create('div');
    footer.style.marginTop = '44px';
    footer.style.paddingTop = '24px';
    footer.style.borderTop = `1px solid ${Colors.border}`;
    footer.style.display = 'flex';
    footer.style.justifyContent = 'center';
    
    const logoSmall = this.createLogoSmall();
    footer.appendChild(logoSmall);
    
    form.appendChild(footer);
    
    screen.appendChild(form);
    
    this.loginBtn = loginBtn;
    
    return screen;
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

  handleLogin() {
    if (!this.email || !this.password) {
      this.showError('Por favor, preencha todos os campos');
      return;
    }

    this.isLoading = true;
    this.loginBtn.disabled = true;
    this.loginBtn.innerHTML = '<span class="spinner" style="margin-right: 8px;"></span>Entrando…';

    // Use Firebase Authentication
    authService.login(this.email, this.password).then(async (result) => {
      if (result.success) {
        console.log('✅ Login successful:', result.uid);
        
        // User exists in Firebase Auth
        // Now load their profile from Firestore to check if onboarding is complete
        const userProfile = await firestoreService.getUserProfile(result.uid);
        
        if (userProfile && userProfile.onboardingCompleted) {
          // User has completed onboarding, go to dashboard
          Session.set('onboardingCompleted', true);
          State.set('userProfile', userProfile);
          this.params.onNavigate('dashboard');
        } else {
          // User needs to complete onboarding
          Session.set('onboardingCompleted', false);
          this.params.onNavigate('onboarding');
        }
      } else {
        // Login failed
        this.showError(result.error);
        this.resetLoginButton();
      }
    });
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
    const passwordInput = this.element.querySelector('input[type="password"]');
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLogin();
        }
      });
    }
  }
}

export default LoginScreen;
