/**
 * ConnectionIndicator — indicador de conexão persistente
 *
 * Exibe um dot colorido no header do dashboard:
 *   - 🟢 verde: online
 *   - 🟡 âmbar: offline com fila pendente
 *   - 🔴 vermelho: offline
 *   - 🔵 azul piscando: conectando/reconectando
 *
 * O dot mostra contador de itens na fila offline quando > 0.
 * Clique no dot exibe detalhes no console.
 */

import { offlineQueue } from './offline-queue.js';

export const ConnectionIndicator = {
  _element: null,
  _dotEl: null,
  _queueBadge: null,
  _isOnline: navigator.onLine !== false,
  _connectionLostAt: null,

  /**
   * Cria e retorna o elemento do indicador (dot + badge).
   * Deve ser inserido no header do dashboard.
   */
  create() {
    if (this._element) return this._element;

    const container = document.createElement('div');
    container.className = 'conn-indicator';
    container.title = this._isOnline ? 'Online' : 'Offline';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-label', this._isOnline ? 'Conexão ativa' : 'Sem conexão');

    const dot = document.createElement('span');
    dot.className = `conn-dot ${this._isOnline ? 'online' : 'offline'}`;
    container.appendChild(dot);
    this._dotEl = dot;

    const badge = document.createElement('span');
    badge.className = 'conn-queue-badge';
    badge.style.display = 'none';
    container.appendChild(badge);
    this._queueBadge = badge;

    // Clique → loga detalhes
    container.addEventListener('click', () => {
      const pending = offlineQueue.size;
      if (pending > 0) {
        console.log(`[Conn] Offline queue: ${pending} pending actions`);
      } else {
        console.log(`[Conn] Status: ${this._isOnline ? '🟢 Online' : '🔴 Offline'}`);
      }
    });

    this._element = container;
    this._setupListeners();
    return container;
  },

  /** Atualiza o estado visual do dot. */
  setOnline(online) {
    this._isOnline = online;
    if (!this._dotEl) return;

    // Remove todas as classes de estado
    this._dotEl.classList.remove('online', 'offline', 'reconnecting');

    if (online) {
      this._dotEl.classList.add('online');
      this._dotEl.title = 'Online';
      this._dotEl.setAttribute('aria-label', 'Conexão ativa');
      this._connectionLostAt = null;
    } else {
      this._dotEl.classList.add('offline');
      this._dotEl.title = 'Offline';
      this._dotEl.setAttribute('aria-label', 'Sem conexão');
      if (!this._connectionLostAt) this._connectionLostAt = Date.now();
    }

    this._updateBadge();
  },

  /** Mostra estado de reconexão. */
  setReconnecting() {
    if (!this._dotEl) return;
    this._dotEl.classList.remove('online', 'offline');
    this._dotEl.classList.add('reconnecting');
    this._dotEl.title = 'Reconectando...';
    this._dotEl.setAttribute('aria-label', 'Reconectando');
  },

  /** Atualiza badge com contagem da fila offline. */
  _updateBadge() {
    const pending = offlineQueue.size;
    if (!this._queueBadge) return;

    if (pending > 0) {
      this._queueBadge.textContent = pending > 99 ? '99+' : String(pending);
      this._queueBadge.style.display = 'flex';
      this._queueBadge.title = `${pending} ação(ões) aguardando sincronização`;
    } else {
      this._queueBadge.style.display = 'none';
    }
  },

  _setupListeners() {
    // Eventos do navegador
    window.addEventListener('online', () => {
      this.setReconnecting();
      // Pequeno delay visual para mostrar a transição
      setTimeout(() => {
        this.setOnline(true);
        offlineQueue.flush().catch(() => {});
      }, 600);
    });

    window.addEventListener('offline', () => {
      this.setOnline(false);
    });

    // Escuta fila offline para atualizar badge
    offlineQueue.subscribe(() => this._updateBadge());

    // Estado inicial
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.setOnline(false);
    }
  },

  /** Remove o elemento do DOM e limpa listeners. */
  destroy() {
    if (this._element && this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }
    this._element = null;
    this._dotEl = null;
    this._queueBadge = null;
  },
};

export default ConnectionIndicator;
