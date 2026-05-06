/**
 * AwaitingScreen — Programa 4D
 *
 * Exibida quando o usuário está aguardando a reunião de onboarding
 * (status: awaiting_onboarding) ou quando o pedido de exame foi gerado
 * (status: exam_request_sent) ou ainda quando o exame está processando.
 */

import { DOM } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { State } from '../utils/helpers.js';
import { USER_STATUS } from '../config/constants.js';

export class AwaitingScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.status = params.status || USER_STATUS.AWAITING_ONBOARDING;
    this.examRequest = params.examRequest || null;
  }

  render() {
    const screen = DOM.create('div', 'awaiting-screen');
    screen.style.cssText = `
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: var(--color-bg);
    `;

    const card = DOM.create('div');
    card.style.cssText = `
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: var(--shadow-xl);
    `;

    // Logo pequena
    const logo = this._createLogo();
    card.appendChild(logo);

    // Conteúdo baseado no status
    const content = this._buildContent();
    card.appendChild(content);

    screen.appendChild(card);
    return screen;
  }

  _createLogo() {
    const wrap = DOM.create('div');
    wrap.style.cssText = 'margin-bottom: 32px;';
    const logo = DOM.create('div');
    logo.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 10px;
    `;
    const badge = DOM.create('span');
    badge.style.cssText = `
      background: var(--gradient-primary);
      color: white;
      font-weight: 800;
      font-size: 20px;
      padding: 8px 14px;
      border-radius: 10px;
      letter-spacing: 1px;
    `;
    badge.textContent = '4D';
    const name = DOM.create('span');
    name.style.cssText = 'color: var(--color-text); font-weight: 700; font-size: 18px;';
    name.textContent = 'Bela Nutrição';
    logo.appendChild(badge);
    logo.appendChild(name);
    wrap.appendChild(logo);
    return wrap;
  }

  _buildContent() {
    const wrap = DOM.create('div');

    const configs = {
      [USER_STATUS.AWAITING_ONBOARDING]: {
        emoji: '📅',
        title: 'Aguardando sua reunião inicial',
        subtitle: 'Sua vaga está reservada!',
        description: 'Em breve você receberá o link para a reunião de onboarding pelo WhatsApp ou e-mail. Nessa reunião, sua Guardiã vai te conhecer melhor e iniciar o programa.',
        steps: [
          { icon: '📱', text: 'Aguarde o contato da sua Guardiã' },
          { icon: '🎥', text: 'Participe da reunião pelo Google Meet' },
          { icon: '📋', text: 'Seu perfil será criado automaticamente' },
          { icon: '🍽️', text: 'Acesse o app e comece sua jornada' },
        ],
        cta: null,
      },
      [USER_STATUS.PENDING_BLOOD_TEST]: {
        emoji: '🩸',
        title: 'Envie seu exame de sangue',
        subtitle: 'Quase lá!',
        description: 'Sua Guardiã identificou que você tem um exame de sangue recente. Envie-o para que nossa IA possa pré-preencher seu Formulário de Saúde automaticamente.',
        steps: [
          { icon: '📁', text: 'Tenha o exame em PDF ou foto em mãos' },
          { icon: '🤖', text: 'A IA extrai os dados automaticamente' },
          { icon: '✅', text: 'Você confirma e complementa as informações' },
        ],
        cta: {
          label: '📎 Enviar meu exame de sangue',
          action: () => this.params.onNavigate?.('exam-upload'),
        },
      },
      [USER_STATUS.PROCESSING_BLOOD_TEST]: {
        emoji: '⚙️',
        title: 'Processando seu exame...',
        subtitle: 'Aguarde alguns instantes',
        description: 'Nossa IA está analisando seu exame de sangue e extraindo os dados. Isso pode levar de 1 a 3 minutos. Você pode fechar o app e voltará para o ponto certo.',
        steps: [
          { icon: '📊', text: 'Analisando marcadores metabólicos' },
          { icon: '🧪', text: 'Identificando HbA1c, glicose, lipídios...' },
          { icon: '📋', text: 'Pré-preenchendo seu Formulário de Saúde' },
        ],
        cta: null,
        showSpinner: true,
      },
      [USER_STATUS.EXAM_REQUEST_SENT]: {
        emoji: '📄',
        title: 'Pedido de exames enviado!',
        subtitle: 'Próximo passo: fazer os exames',
        description: 'Como você não tem um exame recente, geramos um pedido personalizado com todas as suas informações. Apresente-o ao seu médico para solicitar os exames.',
        steps: [
          { icon: '📥', text: 'Baixe seu pedido de exames' },
          { icon: '👨‍⚕️', text: 'Apresente ao seu médico' },
          { icon: '🔬', text: 'Faça os exames no laboratório' },
          { icon: '📎', text: 'Volte e envie o resultado aqui' },
        ],
        cta: this.examRequest ? {
          label: '📥 Baixar meu pedido de exames',
          action: () => window.open(this.examRequest.fileUrl, '_blank'),
        } : null,
        secondaryCta: {
          label: '📎 Já fiz os exames — enviar resultado',
          action: () => this.params.onNavigate?.('exam-upload'),
        },
      },
      [USER_STATUS.AWAITING_MENU_FORM]: {
        emoji: '🥗',
        title: 'Aguardando semana 3',
        subtitle: 'Formulário de Saúde completo ✅',
        description: 'Seu Formulário de Saúde foi preenchido com sucesso. Na semana 3, você receberá acesso ao Formulário Pré-Cardápio para que possamos gerar seu plano alimentar personalizado.',
        steps: [
          { icon: '✅', text: 'Formulário de Saúde — concluído' },
          { icon: '⏳', text: 'Semana 3 — Formulário Pré-Cardápio' },
          { icon: '🍽️', text: 'Semana 4 — Cardápio personalizado + Libre' },
        ],
        cta: null,
      },
    };

    const config = configs[this.status] || configs[USER_STATUS.AWAITING_ONBOARDING];

    // Emoji grande
    const emoji = DOM.create('div');
    emoji.style.cssText = 'font-size: 56px; margin-bottom: 16px; line-height: 1;';
    emoji.textContent = config.emoji;
    wrap.appendChild(emoji);

    if (config.showSpinner) {
      const spinner = DOM.create('div');
      spinner.style.cssText = `
        display: inline-block;
        width: 40px; height: 40px;
        border: 3px solid rgba(240,5,154,0.2);
        border-top-color: #f0059a;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      `;
      wrap.appendChild(spinner);
    }

    // Badge subtitle
    const subtitle = DOM.create('span');
    subtitle.style.cssText = `
      display: inline-block;
      background: rgba(240,5,154,0.12);
      color: #f0059a;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    `;
    subtitle.textContent = config.subtitle;
    wrap.appendChild(subtitle);

    const title = DOM.create('h1');
    title.style.cssText = `
      font-size: 22px;
      font-weight: 800;
      color: var(--color-text);
      margin: 0 0 12px;
      line-height: 1.3;
    `;
    title.textContent = config.title;
    wrap.appendChild(title);

    const desc = DOM.create('p');
    desc.style.cssText = `
      font-size: 14px;
      color: var(--color-muted);
      line-height: 1.6;
      margin: 0 0 28px;
    `;
    desc.textContent = config.description;
    wrap.appendChild(desc);

    // Steps
    if (config.steps?.length) {
      const stepsWrap = DOM.create('div');
      stepsWrap.style.cssText = `
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 24px;
        text-align: left;
      `;
      config.steps.forEach((step, i) => {
        const row = DOM.create('div');
        row.style.cssText = `
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          ${i < config.steps.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.04);' : ''}
        `;
        const icon = DOM.create('span');
        icon.style.cssText = 'font-size: 18px; flex-shrink: 0; width: 28px; text-align: center;';
        icon.textContent = step.icon;
        const text = DOM.create('span');
        text.style.cssText = 'font-size: 13px; color: var(--color-text); font-weight: 500;';
        text.textContent = step.text;
        row.appendChild(icon);
        row.appendChild(text);
        stepsWrap.appendChild(row);
      });
      wrap.appendChild(stepsWrap);
    }

    // CTAs
    if (config.cta) {
      const btn = UIComponents.primaryButton(config.cta.label);
      btn.style.cssText += 'width: 100%; margin-bottom: 12px;';
      btn.addEventListener('click', config.cta.action);
      wrap.appendChild(btn);
    }

    if (config.secondaryCta) {
      const btn2 = UIComponents.secondaryButton(config.secondaryCta.label);
      btn2.style.cssText += 'width: 100%;';
      btn2.addEventListener('click', config.secondaryCta.action);
      wrap.appendChild(btn2);
    }

    // Rodapé
    const footer = DOM.create('p');
    footer.style.cssText = 'font-size: 11px; color: var(--color-muted); margin-top: 24px; opacity: 0.6;';
    footer.textContent = 'Programa de Acompanhamento 4D · Bela Nutrição · Confidencial';
    wrap.appendChild(footer);

    return wrap;
  }
}
