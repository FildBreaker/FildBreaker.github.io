// theme.js
import { dataManager } from './dataManager.js';

export const THEMES = {
  'dark-gold':   '🌙 Тёмная золотая',
  'dark-blue':   '🌙 Тёмная синяя',
  'dark-green':  '🌙 Тёмная зелёная',
  'dark-purple': '🌙 Тёмная фиолетовая',
  'dark-red':    '🌙 Тёмная красная',
  'light-gold':  '☀️ Светлая золотая',
  'light-blue':  '☀️ Светлая синяя',
  'light-green': '☀️ Светлая зелёная',
  'light-purple':'☀️ Светлая фиолетовая',
  'light-red':   '☀️ Светлая красная'
};

const themePreviewColors = {
  'dark-gold':   '#ffb347',
  'dark-blue':   '#4a8cff',
  'dark-green':  '#4caf50',
  'dark-purple': '#ab47bc',
  'dark-red':    '#e74c3c',
  'light-gold':  '#b8860b',
  'light-blue':  '#1a6b8a',
  'light-green': '#1a7a3a',
  'light-purple':'#6a1a8a',
  'light-red':   '#8a1a1a'
};

let currentTheme = 'dark-gold';
let themeModal = null;

export function applyTheme(themeName) {
  if (!themeName || !THEMES[themeName]) {
    themeName = 'dark-gold';
  }
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ');
  document.body.classList.add(`theme-${themeName}`);
  currentTheme = themeName;
  
  // Сохраняем в localStorage (только локально)
  try {
    localStorage.setItem('b21-theme', themeName);
  } catch (e) { /* ignore */ }
  
  if (themeModal && themeModal.style.display === 'flex') {
    renderThemeOptions();
  }
}

export async function loadTheme() {
  // Только локальное хранилище, без Firebase
  const localTheme = localStorage.getItem('b21-theme');
  if (localTheme && THEMES[localTheme]) {
    applyTheme(localTheme);
  } else {
    applyTheme('dark-gold');
  }
}

export async function saveTheme(themeName) {
  if (!THEMES[themeName]) return;
  applyTheme(themeName);
  // Сохраняем только локально
  // (убрана синхронизация с Firebase)
}

function createThemeModal() {
  if (document.getElementById('themeModal')) return;
  const modal = document.createElement('div');
  modal.id = 'themeModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:420px;">
      <span class="close-modal" onclick="window.closeThemeModal()">&times;</span>
      <h3 style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
        <i class="fas fa-palette" style="color:var(--accent);"></i>
        Выберите тему оформления
      </h3>
      <div id="themeOptions" style="display:flex; flex-direction:column; gap:10px;"></div>
      <div style="margin-top:20px; text-align:center; font-size:0.8rem; color:var(--text-muted);">
        Тема сохраняется только на этом устройстве
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  themeModal = modal;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeThemeModal();
  });
  renderThemeOptions();
}

function renderThemeOptions() {
  const container = document.getElementById('themeOptions');
  if (!container) return;
  container.innerHTML = '';

  const darkLabel = document.createElement('div');
  darkLabel.style.cssText = 'font-weight:600; margin-top:8px; color:var(--text-secondary);';
  darkLabel.textContent = '🌙 Тёмные';
  container.appendChild(darkLabel);

  Object.entries(THEMES).forEach(([key, label]) => {
    if (!key.startsWith('dark')) return;
    const btn = createThemeButton(key, label);
    container.appendChild(btn);
  });

  const lightLabel = document.createElement('div');
  lightLabel.style.cssText = 'font-weight:600; margin-top:12px; color:var(--text-secondary);';
  lightLabel.textContent = '☀️ Светлые';
  container.appendChild(lightLabel);

  Object.entries(THEMES).forEach(([key, label]) => {
    if (!key.startsWith('light')) return;
    const btn = createThemeButton(key, label);
    container.appendChild(btn);
  });
}

function createThemeButton(key, label) {
  const btn = document.createElement('button');
  btn.className = `theme-option ${currentTheme === key ? 'active' : ''}`;
  btn.dataset.theme = key;
  const color = themePreviewColors[key] || '#888';
  btn.innerHTML = `
    <span class="theme-preview" style="border-color: ${color};"></span>
    <span>${label}</span>
    ${currentTheme === key ? '<i class="fas fa-check" style="color:var(--accent); margin-left:auto;"></i>' : ''}
  `;
  btn.addEventListener('click', async () => {
    await saveTheme(key);
    renderThemeOptions();
    setTimeout(closeThemeModal, 500);
  });
  return btn;
}

export function openThemeModal() {
  if (!document.getElementById('themeModal')) {
    createThemeModal();
  }
  themeModal = document.getElementById('themeModal');
  if (themeModal) {
    renderThemeOptions();
    themeModal.style.display = 'flex';
  }
}

export function closeThemeModal() {
  if (themeModal) {
    themeModal.style.display = 'none';
  }
}

window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.saveTheme = saveTheme;

document.addEventListener('DOMContentLoaded', loadTheme);
