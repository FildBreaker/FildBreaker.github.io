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

// Фоны: оптимизированные под blur (w=800, q=50, webp)
const THEME_BG_LIST = {
  'dark-gold': [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=50&fm=webp'
  ],
  'dark-blue': [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=50&fm=webp'
  ],
  'dark-green': [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=50&fm=webp'
  ],
  'dark-purple': [
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=50&fm=webp'
  ],
  'dark-red': [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=50&fm=webp'
  ],
  'light-gold': [
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=50&fm=webp'
  ],
  'light-blue': [
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=50&fm=webp'
  ],
  'light-green': [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=50&fm=webp'
  ],
  'light-purple': [
    'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=50&fm=webp'
  ],
  'light-red': [
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&q=50&fm=webp',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=50&fm=webp'
  ]
};

const THEME_BG_FALLBACK = {
  'dark-gold':   'linear-gradient(135deg, #1a1a2e, #2d1f0e, #3d2b1f)',
  'dark-blue':   'linear-gradient(135deg, #0a1628, #1a2a4a, #1f3a6a)',
  'dark-green':  'linear-gradient(135deg, #0a1f0a, #1a3a1a, #2a5a2a)',
  'dark-purple': 'linear-gradient(135deg, #1a0a2a, #2a1a4a, #3a2a6a)',
  'dark-red':    'linear-gradient(135deg, #2a0a0a, #4a1a1a, #6a2a2a)',
  'light-gold':  'linear-gradient(135deg, #fdf6e3, #f5e6ca, #ecd4b0)',
  'light-blue':  'linear-gradient(135deg, #e8f0fe, #d0e0f5, #b8d0ec)',
  'light-green': 'linear-gradient(135deg, #e8f5e8, #d0ecda, #b8e3cc)',
  'light-purple':'linear-gradient(135deg, #f0e8f5, #e0d0ec, #d0b8e3)',
  'light-red':   'linear-gradient(135deg, #f5e8e8, #ecd0d0, #e3b8b8)'
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
let currentBgIndex = 0;
const bgUrlCache = {};

// Флаг: идёт ли первая инициализация (без анимации)
let firstThemeApply = true;

// Какой из двух слоёв градиента сейчас активен
let activeGradientLayer = 'A';

// ===== Утилита: читаем актуальную тему из DOM =====
function readThemeFromDOM() {
  const cls = [...document.body.classList].find(c => c.startsWith('theme-'));
  return cls ? cls.replace('theme-', '') : null;
}

// ===== Двойная буферизация градиента (для плавного перехода) =====
function ensureGradientLayers() {
  if (!document.getElementById('bgGradientA')) {
    const a = document.createElement('div');
    a.id = 'bgGradientA';
    a.className = 'bg-gradient active';
    const css = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-image-css').trim();
    a.style.background = css || THEME_BG_FALLBACK[currentTheme];
    document.body.insertBefore(a, document.body.firstChild);
  }
  if (!document.getElementById('bgGradientB')) {
    const b = document.createElement('div');
    b.id = 'bgGradientB';
    b.className = 'bg-gradient bg-b';
    document.body.insertBefore(b, document.body.firstChild);
  }
}

function switchGradientTo(cssGradient) {
  ensureGradientLayers();
  const a = document.getElementById('bgGradientA');
  const b = document.getElementById('bgGradientB');
  if (!a || !b) return;

  const current = activeGradientLayer === 'A' ? a : b;
  const next    = activeGradientLayer === 'A' ? b : a;

  next.style.background = cssGradient;
  // Форсируем reflow, чтобы transition сработал
  void next.offsetWidth;
  requestAnimationFrame(() => {
    next.classList.add('active');
    current.classList.remove('active');
    activeGradientLayer = activeGradientLayer === 'A' ? 'B' : 'A';
  });
}

// ===== Получить градиент для темы =====
function getThemeGradient(themeName) {
  // Создаём временный элемент с нужной темой и читаем CSS-переменную
  const tmp = document.createElement('div');
  tmp.setAttribute('data-theme', themeName);
  tmp.style.position = 'absolute';
  tmp.style.visibility = 'hidden';
  tmp.style.pointerEvents = 'none';
  document.documentElement.appendChild(tmp);
  const val = getComputedStyle(tmp).getPropertyValue('--bg-image-css').trim();
  document.documentElement.removeChild(tmp);

  if (val && val !== 'none') return val;
  return THEME_BG_FALLBACK[themeName] || THEME_BG_FALLBACK['dark-gold'];
}

// ===== Проверка доступности картинки =====
function testImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    setTimeout(() => resolve(false), 6000);
  });
}

// ===== Поиск рабочего фона =====
async function findWorkingBg(themeName, startIndex = 0) {
  const list = THEME_BG_LIST[themeName] || [];
  for (let i = 0; i < list.length; i++) {
    const idx = (startIndex + i) % list.length;
    const url = list[idx];
    if (bgUrlCache[url] === true) return { url, index: idx };
    if (bgUrlCache[url] === false) continue;
    const ok = await testImageUrl(url);
    bgUrlCache[url] = ok;
    if (ok) return { url, index: idx };
  }
  return null;
}

// ===== Слой картинки =====
let bgLayer = null;
function ensureBgLayer() {
  if (bgLayer && bgLayer.isConnected) return bgLayer;
  bgLayer = document.createElement('div');
  bgLayer.id = 'bgImageLayer';
  document.body.appendChild(bgLayer);
  return bgLayer;
}

