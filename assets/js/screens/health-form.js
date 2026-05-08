/**
 * HealthFormScreen — Formulário de Saúde e Histórico (Form 1)
 * Programa 4D — Bela Nutrição
 *
 * 23 perguntas divididas em 7 seções:
 *   1. Identificação e Medidas
 *   2. Diagnóstico e Medicamentos
 *   3. Histórico de Saúde
 *   4. Controle Glicêmico
 *   5. Estilo de Vida
 *   6. Contexto de Vida
 *   7. Médico e Suporte
 *
 * Suporta pré-preenchimento por IA (exame de sangue ou transcrição).
 * Campos pré-preenchidos são destacados com badge "IA" e podem ser editados.
 */

import { DOM, State, Session } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { firestoreService } from '../services/firestore.js';
import { HEALTH_FORM_SECTIONS, DIAGNOSTIC_OPTIONS } from '../config/constants.js';

export class HealthFormScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.uid = State.get('currentUser')?.uid || Session.get('userId');
    this.currentSection = 0;
    this.totalSections = HEALTH_FORM_SECTIONS.length;
    this.aiPrefillData = params.aiPrefillData || null; // dados pré-preenchidos pela IA
    this.isAiPrefilled = !!this.aiPrefillData;
    this.isSaving = false;

    // Inicializa o formData com os dados pré-preenchidos pela IA (se houver)
    this.formData = this._initFormData();
  }

  _initFormData() {
    const ai = this.aiPrefillData || {};
    return {
      // Seção 1 — Identificação
      fullName:          ai.fullName          || '',
      birthDate:         ai.birthDate         || '',
      gender:            ai.gender            || '',
      weight:            ai.weight            || '',
      height:            ai.height            || '',
      waist:             ai.waist             || '',

      // Seção 2 — Diagnóstico e Medicamentos
      diagnostics:       ai.diagnostics       || [],
      otherDiagnosis:    ai.otherDiagnosis    || '',
      diagnosisDuration: ai.diagnosisDuration || '',
      medications:       ai.medications       || [{ name: '', dose: '', time: '' }],

      // Seção 3 — Histórico de Saúde
      previousDiets:     ai.previousDiets     !== undefined ? ai.previousDiets : null,
      previousDietDesc:  ai.previousDietDesc  || '',
      maxWeight:         ai.maxWeight         || '',
      maxWeightYear:     ai.maxWeightYear      || '',
      minWeight:         ai.minWeight          || '',
      healthEvents:      ai.healthEvents       || '',
      familyHistory:     ai.familyHistory      !== undefined ? ai.familyHistory : null,
      familyHistoryDesc: ai.familyHistoryDesc  || '',

      // Seção 4 — Controle Glicêmico (pode vir do exame de sangue)
      glucometerType:    ai.glucometerType    || '',
      glucoseFasting:    ai.glucoseFasting    || '',    // ← extraído do exame
      glucoseAfterBreakfast: ai.glucoseAfterBreakfast || '',
      glucoseAfterLunch: ai.glucoseAfterLunch || '',
      glucoseAfterDinner: ai.glucoseAfterDinner || '',
      glucoseBeforeSleep: ai.glucoseBeforeSleep || '',
      glucoseMax:        ai.glucoseMax        || '',
      hba1c:             ai.hba1c             || '',    // ← extraído do exame
      hba1cDate:         ai.hba1cDate         || '',

      // Seção 5 — Estilo de Vida
      sleepQuality:      ai.sleepQuality      || 3,
      sleepHours:        ai.sleepHours        || '',
      sleepIssues:       ai.sleepIssues       || '',
      activityLevel:     ai.activityLevel     || '',
      activityDetails:   ai.activityDetails   || '',
      stressLevel:       ai.stressLevel       || 3,
      emotionalEating:   ai.emotionalEating   || '',
      bowelFunction:     ai.bowelFunction     || '',

      // Seção 6 — Contexto de Vida
      livingWith:        ai.livingWith        || '',
      familyDiet:        ai.familyDiet        || '',
      lifeEvents:        ai.lifeEvents        || '',

      // Seção 7 — Médico e Suporte
      hasDoctorMonitoring: ai.hasDoctorMonitoring !== undefined ? ai.hasDoctorMonitoring : null,
      doctorSpecialty:   ai.doctorSpecialty   || '',
      doctorToldAbout4D: ai.doctorToldAbout4D || '',
      scheduledExams:    ai.scheduledExams    !== undefined ? ai.scheduledExams : null,
      scheduledExamsDesc: ai.scheduledExamsDesc || '',
      extraInfo:         ai.extraInfo         || '',
    };
  }

  // Conjunto de campos que foram pré-preenchidos pela IA
  _aiFilledFields() {
    if (!this.isAiPrefilled) return new Set();
    const ai = this.aiPrefillData;
    const filled = new Set();
    const fields = ['glucoseFasting','glucoseAfterBreakfast','glucoseAfterLunch',
      'glucoseAfterDinner','glucoseBeforeSleep','glucoseMax','hba1c','hba1cDate',
      'fullName','birthDate','gender','weight','height','diagnostics'];
    fields.forEach(f => {
      if (ai[f] !== undefined && ai[f] !== '' && ai[f] !== null && !(Array.isArray(ai[f]) && !ai[f].length)) {
        filled.add(f);
      }
    });
    return filled;
  }

  render() {
    const screen = DOM.create('div', 'health-form-screen');
    screen.style.cssText = `
      min-height: 100vh;
      background: var(--color-bg);
      padding: 0 0 100px;
    `;

    screen.appendChild(this._buildTopBar());

    const container = DOM.create('div');
    container.style.cssText = 'max-width: 600px; margin: 0 auto; padding: 24px 20px;';

    if (this.isAiPrefilled) {
      container.appendChild(this._buildAiBanner());
    }

    container.appendChild(this._buildSectionNav());
    container.appendChild(this._buildSectionContent());

    screen.appendChild(container);
    return screen;
  }

  _buildTopBar() {
    const bar = DOM.create('div');
    bar.style.cssText = `
      position: sticky; top: 0; z-index: 100;
      background: var(--color-bg);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 16px 20px;
    `;

    const inner = DOM.create('div');
    inner.style.cssText = 'max-width: 600px; margin: 0 auto;';

    const row = DOM.create('div');
    row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;';

    const left = DOM.create('div');
    left.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    const sectionInfo = HEALTH_FORM_SECTIONS[this.currentSection];
    const icon = DOM.create('span');
    icon.style.cssText = 'font-size: 20px;';
    icon.textContent = sectionInfo.icon;

    const titleWrap = DOM.create('div');
    const sectionNum = DOM.create('span');
    sectionNum.style.cssText = 'font-size: 11px; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block;';
    sectionNum.textContent = `Seção ${this.currentSection + 1} de ${this.totalSections}`;
    const sectionTitle = DOM.create('span');
    sectionTitle.style.cssText = 'font-size: 16px; font-weight: 700; color: var(--color-text); display: block;';
    sectionTitle.textContent = sectionInfo.title;
    titleWrap.appendChild(sectionNum);
    titleWrap.appendChild(sectionTitle);

    left.appendChild(icon);
    left.appendChild(titleWrap);
    row.appendChild(left);

    // Progresso geral
    const pct = Math.round(((this.currentSection) / this.totalSections) * 100);
    const pctLabel = DOM.create('span');
    pctLabel.style.cssText = 'font-size: 12px; color: var(--color-muted); font-weight: 600;';
    pctLabel.textContent = `${pct}%`;
    row.appendChild(pctLabel);

    // Barra de progresso
    const barWrap = DOM.create('div');
    barWrap.style.cssText = 'height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px;';
    const fill = DOM.create('div');
    fill.style.cssText = `height: 100%; width: ${pct}%; background: var(--gradient-primary); border-radius: 2px; transition: width 0.4s ease;`;
    barWrap.appendChild(fill);

    inner.appendChild(row);
    inner.appendChild(barWrap);
    bar.appendChild(inner);
    return bar;
  }

  _buildAiBanner() {
    const banner = DOM.create('div');
    banner.style.cssText = `
      background: linear-gradient(135deg, rgba(240,5,154,0.1), rgba(167,139,250,0.1));
      border: 1px solid rgba(240,5,154,0.25);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    `;
    const icon = DOM.create('span');
    icon.style.cssText = 'font-size: 22px; flex-shrink: 0; margin-top: 2px;';
    icon.textContent = '🤖';
    const text = DOM.create('div');
    text.style.cssText = 'flex: 1;';
    const t1 = DOM.create('p');
    t1.style.cssText = 'font-size: 13px; font-weight: 700; color: var(--color-text); margin: 0 0 4px;';
    t1.textContent = 'Campos pré-preenchidos pela IA';
    const t2 = DOM.create('p');
    t2.style.cssText = 'font-size: 12px; color: var(--color-muted); margin: 0; line-height: 1.5;';
    t2.textContent = 'Com base no seu exame de sangue e/ou transcrição da reunião, alguns campos foram preenchidos automaticamente. Revise, corrija se necessário e complete o que falta.';
    text.appendChild(t1);
    text.appendChild(t2);
    banner.appendChild(icon);
    banner.appendChild(text);
    return banner;
  }

  _buildSectionNav() {
    const nav = DOM.create('div');
    nav.style.cssText = `
      display: flex; gap: 6px; margin-bottom: 24px; flex-wrap: wrap;
    `;
    HEALTH_FORM_SECTIONS.forEach((sec, i) => {
      const dot = DOM.create('button');
      dot.style.cssText = `
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid ${i === this.currentSection ? '#f0059a' : 'rgba(255,255,255,0.1)'};
        background: ${i === this.currentSection ? 'rgba(240,5,154,0.15)' : 'transparent'};
        color: ${i === this.currentSection ? '#f0059a' : 'var(--color-muted)'};
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      `;
      dot.textContent = `${sec.icon} ${i + 1}`;
      dot.title = sec.title;
      dot.addEventListener('click', () => this._goToSection(i));
      nav.appendChild(dot);
    });
    return nav;
  }

  _buildSectionContent() {
    const wrap = DOM.create('div');
    wrap.id = 'section-content';

    const sections = [
      () => this._section1_identification(),
      () => this._section2_diagnosis(),
      () => this._section3_history(),
      () => this._section4_glycemic(),
      () => this._section5_lifestyle(),
      () => this._section6_context(),
      () => this._section7_medical(),
    ];

    const content = sections[this.currentSection]?.() || DOM.create('div');
    wrap.appendChild(content);

    // Navegação
    const navBtns = DOM.create('div');
    navBtns.style.cssText = 'display: flex; gap: 12px; margin-top: 32px;';

    if (this.currentSection > 0) {
      const back = UIComponents.secondaryButton('← Anterior');
      back.style.flex = '1';
      back.addEventListener('click', () => this._goToSection(this.currentSection - 1));
      navBtns.appendChild(back);
    }

    const isLast = this.currentSection === this.totalSections - 1;
    const next = UIComponents.primaryButton(isLast ? '✅ Concluir Formulário' : 'Próximo →');
    next.style.flex = '2';
    next.addEventListener('click', () => isLast ? this._submitForm() : this._goToSection(this.currentSection + 1));
    navBtns.appendChild(next);

    wrap.appendChild(navBtns);
    return wrap;
  }

  // ─── SEÇÕES ────────────────────────────────────────────────

  _section1_identification() {
    const wrap = DOM.create('div');
    const aiFields = this._aiFilledFields();

    wrap.appendChild(this._textField('fullName', 'Nome completo', 'Ex: Maria da Silva', aiFields.has('fullName')));
    wrap.appendChild(this._dateField('birthDate', 'Data de nascimento', aiFields.has('birthDate')));
    wrap.appendChild(this._radioGroup('gender', 'Sexo', ['Feminino', 'Masculino'], aiFields.has('gender')));

    const measureRow = DOM.create('div');
    measureRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;';
    measureRow.appendChild(this._numberField('weight', 'Peso (kg)', '75', aiFields.has('weight')));
    measureRow.appendChild(this._numberField('height', 'Altura (cm)', '165', aiFields.has('height')));
    measureRow.appendChild(this._numberField('waist', 'Cintura (cm)', 'Opcional', false));
    wrap.appendChild(measureRow);

    return wrap;
  }

  _section2_diagnosis() {
    const wrap = DOM.create('div');
    const aiFields = this._aiFilledFields();

    // Checkboxes diagnósticos
    const diagLabel = this._fieldLabel('Diagnósticos confirmados', aiFields.has('diagnostics'));
    wrap.appendChild(diagLabel);

    const checkGrid = DOM.create('div');
    checkGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px;';
    DIAGNOSTIC_OPTIONS.forEach(opt => {
      const row = DOM.create('label');
      row.style.cssText = `
        display: flex; align-items: center; gap: 8px; padding: 10px 12px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--color-text);
      `;
      const cb = DOM.create('input');
      cb.type = 'checkbox';
      cb.checked = this.formData.diagnostics.includes(opt);
      cb.addEventListener('change', () => {
        if (cb.checked) {
          this.formData.diagnostics = [...this.formData.diagnostics, opt];
        } else {
          this.formData.diagnostics = this.formData.diagnostics.filter(d => d !== opt);
        }
      });
      row.appendChild(cb);
      row.appendChild(document.createTextNode(opt));
      checkGrid.appendChild(row);
    });
    wrap.appendChild(checkGrid);

    wrap.appendChild(this._textareaField('diagnosisDuration', 'Há quanto tempo tem o diagnóstico e como está sendo tratado?', 'Uma linha por diagnóstico...'));
    wrap.appendChild(this._medicationsTable());

    return wrap;
  }

  _section3_history() {
    const wrap = DOM.create('div');

    wrap.appendChild(this._yesNoField('previousDiets', 'Já fez dieta ou acompanhamento nutricional antes?'));
    wrap.appendChild(this._textareaField('previousDietDesc', 'Se sim: o que foi e por que parou?', 'Descreva brevemente...'));

    const weightRow = DOM.create('div');
    weightRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px;';
    weightRow.appendChild(this._numberField('maxWeight', 'Maior peso (kg)', ''));
    weightRow.appendChild(this._textField('maxWeightYear', 'Ano', '2020'));
    weightRow.appendChild(this._numberField('minWeight', 'Menor peso (kg)', ''));
    wrap.appendChild(weightRow);

    wrap.appendChild(this._textareaField('healthEvents', 'Eventos de saúde marcantes', 'Ex: cirurgias, internações, gravidez, menopausa, uso prolongado de corticóides...'));
    wrap.appendChild(this._yesNoField('familyHistory', 'Alguém na família tem diabetes, obesidade ou doença cardíaca?'));
    wrap.appendChild(this._textareaField('familyHistoryDesc', 'Se sim: quem e qual condição?', ''));

    return wrap;
  }

  _section4_glycemic() {
    const wrap = DOM.create('div');
    const aiFields = this._aiFilledFields();

    // Indicador de pré-preenchimento
    if (aiFields.has('glucoseFasting') || aiFields.has('hba1c')) {
      const badge = DOM.create('div');
      badge.style.cssText = `
        background: rgba(31,204,116,0.1); border: 1px solid rgba(31,204,116,0.25);
        border-radius: 8px; padding: 10px 14px; margin-bottom: 20px;
        font-size: 12px; color: #1fcc74; display: flex; gap: 8px;
      `;
      badge.innerHTML = '<span>🩸</span><span>Valores extraídos do seu exame de sangue. Verifique se estão corretos.</span>';
      wrap.appendChild(badge);
    }

    wrap.appendChild(this._radioGroup('glucometerType', 'Você mede a glicemia em casa?', [
      'Sim, com glicosímetro',
      'Sim, com monitor contínuo (Libre/Dexcom)',
      'Não meço em casa',
    ]));

    const label = this._fieldLabel('Valores de glicemia (mg/dL)', false, 'Preencha o que souber — deixe em branco o que não souber');
    wrap.appendChild(label);

    const glucFields = [
      { key: 'glucoseFasting',     label: 'Em jejum' },
      { key: 'glucoseAfterBreakfast', label: 'Após café da manhã' },
      { key: 'glucoseAfterLunch',  label: 'Após almoço' },
      { key: 'glucoseAfterDinner', label: 'Após jantar' },
      { key: 'glucoseBeforeSleep', label: 'Antes de dormir' },
      { key: 'glucoseMax',         label: 'Maior valor já registrado' },
    ];

    const grid = DOM.create('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;';
    glucFields.forEach(({ key, label: lbl }) => {
      grid.appendChild(this._numberField(key, lbl, '', aiFields.has(key)));
    });
    wrap.appendChild(grid);

    const hba1cRow = DOM.create('div');
    hba1cRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';
    hba1cRow.appendChild(this._numberField('hba1c', 'HbA1c (%)', 'Ex: 7.2', aiFields.has('hba1c')));
    hba1cRow.appendChild(this._textField('hba1cDate', 'Data aproximada do exame', 'mês/ano', aiFields.has('hba1cDate')));
    wrap.appendChild(hba1cRow);

    return wrap;
  }

  _section5_lifestyle() {
    const wrap = DOM.create('div');

    wrap.appendChild(this._scaleField('sleepQuality', 'Qualidade do sono', 'Muito ruim', 'Excelente'));
    wrap.appendChild(this._numberField('sleepHours', 'Horas de sono por noite', 'Ex: 7'));
    wrap.appendChild(this._textareaField('sleepIssues', 'Queixa específica sobre sono', 'Ex: acorda à noite, dificuldade para dormir...'));
    wrap.appendChild(this._radioGroup('activityLevel', 'Atividade física', [
      'Não pratico',
      'Caminhada ou atividade leve eventual',
      'Regular 1 a 2× por semana',
      'Regular 3 a 4× por semana',
      'Treino intenso 5+ vezes por semana',
    ]));
    wrap.appendChild(this._textareaField('activityDetails', 'Se pratica: qual atividade e há quanto tempo?', ''));
    wrap.appendChild(this._scaleField('stressLevel', 'Nível de estresse no dia a dia', 'Muito baixo', 'Extremamente alto'));
    wrap.appendChild(this._radioGroup('emotionalEating', 'O estresse/emoções influenciam sua alimentação?', [
      'Não, consigo separar bem',
      'Um pouco, às vezes',
      'Sim, com frequência',
      'Sim, é um dos meus principais desafios',
    ]));
    wrap.appendChild(this._radioGroup('bowelFunction', 'Funcionamento intestinal', [
      'Regular — evacuo todos os dias ou em dias alternados',
      'Irregular — tenho prisão de ventre com frequência',
      'Solto — evacuo mais de uma vez ao dia',
      'Tenho outros desconfortos (gases, inchaço, etc.)',
    ]));

    return wrap;
  }

  _section6_context() {
    const wrap = DOM.create('div');

    wrap.appendChild(this._radioGroup('livingWith', 'Com quem você mora?', [
      'Sozinho(a)',
      'Com cônjuge ou parceiro(a)',
      'Com cônjuge e filhos',
      'Com filhos (sem parceiro)',
      'Com família extensa',
      'Com colegas / república',
    ]));
    wrap.appendChild(this._radioGroup('familyDiet', 'A alimentação da sua casa acompanha seu plano?', [
      'A família apoia e come de forma parecida',
      'Cada um come o que quer — há liberdade',
      'É um desafio: há pressão ou conflito com o plano',
      'Eu cozinho para todos — é complicado adaptar',
      'Moro sozinho(a) — só depende de mim',
    ]));
    wrap.appendChild(this._textareaField('lifeEvents', 'Há algo acontecendo na sua vida que devemos saber?', 'Ex: mudança de emprego, luto, separação, gravidez, viagem longa, procedimento médico previsto...'));

    return wrap;
  }

  _section7_medical() {
    const wrap = DOM.create('div');

    wrap.appendChild(this._yesNoField('hasDoctorMonitoring', 'Você tem médico acompanhando seu diabetes/pré-diabetes?'));
    wrap.appendChild(this._textareaField('doctorSpecialty', 'Se sim: especialidade e frequência das consultas', ''));
    wrap.appendChild(this._radioGroup('doctorToldAbout4D', 'Já conversou com seu médico sobre o Programa 4D?', [
      'Sim, ele aprovou',
      'Sim, ele ficou neutro',
      'Sim, ele questionou',
      'Não conversei ainda',
    ]));
    wrap.appendChild(this._yesNoField('scheduledExams', 'Tem exame ou consulta agendada nos próximos 3 meses?'));
    wrap.appendChild(this._textareaField('scheduledExamsDesc', 'Se sim: qual e quando?', ''));
    wrap.appendChild(this._textareaField('extraInfo', 'Espaço livre — o que mais você quer compartilhar?', 'Qualquer informação que não coube acima mas que considera importante...'));

    return wrap;
  }

  // ─── COMPONENTES DE CAMPO ──────────────────────────────────

  _fieldLabel(text, aiPrefilled = false, hint = null) {
    const wrap = DOM.create('div');
    wrap.style.cssText = 'margin-bottom: 6px; display: flex; align-items: center; gap: 8px;';

    const label = DOM.create('label');
    label.style.cssText = 'font-size: 13px; font-weight: 600; color: var(--color-text);';
    label.textContent = text;
    wrap.appendChild(label);

    if (aiPrefilled) {
      const badge = DOM.create('span');
      badge.style.cssText = `
        background: rgba(167,139,250,0.2); color: #a78bfa;
        font-size: 10px; font-weight: 700; padding: 2px 7px;
        border-radius: 10px; letter-spacing: 0.5px;
      `;
      badge.textContent = '🤖 IA';
      wrap.appendChild(badge);
    }

    if (hint) {
      const h = DOM.create('span');
      h.style.cssText = 'font-size: 11px; color: var(--color-muted); display: block; margin-top: 2px;';
      h.textContent = hint;
      const outer = DOM.create('div');
      outer.appendChild(wrap);
      outer.appendChild(h);
      return outer;
    }

    return wrap;
  }

  _inputWrap(fieldKey, label, aiPrefilled = false) {
    const wrap = DOM.create('div');
    wrap.style.marginBottom = '20px';
    wrap.appendChild(this._fieldLabel(label, aiPrefilled));
    return wrap;
  }

  _styledInput(type, value, placeholder, aiPrefilled) {
    const input = DOM.create('input');
    input.type = type;
    input.value = value;
    input.placeholder = placeholder;
    input.style.cssText = `
      width: 100%; padding: 11px 14px; box-sizing: border-box;
      background: ${aiPrefilled ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.05)'};
      border: 1px solid ${aiPrefilled ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.1)'};
      border-radius: 8px; color: var(--color-text); font-size: 14px;
      outline: none; transition: border-color 0.2s;
    `;
    input.addEventListener('focus', () => input.style.borderColor = '#f0059a');
    input.addEventListener('blur', () => input.style.borderColor = aiPrefilled ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.1)');
    return input;
  }

  _textField(key, label, placeholder = '', aiPrefilled = false) {
    const wrap = this._inputWrap(key, label, aiPrefilled);
    const input = this._styledInput('text', this.formData[key] || '', placeholder, aiPrefilled);
    input.addEventListener('input', () => this.formData[key] = input.value);
    wrap.appendChild(input);
    return wrap;
  }

  _numberField(key, label, placeholder = '', aiPrefilled = false) {
    const wrap = this._inputWrap(key, label, aiPrefilled);
    const input = this._styledInput('text', this.formData[key] || '', placeholder, aiPrefilled);
    input.inputMode = 'decimal';
    input.addEventListener('input', () => this.formData[key] = input.value);
    wrap.appendChild(input);
    return wrap;
  }

  _dateField(key, label, aiPrefilled = false) {
    const wrap = this._inputWrap(key, label, aiPrefilled);
    const input = this._styledInput('date', this.formData[key] || '', '', aiPrefilled);
    input.addEventListener('change', () => this.formData[key] = input.value);
    wrap.appendChild(input);
    return wrap;
  }

  _textareaField(key, label, placeholder = '') {
    const wrap = DOM.create('div');
    wrap.style.marginBottom = '20px';
    wrap.appendChild(this._fieldLabel(label));
    const ta = DOM.create('textarea');
    ta.value = this.formData[key] || '';
    ta.placeholder = placeholder;
    ta.rows = 3;
    ta.style.cssText = `
      width: 100%; padding: 11px 14px; box-sizing: border-box;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: var(--color-text); font-size: 14px;
      outline: none; resize: vertical; transition: border-color 0.2s; font-family: inherit;
    `;
    ta.addEventListener('focus', () => ta.style.borderColor = '#f0059a');
    ta.addEventListener('blur', () => ta.style.borderColor = 'rgba(255,255,255,0.1)');
    ta.addEventListener('input', () => this.formData[key] = ta.value);
    wrap.appendChild(ta);
    return wrap;
  }

  _radioGroup(key, label, options, aiPrefilled = false) {
    const wrap = DOM.create('div');
    wrap.style.marginBottom = '20px';
    wrap.appendChild(this._fieldLabel(label, aiPrefilled));
    options.forEach(opt => {
      const row = DOM.create('label');
      row.style.cssText = `
        display: flex; align-items: center; gap: 10px; padding: 10px 14px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 8px; cursor: pointer; margin-bottom: 6px;
        font-size: 13px; color: var(--color-text); transition: all 0.15s;
      `;
      const rb = DOM.create('input');
      rb.type = 'radio';
      rb.name = key;
      rb.value = opt;
      rb.checked = this.formData[key] === opt;
      rb.style.accentColor = '#f0059a';
      rb.addEventListener('change', () => {
        if (rb.checked) {
          this.formData[key] = opt;
          wrap.querySelectorAll('label').forEach(l => {
            l.style.borderColor = 'rgba(255,255,255,0.06)';
            l.style.background = 'rgba(255,255,255,0.03)';
          });
          row.style.borderColor = 'rgba(240,5,154,0.35)';
          row.style.background = 'rgba(240,5,154,0.06)';
        }
      });
      if (rb.checked) {
        row.style.borderColor = 'rgba(240,5,154,0.35)';
        row.style.background = 'rgba(240,5,154,0.06)';
      }
      row.appendChild(rb);
      row.appendChild(document.createTextNode(opt));
      wrap.appendChild(row);
    });
    return wrap;
  }

  _yesNoField(key, label) {
    const wrap = DOM.create('div');
    wrap.style.marginBottom = '20px';
    wrap.appendChild(this._fieldLabel(label));
    const row = DOM.create('div');
    row.style.cssText = 'display: flex; gap: 10px;';
    ['Sim', 'Não', 'Não sei'].forEach(opt => {
      const btn = DOM.create('button');
      const val = opt === 'Sim' ? true : opt === 'Não' ? false : null;
      btn.style.cssText = `
        flex: 1; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600;
        cursor: pointer; transition: all 0.15s;
        border: 1px solid ${this.formData[key] === val ? '#f0059a' : 'rgba(255,255,255,0.1)'};
        background: ${this.formData[key] === val ? 'rgba(240,5,154,0.12)' : 'rgba(255,255,255,0.03)'};
        color: ${this.formData[key] === val ? '#f0059a' : 'var(--color-muted)'};
      `;
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        this.formData[key] = val;
        row.querySelectorAll('button').forEach(b => {
          b.style.borderColor = 'rgba(255,255,255,0.1)';
          b.style.background = 'rgba(255,255,255,0.03)';
          b.style.color = 'var(--color-muted)';
        });
        btn.style.borderColor = '#f0059a';
        btn.style.background = 'rgba(240,5,154,0.12)';
        btn.style.color = '#f0059a';
      });
      row.appendChild(btn);
    });
    wrap.appendChild(row);
    return wrap;
  }

  _scaleField(key, label, minLabel, maxLabel) {
    const wrap = DOM.create('div');
    wrap.style.marginBottom = '20px';
    wrap.appendChild(this._fieldLabel(label));
    const row = DOM.create('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 8px;';
    const minL = DOM.create('span');
    minL.style.cssText = 'font-size: 11px; color: var(--color-muted); width: 60px; text-align: right;';
    minL.textContent = minLabel;
    const btns = DOM.create('div');
    btns.style.cssText = 'display: flex; gap: 6px; flex: 1; justify-content: center;';
    [1, 2, 3, 4, 5].forEach(v => {
      const b = DOM.create('button');
      b.style.cssText = `
        width: 40px; height: 40px; border-radius: 50%; font-size: 14px; font-weight: 700;
        border: 2px solid ${this.formData[key] === v ? '#f0059a' : 'rgba(255,255,255,0.1)'};
        background: ${this.formData[key] === v ? '#f0059a' : 'transparent'};
        color: ${this.formData[key] === v ? 'white' : 'var(--color-muted)'};
        cursor: pointer; transition: all 0.15s;
      `;
      b.textContent = v;
      b.addEventListener('click', () => {
        this.formData[key] = v;
        btns.querySelectorAll('button').forEach(btn => {
          btn.style.borderColor = 'rgba(255,255,255,0.1)';
          btn.style.background = 'transparent';
          btn.style.color = 'var(--color-muted)';
        });
        b.style.borderColor = '#f0059a';
        b.style.background = '#f0059a';
        b.style.color = 'white';
      });
      btns.appendChild(b);
    });
    const maxL = DOM.create('span');
    maxL.style.cssText = 'font-size: 11px; color: var(--color-muted); width: 60px;';
    maxL.textContent = maxLabel;
    row.appendChild(minL);
    row.appendChild(btns);
    row.appendChild(maxL);
    wrap.appendChild(row);
    return wrap;
  }

  _medicationsTable() {
    const wrap = DOM.create('div');
    wrap.style.marginBottom = '20px';
    wrap.appendChild(this._fieldLabel('Medicamentos e suplementos contínuos'));

    const table = DOM.create('div');
    table.id = 'med-table';

    const renderRows = () => {
      table.innerHTML = '';
      this.formData.medications.forEach((med, i) => {
        const row = DOM.create('div');
        row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px;';
        const fields = [
          { key: 'name', ph: 'Medicamento / Suplemento' },
          { key: 'dose', ph: 'Dose' },
          { key: 'time', ph: 'Horário' },
        ];
        fields.forEach(f => {
          const inp = this._styledInput('text', med[f] || '', f.ph, false);
          inp.style.marginBottom = '0';
          inp.addEventListener('input', () => {
            this.formData.medications[i][f.key] = inp.value;
          });
          row.appendChild(inp);
        });
        const removeBtn = DOM.create('button');
        removeBtn.style.cssText = 'background: none; border: 1px solid rgba(255,0,0,0.2); color: #ef4444; border-radius: 6px; cursor: pointer; padding: 0 10px; font-size: 14px;';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
          this.formData.medications.splice(i, 1);
          renderRows();
        });
        row.appendChild(removeBtn);
        table.appendChild(row);
      });
    };

    renderRows();
    wrap.appendChild(table);

    const addBtn = UIComponents.secondaryButton('+ Adicionar medicamento');
    addBtn.style.cssText += 'width: 100%; margin-top: 8px; font-size: 13px;';
    addBtn.addEventListener('click', () => {
      this.formData.medications.push({ name: '', dose: '', time: '' });
      renderRows();
    });
    wrap.appendChild(addBtn);
    return wrap;
  }

  // ─── NAVEGAÇÃO E SUBMIT ────────────────────────────────────

  _goToSection(index) {
    this.currentSection = index;
    this.container.innerHTML = '';
    this.container.appendChild(this.render());
  }

  _validateRequiredFields() {
    const requiredMap = [
      { key: 'fullName', label: 'Nome completo' },
      { key: 'birthDate', label: 'Data de nascimento' },
      { key: 'weight', label: 'Peso' },
      { key: 'height', label: 'Altura' },
    ];

    for (const field of requiredMap) {
      const value = String(this.formData[field.key] || '').trim();
      if (!value) {
        this._showErrorToast(`Por favor, preencha: ${field.label}`);
        return false;
      }
    }

    if (!Array.isArray(this.formData.diagnostics) || this.formData.diagnostics.length === 0) {
      this._showErrorToast('Selecione ao menos 1 diagnóstico.');
      return false;
    }

    return true;
  }

  async _submitForm() {
    if (!this._validateRequiredFields()) return;
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      const saved = await firestoreService.saveHealthForm(
        this.uid,
        this.formData,
        { aiPrefilled: this.isAiPrefilled, completed: true }
      );

      if (saved) {
        this._showSuccessToast();
        setTimeout(() => {
          this.params.onNavigate?.('dashboard');
        }, 2000);
      }
    } catch (e) {
      console.error('[HealthForm] submit error:', e);
      if (!navigator.onLine) {
        this._showErrorToast('Sem conexão. Verifique sua internet e tente novamente.');
      } else {
        this._showErrorToast('Erro ao salvar o formulário. Tente novamente.');
      }
    } finally {
      this.isSaving = false;
    }
  }

  _showSuccessToast() {
    const t = DOM.create('div');
    t.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: var(--color-success); color: white; padding: 14px 24px;
      border-radius: 10px; font-size: 14px; font-weight: 700;
      z-index: 9999; box-shadow: var(--shadow-xl);
    `;
    t.textContent = '✅ Formulário salvo com sucesso!';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  _showErrorToast(msg) {
    const t = DOM.create('div');
    t.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #ef4444; color: white; padding: 14px 24px;
      border-radius: 10px; font-size: 14px; font-weight: 700;
      z-index: 9999;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  mount() {
    this.container = DOM.byId('app');
    this.container.innerHTML = '';
    this.container.appendChild(this.render());
  }
}
