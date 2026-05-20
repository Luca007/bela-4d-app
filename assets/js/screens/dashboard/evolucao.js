// Dashboard tab: Evolucao
import { renderSparkline } from './helpers.js';
import { EXAM_RESULTS } from '../../config/data.js';

export function render(dash) {
  const cards = [
    { label: 'Glicemia', value: '98', unit: 'mg/dL', delta: '▼ 50', color: '#1fcc74' },
    { label: 'Peso', value: '79.6', unit: 'kg', delta: '▼ 4.4', color: '#1fcc74' },
    { label: 'HbA1c', value: '6.1', unit: '%', delta: '▼ 0.8%', color: '#1fcc74' },
  ];

  const graphs = [
    { key: 'glicemia', title: 'Glicemia em Jejum', ref: 'Ref: 70-99 mg/dL', color: '#f0059a', unit: 'mg/dL' },
    { key: 'hba1c', title: 'Hemoglobina Glicada (HbA1c)', ref: 'Ref: &lt; 5,7%', color: '#a78bfa', unit: '%' },
    { key: 'peso', title: 'Peso Corporal', ref: '', color: '#38bdf8', unit: 'kg' },
  ];

  return `
    <section>
      <div class="dash-section-title">📊 Minha Evolução</div>
      <div class="dash-section-subtitle">Acompanhe o progresso dos seus resultados ao longo do programa</div>
      <div class="dash-grid-3" style="margin-bottom:20px;">
        ${cards.map(card => `
          <div class="dash-card dash-stat">
            <div class="dash-stat-label">${card.label}</div>
            <div class="dash-stat-value">${card.value}<span style="font-size:11px;color:var(--dash-muted);margin-left:2px;">${card.unit}</span></div>
            <div class="dash-stat-delta" style="color:${card.color};">${card.delta}</div>
          </div>
        `).join('')}
      </div>
      ${graphs.map(graph => `
        <div class="dash-card pad" style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
            <div>
              <div style="color:var(--dash-text);font-weight:800;font-size:18px;">${graph.title}</div>
              ${graph.ref ? '<div style="color:var(--dash-muted);font-size:13px;margin-top:2px;">' + graph.ref + '</div>' : ''}
            </div>
            <div style="text-align:right;">
              <div style="color:${graph.color};font-weight:800;font-size:28px;">${((dash.examResults||EXAM_RESULTS)[graph.key])[((dash.examResults||EXAM_RESULTS)[graph.key]).length - 1].v}<span style="font-size:14px;margin-left:3px;">${graph.unit}</span></div>
            </div>
          </div>
          ${renderSparkline(((dash.examResults||EXAM_RESULTS)[graph.key]), graph.color, 110, 'var(--dash-muted)')}
        </div>
      `).join('')}
    </section>
  `;
}
