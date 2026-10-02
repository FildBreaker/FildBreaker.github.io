import { dataManager } from './dataManager.js';

export const THEMES = {
  'dark-gold':   '🌙 Тёмная золотая',
  'dark-blue':   '🌙 Тёмная синяя',
  'dark-green':  '🌙 Тёмная зеленая',
  'dark-purple': '🌙 Тёмная фиолетовая',
  'dark-red':    '🌙 Тёмная красная',
  'light-gold':  '☀️ Светлая золотая',
  'light-blue':  '☀️ Светлая синяя',
  'light-green': '☀️ Светлая зеленая',
  'light-purple':'☀️ Светлая фиолетовая',
  'light-red':   '☀️ Светлая красная'
};

// Уникальные фоны для каждой темы
const THEME_BG_LIST = {
  'dark-gold': [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&q=60&fm=webp'
  ],
  'dark-blue': [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1280&q=60&fm=webp'
  ],
  'dark-green': [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1280&q=60&fm=webp'
  ],
  'dark-purple': [
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1280&q=60&fm=webp'
  ],
  'dark-red': [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=60&fm=webp'
  ],
  'light-gold': [
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1280&q=60&fm=webp'
  ],
  'light-blue': [
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&q=60&fm=webp'
  ],
  'light-green': [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1280&q=60&fm=webp'
  ],
  'light-purple': [
    'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&q=60&fm=webp'
  ],
  'light-red': [
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1280&q=60&fm=webp',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1280&q=60&fm=webp'
  ]
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
  if (!themeName || !THEMES[themeName]) themeName = 'dark-gold';
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ');
  document.body.classList.add(`theme-${themeName}`);
  const bgUrl = THEME_BG[themeName] || THEME_BG['dark-gold'];
  document.documentElement.style.setProperty('--bg-image-url', `url("${bgUrl}")`);
  currentTheme = themeName;
  try { localStorage.setItem('b21-theme', themeName); } catch (e) {}
  if (themeModal && themeModal.style.display === 'flex') renderThemeOptions();
}

export async function loadTheme() {
  const localTheme = localStorage.getItem('b21-theme');
  if (localTheme && THEMES[localTheme]) applyTheme(localTheme);
  else applyTheme('dark-gold');
  try {
    const globalTheme = await dataManager.loadTheme();
    if (globalTheme && THEMES[globalTheme] && globalTheme !== currentTheme) {
      applyTheme(globalTheme);
    }
  } catch (e) { console.warn('Не удалось загрузить тему:', e); }
}

export async function saveTheme(themeName) {
  if (!THEMES[themeName]) return;
  applyTheme(themeName);
  try { await dataManager.saveTheme(themeName); }
  catch (e) { console.warn('Не удалось сохранить тему:', e); }
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
        Тема сохраняется для всех пользователей (через Firebase)
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  themeModal = modal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeThemeModal(); });
  renderThemeOptions();
}

function renderThemeOptions() {
  const container = document.getElementById('themeOptions');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(THEMES).forEach(([key, label]) => {
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
    container.appendChild(btn);
  });
}

export function openThemeModal() {
  if (!document.getElementById('themeModal')) createThemeModal();
  themeModal = document.getElementById('themeModal');
  if (themeModal) {
    renderThemeOptions();
    themeModal.style.display = 'flex';
  }
}

export function closeThemeModal() {
  if (themeModal) themeModal.style.display = 'none';
}

window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.saveTheme = saveTheme;

document.addEventListener('DOMContentLoaded', loadTheme);
