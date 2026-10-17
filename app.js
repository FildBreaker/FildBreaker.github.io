// app.js
import { state } from './state.js';
import { setupModalGlobals } from './utils.js';
import { setupGlobalSearch } from './search.js';
import { applyCollapse, watchCollapse } from './collapse.js';
import { setupSubjectScroll } from './routes/homework.js';

// Импортируем рендеры страниц
import { renderHome } from './routes/home.js';
import { renderSchedule } from './routes/schedule.js';
import { renderExam } from './routes/exam.js';
import { renderResources } from './routes/resources.js';
import { renderHomework } from './routes/homework.js';
import { renderExtracurricular } from './routes/extracurricular.js';
import { renderTeacher } from './routes/teacher.js';

const ROUTES = ['home', 'schedule', 'exam', 'resources', 'homework', 'extracurricular', 'teacher'];

const RENDERERS = {
  home: renderHome,
  schedule: renderSchedule,
  exam: renderExam,
  resources: renderResources,
  homework: renderHomework,
  extracurricular: renderExtracurricular,
  teacher: renderTeacher
};

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

  if (state.currentRoute && state.intervals[state.currentRoute]) {
    clearInterval(state.intervals[state.currentRoute]);
    state.intervals[state.currentRoute] = null;
  }
  
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

function init() {
  setupModalGlobals();
  setupGlobalSearch();
  
  if (!location.hash) location.hash = '#/home';
  window.addEventListener('hashchange', navigate);
  
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
