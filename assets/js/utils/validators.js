// Form and input validation
export const Validators = {
  email(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },

  required(value) {
    return value && value.trim().length > 0;
  },

  password(value) {
    return value && value.length >= 6;
  },

  date(value) {
    return /^\d{2}\/\d{2}\/\d{4}$/.test(value);
  },

  number(value) {
    return !isNaN(value) && value !== '';
  },

  phone(value) {
    return /^[\d\s\-\(\)]+$/.test(value);
  },
};

// String utilities
export const StringUtils = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  truncate(str, length) {
    return str.length > length ? str.slice(0, length) + '...' : str;
  },

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  },
};

// Array utilities
export const ArrayUtils = {
  shuffle(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  },

  unique(arr) {
    return [...new Set(arr)];
  },

  chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  flatten(arr) {
    return arr.reduce((flat, item) => flat.concat(Array.isArray(item) ? this.flatten(item) : item), []);
  },
};

// Animation utilities
export const Animations = {
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.animation = `fadeIn ${duration}ms ease forwards`;
  },

  slideUp(element, duration = 300) {
    element.style.animation = `fadeUp ${duration}ms cubic-bezier(0.4,0,0.2,1) forwards`;
  },

  pulse(element, duration = 1000) {
    element.style.animation = `pulse ${duration}ms ease infinite`;
  },
};

// Number utilities
export const NumberUtils = {
  percentage(value, total) {
    return Math.round((value / total) * 100);
  },

  round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};

// Time utilities
export const TimeUtils = {
  getDayName(index) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    return days[index];
  },

  getMonthName(index) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[index];
  },

  formatTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },

  formatDistance(date) {
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'agora';
    if (minutes < 60) return `há ${minutes}m`;
    if (hours < 24) return `há ${hours}h`;
    if (days < 7) return `há ${days}d`;
    return 'há muito tempo';
  },
};
