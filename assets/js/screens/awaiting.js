/**
 * AwaitingScreen — Programa 4D
 *
 * Exibida quando o usuário está aguardando a reunião de onboarding
 * (status: awaiting_onboarding) ou quando o pedido de exame foi gerado
 * (status: exam_request_sent) ou ainda quando o exame está processando.
 *
 * Para AWAITING_ONBOARDING, se a reunião ainda não foi agendada, exibe
 * um seletor de data e horário. Após agendar, exibe a confirmação.
 */

import { DOM, State, Session } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { USER_STATUS } from '../config/constants.js';
import { firestoreService } from '../services/firestore.js';

export class AwaitingScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.status = params.status || USER_STATUS.AWAITING_ONBOARDING;
    this.examRequest = params.examRequest || null;
    this.meeting = null;            // preenchido em mount()
    this.isSchedulingMeeting = false;
    this._destroyed = false;

    // Estado do calendário interativo
    const now = new Date();
    this.viewMonth = now.getMonth();
    this.viewYear = now.getFullYear();
    this.selectedDate = null;       // 'YYYY-MM-DD'
    this.selectedTime = null;       // 'HH:MM'
  }

  async mount() {
    this.container = DOM.byId('app');
    if (this.container) this.container.innerHTML = '';

    // Para o status awaiting_onboarding, carregamos a info de reunião
    // antes de renderizar (vem do userProfile.meeting).
    if (this.status === USER_STATUS.AWAITING_ONBOARDING) {
      this.meeting = await this._loadMeeting();
      if (this._destroyed) return;
    }

    this.element = this.render();
    if (this.container) this.container.appendChild(this.element);
  }

  destroy() {
    this._destroyed = true;
    if (this.element) this.element.remove();
  }

  async _loadMeeting() {
    try {
      let profile = State.get?.('userProfile') || null;
      if (!profile?.meeting) {
        const uid = Session.get?.('userId');
        if (uid && firestoreService?.getUserProfile) {
          profile = await firestoreService.getUserProfile(uid);
          if (profile) State.set?.('userProfile', profile);
        }
      }
      return profile?.meeting || null;
    } catch (e) {
      console.warn('[AwaitingScreen] _loadMeeting failed:', e);
      return null;
    }
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

    const logo = this._createLogo();
    card.appendChild(logo);

    // Para AWAITING_ONBOARDING sem reunião agendada → mostrar scheduler
    if (
      this.status === USER_STATUS.AWAITING_ONBOARDING &&
      !this._hasActiveMeeting()
    ) {
      card.appendChild(this._buildScheduleForm());
    } else {
      card.appendChild(this._buildContent());
    }

    screen.appendChild(card);
    return screen;
  }

  _hasActiveMeeting() {
    return !!(this.meeting && this.meeting.scheduledFor &&
              this.meeting.status !== 'cancelled');
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

  // ─────────────────────────────────────────────
  // Formulário de agendamento
  // ─────────────────────────────────────────────

  _buildScheduleForm() {
    const wrap = DOM.create('div');

    const emoji = DOM.create('div');
    emoji.style.cssText = 'font-size: 56px; margin-bottom: 16px; line-height: 1;';
    emoji.textContent = '🗓️';
    wrap.appendChild(emoji);

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
    subtitle.textContent = 'Bem-vinda ao Programa 4D!';
    wrap.appendChild(subtitle);

    const title = DOM.create('h1');
    title.style.cssText = `
      font-size: 22px;
      font-weight: 800;
      color: var(--color-text);
      margin: 0 0 12px;
      line-height: 1.3;
    `;
    title.textContent = 'Agende sua reunião inicial';
    wrap.appendChild(title);

    const desc = DOM.create('p');
    desc.style.cssText = `
      font-size: 14px;
      color: var(--color-muted);
      line-height: 1.6;
      margin: 0 0 20px;
    `;
    desc.textContent = 'Escolha a data e o horário em que sua Guardiã pode te encontrar pelo Google Meet. A reunião dura cerca de 40 minutos.';
    wrap.appendChild(desc);

    // ─── PASSO 1: Entrada rápida (data + hora nativas) — em destaque ───
    const step1Label = DOM.create('div');
    step1Label.style.cssText = `
      display: inline-flex; align-items: center; gap: 6px;
      background: #f0059a; color: #fff;
      padding: 3px 10px; border-radius: 20px;
      font-size: 10px; font-weight: 800;
      letter-spacing: 0.6px; text-transform: uppercase;
      margin-bottom: 8px;
    `;
    step1Label.textContent = '① Escolha data e horário';
    wrap.appendChild(step1Label);

    const quickEntry = DOM.create('div');
    quickEntry.id = 'meeting-quick-entry';
    quickEntry.style.cssText = `
      background: rgba(240,5,154,0.06);
      border: 2px solid rgba(240,5,154,0.35);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
      text-align: left;
      box-shadow: 0 0 24px rgba(240,5,154,0.08);
    `;
    wrap.appendChild(quickEntry);

    // ─── Resumo da seleção ───
    const summary = DOM.create('div');
    summary.id = 'meeting-summary';
    summary.style.cssText = `
      background: rgba(240,5,154,0.08);
      border: 1px solid rgba(240,5,154,0.25);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 16px;
      text-align: left;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    `;
    wrap.appendChild(summary);

    // ─── PASSO 2: Calendário em grade (alternativa visual) ───
    const step2Label = DOM.create('div');
    step2Label.style.cssText = `
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.08); color: var(--color-muted);
      padding: 3px 10px; border-radius: 20px;
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.6px; text-transform: uppercase;
      margin-bottom: 8px;
    `;
    step2Label.textContent = '② Ou navegue pelo calendário';
    wrap.appendChild(step2Label);

    const calendar = DOM.create('div');
    calendar.id = 'meeting-calendar';
    calendar.style.cssText = `
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 16px;
    `;
    wrap.appendChild(calendar);

    // ─── Time-slot picker ───
    const timeWrap = DOM.create('div');
    timeWrap.id = 'meeting-times';
    timeWrap.style.cssText = 'margin-bottom: 16px; text-align: left;';
    wrap.appendChild(timeWrap);

    // ─── Mensagem de erro inline ───
    const errorMsg = DOM.create('div');
    errorMsg.id = 'meeting-error';
    errorMsg.style.cssText = `
      display: none;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      color: #ef4444;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 14px;
      text-align: left;
    `;
    wrap.appendChild(errorMsg);

    // ─── Botão de agendamento ───
    const btn = UIComponents.primaryButton('🗓️ Agendar reunião');
    btn.id = 'schedule-meeting-btn';
    btn.style.cssText += 'width: 100%; margin-bottom: 8px;';
    btn.addEventListener('click', () => this._submitMeeting(btn, errorMsg));
    wrap.appendChild(btn);

    // Nota explicativa
    const hint = DOM.create('p');
    hint.style.cssText = 'font-size: 11px; color: var(--color-muted); margin-top: 8px; line-height: 1.5;';
    hint.textContent = 'Você poderá reagendar caso precise. Sua Guardiã enviará o link da reunião por e-mail ou WhatsApp.';
    wrap.appendChild(hint);

    // Renderiza os componentes interativos no DOM já anexado
    this._renderQuickEntry(quickEntry);
    this._renderCalendar(calendar);
    this._renderTimeSlots(timeWrap);
    this._renderSelectionSummary(summary);

    return wrap;
  }

  // ─────────────────────────────────────────────
  // Entrada rápida (date + time inputs)
  // ─────────────────────────────────────────────

  _renderQuickEntry(host) {
    host.innerHTML = '';
    const { minDate, maxDate } = this._scheduleBounds();

    const title = DOM.create('div');
    title.style.cssText = `
      font-size: 14px; font-weight: 800; color: var(--color-text);
      margin-bottom: 4px;
    `;
    title.textContent = '⚡ Quando você prefere conversar?';
    host.appendChild(title);

    const hint = DOM.create('div');
    hint.style.cssText = 'font-size: 12px; color: var(--color-muted); margin-bottom: 12px; line-height: 1.4;';
    hint.textContent = 'Selecione a data e o horário (seg a sex, 08:00 às 17:30, slots de 30 min).';
    host.appendChild(hint);

    const row = DOM.create('div');
    row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px;';

    // ─── Date input ───
    const dateWrap = DOM.create('div');
    const dateLabel = DOM.create('label');
    dateLabel.style.cssText = 'display: block; font-size: 11px; color: var(--color-muted); margin-bottom: 4px; font-weight: 600;';
    dateLabel.textContent = '📅 Data';
    dateLabel.htmlFor = 'meeting-date-input';
    dateWrap.appendChild(dateLabel);

    const dateInput = DOM.create('input');
    dateInput.type = 'date';
    dateInput.id = 'meeting-date-input';
    dateInput.min = this._fmtIso(minDate);
    dateInput.max = this._fmtIso(maxDate);
    if (this.selectedDate) dateInput.value = this.selectedDate;
    dateInput.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      box-sizing: border-box;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      outline: none;
      cursor: pointer;
      color-scheme: dark;
    `;
    dateInput.addEventListener('focus', () => dateInput.style.borderColor = '#f0059a');
    dateInput.addEventListener('blur', () => dateInput.style.borderColor = 'rgba(255,255,255,0.1)');
    dateInput.addEventListener('change', () => this._onQuickDateChange(dateInput));
    dateWrap.appendChild(dateInput);
    row.appendChild(dateWrap);

    // ─── Time input ───
    const timeWrap = DOM.create('div');
    const timeLabel = DOM.create('label');
    timeLabel.style.cssText = 'display: block; font-size: 11px; color: var(--color-muted); margin-bottom: 4px; font-weight: 600;';
    timeLabel.textContent = '🕐 Horário';
    timeLabel.htmlFor = 'meeting-time-input';
    timeWrap.appendChild(timeLabel);

    const timeInput = DOM.create('input');
    timeInput.type = 'time';
    timeInput.id = 'meeting-time-input';
    timeInput.min = '08:00';
    timeInput.max = '17:30';
    timeInput.step = '1800'; // 30 min
    if (this.selectedTime) timeInput.value = this.selectedTime;
    timeInput.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      box-sizing: border-box;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      outline: none;
      cursor: pointer;
      color-scheme: dark;
    `;
    timeInput.addEventListener('focus', () => timeInput.style.borderColor = '#f0059a');
    timeInput.addEventListener('blur', () => timeInput.style.borderColor = 'rgba(255,255,255,0.1)');
    timeInput.addEventListener('change', () => this._onQuickTimeChange(timeInput));
    timeWrap.appendChild(timeInput);
    row.appendChild(timeWrap);

    host.appendChild(row);

    const quickError = DOM.create('div');
    quickError.id = 'meeting-quick-error';
    quickError.style.cssText = `
      display: none;
      margin-top: 8px;
      font-size: 11px;
      color: #ef4444;
      font-weight: 600;
    `;
    host.appendChild(quickError);
  }

  _showQuickError(msg) {
    const el = document.getElementById('meeting-quick-error');
    if (!el) return;
    if (!msg) {
      el.style.display = 'none';
      el.textContent = '';
    } else {
      el.style.display = 'block';
      el.textContent = msg;
    }
  }

  _onQuickDateChange(input) {
    const iso = input.value;
    if (!iso) {
      this.selectedDate = null;
      this.selectedTime = null;
      this._refreshScheduleUI();
      return;
    }
    const { minDate, maxDate } = this._scheduleBounds();
    const d = new Date(`${iso}T00:00`);
    if (Number.isNaN(d.getTime())) {
      this._showQuickError('Data inválida.');
      input.value = this.selectedDate || '';
      return;
    }
    if (d < this._stripTime(minDate)) {
      this._showQuickError(`Data muito próxima. Mínimo: ${this._fmtIso(minDate)}.`);
      input.value = this.selectedDate || '';
      return;
    }
    if (d > this._stripTime(maxDate)) {
      this._showQuickError(`Data muito distante. Máximo: ${this._fmtIso(maxDate)}.`);
      input.value = this.selectedDate || '';
      return;
    }
    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      this._showQuickError('Atendimentos apenas em dias úteis (seg a sex).');
      input.value = this.selectedDate || '';
      return;
    }
    this._showQuickError(null);
    this.selectedDate = iso;
    this.viewMonth = d.getMonth();
    this.viewYear = d.getFullYear();
    // Reset time se não estiver mais disponível para a nova data
    if (this.selectedTime) {
      const slots = this._availableTimeSlots(iso);
      if (!slots.includes(this.selectedTime)) this.selectedTime = null;
    }
    this._refreshScheduleUI();
  }

  _onQuickTimeChange(input) {
    const t = input.value;
    if (!t) {
      this.selectedTime = null;
      this._refreshScheduleUI();
      return;
    }
    if (!this.selectedDate) {
      this._showQuickError('Selecione a data antes do horário.');
      input.value = '';
      return;
    }
    // Normaliza para slot de 30 min
    const [hh, mm] = t.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) {
      this._showQuickError('Horário inválido.');
      input.value = this.selectedTime || '';
      return;
    }
    const normMin = mm < 15 ? 0 : (mm < 45 ? 30 : 0);
    const normHour = mm >= 45 ? hh + 1 : hh;
    const normalized = `${String(normHour).padStart(2,'0')}:${String(normMin).padStart(2,'0')}`;

    const slots = this._availableTimeSlots(this.selectedDate);
    if (!slots.includes(normalized)) {
      this._showQuickError('Horário fora da janela disponível (08:00–17:30, slots de 30min).');
      input.value = this.selectedTime || '';
      return;
    }
    this._showQuickError(null);
    this.selectedTime = normalized;
    input.value = normalized;
    this._refreshScheduleUI();
  }

  _refreshScheduleUI() {
    // Re-sincroniza calendário, slots e summary com o estado atual,
    // sem re-renderizar o quick entry (preserva foco do input).
    const quick = document.getElementById('meeting-quick-entry');
    const cal = document.getElementById('meeting-calendar');
    const times = document.getElementById('meeting-times');
    const summary = document.getElementById('meeting-summary');
    if (cal) this._renderCalendar(cal);
    if (times) this._renderTimeSlots(times);
    if (summary) this._renderSelectionSummary(summary);
    // Atualiza os inputs (sem disparar evento de change)
    if (quick) {
      const dInput = quick.querySelector('#meeting-date-input');
      const tInput = quick.querySelector('#meeting-time-input');
      if (dInput) dInput.value = this.selectedDate || '';
      if (tInput) tInput.value = this.selectedTime || '';
    }
  }

  // ─────────────────────────────────────────────
  // Calendário em grade
  // ─────────────────────────────────────────────

  _renderCalendar(host) {
    host.innerHTML = '';
    const { minDate, maxDate } = this._scheduleBounds();

    // Cabeçalho com nome do mês + setas
    const header = DOM.create('div');
    header.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    `;

    const monthLabel = DOM.create('div');
    monthLabel.style.cssText = `
      font-size: 14px; font-weight: 800; color: var(--color-text);
      text-transform: capitalize;
    `;
    const monthName = new Date(this.viewYear, this.viewMonth, 1)
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    monthLabel.textContent = monthName;

    const prevBtn = this._navButton('‹', () => this._shiftMonth(-1, host));
    const nextBtn = this._navButton('›', () => this._shiftMonth(1, host));

    // Desativa setas fora dos limites
    const firstOfView = new Date(this.viewYear, this.viewMonth, 1);
    const lastOfView = new Date(this.viewYear, this.viewMonth + 1, 0);
    if (lastOfView < minDate) prevBtn.disabled = nextBtn.disabled = false;
    if (firstOfView <= new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
      prevBtn.disabled = true;
      prevBtn.style.opacity = '0.3';
      prevBtn.style.cursor = 'not-allowed';
    }
    if (firstOfView >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
      nextBtn.disabled = true;
      nextBtn.style.opacity = '0.3';
      nextBtn.style.cursor = 'not-allowed';
    }

    header.appendChild(prevBtn);
    header.appendChild(monthLabel);
    header.appendChild(nextBtn);
    host.appendChild(header);

    // Cabeçalho dos dias da semana
    const weekdayRow = DOM.create('div');
    weekdayRow.style.cssText = `
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
      margin-bottom: 6px;
    `;
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach((d, i) => {
      const cell = DOM.create('div');
      cell.style.cssText = `
        text-align: center; font-size: 11px; font-weight: 700;
        color: ${i === 0 || i === 6 ? 'rgba(239,68,68,0.6)' : 'var(--color-muted)'};
        padding: 4px 0;
      `;
      cell.textContent = d;
      weekdayRow.appendChild(cell);
    });
    host.appendChild(weekdayRow);

    // Grade de dias
    const grid = DOM.create('div');
    grid.style.cssText = `
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
    `;

    const firstDayOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const startOffset = firstDayOfMonth.getDay(); // 0=dom

    // Células vazias antes do dia 1
    for (let i = 0; i < startOffset; i++) {
      const empty = DOM.create('div');
      grid.appendChild(empty);
    }

    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.viewYear, this.viewMonth, d);
      const dow = date.getDay();
      const iso = this._fmtIso(date);

      const cell = DOM.create('button');
      cell.type = 'button';
      cell.textContent = String(d);
      cell.dataset.date = iso;

      const isWeekend = dow === 0 || dow === 6;
      const isBeforeMin = date < this._stripTime(minDate);
      const isAfterMax = date > this._stripTime(maxDate);
      const isDisabled = isWeekend || isBeforeMin || isAfterMax;
      const isSelected = this.selectedDate === iso;

      cell.style.cssText = `
        aspect-ratio: 1;
        border-radius: 8px; font-size: 13px; font-weight: 600;
        border: 1px solid ${isSelected ? '#f0059a' : 'rgba(255,255,255,0.06)'};
        background: ${isSelected ? '#f0059a' : (isDisabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)')};
        color: ${isSelected ? '#fff' : (isDisabled ? 'rgba(255,255,255,0.18)' : 'var(--color-text)')};
        cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
        transition: all 0.15s;
        font-family: inherit;
        padding: 0;
      `;

      if (!isDisabled) {
        cell.addEventListener('click', () => {
          this.selectedDate = iso;
          // Resetar horário se a data mudou
          if (this.selectedTime) {
            const slots = this._availableTimeSlots(iso);
            if (!slots.includes(this.selectedTime)) this.selectedTime = null;
          }
          this._renderCalendar(host);
          const sumEl = document.getElementById('meeting-summary');
          if (sumEl) this._renderSelectionSummary(sumEl);
          const timesEl = document.getElementById('meeting-times');
          if (timesEl) this._renderTimeSlots(timesEl);
          // Sincroniza com inputs de entrada rápida
          const dInput = document.getElementById('meeting-date-input');
          const tInput = document.getElementById('meeting-time-input');
          if (dInput) dInput.value = this.selectedDate || '';
          if (tInput) tInput.value = this.selectedTime || '';
        });
        cell.addEventListener('mouseenter', () => {
          if (!isSelected) cell.style.background = 'rgba(240,5,154,0.18)';
        });
        cell.addEventListener('mouseleave', () => {
          if (!isSelected) cell.style.background = 'rgba(255,255,255,0.04)';
        });
      } else {
        cell.disabled = true;
      }

      grid.appendChild(cell);
    }

    host.appendChild(grid);
  }

  _navButton(label, onClick) {
    const b = DOM.create('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = `
      width: 32px; height: 32px; border-radius: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--color-text); font-size: 18px; font-weight: 700;
      cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    `;
    b.addEventListener('click', onClick);
    b.addEventListener('mouseenter', () => { if (!b.disabled) b.style.borderColor = '#f0059a'; });
    b.addEventListener('mouseleave', () => { b.style.borderColor = 'rgba(255,255,255,0.1)'; });
    return b;
  }

  _shiftMonth(delta, host) {
    let m = this.viewMonth + delta;
    let y = this.viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    this.viewMonth = m;
    this.viewYear = y;
    this._renderCalendar(host);
  }

  _renderTimeSlots(host) {
    host.innerHTML = '';
    const label = DOM.create('div');
    label.style.cssText = `
      font-size: 13px; font-weight: 700; color: var(--color-text);
      margin-bottom: 8px;
    `;
    label.textContent = '🕐 Horário';
    host.appendChild(label);

    if (!this.selectedDate) {
      const hint = DOM.create('div');
      hint.style.cssText = `
        font-size: 12px; color: var(--color-muted);
        padding: 12px; background: rgba(255,255,255,0.03);
        border: 1px dashed rgba(255,255,255,0.1);
        border-radius: 8px; text-align: center;
      `;
      hint.textContent = 'Selecione uma data primeiro';
      host.appendChild(hint);
      return;
    }

    const slots = this._availableTimeSlots(this.selectedDate);
    const grid = DOM.create('div');
    grid.style.cssText = `
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    `;
    if (!slots.length) {
      const empty = DOM.create('div');
      empty.style.cssText = `
        grid-column: 1 / -1;
        font-size: 12px; color: var(--color-muted);
        padding: 12px; text-align: center;
        background: rgba(255,255,255,0.03);
        border-radius: 8px;
      `;
      empty.textContent = 'Nenhum horário disponível nesta data.';
      grid.appendChild(empty);
    }
    slots.forEach(t => {
      const isSelected = this.selectedTime === t;
      const b = DOM.create('button');
      b.type = 'button';
      b.textContent = t;
      b.dataset.time = t;
      b.style.cssText = `
        padding: 10px 6px; border-radius: 8px;
        font-size: 13px; font-weight: 700; font-family: inherit;
        border: 1px solid ${isSelected ? '#f0059a' : 'rgba(255,255,255,0.1)'};
        background: ${isSelected ? '#f0059a' : 'rgba(255,255,255,0.05)'};
        color: ${isSelected ? '#fff' : 'var(--color-text)'};
        cursor: pointer; transition: all 0.15s;
      `;
      b.addEventListener('click', () => {
        this.selectedTime = t;
        this._renderTimeSlots(host);
        const sumEl = document.getElementById('meeting-summary');
        if (sumEl) this._renderSelectionSummary(sumEl);
        // Sincroniza input de hora
        const tInput = document.getElementById('meeting-time-input');
        if (tInput) tInput.value = this.selectedTime || '';
      });
      b.addEventListener('mouseenter', () => {
        if (!isSelected) b.style.borderColor = '#f0059a';
      });
      b.addEventListener('mouseleave', () => {
        if (!isSelected) b.style.borderColor = 'rgba(255,255,255,0.1)';
      });
      grid.appendChild(b);
    });
    host.appendChild(grid);
  }

  _renderSelectionSummary(host) {
    host.innerHTML = '';
    const labelDiv = DOM.create('div');
    labelDiv.style.cssText = `
      font-size: 10px; color: #f0059a; font-weight: 800;
      letter-spacing: 0.5px; text-transform: uppercase;
      margin-bottom: 4px;
    `;
    labelDiv.textContent = 'Sua seleção';

    const valDiv = DOM.create('div');
    valDiv.style.cssText = `
      font-size: 14px; color: var(--color-text); font-weight: 700;
    `;
    if (this.selectedDate && this.selectedTime) {
      const d = new Date(`${this.selectedDate}T${this.selectedTime}`);
      const data = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
      valDiv.textContent = `${data} às ${this.selectedTime}`;
    } else if (this.selectedDate) {
      const d = new Date(`${this.selectedDate}T00:00`);
      const data = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
      valDiv.textContent = `${data} — escolha um horário`;
      valDiv.style.textTransform = 'capitalize';
    } else {
      valDiv.textContent = 'Escolha data e horário';
      valDiv.style.color = 'var(--color-muted)';
      valDiv.style.fontWeight = '600';
    }

    const left = DOM.create('div');
    left.appendChild(labelDiv);
    left.appendChild(valDiv);
    host.appendChild(left);

    const ic = DOM.create('div');
    ic.style.cssText = 'font-size: 22px;';
    ic.textContent = (this.selectedDate && this.selectedTime) ? '✅' : '🗓️';
    host.appendChild(ic);
  }

  _availableTimeSlots(isoDate) {
    // Slots de 30 em 30 min entre 08:00 e 17:30
    const all = [];
    for (let h = 8; h < 18; h++) {
      all.push(`${String(h).padStart(2,'0')}:00`);
      all.push(`${String(h).padStart(2,'0')}:30`);
    }
    // Se data == hoje, filtra slots já passados (com folga de 1h)
    const today = new Date();
    const todayIso = this._fmtIso(today);
    if (isoDate === todayIso) {
      const cutoff = today.getHours() + 1 + (today.getMinutes() >= 30 ? 0.5 : 0);
      return all.filter(t => {
        const [hh, mm] = t.split(':').map(Number);
        return hh + (mm / 60) >= cutoff;
      });
    }
    return all;
  }

  _stripTime(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  _fmtIso(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  _scheduleBounds() {
    // Mínimo: amanhã (dá tempo da Guardiã confirmar)
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1);
    // Pula fim de semana — força para segunda
    const day = minDate.getDay();
    if (day === 0) minDate.setDate(minDate.getDate() + 1); // dom → seg
    if (day === 6) minDate.setDate(minDate.getDate() + 2); // sáb → seg

    // Máximo: 30 dias à frente
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    return { minDate, maxDate };
  }

  async _submitMeeting(btn, errorMsg) {
    if (this.isSchedulingMeeting) return;

    const showError = (msg) => {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    };
    const clearError = () => {
      errorMsg.style.display = 'none';
      errorMsg.textContent = '';
    };
    clearError();

    const date = this.selectedDate;
    const time = this.selectedTime;

    if (!date) { showError('Selecione uma data no calendário.'); return; }
    if (!time) { showError('Selecione um horário disponível.'); return; }

    const dt = new Date(`${date}T${time}`);
    if (Number.isNaN(dt.getTime())) {
      showError('Data ou horário inválido.');
      return;
    }
    if (dt.getTime() < Date.now()) {
      showError('Escolha uma data e horário no futuro.');
      return;
    }
    const dow = dt.getDay();
    if (dow === 0 || dow === 6) {
      showError('Atendimentos apenas em dias úteis (segunda a sexta).');
      return;
    }
    const hour = dt.getHours();
    if (hour < 8 || hour >= 18) {
      showError('Horário disponível: 08:00 às 18:00.');
      return;
    }

    const uid = Session.get?.('userId');
    if (!uid) {
      showError('Sessão expirou. Faça login novamente.');
      return;
    }

    this.isSchedulingMeeting = true;
    const restoreBtn = UIComponents.setButtonLoading?.(btn, 'Agendando…') || null;

    try {
      const isoLocal = `${date}T${time}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const ok = await firestoreService.scheduleOnboardingMeeting(uid, isoLocal, tz);
      if (!ok) {
        showError('Não foi possível agendar. Tente novamente.');
        return;
      }
      this.meeting = {
        scheduledFor: isoLocal,
        scheduledAt: new Date().toISOString(),
        timezone: tz,
        status: 'scheduled',
      };
      const profile = State.get?.('userProfile') || {};
      State.set?.('userProfile', { ...profile, meeting: this.meeting });
      if (this.container && !this._destroyed) {
        this.container.innerHTML = '';
        this.element = this.render();
        this.container.appendChild(this.element);
      }
    } catch (e) {
      console.error('[AwaitingScreen] schedule failed:', e);
      showError('Erro ao agendar. Verifique sua conexão e tente novamente.');
    } finally {
      this.isSchedulingMeeting = false;
      if (restoreBtn) restoreBtn();
    }
  }

  // ─────────────────────────────────────────────
  // Tela de confirmação / aguardando
  // ─────────────────────────────────────────────

  _buildContent() {
    const wrap = DOM.create('div');

    const configs = {
      [USER_STATUS.AWAITING_ONBOARDING]: {
        emoji: '📅',
        title: 'Reunião agendada!',
        subtitle: this._formatMeetingBadge(),
        description: 'Sua reunião inicial está confirmada. Em breve, sua Guardiã enviará o link da reunião pelo Google Meet por e-mail ou WhatsApp.',
        steps: [
          { icon: '📱', text: 'Aguarde o contato da sua Guardiã' },
          { icon: '🎥', text: 'Participe da reunião pelo Google Meet' },
          { icon: '📋', text: 'Seu perfil será criado automaticamente' },
          { icon: '🍽️', text: 'Acesse o app e comece sua jornada' },
        ],
        cta: null,
        secondaryCta: this._hasActiveMeeting() ? {
          label: '🔄 Reagendar reunião',
          action: async () => {
            const uid = Session.get?.('userId');
            if (!uid) return;
            const confirmed = window.confirm?.('Deseja cancelar e reagendar a reunião?') ?? true;
            if (!confirmed) return;
            await firestoreService.cancelOnboardingMeeting(uid);
            this.meeting = null;
            const profile = State.get?.('userProfile') || {};
            State.set?.('userProfile', { ...profile, meeting: null });
            if (this.container && !this._destroyed) {
              this.container.innerHTML = '';
              this.element = this.render();
              this.container.appendChild(this.element);
            }
          },
        } : null,
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
          action: async () => {
            try {
              const { n8nService } = await import('../services/n8n.js');
              const uid = (await import('../services/auth.js')).authService.getCurrentUser()?.uid;
              if (!uid) return window.open(this.examRequest.fileUrl || '#', '_blank');
              const loader = document.createElement('div');
              loader.textContent = 'Preparando pedido...';
              loader.style.cssText = 'position:fixed;right:20px;top:20px;padding:8px 12px;background:#111;color:#fff;border-radius:8px;z-index:99999;';
              document.body.appendChild(loader);
              const res = await n8nService.downloadExamPdf(uid, this.examRequest.id);
              loader.remove();
              const fileUrl = res?.fileUrl || this.examRequest.fileUrl;
              if (fileUrl) {
                const a = document.createElement('a');
                a.href = fileUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.download = '';
                document.body.appendChild(a); a.click(); a.remove();
              } else {
                window.open(this.examRequest.fileUrl || '#', '_blank');
              }
            } catch (e) {
              console.error('download exam failed', e);
              window.open(this.examRequest.fileUrl || '#', '_blank');
            }
          }
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
      const spinnerWrap = DOM.create('div');
      spinnerWrap.style.cssText = 'display: flex; justify-content: center; margin-bottom: 20px;';
      const spinner = DOM.create('div');
      spinner.style.cssText = `
        width: 40px; height: 40px;
        border: 3px solid rgba(240,5,154,0.2);
        border-top-color: #f0059a;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `;
      spinnerWrap.appendChild(spinner);
      wrap.appendChild(spinnerWrap);
    }

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

    if (this.status === USER_STATUS.AWAITING_ONBOARDING && this._hasActiveMeeting()) {
      wrap.appendChild(this._buildMeetingDateCard());
    }

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

    const footer = DOM.create('p');
    footer.style.cssText = 'font-size: 11px; color: var(--color-muted); margin-top: 24px; opacity: 0.6;';
    footer.textContent = 'Programa de Acompanhamento 4D · Bela Nutrição · Confidencial';
    wrap.appendChild(footer);

    return wrap;
  }

  _formatMeetingBadge() {
    if (!this._hasActiveMeeting()) return 'Sua vaga está reservada!';
    try {
      const d = new Date(this.meeting.scheduledFor);
      const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `${data} às ${hora}`;
    } catch {
      return 'Reunião agendada';
    }
  }

  _buildMeetingDateCard() {
    const card = DOM.create('div');
    card.style.cssText = `
      background: rgba(240,5,154,0.08);
      border: 1px solid rgba(240,5,154,0.3);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      text-align: left;
      display: flex; align-items: center; gap: 14px;
    `;
    const ic = DOM.create('div');
    ic.style.cssText = 'font-size: 28px; flex-shrink: 0;';
    ic.textContent = '🗓️';
    const txt = DOM.create('div');
    txt.style.flex = '1';
    const label = DOM.create('div');
    label.style.cssText = 'font-size: 11px; color: #f0059a; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px;';
    label.textContent = 'Sua reunião';
    const val = DOM.create('div');
    val.style.cssText = 'font-size: 15px; color: var(--color-text); font-weight: 700;';
    val.textContent = this._formatMeetingBadge();
    txt.appendChild(label);
    txt.appendChild(val);
    card.appendChild(ic);
    card.appendChild(txt);
    return card;
  }
}
