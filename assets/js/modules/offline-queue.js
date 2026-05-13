/**
 * OfflineQueue — fila local persistida em localStorage.
 * Guarda ações que precisam ir ao servidor e drena automaticamente quando online.
 *
 * Uso:
 *   import { offlineQueue } from './offline-queue.js';
 *   offlineQueue.registerHandler('chat_send', async (payload) => { ... });
 *   offlineQueue.enqueue('chat_send', { uid, message });
 */

const QUEUE_KEY = '_belaOfflineQueue_v1';

class OfflineQueue {
  constructor() {
    this.queue = this._load();
    this.handlers = {};
    this._flushing = false;
    this._listeners = new Set();
  }

  _load() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _save() {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue)); } catch {}
    this._notify();
  }

  _notify() {
    for (const cb of this._listeners) { try { cb(this.size); } catch {} }
  }

  /** Registra um handler que recebe o payload e retorna Promise. */
  registerHandler(action, handler) {
    this.handlers[action] = handler;
  }

  /** Subscreve uma callback para mudanças no tamanho da fila. */
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  /** Adiciona ação à fila e tenta drenar imediatamente se online. */
  enqueue(action, payload) {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      payload,
      ts: Date.now(),
      attempts: 0,
    };
    this.queue.push(item);
    this._save();
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.flush().catch(() => {});
    }
  }

  /** Drena a fila — para na primeira falha para evitar avalanche. */
  async flush() {
    if (this._flushing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (!this.queue.length) return;

    this._flushing = true;
    try {
      const pending = [...this.queue];
      for (const item of pending) {
        const handler = this.handlers[item.action];
        if (!handler) {
          // Sem handler registrado — descarta para não acumular
          this._remove(item.id);
          continue;
        }
        try {
          await handler(item.payload);
          this._remove(item.id);
        } catch (e) {
          console.warn('[OfflineQueue] handler error', item.action, e);
          item.attempts = (item.attempts || 0) + 1;
          this._save();
          // Para o flush e tenta novamente em próximo ciclo
          break;
        }
      }
    } finally {
      this._flushing = false;
    }
  }

  _remove(id) {
    this.queue = this.queue.filter(i => i.id !== id);
    this._save();
  }

  get size() { return this.queue.length; }

  clear() {
    this.queue = [];
    this._save();
  }
}

export const offlineQueue = new OfflineQueue();
export default offlineQueue;
