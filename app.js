// app.js — SPA для Б-31ЛЕС
import { dataManager } from './dataManager.js';
import { createRichEditor, sanitizeHtml, escapeHtml as esc } from './rich-editor.js';
import { openDatePicker, formatDate } from './date-picker.js';
import { toast, toastSuccess, toastError, toastWarning, toastInfo, confirmDialog } from './toast.js';
import { renderEmpty } from './empty-states.js';
import { applyCollapse, watchCollapse } from './collapse.js';
import { isEditor, getCurrentUser } from './auth.js';

// ============================================================
// TELEGRAM NOTIFICATIONS
// ============================================================
const TG_WORKER_URL = 'https://jolly-violet-3d1eb31les.fildbreaker.workers.dev';

async function tgNotify(message) {
  const user = getCurrentUser();
  if (!user || !isEditor()) return; 

  try {
    const token = await user.getIdToken();
    await fetch(TG_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    console.warn('TG notify failed:', err);
  }
}

const state = {
  currentRoute: null,
  intervals: {},
  data: {
    schedule: null,
    homework: null,
    exams: null,
    resources: null,
    extracurricular: null,
    teachers: null
  }
};

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') {
    return Object.keys(val).sort((a, b) => Number(a) - Number(b)).map(k => val[k]);
  }
  return [];
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
}
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'flex';
}

function setupModalGlobals() {
  document.addEventListener('click', (e) => {
    const closeEl = e.target.closest('[data-close]');
    if (closeEl) {
      const id = closeEl.dataset.close;
      if (id) closeModal(id);
    }
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modals = [...document.querySelectorAll('.modal')].filter(m => m.style.display === 'flex');
    if (modals.length) modals[modals.length - 1].style.display = 'none';
  });
}

const ROUTES = ['home', 'schedule', 'exam', 'resources', 'homework', 'extracurricular', 'teacher'];

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  return ROUTES.includes(hash) ? hash : 'home';
}

async function navigate() {
  const route = parseRoute();
  if (state.currentRoute === route) return;

  const mc = document.getElementById('mainContent');

  if (state.currentRoute && mc) {
    mc.classList.add('route-exit');
    await new Promise(r => setTimeout(r, 200));
    mc.classList.remove('route-exit');
  }

  if (state.currentRoute) destroyRoute(state.currentRoute);
  state.currentRoute = route;

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });

  try {
    const renderer = RENDERERS[route];
    if (renderer) await renderer();

    if (mc) {
      mc.classList.remove('route-enter');
      void mc.offsetWidth;
      mc.classList.add('route-enter');
      setTimeout(() => mc.classList.remove('route-enter'), 700);
    }

    applyCollapse();
    if (window.setStagger) window.setStagger();
  } catch (err) {
    console.error(`[route:${route}] error:`, err);
  }
}

function destroyRoute(route) {
  if (state.intervals[route]) {
    clearInterval(state.intervals[route]);
    state.intervals[route] = null;
  }
}

window.addEventListener('hashchange', navigate);

// ============================================================
// САЙДБАР (ЦЕНТРАЛИЗОВАННЫЙ)
// ============================================================
function setSidebar(html) { document.getElementById('sidebarDynamic').innerHTML = html; }

function setSidebarNavHandlers() {
  document.querySelectorAll('#sidebarDynamic [data-nav]').forEach(btn => {
    btn.onclick = () => { location.hash = '#/' + btn.dataset.nav; };
  });
}

