// Navigation and screen management
import { DOM } from '../utils/helpers.js';

export class Navigator {
  constructor() {
    this.currentScreen = null;
    this.screens = new Map();
    this.listeners = [];
    this.history = [];
  }

  registerScreen(id, screenClass) {
    this.screens.set(id, screenClass);
  }

  navigate(screenId, params = {}) {
    if (!this.screens.has(screenId)) {
      console.error(`Screen ${screenId} not registered`);
      return;
    }

    // Cleanup current screen
    if (this.currentScreen) {
      this.currentScreen.destroy();
    }

    // Create and initialize new screen
    const ScreenClass = this.screens.get(screenId);
    this.currentScreen = new ScreenClass(params);
    this.currentScreen.mount();

    // Update history
    this.history.push(screenId);

    // Notify listeners
    this.notify(screenId);
  }

  goBack() {
    if (this.history.length > 1) {
      this.history.pop();
      const previousScreen = this.history[this.history.length - 1];
      this.navigate(previousScreen);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify(screenId) {
    this.listeners.forEach(listener => listener(screenId));
  }

  getCurrentScreenId() {
    return this.history[this.history.length - 1];
  }
}

// Base screen class
export class BaseScreen {
  constructor(params = {}) {
    this.params = params;
    this.element = null;
    this.container = null;
  }

  mount() {
    this.container = DOM.byId('app') || DOM.query('main') || document.body;
    this.element = this.render();
    DOM.clear(this.container);
    this.container.appendChild(this.element);
    this.setupEventListeners();
    this.setupAnimations();
  }

  render() {
    // Override in subclass
    return DOM.create('div');
  }

  setupEventListeners() {
    // Override in subclass
  }

  setupAnimations() {
    // Override in subclass
  }

  destroy() {
    // Cleanup
    if (this.element) {
      this.element.remove();
    }
  }

  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
}

// Screen manager
export class ScreenManager {
  constructor(containerId = 'app') {
    this.container = DOM.byId(containerId);
    this.screens = new Map();
    this.currentScreen = null;
  }

  register(id, component) {
    this.screens.set(id, component);
  }

  render(id, props = {}) {
    // Hide current screen
    if (this.currentScreen) {
      this.currentScreen.remove();
    }

    // Get and render new screen
    const component = this.screens.get(id);
    if (component) {
      const element = component(props);
      this.container.innerHTML = '';
      this.container.appendChild(element);
      this.currentScreen = element;
    }
  }
}

export default Navigator;
