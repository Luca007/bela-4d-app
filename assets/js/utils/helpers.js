// DOM manipulation utilities
export const DOM = {
  create(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    Object.assign(element, attributes);
    return element;
  },

  setStyle(element, styles) {
    Object.assign(element.style, styles);
  },

  addClass(element, className) {
    element.classList.add(...className.split(' '));
  },

  removeClass(element, className) {
    element.classList.remove(...className.split(' '));
  },

  toggleClass(element, className) {
    element.classList.toggle(className);
  },

  on(element, event, handler) {
    element.addEventListener(event, handler);
  },

  off(element, event, handler) {
    element.removeEventListener(event, handler);
  },

  append(parent, ...children) {
    parent.append(...children);
  },

  remove(element) {
    element.remove();
  },

  clear(element) {
    element.innerHTML = '';
  },

  html(element, content) {
    element.innerHTML = content;
  },

  text(element, content) {
    element.textContent = content;
  },

  query(selector) {
    return document.querySelector(selector);
  },

  queryAll(selector) {
    return document.querySelectorAll(selector);
  },

  byId(id) {
    return document.getElementById(id);
  },
};

// State management
export const State = {
  data: {},
  listeners: [],

  set(key, value) {
    this.data[key] = value;
    this.notify();
  },

  get(key) {
    return this.data[key];
  },

  subscribe(listener) {
    this.listeners.push(listener);
  },

  notify() {
    this.listeners.forEach(listener => listener(this.data));
  },

  reset() {
    this.data = {};
  },

  clear() {
    this.data = {};
    this.notify();
  },
};

// Local storage management
export const Storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },
};

// User session management
export const Session = {
  user: null,
  xp: 520,
  avatar: {
    emoji: "🌙",
    color: "#f0059a",
    nick: "@voce",
  },

  // Generic key/value API used across the codebase
  set(key, value) {
    // Keep in-memory and persist to localStorage
    this[key] = value;
    try {
      Storage.set(key, value);
    } catch (e) {
      console.warn('Session: failed to persist key', key, e);
    }
  },

  get(key) {
    if (key in this && this[key] !== undefined) return this[key];
    return Storage.get(key);
  },

  // Backwards-compatible specific helpers
  setUser(user) {
    this.set('user', user);
  },

  getUser() {
    return this.get('user');
  },

  setXP(xp) {
    this.set('xp', xp);
  },

  setAvatar(avatar) {
    this.set('avatar', avatar);
  },

  logout() {
    this.user = null;
    Storage.clear();
  },

  clear() {
    this.user = null;
    this.xp = 0;
    this.avatar = null;
    Storage.clear();
  },
};

// Saudação adequada ao gênero. Default = "Bem-vindo" (masculino) quando o
// gender é ausente, "Outro", desconhecido ou ainda não preenchido (ex.: toast
// pós-login antes do onboarding, notificação welcome criada em ensureUserDocument).
export function welcomeWord(gender) {
  const normalized = String(gender || '').trim().toLowerCase();
  if (normalized === 'feminino' || normalized === 'f' || normalized === 'mulher') {
    return 'Bem-vinda';
  }
  return 'Bem-vindo';
}
