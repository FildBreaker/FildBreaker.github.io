// theme.js
import { dataManager } from './dataManager.js';

const THEMES = {
  'dark-gold': 'Тёмная (золотая)',
  'dark-blue': 'Тёмная (синяя)',
  'dark-green': 'Тёмная (зелёная)',
  'dark-purple': 'Тёмная (фиолетовая)',
  'light': 'Светлая'
};

let currentTheme = 'dark-gold';

// Применить тему
function applyTheme(themeName) {
  if (!themeName || !THEMES[themeName]) themeName = 'dark-gold';
  document.body.className = `theme-${themeName}`;
  currentTheme = themeName;
  localStorage.setItem('b21-theme', themeName);
  // Обновляем иконку
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      if (themeName === 'light') icon.className = 'fas fa-sun';
      else icon.className = 'fas fa-moon';
    }
  }
}

// Загрузить тему (сначала из localStorage, потом из Firebase)
async function loadTheme() {
  // 1. localStorage
  const localTheme = localStorage.getItem('b21-theme');
  if (localTheme && THEMES[localTheme]) {
    applyTheme(localTheme);
  } else {
    applyTheme('dark-gold');
  }

  // 2. Firebase (глобальная тема)
  try {
    const globalTheme = await dataManager.load('theme');
    if (globalTheme && THEMES[globalTheme] && globalTheme !== currentTheme) {
      applyTheme(globalTheme);
    }
  } catch (e) {
    console.warn('Не удалось загрузить тему из Firebase:', e);
  }
}

// Сохранить тему в Firebase и применить
async function saveTheme(themeName) {
  if (!THEMES[themeName]) return;
  applyTheme(themeName);
  try {
    await dataManager.save('theme', themeName);
  } catch (e) {
    console.warn('Не удалось сохранить тему в Firebase:', e);
  }
}

// Открыть модалку выбора темы
function openThemeModal() {
  const modal = document.getElementById('themeModal');
  if (!modal) {
    // Создаём модалку, если её нет
    createThemeModal();
    return;
  }
  modal.style.display = 'flex';
  // Обновляем список тем
  const container = document.getElementById('themeOptions');
  if (container) {
    container.innerHTML = '';
    Object.entries(THEMES).forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.className = `theme-option ${currentTheme === key ? 'active' : ''}`;
      btn.dataset.theme = key;
      btn.innerHTML = `
        <span class="theme-preview" style="background:var(--bg-card); border-color:var(--border-color);"></span>
        ${label}
        ${currentTheme === key ? '<i class="fas fa-check" style="color:var(--accent);"></i>' : ''}
      `;
      btn.addEventListener('click', async () => {
        await saveTheme(key);
        // Обновляем активный класс в модалке
        document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Добавляем галочку
        document.querySelectorAll('.theme-option i.fa-check').forEach(i => i.remove());
        const check = document.createElement('i');
        check.className = 'fas fa-check';
        check.style.cssText = 'color:var(--accent); margin-left:8px;';
        btn.appendChild(check);
        // Закрываем через секунду
        setTimeout(() => closeThemeModal(), 600);
      });
      container.appendChild(btn);
    });
  }
}

function closeThemeModal() {
  const modal = document.getElementById('themeModal');
  if (modal) modal.style.display = 'none';
}

function createThemeModal() {
  const modal = document.createElement('div');
  modal.id = 'themeModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal" onclick="closeThemeModal()">&times;</span>
      <h3><i class="fas fa-palette"></i> Выберите тему оформления</h3>
      <div id="themeOptions" style="display:flex; flex-direction:column; gap:12px; margin-top:16px;"></div>
      <div class="modal-buttons" style="margin-top:20px;">
        <button class="cancel-btn" onclick="closeThemeModal()">Закрыть</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  // Обработчик закрытия по клику вне
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeThemeModal();
  });
  // Стили для кнопок тем
  const style = document.createElement('style');
  style.textContent = `
    .theme-option {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 18px;
      background: var(--bg-hover);
      border: 2px solid var(--border-color);
      border-radius: 40px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: 0.3s;
      font-family: inherit;
      font-size: 1rem;
      width: 100%;
    }
    .theme-option:hover {
      border-color: var(--accent);
      background: var(--bg-active);
    }
    .theme-option.active {
      border-color: var(--accent);
      background: var(--bg-active);
    }
    .theme-preview {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid var(--border-color);
      flex-shrink: 0;
      transition: 0.3s;
    }
    .theme-option.active .theme-preview {
      border-color: var(--accent);
      box-shadow: 0 0 12px var(--accent-glow);
    }
    /* Превью цветов для каждой темы */
    body.theme-dark-gold .theme-preview { background: #161b22; }
    body.theme-dark-blue .theme-preview { background: #161b22; }
    body.theme-dark-green .theme-preview { background: #161b22; }
    body.theme-dark-purple .theme-preview { background: #161b22; }
    body.theme-light .theme-preview { background: #f0f2f5; }
    .theme-option[data-theme="dark-gold"] .theme-preview { border-color: #ffb347; }
    .theme-option[data-theme="dark-blue"] .theme-preview { border-color: #4a8cff; }
    .theme-option[data-theme="dark-green"] .theme-preview { border-color: #4caf50; }
    .theme-option[data-theme="dark-purple"] .theme-preview { border-color: #ab47bc; }
    .theme-option[data-theme="light"] .theme-preview { border-color: #f0a500; background: #ffffff; }
  `;
  document.head.appendChild(style);
}

// Экспортируем функции в глобальный доступ для onclick
window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.saveTheme = saveTheme;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', loadTheme);