// Shared screen components
import { DOM } from '../utils/helpers.js';
import { Colors } from '../config/colors.js';

export function createHeaderBar(title, userInfo = null) {
  const header = DOM.create('div', 'dashboard-header');
  
  if (userInfo) {
    // User avatar
    const avatar = DOM.create('div');
    avatar.style.width = '34px';
    avatar.style.height = '34px';
    avatar.style.borderRadius = '50%';
    avatar.style.background = `${userInfo.color}22`;
    avatar.style.border = `2px solid ${userInfo.color}55`;
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.fontSize = '18px';
    avatar.style.flexShrink = '0';
    avatar.textContent = userInfo.emoji;
    
    // User info
    const userDetails = DOM.create('div');
    const greeting = DOM.create('div');
    greeting.style.color = Colors.text;
    greeting.style.fontWeight = '700';
    greeting.style.fontSize = '14px';
    greeting.style.lineHeight = '1';
    greeting.textContent = 'Olá! 👋';
    
    const nick = DOM.create('div');
    nick.style.color = Colors.muted;
    nick.style.fontSize = '12px';
    nick.textContent = userInfo.nick || '@usuario';
    
    userDetails.appendChild(greeting);
    userDetails.appendChild(nick);
    
    header.appendChild(avatar);
    header.appendChild(userDetails);
  }
  
  // Spacer
  const spacer = DOM.create('div');
  spacer.style.flex = '1';
  spacer.style.minWidth = '180px';
  header.appendChild(spacer);
  
  // Title
  const titleEl = DOM.create('span');
  titleEl.style.color = Colors.text;
  titleEl.style.fontWeight = '700';
  titleEl.style.fontSize = '15px';
  titleEl.textContent = title;
  header.appendChild(titleEl);
  
  return header;
}

export function createBreadcrumb(label, statusBadge = null) {
  const breadcrumb = DOM.create('div', 'dashboard-breadcrumb');
  
  const labelEl = DOM.create('span');
  labelEl.style.color = Colors.text;
  labelEl.style.fontWeight = '700';
  labelEl.style.fontSize = '15px';
  labelEl.textContent = label;
  
  breadcrumb.appendChild(labelEl);
  
  if (statusBadge) {
    breadcrumb.appendChild(statusBadge);
  }
  
  return breadcrumb;
}

export function createStatusBadge(text, color = Colors.pink) {
  const badge = DOM.create('span');
  badge.style.background = `${color}15`;
  badge.style.border = `1px solid ${color}44`;
  badge.style.borderRadius = '8px';
  badge.style.padding = '3px 10px';
  badge.style.color = color;
  badge.style.fontSize = '12px';
  badge.style.fontWeight = '700';
  badge.style.marginLeft = 'auto';
  badge.textContent = text;
  return badge;
}

export default {
  createHeaderBar,
  createBreadcrumb,
  createStatusBadge,
};
