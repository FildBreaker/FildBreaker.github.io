// theme.js
import { dataManager } from './dataManager.js';
import { isEditor } from './auth.js';

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

// Фоны лежат ЛОКАЛЬНО в data/bg/ — внешние CDN (pexels) недоступны из РФ и
// в какой-то момент отдали 404 на все фото, из-за чего фон сайта превратился в градиент.
// Источник — Wikimedia Commons (свободные лицензии):
//   bg-1: "Fog descending on a pine forest" (Unsplash, CC0) — серо-зеленый бор
//   bg-2: "Mystical forest in fog" (Flickr, CC BY) — туманный лиственный лес
//   bg-3: "Lake Mapourika, NZ" (Wikimedia, CC BY-SA) — синее озеро
//   bg-4: "Dark fog" (Wikimedia, CC BY-SA) — сизый туманный холм
//   bg-gold: "Fog in the Golden Valley - Falzarego Pass" (Wikimedia, CC BY-SA) — золото
//   bg-heide: "Haltern am See, Westruper Heide" (Wikimedia, CC BY-SA) — рассветная пустошь
//   bg-red: "Red Forest trees 2" (Wikimedia, CC BY-SA) — выгоревший лес, синее небо
const THEME_BG_LIST = {
  'dark-gold': [
    'data/bg/bg-gold.jpg',
    'data/bg/bg-heide.jpg',
    'data/bg/bg-1.jpg'
  ],
  'dark-blue': [
    'data/bg/bg-3.jpg',
    'data/bg/bg-4.jpg',
    'data/bg/bg-red.jpg'
  ],
  'dark-green': [
    'data/bg/bg-1.jpg',
    'data/bg/bg-2.jpg',
    'data/bg/bg-3.jpg'
  ],
  'dark-purple': [
    'data/bg/bg-4.jpg',
    'data/bg/bg-2.jpg',
    'data/bg/bg-red.jpg'
  ],
  'dark-red': [
    'data/bg/bg-red.jpg',
    'data/bg/bg-gold.jpg',
    'data/bg/bg-4.jpg'
  ],
  'light-gold': [
    'data/bg/bg-heide.jpg',
    'data/bg/bg-gold.jpg',
    'data/bg/bg-1.jpg'
  ],
  'light-blue': [
    'data/bg/bg-3.jpg',
    'data/bg/bg-red.jpg',
    'data/bg/bg-4.jpg'
  ],
  'light-green': [
    'data/bg/bg-2.jpg',
    'data/bg/bg-1.jpg',
    'data/bg/bg-3.jpg'
  ],
  'light-purple': [
    'data/bg/bg-4.jpg',
    'data/bg/bg-2.jpg',
    'data/bg/bg-heide.jpg'
  ],
  'light-red': [
    'data/bg/bg-heide.jpg',
    'data/bg/bg-gold.jpg',
    'data/bg/bg-red.jpg'
  ]
};

const THEME_BG_FALLBACK = {
  'dark-gold':'linear-gradient(135deg,#1a1a2e,#2d1f0e,#3d2b1f)',
  'dark-blue':'linear-gradient(135deg,#0a1628,#1a2a4a,#1f3a6a)',
  'dark-green':'linear-gradient(135deg,#0a1f0a,#1a3a1a,#2a5a2a)',
  'dark-purple':'linear-gradient(135deg,#1a0a2a,#2a1a4a,#3a2a6a)',
  'dark-red':'linear-gradient(135deg,#2a0a0a,#4a1a1a,#6a2a2a)',
  'light-gold':'linear-gradient(135deg,#fdf6e3,#f5e6ca,#ecd4b0)',
  'light-blue':'linear-gradient(135deg,#e8f0fe,#d0e0f5,#b8d0ec)',
  'light-green':'linear-gradient(135deg,#e8f5e8,#d0ecda,#b8e3cc)',
  'light-purple':'linear-gradient(135deg,#f0e8f5,#e0d0ec,#d0b8e3)',
  'light-red':'linear-gradient(135deg,#f5e8e8,#ecd0d0,#e3b8b8)'
};

const themePreviewColors = {
  'dark-gold':'#ffb347','dark-blue':'#4a8cff','dark-green':'#4caf50',
  'dark-purple':'#ab47bc','dark-red':'#e74c3c',
  'light-gold':'#b8860b','light-blue':'#1a6b8a','light-green':'#1a7a3a',
  'light-purple':'#6a1a8a','light-red':'#8a1a1a'
};

