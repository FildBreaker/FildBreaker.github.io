// routes/schedule.js
import { dataManager } from '../dataManager.js';
import { createRichEditor, sanitizeHtml, escapeHtml as esc } from '../rich-editor.js';
import { toastSuccess, toastError, toastWarning, confirmDialog } from '../toast.js';
import { isEditor } from '../auth.js';
import { state } from '../state.js';
import { setSidebar, setMain, setSidebarNavHandlers, openModal, closeModal, tgNotify } from '../utils.js';

const pairTimes = { 1: "1 пара (9:00 – 10:30)", 2: "2 пара (10:45 – 12:15)", 3: "3 пара (12:30 – 14:00)", 4: "4 пара (14:40 – 16:10)", 5: "5 пара (16:20 – 17:50)", 6: "6 пара (18:00 – 19:30)" };
const breaks = { 1: "Перерыв: 15 минут", 2: "Перерыв: 15 минут", 3: "Перерыв: 40 минут", 4: "Перерыв: 10 минут", 5: "Перерыв: 10 минут" };
const MAX_PAIR = 6;
const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const scheduleEdit = { day: null, pair: null, type: '', notesEditor: null };

export async function renderSchedule() {
  setSidebar(`
    <h3><i class="fas fa-compass"></i> Основное</h3>
    <div class="nav-buttons">
      <button class="nav-btn" data-nav="extracurricular"><i class="fas fa-calendar-alt"></i> Мероприятия</button>
      <button class="nav-btn" data-nav="teacher"><i class="fas fa-chalkboard-teacher"></i> Преподаватели</button>
      <button class="nav-btn" data-nav="resources"><i class="fas fa-link"></i> Ресурсы</button>
      <button class="nav-btn" data-nav="homework"><i class="fas fa-book-open"></i> Домашка</button>
    </div>
    <div class="sidebar-note"><i class="fas fa-cloud-upload-alt"></i><p>Большой брат следит за тобой.</p></div>
  `);
  setSidebarNavHandlers();

  setMain(`
    <div class="schedule-section">
      <div class="schedule-header">
        <h2><i class="fas fa-table-list"></i> Расписание занятий</h2>
        <div class="schedule-actions">
          <button id="resetScheduleBtn" class="reset-btn"><i class="fas fa-undo-alt"></i> Сбросить</button>
          <span class="sync-hint"><i class="fas fa-sync-alt"></i> автосинхронизация</span>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="schedule-table">
          <thead><tr><th>Пара</th><th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th></tr></thead>
          <tbody id="scheduleBody"></tbody>
        </table>
      </div>
    </div>
  `);

  if (!state.data.schedule) {
    const saved = await dataManager.load('schedule');
    state.data.schedule = saved || {};
  }
  renderScheduleTable();

  setupScheduleModal();
  document.getElementById('resetScheduleBtn').onclick = async () => {
    if (!isEditor()) { toastError('Нет прав на редактирование'); return; }
    const ok = await confirmDialog({ title: 'Сбросить расписание?', message: 'Все текущие правки будут потеряны.', confirmText: 'Сбросить', danger: true });
    if (!ok) return;
    state.data.schedule = {};
    const success = await dataManager.save('schedule', state.data.schedule);
    if (!success) return;
    renderScheduleTable();
    toastSuccess('Расписание очищено');
    tgNotify('🔄 <b>Расписание сброшено</b>');
  };
}

function renderScheduleTable() {
  const tbody = document.getElementById('scheduleBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const scheduleData = state.data.schedule;
  for (let pair = 1; pair <= MAX_PAIR; pair++) {
    const tr = document.createElement('tr');
    const tdTime = document.createElement('td');
    tdTime.className = 'pair-time';
    tdTime.innerHTML = `<strong>${pairTimes[pair]}</strong>`;
    tr.appendChild(tdTime);

    for (let day = 0; day < 7; day++) {
      const td = document.createElement('td');
      const lesson = scheduleData[day]?.[pair] || { subject: '', room: '', startDate: '', endDate: '', type: '', notes: '', isCancelled: false };
      
      let cellClass = 'schedule-cell';
      let cancelHtml = '';

      if (lesson.isCancelled) {
        cellClass += ' is-cancelled';
        cancelHtml = `<div class="cancel-badge"><i class="fas fa-ban"></i> ОТМЕНА</div>`;
      }

      td.className = cellClass;
      
      const subjectHtml = lesson.subject ? esc(lesson.subject) : '—';
      const roomHtml = lesson.room ? ` (${esc(lesson.room)})` : '';
      let typeIcon = '';
      if (lesson.type === 'lecture') typeIcon = '<i class="fas fa-chalkboard-teacher" style="color:var(--accent);"></i> ';
      else if (lesson.type === 'practice') typeIcon = '<i class="fas fa-tools" style="color:var(--accent);"></i> ';
      let dateHtml = '';
      if (lesson.startDate || lesson.endDate) {
        const parts = [];
        if (lesson.startDate) parts.push(`с ${esc(lesson.startDate)}`);
        if (lesson.endDate) parts.push(`до ${esc(lesson.endDate)}`);
        dateHtml = `<div class="end-date"><i class="far fa-calendar-alt"></i> ${parts.join(' ')}</div>`;
      }
      let notesHtml = '';
      if (lesson.notes) notesHtml = `<div class="cell-notes rich-display">${sanitizeHtml(lesson.notes)}</div>`;

      td.innerHTML = `
        <div class="cell-content">
          ${cancelHtml}
          <div class="subject">${typeIcon}${subjectHtml}${roomHtml}</div>
          ${dateHtml}
          ${notesHtml}
          <div class="edit-icon"><i class="fas fa-pen"></i></div>
        </div>
      `;
      
      td.dataset.day = day;
      td.dataset.pair = pair;
      td.onclick = () => openScheduleEdit(day, pair);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);

    if (pair < MAX_PAIR) {
      const breakTr = document.createElement('tr');
      breakTr.className = 'break-row';
      const breakTd = document.createElement('td');
      breakTd.colSpan = 8;
      breakTd.textContent = breaks[pair] || '';
      breakTr.appendChild(breakTd);
      tbody.appendChild(breakTr);
    }
  }
}

function setupScheduleModal() {
  const typeBtns = ['scheduleTypeLecture', 'scheduleTypePractice', 'scheduleTypeNone'];
  typeBtns.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = () => {
      scheduleEdit.type = btn.dataset.type;
      typeBtns.forEach(i => document.getElementById(i).classList.remove('active'));
      btn.classList.add('active');
    };
  });
  document.getElementById('scheduleEditForm').onsubmit = async (e) => {
    e.preventDefault();
    await saveScheduleEdit();
  };
}

