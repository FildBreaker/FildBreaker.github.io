// theme.js
import { dataManager } from './dataManager.js';

// Список тем: ключ → название для отображения
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

// Соответствие темы → цвет превью (для модалки)
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

// ===== ПРИМЕНЕНИЕ ТЕМЫ =====
export function applyTheme(themeName) {
  if (!themeName || !THEMES[themeName]) {
    themeName = 'dark-gold';
  }

  // Удаляем все предыдущие классы тем (начинаются с "theme-")
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ');

  // Добавляем новую тему
  document.body.classList.add(`theme-${themeName}`);
  currentTheme = themeName;

  // Сохраняем в localStorage
  try {
    localStorage.setItem('b21-theme', themeName);
  } catch (e) { /* ignore */ }

  // Обновляем модалку, если открыта
  if (themeModal && themeModal.style.display === 'flex') {
    renderThemeOptions();
  }
}

// ===== ЗАГРУЗКА ТЕМЫ =====
export async function loadTheme() {
  // Сначала из localStorage (быстро)
  const localTheme = localStorage.getItem('b21-theme');
  if (localTheme && THEMES[localTheme]) {
    applyTheme(localTheme);
  } else {
    applyTheme('dark-gold');
  }

  // Затем из Firebase (глобальная)
  try {
    const globalTheme = await dataManager.loadTheme();
    if (globalTheme && THEMES[globalTheme] && globalTheme !== currentTheme) {
      applyTheme(globalTheme);
    }
  } catch (e) {
    console.warn('Не удалось загрузить тему из Firebase:', e);
  }
}

// ===== СОХРАНЕНИЕ ТЕМЫ =====
export async function saveTheme(themeName) {
  if (!THEMES[themeName]) return;
  applyTheme(themeName);

  try {
    await dataManager.saveTheme(themeName);
  } catch (e) {
    console.warn('Не удалось сохранить тему в Firebase:', e);
  }
}

// ===== СОЗДАНИЕ МОДАЛКИ С ТЕМАМИ =====
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

  // Закрытие по клику вне
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeThemeModal();
  });

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
    // Цвет превью
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

// ===== ОТКРЫТИЕ / ЗАКРЫТИЕ =====
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

// Глобальные функции для вызова из HTML (onclick)
window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.saveTheme = saveTheme;

// Автозагрузка темы при старте
document.addEventListener('DOMContentLoaded', loadTheme);