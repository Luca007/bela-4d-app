/**
 * ExamUploadScreen — Programa 4D
 *
 * Permite que o usuário envie seu exame de sangue para processamento por IA.
 * O arquivo vai para o Firebase Storage e depois o n8n processa via Google Drive.
 *
 * Fluxo:
 *   1. Usuário seleciona arquivo (PDF, JPG, PNG)
 *   2. Upload para Firebase Storage
 *   3. Firebase Function notifica n8n com a URL do arquivo
 *   4. n8n processa e faz callback atualizando Firestore
 *   5. App detecta mudança de status e redireciona para health-form
 */

import { DOM, State } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';
import { UIComponents } from '../modules/components.js';
import { BaseScreen } from '../modules/navigator.js';
import { firestoreService } from '../services/firestore.js';
import { n8nService } from '../services/n8n.js';

// Firebase Storage
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js';
import { getApp } from '../config/firebase.js';

const MAX_FILE_SIZE_MB = 20;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export class ExamUploadScreen extends BaseScreen {
  constructor(params) {
    super(params);
    this.selectedFile = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uid = State.get('currentUser')?.uid;
  }

  render() {
    const screen = DOM.create('div', 'exam-upload-screen');
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
      padding: 36px 28px;
      max-width: 500px;
      width: 100%;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: var(--shadow-xl);
    `;

    card.appendChild(this._buildHeader());
    card.appendChild(this._buildDropZone());
    card.appendChild(this._buildFileInfo());
    card.appendChild(this._buildProgress());
    card.appendChild(this._buildActions());
    card.appendChild(this._buildTips());

    screen.appendChild(card);
    return screen;
  }

  _buildHeader() {
    const wrap = DOM.create('div');
    wrap.style.cssText = 'text-align: center; margin-bottom: 28px;';

    const emoji = DOM.create('div');
    emoji.style.cssText = 'font-size: 48px; margin-bottom: 12px;';
    emoji.textContent = '🩸';

    const badge = DOM.create('span');
    badge.style.cssText = `
      display: inline-block;
      background: rgba(240,5,154,0.12);
      color: #f0059a;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    `;
    badge.textContent = 'Análise por IA';

    const title = DOM.create('h2');
    title.style.cssText = 'font-size: 22px; font-weight: 800; color: var(--color-text); margin: 0 0 8px;';
    title.textContent = 'Envie seu exame de sangue';

    const sub = DOM.create('p');
    sub.style.cssText = 'font-size: 13px; color: var(--color-muted); margin: 0; line-height: 1.5;';
    sub.textContent = 'Nossa IA extrai os marcadores automaticamente e pré-preenche seu Formulário de Saúde.';

    wrap.appendChild(emoji);
    wrap.appendChild(badge);
    wrap.appendChild(title);
    wrap.appendChild(sub);
    return wrap;
  }

  _buildDropZone() {
    const zone = DOM.create('div');
    zone.id = 'drop-zone';
    zone.style.cssText = `
      border: 2px dashed rgba(240,5,154,0.3);
      border-radius: 12px;
      padding: 36px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(240,5,154,0.03);
      margin-bottom: 16px;
    `;

    const icon = DOM.create('div');
    icon.style.cssText = 'font-size: 36px; margin-bottom: 12px;';
    icon.textContent = '📁';

    const label = DOM.create('p');
    label.style.cssText = 'font-size: 14px; font-weight: 600; color: var(--color-text); margin: 0 0 4px;';
    label.textContent = 'Arraste o arquivo ou clique para selecionar';

    const hint = DOM.create('p');
    hint.style.cssText = 'font-size: 12px; color: var(--color-muted); margin: 0;';
    hint.textContent = 'PDF, JPG ou PNG · Máx. 20 MB';

    // Input file oculto
    const input = DOM.create('input');
    input.type = 'file';
    input.id = 'file-input';
    input.accept = '.pdf,.jpg,.jpeg,.png,.webp';
    input.style.display = 'none';

    zone.appendChild(icon);
    zone.appendChild(label);
    zone.appendChild(hint);
    zone.appendChild(input);

    // Eventos
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.borderColor = '#f0059a';
      zone.style.background = 'rgba(240,5,154,0.08)';
    });
    zone.addEventListener('dragleave', () => {
      zone.style.borderColor = 'rgba(240,5,154,0.3)';
      zone.style.background = 'rgba(240,5,154,0.03)';
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'rgba(240,5,154,0.3)';
      zone.style.background = 'rgba(240,5,154,0.03)';
      const file = e.dataTransfer.files[0];
      if (file) this._handleFileSelected(file);
    });
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this._handleFileSelected(file);
    });

    return zone;
  }

  _buildFileInfo() {
    const wrap = DOM.create('div');
    wrap.id = 'file-info';
    wrap.style.cssText = 'display: none; margin-bottom: 16px;';

    const card = DOM.create('div');
    card.style.cssText = `
      background: rgba(31,204,116,0.08);
      border: 1px solid rgba(31,204,116,0.2);
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const icon = DOM.create('span');
    icon.style.cssText = 'font-size: 24px; flex-shrink: 0;';
    icon.id = 'file-icon';
    icon.textContent = '📄';

    const info = DOM.create('div');
    info.style.cssText = 'flex: 1; min-width: 0;';

    const name = DOM.create('div');
    name.id = 'file-name';
    name.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    const size = DOM.create('div');
    size.id = 'file-size';
    size.style.cssText = 'font-size: 11px; color: var(--color-muted); margin-top: 2px;';

    const remove = DOM.create('button');
    remove.style.cssText = `
      background: none; border: none; cursor: pointer;
      color: var(--color-muted); font-size: 18px; padding: 4px;
      flex-shrink: 0;
    `;
    remove.textContent = '✕';
    remove.addEventListener('click', () => this._clearFile());

    info.appendChild(name);
    info.appendChild(size);
    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(remove);
    wrap.appendChild(card);
    return wrap;
  }

  _buildProgress() {
    const wrap = DOM.create('div');
    wrap.id = 'progress-wrap';
    wrap.style.cssText = 'display: none; margin-bottom: 16px;';

    const label = DOM.create('div');
    label.style.cssText = `
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--color-muted);
      margin-bottom: 6px;
    `;
    const labelText = DOM.create('span');
    labelText.textContent = 'Enviando...';
    const labelPct = DOM.create('span');
    labelPct.id = 'progress-pct';
    labelPct.textContent = '0%';
    label.appendChild(labelText);
    label.appendChild(labelPct);

    const bar = DOM.create('div');
    bar.style.cssText = `
      height: 6px; background: rgba(255,255,255,0.08);
      border-radius: 3px; overflow: hidden;
    `;
    const fill = DOM.create('div');
    fill.id = 'progress-fill';
    fill.style.cssText = `
      height: 100%; width: 0%;
      background: var(--gradient-primary);
      border-radius: 3px;
      transition: width 0.3s ease;
    `;
    bar.appendChild(fill);
    wrap.appendChild(label);
    wrap.appendChild(bar);
    return wrap;
  }

  _buildActions() {
    const wrap = DOM.create('div');
    wrap.id = 'actions-wrap';
    wrap.style.cssText = 'margin-bottom: 20px;';

    const btn = UIComponents.primaryButton('📤 Enviar para análise');
    btn.id = 'upload-btn';
    btn.style.cssText += 'width: 100%; opacity: 0.5; cursor: not-allowed;';
    btn.disabled = true;
    btn.addEventListener('click', () => this._startUpload());
    wrap.appendChild(btn);
    return wrap;
  }

  _buildTips() {
    const wrap = DOM.create('div');
    wrap.style.cssText = `
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 14px 16px;
    `;
    const title = DOM.create('p');
    title.style.cssText = 'font-size: 12px; font-weight: 700; color: var(--color-text); margin: 0 0 10px;';
    title.textContent = '💡 Dicas para melhor resultado';
    const tips = [
      'Use o PDF original do laboratório, se possível',
      'Foto: boa iluminação, sem reflexo, texto legível',
      'O arquivo deve ser recente (últimos 12 meses)',
      'Exames de mais de um laboratório podem ser combinados',
    ];
    tips.forEach(tip => {
      const t = DOM.create('div');
      t.style.cssText = 'font-size: 12px; color: var(--color-muted); display: flex; gap: 6px; margin-bottom: 6px;';
      t.innerHTML = `<span>·</span><span>${tip}</span>`;
      wrap.appendChild(t);
    });
    wrap.insertBefore(title, wrap.firstChild);
    return wrap;
  }

  // ─── Lógica ───────────────────────────────────────────────

  _handleFileSelected(file) {
    // Valida tipo
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this._showError('Formato não suportado. Use PDF, JPG ou PNG.');
      return;
    }
    // Valida tamanho
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      this._showError(`Arquivo muito grande (${sizeMb.toFixed(1)} MB). Máximo: ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    this.selectedFile = file;

    // Mostra info do arquivo
    const icon = file.type === 'application/pdf' ? '📄' : '🖼️';
    DOM.byId('file-icon').textContent = icon;
    DOM.byId('file-name').textContent = file.name;
    DOM.byId('file-size').textContent = `${sizeMb.toFixed(2)} MB · ${file.type.split('/')[1].toUpperCase()}`;
    DOM.byId('file-info').style.display = 'block';

    // Habilita botão
    const btn = DOM.byId('upload-btn');
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }

  _clearFile() {
    this.selectedFile = null;
    DOM.byId('file-info').style.display = 'none';
    DOM.byId('file-input').value = '';
    const btn = DOM.byId('upload-btn');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }

  async _startUpload() {
    const isValidUploadState = this.selectedFile && !this.isUploading && this.uid;
    if (!isValidUploadState) return;
    this.isUploading = true;

    const btn = DOM.byId('upload-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Enviando...';

    DOM.byId('progress-wrap').style.display = 'block';

    try {
      // 1. Upload para Firebase Storage
      const storage = getStorage(getApp());
      const path = `users/${this.uid}/blood-tests/${Date.now()}_${this.selectedFile.name}`;
      const fileRef = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, this.selectedFile);

      const downloadUrl = await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            DOM.byId('progress-fill').style.width = `${pct}%`;
            DOM.byId('progress-pct').textContent = `${pct}%`;
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      // 2. Salva referência no Firestore
      const bloodTestId = await firestoreService.saveBloodTest(this.uid, {
        fileUrl: downloadUrl,
        fileName: this.selectedFile.name,
        fileSize: this.selectedFile.size,
        status: 'pending',
      });

      // 3. Notifica Firebase Function → n8n
      if (bloodTestId) {
        await n8nService.processBloodTest(this.uid, bloodTestId, downloadUrl);
      }

      // 4. Redireciona para tela de aguardo (processando)
      this._showSuccess();
      setTimeout(() => {
        this.params.onNavigate?.('awaiting', {
          status: 'processing_blood_test',
        });
      }, 2500);

    } catch (error) {
      console.error('[ExamUpload] Upload error:', error);
      this._showError('Erro ao enviar o arquivo. Tente novamente.');
      btn.disabled = false;
      btn.textContent = '📤 Enviar para análise';
      btn.style.opacity = '1';
    } finally {
      this.isUploading = false;
    }
  }

  _showError(msg) {
    const toast = DOM.create('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #ef4444; color: white; padding: 12px 20px;
      border-radius: 8px; font-size: 13px; font-weight: 600;
      z-index: 9999; animation: slideUp 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  _showSuccess() {
    const btn = DOM.byId('upload-btn');
    btn.textContent = '✅ Exame enviado com sucesso!';
    btn.style.background = 'var(--color-success)';
    btn.style.opacity = '1';
  }
}
