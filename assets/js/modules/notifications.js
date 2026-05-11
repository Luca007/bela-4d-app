import { DOM } from '../utils/helpers.js';

class NotificationService {
  constructor() {
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    if (this.container) return;
    this.container = DOM.create('div', 'gmp-notifications');
    Object.assign(this.container.style, {
      position: 'fixed', top: '20px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', pointerEvents: 'none'
    });
    document.body.appendChild(this.container);
  }

  _createToastElement(text, opts = {}) {
    const type = opts.type || 'status';
    const palette = {
      error: { bg: '#ef4444', border: '#b91c1c', icon: '⛔' },
      warning: { bg: '#f59e0b', border: '#b45309', icon: '⚠️' },
      success: { bg: '#16a34a', border: '#15803d', icon: '✅' },
      status: { bg: '#2563eb', border: '#1d4ed8', icon: 'ℹ️' },
    };
    const tone = palette[type] || palette.status;

    const el = DOM.create('div', 'gmp-toast');
    Object.assign(el.style, {
      pointerEvents: 'auto',
      background: `linear-gradient(180deg, ${tone.bg}, ${tone.border})`,
      color: '#fff',
      padding: '10px 12px',
      borderRadius: '11px',
      boxShadow: '0 10px 28px rgba(0,0,0,0.42)',
      minWidth: '220px',
      maxWidth: '360px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      border: `1px solid ${tone.border}`,
      transition: 'transform 180ms ease, opacity 180ms ease',
      touchAction: 'pan-y',
      userSelect: 'none',
    });

    const icon = DOM.create('span');
    icon.textContent = tone.icon;
    Object.assign(icon.style, { fontSize: '16px', flexShrink: '0' });

    const message = DOM.create('div');
    message.textContent = text;
    Object.assign(message.style, { flex: '1', fontSize: '14px', lineHeight: '1.3', fontWeight: '700' });

    const closeBtn = DOM.create('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, {
      width: '22px',
      height: '22px',
      border: 'none',
      borderRadius: '6px',
      background: 'rgba(255,255,255,0.2)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '900',
      flexShrink: '0',
    });

