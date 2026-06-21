// theme.js
import { dataManager } from './dataManager.js';

// Доступные темы
const THEMES = {
  'dark-gold': '🌙 Тёмная (золотая)',
  'dark-blue': '🌙 Тёмная (синяя)',
  'dark-green': '🌙 Тёмная (зелёная)',
  'dark-purple': '🌙 Тёмная (фиолетовая)',
  'light': '☀️ Светлая'
};

let currentTheme = 'dark-gold';
let themeModal = null;

// ===== ПРИМЕНЕНИЕ ТЕМЫ =====
export function applyTheme(themeName) {
  if (!themeName || !THEMES[themeName]) {
    themeName = 'dark-gold';
  }

  // Удаляем все предыдущие классы тем
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
  } catch (e) {
    // ignore
  }

  // Обновляем иконку на кнопке
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      if (themeName === 'light') {
        icon.className = 'fas fa-sun';
      } else {
        icon.className = 'fas fa-moon';
      }
    }
  }

  // Обновляем активный класс в модалке (если открыта)
  if (themeModal && themeModal.style.display === 'flex') {
    document.querySelectorAll('.theme-option').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === themeName);
    });
  }
}

// ===== ЗАГРУЗКА ТЕМЫ =====
export async function loadTheme() {
  // 1. Сначала пробуем из localStorage (быстро)
  const localTheme = localStorage.getItem('b21-theme');
  if (localTheme && THEMES[localTheme]) {
    applyTheme(localTheme);
  } else {
    applyTheme('dark-gold');
  }

  // 2. Потом из Firebase (глобальная)
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

// ===== СОЗДАНИЕ МОДАЛКИ =====
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
        Выберите тему
      </h3>
      <div id="themeOptions" style="display:flex; flex-direction:column; gap:10px;"></div>
      <div style="margin-top:20px; text-align:center; font-size:0.8rem; color:var(--text-muted);">
        Тема сохраняется для всех пользователей
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  themeModal = modal;

  // Закрытие по клику вне
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeThemeModal();
  });

  // Заполняем список тем
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
    btn.innerHTML = `
      <span class="theme-preview"></span>
      <span>${label}</span>
      ${currentTheme === key ? '<i class="fas fa-check" style="color:var(--accent); margin-left:auto;"></i>' : ''}
    `;
    btn.addEventListener('click', async () => {
      await saveTheme(key);
      renderThemeOptions(); // обновляем галочки
      setTimeout(closeThemeModal, 500);
    });
    container.appendChild(btn);
  });
}

// ===== ОТКРЫТИЕ / ЗАКРЫТИЕ МОДАЛКИ =====
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

// ===== ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ДЛЯ КНОПОК ТЕМ =====
function injectThemeStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .theme-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--bg-hover);
      border: 2px solid var(--border-color);
      border-radius: 40px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.3s;
      font-family: inherit;
      font-size: 0.95rem;
      width: 100%;
      text-align: left;
    }
    .theme-option:hover {
      border-color: var(--accent);
      background: var(--bg-active);
      transform: translateX(4px);
    }
    .theme-option.active {
      border-color: var(--accent);
      background: var(--bg-active);
      box-shadow: 0 0 20px var(--accent-glow);
    }
    .theme-preview {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid var(--border-color);
      flex-shrink: 0;
      transition: 0.3s;
      background: var(--bg-card);
    }
    .theme-option.active .theme-preview {
      border-color: var(--accent);
    }
    /* Цвета для превью каждой темы */
    .theme-option[data-theme="dark-gold"] .theme-preview { border-color: #ffb347; }
    .theme-option[data-theme="dark-blue"] .theme-preview { border-color: #4a8cff; }
    .theme-option[data-theme="dark-green"] .theme-preview { border-color: #4caf50; }
    .theme-option[data-theme="dark-purple"] .theme-preview { border-color: #ab47bc; }
    .theme-option[data-theme="light"] .theme-preview { border-color: #f0a500; background: #ffffff; }
  `;
  document.head.appendChild(style);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  injectThemeStyles();
  loadTheme();
});

// Делаем функции глобальными для вызова из HTML (onclick)
window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.saveTheme = saveTheme;