function openScheduleEdit(day, pair) {
  if (!isEditor()) return;
  scheduleEdit.day = day;
  scheduleEdit.pair = pair;
  const lesson = state.data.schedule[day]?.[pair] || { subject: '', room: '', startDate: '', endDate: '', type: '', notes: '', isCancelled: false };
  
  document.getElementById('scheduleEditSubject').value = lesson.subject || '';
  document.getElementById('scheduleEditRoom').value = lesson.room || '';
  document.getElementById('scheduleEditStartDate').value = lesson.startDate || '';
  document.getElementById('scheduleEditEndDate').value = lesson.endDate || '';
  document.getElementById('scheduleEditCancelled').checked = lesson.isCancelled || false;

  // Заполняем селекты для переноса
  const daySelect = document.getElementById('scheduleEditDay');
  const pairSelect = document.getElementById('scheduleEditPair');
  if (daySelect) daySelect.value = day;
  if (pairSelect) pairSelect.value = pair;

  scheduleEdit.type = lesson.type || '';
  ['scheduleTypeLecture', 'scheduleTypePractice', 'scheduleTypeNone'].forEach(id => document.getElementById(id).classList.remove('active'));
  if (lesson.type === 'lecture') document.getElementById('scheduleTypeLecture').classList.add('active');
  else if (lesson.type === 'practice') document.getElementById('scheduleTypePractice').classList.add('active');
  else document.getElementById('scheduleTypeNone').classList.add('active');

  const nc = document.getElementById('scheduleEditNotesEditor');
  nc.innerHTML = '';
  scheduleEdit.notesEditor = createRichEditor(nc, { placeholder: 'Дополнительные заметки...', minHeight: '60px' });
  scheduleEdit.notesEditor.setContent(lesson.notes || '');

  openModal('scheduleEditModal');
}

async function saveScheduleEdit() {
  if (!isEditor()) { closeModal('scheduleEditModal'); return; }
  
  const oldDay = scheduleEdit.day;
  const oldPair = scheduleEdit.pair;
  if (oldDay === null || oldPair === null) return;

  const newDay = parseInt(document.getElementById('scheduleEditDay').value);
  const newPair = parseInt(document.getElementById('scheduleEditPair').value);

  const newSubject = document.getElementById('scheduleEditSubject').value.trim();
  const newRoom = document.getElementById('scheduleEditRoom').value.trim();
  const newStartDate = document.getElementById('scheduleEditStartDate').value.trim();
  const newEndDate = document.getElementById('scheduleEditEndDate').value.trim();
  const isCancelled = document.getElementById('scheduleEditCancelled').checked;
  
  const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
  if (newStartDate && !datePattern.test(newStartDate)) { toastWarning('Дата начала в формате ДД.ММ.ГГГГ'); return; }
  if (newEndDate && !datePattern.test(newEndDate)) { toastWarning('Дата окончания в формате ДД.ММ.ГГГГ'); return; }
  
  const newNotes = scheduleEdit.notesEditor ? sanitizeHtml(scheduleEdit.notesEditor.getContent()) : '';
  
  // Если пара переехала в другой день или на другую пару
  if (oldDay !== newDay || oldPair !== newPair) {
    if (state.data.schedule[oldDay] && state.data.schedule[oldDay][oldPair]) {
      delete state.data.schedule[oldDay][oldPair];
    }
  }

  // Создаем/обновляем новую
  if (!state.data.schedule[newDay]) state.data.schedule[newDay] = {};
  state.data.schedule[newDay][newPair] = { 
    subject: newSubject, 
    room: newRoom, 
    startDate: newStartDate, 
    endDate: newEndDate, 
    type: scheduleEdit.type || '', 
    notes: newNotes,
    isCancelled: isCancelled
  };
  
  const success = await dataManager.save('schedule', state.data.schedule);
  if (!success) return;

  renderScheduleTable();
  closeModal('scheduleEditModal');
  toastSuccess('Пара сохранена');

  const typeText = scheduleEdit.type === 'lecture' ? '🎓 Лекция' : scheduleEdit.type === 'practice' ? '🛠 Практика' : '';
  const actionText = (oldDay !== newDay || oldPair !== newPair) ? 'перенесена' : 'обновлена';
  const cancelText = isCancelled ? '❌ ОТМЕНЕНА\n' : '';

  tgNotify(
    `📅 <b>Расписание: пара ${actionText}</b>\n` +
    `📆 ${DAY_NAMES[newDay]}, ${newPair}-я пара\n` +
    cancelText +
    (newSubject ? `📖 ${newSubject}\n` : '') +
    (newRoom ? `🚪 Ауд.: ${newRoom}\n` : '') + (typeText ? typeText : '')
  );
}
