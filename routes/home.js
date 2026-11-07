// routes/home.js
import { openDatePicker, formatDate } from '../date-picker.js';
import { toastWarning, toastSuccess } from '../toast.js';
import { isEditor } from '../auth.js';
import { setSidebar, setMain, setSidebarNavHandlers, openModal, closeModal } from '../utils.js';
import { state } from '../state.js';
import { dataManager } from '../dataManager.js';
import { escapeHtml as esc } from '../rich-editor.js';

// Время пар — дублирует справочник из schedule.js (там он не экспортируется)
const PAIR_TIMES = { 1: ['09:00', '10:30'], 2: ['10:45', '12:15'], 3: ['12:30', '14:00'], 4: ['14:40', '16:10'], 5: ['16:20', '17:50'], 6: ['18:00', '19:30'] };

// Дата ДД.ММ.ГГГГ (формат из редактора расписания) — или null
function parseRuDate(s) {
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

// Дата экзамена: ДД.ММ.ГГГГ [ЧЧ:ММ] или ISO; без времени считаем 9:00
function parseExamDate(s) {
  if (typeof s !== 'string') return null;
  let m = s.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], m[4] ? +m[4] : 9, m[5] ? +m[5] : 0);
  m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{1,2}):(\d{2}))?/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 9, m[5] ? +m[5] : 0) : null;
}

