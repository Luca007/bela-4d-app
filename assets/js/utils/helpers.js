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

  setUser(user) {
    this.user = user;
    Storage.set("user", user);
  },

  getUser() {
    return this.user || Storage.get("user");
  },

  setXP(xp) {
    this.xp = xp;
    Storage.set("xp", xp);
  },

  setAvatar(avatar) {
    this.avatar = avatar;
    Storage.set("avatar", avatar);
  },

  logout() {
    this.user = null;
    Storage.clear();
  },
};
