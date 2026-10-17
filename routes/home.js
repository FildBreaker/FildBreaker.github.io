// routes/home.js
import { openDatePicker, formatDate } from '../date-picker.js';
import { toastWarning, toastSuccess } from '../toast.js';
import { isEditor } from '../auth.js';
import { setSidebar, setMain, setSidebarNavHandlers, openModal, closeModal } from '../utils.js';
import { state } from '../state.js';

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
    <div style="background:var(--card-bg); backdrop-filter:blur(6px); border-radius:var(--radius); padding:24px 28px; border:1px solid var(--border-color); box-shadow:var(--shadow);">
      <h3 style="color:var(--text-secondary); margin-bottom:16px;"><i class="fas fa-hourglass-half"></i> Важные даты</h3>
      <div class="timers-container">
        <div class="timer-card">
          <h3><i class="fas fa-graduation-cap"></i> До экзаменов</h3>
          <div class="timer-display" id="examTimer">--:--:--</div>
          <div class="timer-controls">
            <button id="setExamDateBtn"><i class="fas fa-calendar-alt"></i> Установить дату</button>
          </div>
        </div>
        <div class="timer-card">
          <h3><i class="fas fa-flag-checkered"></i> До конца обучения</h3>
          <div class="timer-display" id="gradTimer">--:--:--</div>
          <div class="timer-controls">
            <button id="setGradDateBtn"><i class="fas fa-calendar-alt"></i> Установить дату</button>
          </div>
        </div>
      </div>
    </div>
  `);

  let examTarget = localStorage.getItem('examTarget') || '2026-06-15T10:00';
  let gradTarget = localStorage.getItem('gradTarget') || '2026-06-30T23:59';

  function updateTimer(target, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) { el.textContent = '00:00:00'; return; }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(days).padStart(2,'0')}д ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  }
  function updateAll() {
    updateTimer(examTarget, 'examTimer');
    updateTimer(gradTarget, 'gradTimer');
  }
  updateAll();
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
    selectedDate = new Date(target);
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

  document.getElementById('homeDateSaveBtn').onclick = () => {
    if (!selectedDate) { toastWarning('Выберите дату'); return; }
    const iso = selectedDate.toISOString();
    if (activeTimer === 'exam') { examTarget = iso; localStorage.setItem('examTarget', iso); }
    else { gradTarget = iso; localStorage.setItem('gradTarget', iso); }
    updateAll();
    closeModal('homeDateModal');
    toastSuccess('Дата сохранена');
  };
}