export async function renderHome() {
  setSidebar(`
    <h3><i class="fas fa-compass"></i> Основное</h3>
    <div class="nav-buttons">
      <button class="nav-btn" data-nav="extracurricular"><i class="fas fa-calendar-alt"></i> Мероприятия</button>
      <button class="nav-btn" data-nav="teacher"><i class="fas fa-chalkboard-teacher"></i> Преподаватели</button>
      <button class="nav-btn" data-nav="resources"><i class="fas fa-link"></i> Ресурсы</button>
      <button class="nav-btn" data-nav="homework"><i class="fas fa-book-open"></i> Домашка</button>
    </div>
    <div class="sidebar-note"><i class="fas fa-database"></i><p>Данные синхронизируются через Firebase.</p></div>
  `);
  setSidebarNavHandlers();

  setMain(`
    <div class="welcome-strip">
      <div class="strip-image"><img src="data/forest.gif" alt="Лес" loading="lazy"></div>
      <div class="strip-text"><h2>✨ Добро пожаловать!</h2><p>Единый портал группы Б‑31ЛЕС с актуальным расписанием, экзаменами, домашкой и прочей фигнёй.</p></div>
    </div>
    <div class="today-card">
      <h3><i class="fas fa-sun"></i> Сегодня, <span class="today-date" id="todayDateLabel"></span></h3>
      <div id="todaySchedule"></div>
      <div id="todayDeadlines"></div>
    </div>
    <div style="background:var(--card-bg); backdrop-filter:blur(6px); border-radius:var(--radius); padding:24px 28px; border:1px solid var(--border-color); box-shadow:var(--shadow);">
      <h3 style="color:var(--text-secondary); margin-bottom:16px;"><i class="fas fa-hourglass-half"></i> Важные даты</h3>
      <div class="timers-container">
        <div class="timer-card">
          <h3><i class="fas fa-graduation-cap"></i> До экзаменов</h3>
          <div class="timer-display" id="examTimer">--:--:--</div>
          <div class="timer-sub" id="examTimerSub"></div>
          <div class="timer-controls">
            <button id="setExamDateBtn"><i class="fas fa-calendar-alt"></i> Установить дату</button>
          </div>
        </div>
        <div class="timer-card">
          <h3><i class="fas fa-flag-checkered"></i> До конца обучения</h3>
          <div class="timer-display" id="gradTimer">--:--:--</div>
          <div class="timer-sub"></div>
          <div class="timer-controls">
            <button id="setGradDateBtn"><i class="fas fa-calendar-alt"></i> Установить дату</button>
          </div>
        </div>
      </div>
    </div>
  `);

  // Общие даты: Firebase ключ 'settings' (dataManager сам кэширует в localStorage и ругается тостами).
  // Легаси-миграция: раньше даты жили только в localStorage этого браузера — подхватываем их,
  // чтобы редактор не потерял то, что уже настроил. Мертвые дефолты 2026-06 больше не нужны.
  const settings = (await dataManager.load('settings')) || {};
  let examTarget = settings.examTarget || null;
  let gradTarget = settings.gradTarget || null;
  const legacyExam = localStorage.getItem('examTarget');
  const legacyGrad = localStorage.getItem('gradTarget');
  if (!examTarget && legacyExam && new Date(legacyExam) > new Date()) examTarget = legacyExam;
  if (!gradTarget && legacyGrad && new Date(legacyGrad) > new Date()) gradTarget = legacyGrad;

  // Данные для виджета «Сегодня» и автотаймера (кэшируются в state.data как на остальных страницах)
  if (!state.data.schedule) {
    const savedSchedule = await dataManager.load('schedule');
    state.data.schedule = savedSchedule || {};
  }
  if (!state.data.exams) {
    const savedExams = await dataManager.load('exams');
    state.data.exams = Array.isArray(savedExams) ? savedExams : [];
  }
  if (!state.data.homework) {
    const savedHw = await dataManager.load('homework');
    state.data.homework = (savedHw && Array.isArray(savedHw.subjects)) ? savedHw : { subjects: [] };
  }

  // Автотаймер «до экзаменов»: если ручная дата не установлена (или устарела),
  // берем ближайший будущий экзамен из раздела «Экзамены»
  function nearestFutureExam() {
    const now = new Date();
    let best = null;
    (state.data.exams || []).forEach(ex => {
      if (!ex || typeof ex !== 'object') return;
      const d = parseExamDate(ex.date);
      if (!d || d <= now) return;
      if (!best || d < best.date) best = { date: d, subject: ex.subject || '', room: ex.room || '' };
    });
    return best;
  }
  let examSubText = '';
  const autoExam = nearestFutureExam();
  const manualExamFuture = examTarget && new Date(examTarget) > new Date();
  if (autoExam && !manualExamFuture) {
    examTarget = autoExam.date.toISOString();
    examSubText = `Авто из раздела «Экзамены»: ${autoExam.subject}${autoExam.room ? `, ауд. ${autoExam.room}` : ''}`;
  } else if (manualExamFuture) {
    examSubText = 'Ручная дата — проверь, не устарела ли она';
  }

  function updateTimer(target, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!target) { el.textContent = '--:--:--'; return; } // дата не установлена
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) { el.textContent = '00:00:00'; return; }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(days).padStart(2,'0')}д ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  }

  // Виджет «Сегодня»: сегодняшние пары (с учетом диапазона дат и отмен) + ближайшие дедлайны
  function renderTodayWidget() {
    const schedWrap = document.getElementById('todaySchedule');
    const dlWrap = document.getElementById('todayDeadlines');
    const label = document.getElementById('todayDateLabel');
    if (!schedWrap) return;

    const now = new Date();
    if (label) label.textContent = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

    const dayIdx = (now.getDay() + 6) % 7; // в расписании 0 = понедельник
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const rows = [];
    for (let pair = 1; pair <= 6; pair++) {
      const l = state.data.schedule?.[dayIdx]?.[pair];
      if (!l || !l.subject) continue;
      const s = parseRuDate(l.startDate), e = parseRuDate(l.endDate);
      if (s && todayStart < s) continue; // пара еще не началась по датам
      if (e && todayStart > e) continue; // пара уже закончилась по датам
      const [h1, m1] = PAIR_TIMES[pair][0].split(':').map(Number);
      const [h2, m2] = PAIR_TIMES[pair][1].split(':').map(Number);
      rows.push({ pair, startMin: h1 * 60 + m1, endMin: h2 * 60 + m2, ...l });
    }

    if (!rows.length) {
      schedWrap.innerHTML = `<div class="today-empty"><i class="fas fa-mug-hot"></i> Пар нет. Отдыхай, лесник.</div>`;
    } else {
      const nextIdx = rows.findIndex(r => r.startMin > nowMin);
      rows.forEach((r, i) => {
        r.status = r.isCancelled ? 'cancelled' : (r.startMin <= nowMin && nowMin < r.endMin) ? 'now' : (i === nextIdx ? 'next' : '');
      });
      schedWrap.innerHTML = rows.map(r => {
        const [t1, t2] = PAIR_TIMES[r.pair];
        const badge = r.status === 'now' ? '<span class="today-badge now">сейчас</span>'
          : r.status === 'cancelled' ? '<span class="today-badge cancel">отмена</span>'
          : r.status === 'next' ? `<span class="today-badge next">через ${r.startMin - nowMin} мин</span>` : '';
        return `
          <div class="today-pair ${r.status}">
            <span class="today-time">${t1}–${t2}</span>
            <span class="today-subject">${esc(r.subject)}${r.room ? ` · ${esc(r.room)}` : ''}</span>
            ${badge}
          </div>`;
      }).join('');
    }

    if (dlWrap) {
      const items = [];
      (state.data.homework?.subjects || []).forEach(subj => {
        if (!subj) return;
        (subj.tasks || []).forEach(t => {
          if (!t || !t.deadline) return;
          const d = new Date(t.deadline);
          if (isNaN(d)) return;
          const diffDays = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - todayStart) / 86400000);
          if (diffDays < -30 || diffDays > 7) return;
          const text = String(t.desc || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          items.push({ diffDays, subject: subj.name || '', text });
        });
      });
      items.sort((a, b) => a.diffDays - b.diffDays);
      const top = items.slice(0, 3);
      dlWrap.innerHTML = top.length
        ? `<div class="today-deadlines-title"><i class="fas fa-fire"></i> Дедлайны рядом</div>` + top.map(t => {
            const when = t.diffDays < 0 ? `просрочено на ${-t.diffDays} дн.` : t.diffDays === 0 ? 'сегодня!' : t.diffDays === 1 ? 'завтра' : `через ${t.diffDays} дн.`;
            return `<div class="today-deadline ${t.diffDays < 0 ? 'overdue' : t.diffDays <= 2 ? 'soon' : ''}">
                <span>${esc(t.subject)}${t.text ? ` — ${esc(t.text.slice(0, 60))}${t.text.length > 60 ? '…' : ''}` : ''}</span>
                <b>${when}</b>
              </div>`;
          }).join('')
        : '';
    }
  }

  let lastTodayMin = -1;
  function updateAll() {
    updateTimer(examTarget, 'examTimer');
    updateTimer(gradTarget, 'gradTimer');
    // Виджет пересобираем раз в минуту, а не каждый тик — DOM не дергаем зря
    const nowMin = new Date().getMinutes();
    if (lastTodayMin !== nowMin) { lastTodayMin = nowMin; renderTodayWidget(); }
  }
  updateAll();
  const examSubEl = document.getElementById('examTimerSub');
  if (examSubEl) examSubEl.textContent = examSubText;
  state.intervals.home = setInterval(updateAll, 1000);

  let activeTimer = null;
  let selectedDate = null;

  function updateDatePickerText() {
    const text = document.getElementById('homeDatePickerText');
    if (!text) return;
    text.textContent = formatDate(selectedDate);
  }

  function openDateModal(type) {
    activeTimer = type;
    const target = type === 'exam' ? examTarget : gradTarget;
    selectedDate = target ? new Date(target) : new Date(); // без даты стартуем с сегодняшней
    updateDatePickerText();
    document.getElementById('homeDateModalTitle').innerHTML = type === 'exam'
      ? '<i class="fas fa-graduation-cap"></i> Дата экзаменов'
      : '<i class="fas fa-flag-checkered"></i> Дата окончания обучения';
    openModal('homeDateModal');
  }

  document.getElementById('setExamDateBtn').onclick = () => { if (isEditor()) openDateModal('exam'); };
  document.getElementById('setGradDateBtn').onclick = () => { if (isEditor()) openDateModal('grad'); };

  document.getElementById('homeDatePickerBtn').onclick = () => {
    openDatePicker({
      anchorEl: document.getElementById('homeDatePickerBtn'),
      initial: selectedDate,
      onPick: (date) => { selectedDate = date; updateDatePickerText(); }
    });
  };

  document.getElementById('homeDateSaveBtn').onclick = async () => {
    if (!selectedDate) { toastWarning('Выберите дату'); return; }
    const iso = selectedDate.toISOString();
    if (activeTimer === 'exam') { examTarget = iso; }
    else { gradTarget = iso; }
    // Сохраняем обе даты одним узлом: save() делает полный set, поэтому merged-объект
    const ok = await dataManager.save('settings', { examTarget, gradTarget });
    if (!ok) return; // тост с причиной уже показал dataManager, модалку не закрываем — можно повторить
    updateAll();
    if (activeTimer === 'exam') {
      const sub = document.getElementById('examTimerSub');
      if (sub) sub.textContent = 'Ручная дата — проверь, не устарела ли она';
    }
    closeModal('homeDateModal');
    toastSuccess('Дата сохранена — теперь её видит вся группа');
  };
}