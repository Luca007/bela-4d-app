// Reusable UI components
import { DOM } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { createIconElement } from '../utils/icons.js';

export const UIComponents = {
  // Button components
  primaryButton(text, onClick = null) {
    const button = DOM.create('button', 'btn btn-primary');
    button.innerHTML = text;
    if (onClick) button.addEventListener('click', onClick);
    return button;
  },

  secondaryButton(text, onClick = null) {
    const button = DOM.create('button', 'btn btn-secondary');
    button.innerHTML = text;
    if (onClick) button.addEventListener('click', onClick);
    return button;
  },

  ghostButton(text, onClick = null) {
    const button = DOM.create('button', 'btn btn-ghost');
    button.innerHTML = text;
    if (onClick) button.addEventListener('click', onClick);
    return button;
  },

  // Input components
  textInput(placeholder = '', value = '') {
    const input = DOM.create('input', 'input-text');
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = value;
    return input;
  },

  emailInput(placeholder = '', value = '') {
    const input = DOM.create('input', 'input-text');
    input.type = 'email';
    input.placeholder = placeholder;
    input.value = value;
    return input;
  },

  passwordInput(placeholder = '', value = '') {
    const input = DOM.create('input', 'input-text');
    input.type = 'password';
    input.placeholder = placeholder;
    input.value = value;
    return input;
  },

  numberInput(placeholder = '', value = '') {
    const input = DOM.create('input', 'input-text');
    input.type = 'number';
    input.placeholder = placeholder;
    input.value = value;
    return input;
  },

  textarea(placeholder = '', value = '') {
    const textarea = DOM.create('textarea', 'input-textarea');
    textarea.placeholder = placeholder;
    textarea.value = value;
    return textarea;
  },

  // Label
  label(text) {
    const label = DOM.create('label', 'form-label');
    label.textContent = text;
    return label;
  },

  // Form group
  formGroup(labelText, input) {
    const group = DOM.create('div', 'form-group');
    if (labelText) {
      group.appendChild(this.label(labelText));
    }
    group.appendChild(input);
    return group;
  },

  // Card
  card(content, className = '') {
    const card = DOM.create('div', `card ${className}`);
    if (typeof content === 'string') {
      card.innerHTML = content;
    } else if (content && content.nodeType) {
      card.appendChild(content);
    }
    return card;
  },

  // Avatar
  avatar(emoji, color = Colors.pink, size = 44) {
    const avatar = DOM.create('div', 'avatar');
    DOM.setStyle(avatar, {
      width: size + 'px',
      height: size + 'px',
      background: `${color}22`,
      border: `2px solid ${color}55`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: (size * 0.5) + 'px',
      flexShrink: 0,
    });
    avatar.textContent = emoji;
    return avatar;
  },

  // Badge
  badge(text, color = Colors.pink) {
    const badge = DOM.create('span', 'badge');
    DOM.setStyle(badge, {
      background: `${color}20`,
      border: `1px solid ${color}44`,
      borderRadius: '6px',
      padding: '4px 10px',
      color: color,
      fontSize: '12px',
      fontWeight: '700',
      whiteSpace: 'nowrap',
    });
    badge.textContent = text;
    return badge;
  },

  // Progress bar
  progressBar(value, max = 100, color = Colors.pink) {
    const container = DOM.create('div', 'progress-bar-container');
    DOM.setStyle(container, {
      height: '6px',
      borderRadius: '3px',
      background: 'rgba(255,255,255,0.07)',
      overflow: 'hidden',
      width: '100%',
    });

    const bar = DOM.create('div', 'progress-bar-fill');
    const percentage = (value / max) * 100;
    DOM.setStyle(bar, {
      height: '100%',
      width: percentage + '%',
      borderRadius: '3px',
      background: `linear-gradient(90deg, ${color}, ${Colors.pink})`,
      animation: 'xpG 1.2s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: `0 0 8px ${color}66`,
      transition: 'width 0.3s ease',
    });

    container.appendChild(bar);
    return container;
  },

  // Modal/Dialog
  modal(title, content) {
    const modal = DOM.create('div', 'modal');
    const backdrop = DOM.create('div', 'modal-backdrop');
    const dialog = DOM.create('div', 'modal-dialog');

    const header = DOM.create('div', 'modal-header');
    const heading = DOM.create('h2');
    heading.textContent = title;
    header.appendChild(heading);

    const body = DOM.create('div', 'modal-body');
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }

    const closeBtn = DOM.create('button', 'modal-close');
    closeBtn.textContent = '✕';
    header.appendChild(closeBtn);

    dialog.appendChild(header);
    dialog.appendChild(body);

    modal.appendChild(backdrop);
    modal.appendChild(dialog);

    return { modal, dialog, backdrop, closeBtn };
  },

  // Toast notification
  toast(message, type = 'info') {
    const toast = DOM.create('div', `toast toast-${type}`);
    toast.textContent = message;
    DOM.setStyle(toast, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease',
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  /**
   * Coloca um botão em estado de loading (disable + spinner inline).
   * Retorna função `restore()` que devolve o botão ao estado original.
   * @param {HTMLButtonElement} btn
   * @param {string} loadingText texto durante o loading
   */
  setButtonLoading(btn, loadingText = 'Aguarde...') {
    if (!btn) return () => {};
    const originalHtml = btn.innerHTML;
    const originalDisabled = btn.disabled;
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span>${loadingText}`;
    return () => {
      btn.disabled = originalDisabled;
      btn.innerHTML = originalHtml;
    };
  },

  // Loading spinner
  spinner({ size = 18, color = null, thickness = 2.5 } = {}) {
    const spinner = DOM.create('div', 'spinner');
    const borderColor = color ? `${color}33` : 'rgba(255,255,255,0.3)';
    const topColor = color || '#fff';
    DOM.setStyle(spinner, {
      width: size + 'px',
      height: size + 'px',
      border: `${thickness}px solid ${borderColor}`,
      borderTopColor: topColor,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block',
    });
    return spinner;
  },

  // Full-screen loading overlay
  loaderOverlay({ message = '', color = null } = {}) {
    const overlay = DOM.create('div', 'loader-overlay');
    DOM.setStyle(overlay, {
      position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)',
    });
    const box = DOM.create('div', 'loader-box');
    DOM.setStyle(box, { padding: '18px 22px', borderRadius: '12px', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' });
    box.appendChild(this.spinner({ size: 36, color }));
    if (message) {
      const txt = DOM.create('div'); txt.textContent = message; DOM.setStyle(txt, { color: 'white', fontWeight: 700 }); box.appendChild(txt);
    }
    overlay.appendChild(box);
    return overlay;
  },

  // Tab component
  tabs(items) {
    const container = DOM.create('div', 'tabs-container');
    const tabButtons = DOM.create('div', 'tabs-buttons');

    items.forEach((item, index) => {
      const btn = DOM.create('button', 'tab-button');
      btn.textContent = item.label;
      btn.dataset.tabId = item.id;
      if (index === 0) btn.classList.add('active');
      tabButtons.appendChild(btn);
    });

    const tabPanes = DOM.create('div', 'tabs-panes');
    items.forEach((item, index) => {
      const pane = DOM.create('div', 'tab-pane');
      pane.dataset.tabId = item.id;
      if (index === 0) pane.classList.add('active');
      if (typeof item.content === 'string') {
        pane.innerHTML = item.content;
      } else {
        pane.appendChild(item.content);
      }
      tabPanes.appendChild(pane);
    });

    container.appendChild(tabButtons);
    container.appendChild(tabPanes);

    return container;
  },

  // Stat card (accepts either positional arguments or a single options object)
  statCard(labelOrOptions, value, unit = '', icon = '', color = Colors.pink) {
    let label = '';
    let val = '';
    let optUnit = unit;
    let optIcon = icon;
    let optColor = color;

    if (labelOrOptions && typeof labelOrOptions === 'object') {
      const opts = labelOrOptions;
      label = opts.label || '';
      val = opts.value || '';
      optUnit = opts.unit || '';
      optIcon = opts.icon || '';
      optColor = opts.color || Colors.pink;
    } else {
      label = labelOrOptions;
      val = value;
    }

    const card = DOM.create('div', 'stat-card');
    DOM.setStyle(card, {
      background: Colors.glass,
      border: `1px solid ${Colors.border}`,
      borderRadius: '16px',
      padding: '16px 14px',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
    });

    const header = DOM.create('div');
    DOM.setStyle(header, {
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      marginBottom: '10px',
    });

    if (icon) {
      const iconEl = DOM.create('span');
      iconEl.innerHTML = icon;
      DOM.setStyle(iconEl, { color });
      header.appendChild(iconEl);
    }

    const labelEl = DOM.create('span');
    labelEl.textContent = label;
    DOM.setStyle(labelEl, {
      color: Colors.muted,
      fontSize: '12px',
      fontWeight: '600',
    });
    header.appendChild(labelEl);

    const valueEl = DOM.create('div');
    DOM.setStyle(valueEl, {
      color: Colors.text,
      fontSize: '22px',
      fontWeight: '800',
      lineHeight: '1',
    });
    valueEl.innerHTML = `${val}<span style="font-size:11px;color:${Colors.muted};margin-left:2px">${optUnit}</span>`;

    card.appendChild(header);
    card.appendChild(valueEl);

    return card;
  },
};

export default UIComponents;