function renderSidebar(route) {
  let html = '';

  if (['home', 'schedule', 'exam', 'teacher'].includes(route)) {
    let note = '';
    if (route === 'home') note = '<div class="sidebar-note"><i class="fas fa-database"></i><p>Данные синхронизируются через Firebase.</p></div>';
    if (route === 'schedule') note = '<div class="sidebar-note"><i class="fas fa-cloud-upload-alt"></i><p>Большой брат следит за тобой.</p></div>';
    if (route === 'exam') note = '<div class="sidebar-note"><i class="fas fa-info-circle"></i><p>Информация о экзаменах, на которую мы забьём болт.</p></div>';
    if (route === 'teacher') note = '<div class="sidebar-note"><i class="fas fa-users"></i><p>Преподавательский состав</p></div>';

    html = `
      <h3><i class="fas fa-compass"></i> Основное</h3>
      <div class="nav-buttons">
        <button class="nav-btn" data-nav="extracurricular"><i class="fas fa-calendar-alt"></i> Мероприятия</button>
        <button class="nav-btn" data-nav="teacher"><i class="fas fa-chalkboard-teacher"></i> Преподаватели</button>
        <button class="nav-btn" data-nav="resources"><i class="fas fa-link"></i> Ресурсы</button>
        <button class="nav-btn" data-nav="homework"><i class="fas fa-book-open"></i> Домашка</button>
      </div>
      ${note}
    `;
  } else if (route === 'resources') {
    html = `
      <h3><i class="fas fa-filter"></i> Фильтры</h3>
      <div class="filter-buttons">
        <button class="filter-btn active-filter" data-category="all"><i class="fas fa-th-large"></i> Все</button>
        <button class="filter-btn" data-category="study"><i class="fas fa-book"></i> Учебники</button>
        <button class="filter-btn" data-category="video"><i class="fas fa-video"></i> Видео</button>
        <button class="filter-btn" data-category="test"><i class="fas fa-tasks"></i> Конспекты</button>
        <button class="filter-btn" data-category="soft"><i class="fas fa-laptop-code"></i> Прочее</button>
      </div>
      <div class="sidebar-note"><i class="fas fa-database"></i><p>Архив для всякого хлама.</p></div>
    `;
  } else if (route === 'homework') {
    html = `
      <h3><i class="fas fa-book"></i> Предметы</h3>
      <div class="subjects-list" id="subjectsList"></div>
      <button class="add-subject-btn" id="addSubjectBtn"><i class="fas fa-plus-circle"></i> Добавить предмет</button>
      <div class="sidebar-note"><i class="fas fa-cloud-upload-alt"></i><p>Расписание, на которое хотя бы смотреть можно.</p></div>
    `;
  } else if (route === 'extracurricular') {
    html = `
      <h3><i class="fas fa-compass"></i> Разделы</h3>
      <div class="nav-sections">
        <button class="section-btn active" data-section="events"><i class="fas fa-bullhorn"></i> Мероприятия</button>
        <button class="section-btn" data-section="polls"><i class="fas fa-chart-simple"></i> Опросы</button>
        <button class="section-btn" data-section="tests"><i class="fas fa-puzzle-piece"></i> Тесты</button>
      </div>
      <button class="add-global-btn" id="globalAddBtn"><i class="fas fa-plus-circle"></i> Добавить</button>
      <div class="sidebar-note"><i class="fas fa-database"></i><p>День прошёл, число сменилось...</p></div>
    `;
  }

  setSidebar(html);
  setSidebarNavHandlers();
}

function setMain(html) { document.getElementById('mainContent').innerHTML = html; }
function showSkeletonMain(kind, count) {
  if (window.showSkeleton) window.showSkeleton('mainContent', count || 3, kind || 'card');
}
function hideSkeletonMain() {
  if (window.hideSkeleton) window.hideSkeleton('mainContent');
}

