// routes/exam.js
import { dataManager } from '../dataManager.js';
import { createRichEditor, sanitizeHtml, escapeHtml as esc } from '../rich-editor.js';
import { toastSuccess, toastError, toastWarning, confirmDialog } from '../toast.js';
import { renderEmpty } from '../empty-states.js';
import { isEditor } from '../auth.js';
import { state } from '../state.js';
import { setSidebar, setMain, setSidebarNavHandlers, openModal, closeModal, tgNotify, showSkeletonMain, hideSkeletonMain } from '../utils.js';

const examEdit = { id: null, notesEditor: null };

export async function renderExam() {
  setSidebar(`
    <h3><i class="fas fa-compass"></i> Основное</h3>
    <div class="nav-buttons">
      <button class="nav-btn" data-nav="extracurricular"><i class="fas fa-calendar-alt"></i> Мероприятия</button>
      <button class="nav-btn" data-nav="teacher"><i class="fas fa-chalkboard-teacher"></i> Преподаватели</button>
      <button class="nav-btn" data-nav="resources"><i class="fas fa-link"></i> Ресурсы</button>
      <button class="nav-btn" data-nav="homework"><i class="fas fa-book-open"></i> Домашка</button>
    </div>
    <div class="sidebar-note"><i class="fas fa-info-circle"></i><p>Информация о экзаменах, на которую мы забьём болт.</p></div>
  `);
  setSidebarNavHandlers();

  setMain(`
    <div class="exams-hero">
      <div class="hero-text"><h2><i class="fas fa-chalkboard"></i> Стенд экзаменов</h2></div>
      <div style="display:flex; gap:12px; align-items:center;">
        <span class="hero-badge"><i class="fas fa-calendar-alt"></i> Зимняя сессия 2026</span>
        <button id="addExamBtn" class="reset-btn"><i class="fas fa-plus"></i> Добавить экзамен</button>
      </div>
    </div>
    <div class="exams-grid" id="examsGrid"></div>
  `);

  showSkeletonMain('card', 2);
  if (!state.data.exams) {
    const saved = await dataManager.load('exams');
    state.data.exams = (saved && Array.isArray(saved)) ? saved.filter(x => x && typeof x === 'object') : [];
  }
  hideSkeletonMain();
  renderExams();

  document.getElementById('addExamBtn').onclick = () => openExamModal();
  setupExamModal();

  const grid = document.getElementById('examsGrid');
  if (window.enableDragSort) {
    window.enableDragSort(grid, {
      itemSelector: '.exam-card',
      onReorder: async (newIds) => {
        if (!isEditor()) return;
        const map = new Map(state.data.exams.map(e => [e.id, e]));
        state.data.exams = newIds.map(id => map.get(id)).filter(Boolean);
        const success = await dataManager.save('exams', state.data.exams);
        if (success) { renderExams(); toastSuccess('Порядок сохранён'); }
      }
    });
  }
}

function renderExams() {
  const grid = document.getElementById('examsGrid');
  if (!grid) return;
  if (!Array.isArray(state.data.exams) || !state.data.exams.length) {
    renderEmpty(grid, 'exams', { title: 'Экзамены пока не завезли', subtitle: 'Ни одного экзамена в списке.', actionLabel: isEditor() ? '+ Добавить экзамен' : '', onAction: () => openExamModal() });
    return;
  }
  grid.innerHTML = '';
  state.data.exams.forEach(rawExam => {
    if (!rawExam || typeof rawExam !== 'object') return;
    const exam = {
      id: rawExam.id || Date.now().toString() + Math.random().toString(36).substr(2, 4),
      subject: rawExam.subject || 'Без названия', date: rawExam.date || '', room: rawExam.room || '',
      teacher: rawExam.teacher || '', format: rawExam.format || '', resources: Array.isArray(rawExam.resources) ? rawExam.resources : [],
      method: rawExam.method || '', notes: rawExam.notes || ''
    };
    const card = document.createElement('div');
    card.className = 'exam-card';
    card.dataset.id = exam.id;
    const icon = (exam.subject || '').includes('таксация') ? 'fa-tree' : 'fa-seedling';
    card.innerHTML = `
      <div class="card-header">
        <div class="exam-icon"><i class="fas ${icon}"></i></div>
        <div class="exam-title"><h3>${esc(exam.subject)}</h3><span class="exam-type"><i class="fas fa-check-circle"></i> Экзамен</span></div>
        <div style="margin-left:auto; display:flex; gap:8px;">
          <button class="edit-exam" data-id="${exam.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-edit"></i></button>
          <button class="delete-exam" data-id="${exam.id}" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <div class="card-details">
        <div class="detail-row"><i class="fas fa-calendar-day"></i> <strong>Дата:</strong> ${esc(exam.date)}</div>
        <div class="detail-row"><i class="fas fa-location-dot"></i> <strong>Ауд.:</strong> ${esc(exam.room)}</div>
        <div class="detail-row"><i class="fas fa-user-graduate"></i> <strong>Преподаватель:</strong> ${esc(exam.teacher)}</div>
        <div class="detail-row"><i class="fas fa-clock"></i> <strong>Формат:</strong> ${esc(exam.format)}</div>
      </div>
      ${exam.resources.length ? `<div class="exam-resources"><p class="resources-title"><i class="fas fa-link"></i> Ресурсы:</p><div class="resource-buttons">${exam.resources.map(r => `<a href="#" class="res-link"><i class="fas fa-file-pdf"></i> ${esc(r)}</a>`).join('')}</div></div>` : ''}
      ${exam.method ? `<div class="card-footer-note"><i class="fas fa-arrow-right"></i> <a href="#">${esc(exam.method)}</a></div>` : ''}
      ${exam.notes ? `<div class="exam-notes rich-display">${sanitizeHtml(exam.notes)}</div>` : ''}
    `;
    card.querySelector('.edit-exam').onclick = (e) => { e.stopPropagation(); openExamModal(exam.id); };
    card.querySelector('.delete-exam').onclick = (e) => { e.stopPropagation(); deleteExam(exam.id); };
    grid.appendChild(card);
  });
}