async function setBackgroundForTheme(themeName, startIndex = 0) {
  const layer = ensureBgLayer();

  // Фаза 1: если картинка уже видна — плавно гасим
  if (layer.classList.contains('visible')) {
    layer.classList.remove('visible');
    await new Promise(r => setTimeout(r, 550));
  }

  const result = await findWorkingBg(themeName, startIndex);

  if (result) {
    document.documentElement.style.setProperty('--bg-image-url', `url("${result.url}")`);
    currentBgIndex = result.index;

    // Ждём, пока браузер реально загрузит картинку в кэш
    await new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = result.url;
    });

    // Плавный fade-in
    requestAnimationFrame(() => layer.classList.add('visible'));
  } else {
    document.documentElement.style.setProperty('--bg-image-url', 'none');
    layer.classList.remove('visible');
  }
}

// ===== Применение темы =====
export function applyTheme(themeName) {
  if (!themeName || !THEMES[themeName]) themeName = 'dark-gold';

  // Меняем классы темы
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ');
  document.body.classList.add(`theme-${themeName}`);

  // Дублируем тему на <html> — CSS мгновенно применяет нужный градиент
  document.documentElement.setAttribute('data-theme', themeName);

  currentTheme = themeName;
  try { localStorage.setItem('b21-theme', themeName); } catch (e) {}

  // Плавный переход — только если это НЕ первая инициализация
  if (!firstThemeApply) {
    document.body.classList.add('theme-transitioning');
    clearTimeout(window.__themeTransitionTimer);
    window.__themeTransitionTimer = setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 700);
  }

  // Обновляем градиент-подложку
  const gradient = getThemeGradient(themeName);
  if (firstThemeApply) {
    ensureGradientLayers();
    const a = document.getElementById('bgGradientA');
    if (a) a.style.background = gradient;
  } else {
    switchGradientTo(gradient);
  }

  // Меняем картинку
  setBackgroundForTheme(themeName, 0);

  firstThemeApply = false;

  if (themeModal && themeModal.style.display === 'flex') {
    renderThemeOptions();
  }
}

// ===== Смена фоновой картинки вручную =====
export async function cycleBackground() {
  const list = THEME_BG_LIST[currentTheme] || [];
  if (!list.length) return;
  const nextIndex = (currentBgIndex + 1) % list.length;
  await setBackgroundForTheme(currentTheme, nextIndex);
}

// ===== Загрузка темы при старте =====
export async function loadTheme() {
  const localTheme = localStorage.getItem('b21-theme');
  if (localTheme && THEMES[localTheme]) applyTheme(localTheme);
  else applyTheme('dark-gold');

  try {
    const globalTheme = await dataManager.loadTheme();
    if (globalTheme && THEMES[globalTheme]) {
      const activeInDOM = readThemeFromDOM();
      if (globalTheme !== activeInDOM) applyTheme(globalTheme);
    }
  } catch (e) { console.warn('Не удалось загрузить тему:', e); }
}

// ===== Сохранение темы =====
export async function saveTheme(themeName) {
  if (!THEMES[themeName]) return;
  applyTheme(themeName);
  try { await dataManager.saveTheme(themeName); }
  catch (e) { console.warn('Не удалось сохранить тему:', e); }
}

// ===== Модалка выбора темы =====
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
      <button type="button" id="cycleBgBtn" style="margin-top:16px; width:100%; background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-secondary); padding:10px 16px; border-radius:40px; cursor:pointer; font-family:inherit; font-size:0.9rem; transition: all 0.2s;">
        <i class="fas fa-sync-alt"></i> Сменить фоновую картинку
      </button>
      <div style="margin-top:14px; text-align:center; font-size:0.8rem; color:var(--text-muted);">
        Тема сохраняется для всех пользователей (через Firebase)
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  themeModal = modal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeThemeModal(); });
  renderThemeOptions();
  document.getElementById('cycleBgBtn').addEventListener('click', async () => {
    await cycleBackground();
  });
}

function renderThemeOptions() {
  const container = document.getElementById('themeOptions');
  if (!container) return;

  const activeTheme = readThemeFromDOM() || currentTheme;

  container.innerHTML = '';
  Object.entries(THEMES).forEach(([key, label]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = activeTheme === key;
    btn.className = `theme-option ${isActive ? 'active' : ''}`;
    btn.dataset.theme = key;
    const color = themePreviewColors[key] || '#888';
    btn.innerHTML = `
      <span class="theme-preview" style="border-color: ${color};"></span>
      <span>${label}</span>
      ${isActive ? '<i class="fas fa-check" style="color:var(--accent); margin-left:auto;"></i>' : ''}
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

  const activeInDOM = readThemeFromDOM();
  if (activeInDOM) currentTheme = activeInDOM;

  themeModal = document.getElementById('themeModal');
  if (themeModal) {
    renderThemeOptions();
    themeModal.style.display = 'flex';
  }
}

export function closeThemeModal() {
  if (themeModal) themeModal.style.display = 'none';
}

// ===== Глобальные функции для HTML =====
window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.saveTheme = saveTheme;
window.cycleBackground = cycleBackground;

// ===== Автозагрузка =====
document.addEventListener('DOMContentLoaded', loadTheme);