let currentTheme = 'dark-gold';
let themeModal = null;
let currentBgIndex = 0;
const bgUrlCache = {};
let firstThemeApply = true;

function readThemeFromDOM() {
  const cls = [...document.body.classList].find(c => c.startsWith('theme-'));
  return cls ? cls.replace('theme-', '') : null;
}

function testImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    setTimeout(() => resolve(false), 6000);
  });
}

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
  if (layer.classList.contains('visible')) {
    layer.classList.remove('visible');
    await new Promise(r => setTimeout(r, 550));
  }
  const result = await findWorkingBg(themeName, startIndex);
  if (result) {
    // ВАЖНО: абсолютный URL. Относительный путь в css-переменной браузер
    // резолвит относительно файла стилей (css/base.css), а не страницы —
    // получалось /css/data/bg/... и 404.
    const absoluteUrl = new URL(result.url, location.href).href;
    document.documentElement.style.setProperty('--bg-image-url', `url("${absoluteUrl}")`);
    currentBgIndex = result.index;
    await new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = result.url;
    });
    requestAnimationFrame(() => layer.classList.add('visible'));
  } else {
    document.documentElement.style.setProperty('--bg-image-url', THEME_BG_FALLBACK[themeName] || 'none');
    layer.classList.remove('visible');
  }
}

export function applyTheme(themeName) {
  if (!themeName || !THEMES[themeName]) themeName = 'dark-gold';

  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ');
  document.body.classList.add(`theme-${themeName}`);
  document.documentElement.setAttribute('data-theme', themeName);
  currentTheme = themeName;
  try { localStorage.setItem('b21-theme', themeName); } catch (e) {}

  if (!firstThemeApply) {
    document.body.classList.add('theme-transitioning');
    clearTimeout(window.__themeTransitionTimer);
    window.__themeTransitionTimer = setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 700);
  }
  firstThemeApply = false;

  setBackgroundForTheme(themeName, 0);
  if (themeModal && themeModal.style.display === 'flex') renderThemeOptions();
}

export async function cycleBackground() {
  const list = THEME_BG_LIST[currentTheme] || [];
  if (!list.length) return;
  await setBackgroundForTheme(currentTheme, (currentBgIndex + 1) % list.length);
}

export async function loadTheme() {
  // Тема — ЛИЧНАЯ настройка: localStorage всегда главный.
  // Firebase хранит лишь «дефолтную тему сайта» (ее задает редактор) для тех,
  // кто тему ни разу не выбирал. Раньше тема из Firebase перетирала локальный
  // выбор при каждом заходе — из-за этого у зрителей она «не сохранялась».
  const localTheme = localStorage.getItem('b21-theme');
  if (localTheme && THEMES[localTheme]) { applyTheme(localTheme); return; }
  let globalTheme = null;
  try { globalTheme = await dataManager.loadTheme(); } catch (e) { console.warn('Не удалось загрузить тему:', e); }
  applyTheme(globalTheme && THEMES[globalTheme] ? globalTheme : 'dark-gold');
}

export async function saveTheme(themeName) {
  if (!THEMES[themeName]) return;
  applyTheme(themeName); // applyTheme сохраняет выбор в localStorage — этого достаточно зрителю
  // В Firebase пишем только редакторы: это дефолт для новых посетителей.
  // Обычным пользователям писать в базу некуда (правила разрешают запись только редакторам),
  // а их выбор и так живет у них в localStorage.
  if (isEditor()) {
    try { await dataManager.saveTheme(themeName); } catch (e) {}
  }
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
      <button type="button" id="cycleBgBtn" style="margin-top:16px; width:100%; background:var(--bg-hover); border:1px solid var(--border-color); color:var(--text-secondary); padding:10px 16px; border-radius:40px; cursor:pointer; font-family:inherit; font-size:0.9rem;">
        <i class="fas fa-sync-alt"></i> Сменить фоновую картинку
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  themeModal = modal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeThemeModal(); });
  renderThemeOptions();
  document.getElementById('cycleBgBtn').addEventListener('click', () => cycleBackground());
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

window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.saveTheme = saveTheme;
window.cycleBackground = cycleBackground;

document.addEventListener('DOMContentLoaded', loadTheme);