// ============================================================
// ГЛОБАЛЬНЫЙ ПОИСК
// ============================================================
function setupGlobalSearch() {
  const modal = document.createElement('div');
  modal.id = 'searchModal';
  modal.className = 'search-modal';
  modal.innerHTML = `
    <div class="search-modal-content">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="globalSearchInput" placeholder="Поиск по сайту..." autocomplete="off">
        <span class="search-close" id="globalSearchClose">ESC</span>
      </div>
      <div class="search-results" id="searchResults">
        <div class="search-hint">Введите запрос для поиска по расписанию, домашке, преподам и ресурсам...</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input = document.getElementById('globalSearchInput');
  const resultsBox = document.getElementById('searchResults');
  const closeBtn = document.getElementById('globalSearchClose');
  const openBtn = document.getElementById('openSearchBtn');

  // Открытие по кнопке
  if (openBtn) {
    openBtn.onclick = () => {
      modal.classList.add('active');
      input.focus();
    };
  }

  // Открытие по Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modal.classList.add('active');
      input.focus();
    }
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      input.value = '';
      resultsBox.innerHTML = '<div class="search-hint">Введите запрос для поиска...</div>';
    }
  });

  closeBtn.onclick = () => { modal.classList.remove('active'); };
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length < 2) {
      resultsBox.innerHTML = '<div class="search-hint">Введите хотя бы 2 символа...</div>';
      return;
    }

    const results = [];
    const pushResult = (type, title, text, url, icon) => {
      if (title.toLowerCase().includes(query) || (text && text.toLowerCase().includes(query))) {
        results.push({ type, title, text, url, icon });
      }
    };

    // Берем данные напрямую из state
    if (state.data.schedule) {
      Object.keys(state.data.schedule).forEach(day => {
        Object.keys(state.data.schedule[day]).forEach(pair => {
          const lesson = state.data.schedule[day][pair];
          if (lesson.subject) pushResult('Расписание', lesson.subject, `${lesson.room || ''}`, '#/schedule', 'fa-calendar-alt');
        });
      });
    }
    if (state.data.homework && state.data.homework.subjects) {
      state.data.homework.subjects.forEach(subj => {
        if (subj.tasks) subj.tasks.forEach(task => pushResult('Домашка', subj.name, task.desc.replace(/<[^>]+>/g, ''), '#/homework', 'fa-book-open'));
      });
    }
    if (state.data.exams) {
      state.data.exams.forEach(exam => pushResult('Экзамен', exam.subject, `Ауд: ${exam.room}, ${exam.teacher}`, '#/exam', 'fa-graduation-cap'));
    }
    if (state.data.teachers) {
      state.data.teachers.forEach(t => pushResult('Преподаватель', t.name, t.position, '#/teacher', 'fa-user-tie'));
    }
    if (state.data.resources) {
      state.data.resources.forEach(r => pushResult('Ресурс', r.title, r.desc.replace(/<[^>]+>/g, ''), '#/resources', 'fa-link'));
    }

    if (results.length === 0) {
      resultsBox.innerHTML = `<div class="search-hint">Ничего не найдено по запросу «${query}»</div>`;
    } else {
      resultsBox.innerHTML = results.slice(0, 15).map(r => `
        <a href="${r.url}" class="search-result-item" onclick="document.getElementById('searchModal').classList.remove('active')">
          <div class="search-res-icon"><i class="fas ${r.icon}"></i></div>
          <div class="search-res-info">
            <div class="search-res-type">${r.type}</div>
            <div class="search-res-title">${r.title}</div>
            <div class="search-res-text">${r.text || ''}</div>
          </div>
        </a>
      `).join('');
    }
  });
}

// ============================================================
// ГЛАВНАЯ
// ============================================================
async function renderHome() {
  renderSidebar('home');
  // ... (ОСТАЛЬНОЙ КОД РЕНДЕРА ГЛАВНОЙ БЕЗ ИЗМЕНЕНИЙ) ...
  // (Я его сократил для ответа, он должен быть в твоем файле)
  setMain(`
    <div class="welcome-strip">
      <div class="strip-image"><img src="data/forest.gif" alt="Лес" loading="lazy"></div>
      <div class="strip-text"><h2>✨ Добро пожаловать!</h2><p>Единый портал группы Б‑31ЛЕС с актуальным расписанием, экзаменами, домашкой и прочей фигнёй.</p></div>
    </div>
  `);
  // ... остальная часть функции renderHome ...
}

// ВСТАВЬ СЮДА ВСЕ СВОИ ФУНКЦИИ RENDER... (schedule, exam, resources, homework, extracurricular, teacher) 
// Они не меняются, я их пропускаю, чтобы не спамить.

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
const RENDERERS = {
  home: renderHome,
  schedule: renderSchedule,
  exam: renderExam,
  resources: renderResources,
  homework: renderHomework,
  extracurricular: renderExtracurricular,
  teacher: renderTeacher
};

function init() {
  setupModalGlobals();
  setupGlobalSearch(); // <--- ВОТ ТУТ ВЫЗЫВАЕТСЯ ПОИСК
  if (!location.hash) location.hash = '#/home';
  navigate();
  watchCollapse();

  window.addEventListener('resize', () => {
    document.querySelectorAll('.subject-item').forEach(setupSubjectScroll);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