function setupExamModal() {
  document.getElementById('examForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!isEditor()) { closeModal('examModal'); return; }
    const subject = document.getElementById('examSubject').value.trim();
    const date = document.getElementById('examDate').value.trim();
    const room = document.getElementById('examRoom').value.trim();
    const teacher = document.getElementById('examTeacher').value.trim();
    const format = document.getElementById('examFormat').value.trim();
    const resourcesStr = document.getElementById('examResources').value.trim();
    const method = document.getElementById('examMethod').value.trim();
    if (!subject || !date || !room || !teacher || !format) { toastWarning('Заполните все обязательные поля'); return; }
    const resources = resourcesStr ? resourcesStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    const notes = examEdit.notesEditor ? sanitizeHtml(examEdit.notesEditor.getContent()) : '';
    const examData = { subject, date, room, teacher, format, resources, method, notes };
    const isEdit = !!examEdit.id;
    if (isEdit) { const idx = state.data.exams.findIndex(x => x.id === examEdit.id); if (idx !== -1) state.data.exams[idx] = { ...state.data.exams[idx], ...examData }; }
    else { state.data.exams.push({ id: Date.now().toString(), ...examData }); }
    const success = await dataManager.save('exams', state.data.exams);
    if (!success) return;
    renderExams();
    closeModal('examModal');
    toastSuccess(isEdit ? 'Экзамен обновлён' : 'Экзамен добавлен');
    tgNotify(`📚 <b>Экзамен ${isEdit ? 'изменён' : 'добавлен'}</b>\n📖 ${subject}\n📅 ${date}\n🚪 Ауд.: ${room}\n👤 ${teacher}`);
  };
}

function openExamModal(id = null) {
  if (!isEditor()) return;
  examEdit.id = id;
  const exam = id ? state.data.exams.find(x => x.id === id) : null;
  document.getElementById('examModalTitle').innerHTML = id ? '<i class="fas fa-edit"></i> Редактировать экзамен' : '<i class="fas fa-plus"></i> Добавить экзамен';
  document.getElementById('examSubject').value = exam ? (exam.subject || '') : '';
  document.getElementById('examDate').value = exam ? (exam.date || '') : '';
  document.getElementById('examRoom').value = exam ? (exam.room || '') : '';
  document.getElementById('examTeacher').value = exam ? (exam.teacher || '') : '';
  document.getElementById('examFormat').value = exam ? (exam.format || '') : '';
  document.getElementById('examResources').value = exam ? ((exam.resources || []).join(', ')) : '';
  document.getElementById('examMethod').value = exam ? (exam.method || '') : '';
  const nc = document.getElementById('examNotesEditor');
  nc.innerHTML = '';
  examEdit.notesEditor = createRichEditor(nc, { placeholder: 'Дополнительные заметки...', minHeight: '60px' });
  examEdit.notesEditor.setContent(exam ? (exam.notes || '') : '');
  openModal('examModal');
}

async function deleteExam(id) {
  if (!isEditor()) { toastError('Нет прав на удаление'); return; }
  const exam = state.data.exams.find(x => x.id === id);
  const ok = await confirmDialog({ title: 'Удалить экзамен?', message: exam ? `«${exam.subject}» будет удалён.` : 'Экзамен будет удалён.', confirmText: 'Удалить', danger: true });
  if (!ok) return;
  state.data.exams = state.data.exams.filter(x => x.id !== id);
  const success = await dataManager.save('exams', state.data.exams);
  if (!success) return;
  renderExams();
  toastSuccess('Экзамен удалён');
  if (exam) tgNotify(`🗑 <b>Экзамен удалён</b>\n📖 ${exam.subject || 'Без названия'}`);
}