// Dashboard tab: Exames
import { renderSparkline } from './helpers.js';
import { EXAM_RESULTS } from '../../config/data.js';

export function render(dash) {
  const examChart = dash.examTab === 'resultados' ? (dash.examResults||EXAM_RESULTS) : null;
  return `
    <section>
      <div class="dash-section-title">🔬 Exames e Resultados</div>
      <div class="dash-section-subtitle">Pedidos da Dra. Jessica Benevides e seus resultados</div>
      <div class="dash-chip-row" style="margin-bottom:22px;">
        <button class="dash-chip ${dash.examTab === 'pedidos' ? 'active' : ''}" data-exam-tab="pedidos">📋 Pedidos da Dra.</button>
        <button class="dash-chip ${dash.examTab === 'resultados' ? 'active' : ''}" data-exam-tab="resultados">📊 Meus Resultados</button>
      </div>
      ${dash.examTab === 'pedidos' ? `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="dash-card pad" style="border-color: rgba(240,5,154,0.18); background: rgba(240,5,154,0.06);">
            <p style="color:var(--dash-muted);font-size:14px;"><span style="color:#f0059a;font-weight:700;">Dra. Jessica Benevides</span> · CRM-SP 145.832 · Endocrinologista parceira da Mentoria 4D</p>
          </div>
          ${dash.examOrders.map(order => {
            const fileReady = Boolean(order.fileReady || order.pdfReady || order.fileUrl || order.driveFileUrl);
            return `
            <div class="dash-card pad">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <div>
                  <div style="color:var(--dash-text);font-weight:800;font-size:16px;">Pedido de ${order.dt}</div>
                  <div style="color:var(--dash-muted);font-size:14px;margin-top:2px;">Dra. Jessica Benevides</div>
                </div>
                <span style="background:${order.st === 'Pendente' ? 'rgba(240,5,154,0.15)' : 'rgba(31,204,116,0.12)'};border:1px solid ${order.st === 'Pendente' ? 'rgba(240,5,154,0.28)' : 'rgba(31,204,116,0.32)'};border-radius:8px;padding:5px 12px;color:${order.st === 'Pendente' ? '#f0059a' : '#1fcc74'};font-size:13px;font-weight:700;">${order.st}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:14px;">${order.ex.map(exam => '<div style="display:flex;gap:10px;align-items:center;"><div style="width:6px;height:6px;border-radius:50%;background:#f0059a;flex-shrink:0;"></div><span style="color:var(--dash-text);font-size:15px;">' + exam + '</span></div>').join('')}</div>
              <div class="dash-card pad" style="padding:10px 14px;border-radius:10px;">📋 <strong style="color:var(--dash-text);">Instruções:</strong> <span style="color:var(--dash-muted);font-size:14px;">${order.ins}</span></div>
              <div style="margin-top:12px;display:flex;justify-content:flex-end;">
                <button class="dash-primary-btn ${fileReady ? '' : 'dash-hide-disabled'}" data-order-download="${order.id}" ${fileReady ? '' : 'disabled'} style="min-height:42px;padding:10px 14px;border-radius:10px;opacity:${fileReady ? 1 : 0.5};cursor:${fileReady ? 'pointer' : 'not-allowed'};">
                  ${fileReady ? '📥 Baixar pedido (PDF)' : '🔒 Pedido indisponível'}
                </button>
              </div>
            </div>
          `;
          }).join('')}
        </div>
      ` : `
        <div class="dash-card pad" style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
            <div>
              <div style="color:var(--dash-text);font-weight:800;font-size:18px;">Glicemia em Jejum</div>
              <div style="color:var(--dash-muted);font-size:13px;margin-top:2px;">Ref: 70-99 mg/dL</div>
            </div>
            <div style="text-align:right;">
              <div style="color:#1fcc74;font-weight:800;font-size:28px;">98<span style="font-size:14px;margin-left:3px;">mg/dL</span></div>
            </div>
          </div>
          ${renderSparkline((dash.examResults||EXAM_RESULTS).glicemia, '#f0059a', 110, 'var(--dash-muted)')}
        </div>
        <div class="dash-card pad" style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
            <div>
              <div style="color:var(--dash-text);font-weight:800;font-size:18px;">Hemoglobina Glicada (HbA1c)</div>
              <div style="color:var(--dash-muted);font-size:13px;margin-top:2px;">Ref: &lt; 5,7%</div>
            </div>
            <div style="text-align:right;">
              <div style="color:#a78bfa;font-weight:800;font-size:28px;">6.1<span style="font-size:14px;margin-left:3px;">%</span></div>
            </div>
          </div>
          ${renderSparkline((dash.examResults||EXAM_RESULTS).hba1c, '#a78bfa', 110, 'var(--dash-muted)')}
        </div>
        <div class="dash-card pad">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
            <div>
              <div style="color:var(--dash-text);font-weight:800;font-size:18px;">Peso Corporal</div>
            </div>
            <div style="text-align:right;">
              <div style="color:#38bdf8;font-weight:800;font-size:28px;">79.6<span style="font-size:14px;margin-left:3px;">kg</span></div>
            </div>
          </div>
          ${renderSparkline((dash.examResults||EXAM_RESULTS).peso, '#38bdf8', 110, 'var(--dash-muted)')}
        </div>
      `}
    </section>
  `;
}