    el.appendChild(icon);
    el.appendChild(message);
    el.appendChild(closeBtn);
    return { el, closeBtn };
  }

  _attachSwipeHandlers(el, onDismiss) {
    let pointerStartX = null;
    let deltaX = 0;

    el.addEventListener('pointerdown', event => {
      pointerStartX = event.clientX;
      deltaX = 0;
      el.setPointerCapture?.(event.pointerId);
    });

    el.addEventListener('pointermove', event => {
      if (pointerStartX === null) return;
      deltaX = event.clientX - pointerStartX;
      if (Math.abs(deltaX) > 2) {
        el.style.transform = `translateX(${deltaX}px)`;
      }
    });

    const finishSwipe = () => {
      if (pointerStartX === null) return;
      if (Math.abs(deltaX) > 90) onDismiss();
      else el.style.transform = 'translateX(0)';
      pointerStartX = null;
      deltaX = 0;
    };

    el.addEventListener('pointerup', finishSwipe);
    el.addEventListener('pointercancel', finishSwipe);
  }

  _scheduleAutoDismiss(el, duration, onDismiss) {
    setTimeout(() => {
      if (el.isConnected) onDismiss();
    }, duration);
  }

  // small toast
  toast(text, opts = {}) {
    const { el, closeBtn } = this._createToastElement(text, opts);

    const dismiss = () => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      window.setTimeout(() => el.remove(), 190);
    };

    closeBtn.addEventListener('click', dismiss);
    this._attachSwipeHandlers(el, dismiss);

    this.container.appendChild(el);
    this._scheduleAutoDismiss(el, opts.duration || 3200, dismiss);
  }

  // large achievement popup
  showAchievement({ icon = '🏆', title = 'Conquista', subtitle = '', xp = 0 } = {}) {
    const panel = DOM.create('div', 'gmp-ach');
    Object.assign(panel.style, { pointerEvents: 'auto', width: '340px', background: 'linear-gradient(180deg, rgba(240,5,154,0.98), rgba(192,2,124,0.95))', color: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 16px 50px rgba(0,0,0,0.6)', display: 'flex', gap: '12px', alignItems: 'center', transform: 'translateY(-10px)', opacity: '0', transition: 'transform 360ms cubic-bezier(.2,.9,.2,1), opacity 360ms ease' });

    const iconEl = DOM.create('div'); iconEl.textContent = icon; Object.assign(iconEl.style, { fontSize: '36px' });
    const txt = DOM.create('div');
    const t = DOM.create('div'); t.textContent = title; Object.assign(t.style, { fontWeight: 800, fontSize: '15px' });
    const s = DOM.create('div'); s.textContent = subtitle; Object.assign(s.style, { fontSize: '13px', opacity: 0.9 });
    const xpEl = DOM.create('div'); xpEl.textContent = xp ? `+${xp} XP` : ''; Object.assign(xpEl.style, { marginTop: '6px', fontWeight: 900, color: 'rgba(255,255,255,0.95)' });
    txt.appendChild(t); txt.appendChild(s); if (xp) txt.appendChild(xpEl);

    panel.appendChild(iconEl); panel.appendChild(txt);
    this.container.appendChild(panel);
    // animate in
    requestAnimationFrame(() => { panel.style.transform = 'translateY(0)'; panel.style.opacity = '1'; });
    // auto-dismiss
    setTimeout(() => { panel.style.opacity = '0'; panel.style.transform = 'translateY(-8px)'; }, 4200);
    setTimeout(() => panel.remove(), 4700);
  }

  // generic system notification modal overlay
  modal({ title = '', text = '', actions = [] } = {}) {
    const overlay = DOM.create('div', 'gmp-modal');
    Object.assign(overlay.style, { position: 'fixed', inset: 0, zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.48)' });
    const card = DOM.create('div'); Object.assign(card.style, { background: '#fff', color: '#111', borderRadius: '14px', padding: '18px', width: '440px', maxWidth: '92%' });
    const h = DOM.create('div'); h.textContent = title; Object.assign(h.style, { fontWeight: 800, fontSize: '18px', marginBottom: '8px' });
    const p = DOM.create('div'); p.textContent = text; Object.assign(p.style, { color: '#444', fontSize: '14px', marginBottom: '12px' });
    const actionRow = DOM.create('div'); Object.assign(actionRow.style, { display: 'flex', gap: '8px', justifyContent: 'flex-end' });
    actions.forEach(a => {
      const btn = DOM.create('button'); btn.textContent = a.label; Object.assign(btn.style, { padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' });
      btn.addEventListener('click', () => { a.onClick && a.onClick(); overlay.remove(); });
      actionRow.appendChild(btn);
    });
    card.appendChild(h); card.appendChild(p); card.appendChild(actionRow); overlay.appendChild(card); document.body.appendChild(overlay);
    return {
      close: () => overlay.remove()
    };
  }

  /**
   * Notifica COM persistência: dispara toast E grava em users/{uid}/notifications.
   * Idempotente em chamadas paralelas (não bloqueia o toast se a gravação falhar).
   *
   * @param {Object} opts
   *   uid       — string  (obrigatório para persistir; sem uid, só dispara toast)
   *   title     — string
   *   message   — string  (texto do toast)
   *   type      — 'success'|'error'|'warning'|'status'|'info'
   *   priority  — 'urgent'|'high'|'normal'|'low'
   *   payload   — qualquer dado contextual
   *   persist   — boolean (default: true)
   *   duration  — ms do toast (default: 3200)
   * @returns {Promise<{notificationId: string|null}>}
   */
  async notify({ uid, title, message, type = 'status', priority = 'normal', payload = null, persist = true, duration = 3200 } = {}) {
    if (message) this.toast(message, { type, duration });
    if (!persist || !uid) return { notificationId: null };

    try {
      const { firestoreService } = await import('../services/firestore.js');
      const id = await firestoreService.createNotification(uid, {
        title: title || message?.slice(0, 60) || 'Notificação',
        message: message || '',
        type,
        priority,
        channel: 'app',
        payload,
      });
      return { notificationId: id };
    } catch (error) {
      console.error('[NotificationService] notify persist error:', error);
      return { notificationId: null };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
