// routes/homework.js
import { dataManager } from '../dataManager.js';
import { createRichEditor, sanitizeHtml, escapeHtml as esc } from '../rich-editor.js';
import { openDatePicker, formatDate } from '../date-picker.js';
import { toastSuccess, toastError, toastWarning, confirmDialog } from '../toast.js';
import { renderEmpty } from '../empty-states.js';
import { applyCollapse } from '../collapse.js';
import { isEditor } from '../auth.js';
import { state } from '../state.js';
import { setSidebar, setMain, setSidebarNavHandlers, openModal, closeModal, tgNotify, toArray } from '../utils.js';

const homeworkState = { currentSubjectId: null, editSubjectId: null, editTaskId: null, taskEditor: null, taskDeadline: null };

function normalizeHomework(raw) {
  if (!raw || typeof raw !== 'object') return { subjects: [] };
  const subjectsRaw = toArray(raw.subjects);
  const subjects = subjectsRaw.map(subj => {
    if (!subj || typeof subj !== 'object') return null;
    const tasksRaw = toArray(subj.tasks);
    const tasks = tasksRaw.map(t => {
      if (!t || typeof t !== 'object') return null;
      return { id: t.id || String(Date.now() + Math.random()), desc: t.desc || '', links: toArray(t.links), tags: t.tags || '', deadline: t.deadline || null };
    }).filter(Boolean);
    return { id: subj.id || String(Date.now() + Math.random()), name: subj.name || 'Без названия', tasks };
  }).filter(Boolean);
  return { subjects };
}

export async function renderHomework() {
  setSidebar(`
    <h3><i class="fas fa-book"></i> Предметы</h3>
    <div class="subjects-list" id="subjectsList"></div>
    <button class="add-subject-btn" id="addSubjectBtn"><i class="fas fa-plus-circle"></i> Добавить предмет</button>
    <div class="sidebar-note"><i class="fas fa-cloud-upload-alt"></i><p>Расписание, на которое хотя бы смотреть можно.</p></div>
  `);
  setSidebarNavHandlers();

  setMain(`
    <div class="homework-header">
      <h2 id="currentSubjectTitle"><i class="fas fa-folder"></i> Выберите предмет</h2>
      <button class="add-task-btn" id="addTaskBtn" disabled><i class="fas fa-plus"></i> Добавить задание</button>
    </div>
    <div class="tasks-container" id="tasksContainer">
      <div class="empty-state"><i class="fas fa-hand-point-left"></i><p>Выберите предмет из боковой панели или создайте новый.</p></div>
    </div>
  `);

  if (!state.data.homework) {
    const saved = await dataManager.load('homework');
    state.data.homework = normalizeHomework(saved);
  }

  homeworkState.currentSubjectId = sessionStorage.getItem('activeSubjectId');
  if (homeworkState.currentSubjectId && !state.data.homework.subjects.find(s => s.id === homeworkState.currentSubjectId)) homeworkState.currentSubjectId = null;
  
  renderSubjects();
  if (homeworkState.currentSubjectId) selectSubject(homeworkState.currentSubjectId);
  else if (state.data.homework.subjects.length) selectSubject(state.data.homework.subjects[0].id);
  else clearTasksView();

  document.getElementById('addSubjectBtn').onclick = () => openSubjectModal();
  document.getElementById('addTaskBtn').onclick = () => openTaskModal();
  setupHomeworkModals();

  if (window.enableDragSort) {
    window.enableDragSort(document.getElementById('subjectsList'), {
      itemSelector: '.subject-item',
      onReorder: async (newIds) => {
        if (!isEditor()) return;
        const map = new Map(state.data.homework.subjects.map(s => [s.id, s]));
        state.data.homework.subjects = newIds.map(id => map.get(id)).filter(Boolean);
        const success = await dataManager.save('homework', state.data.homework);
        if (success) { renderSubjects(); toastSuccess('Порядок сохранён'); }
      }
    });
  }
}

function renderSubjects() {
  const container = document.getElementById('subjectsList');
  if (!container) return;
  container.innerHTML = '';
  state.data.homework.subjects.forEach(subj => {
    const div = document.createElement('div');
    div.className = `subject-item ${homeworkState.currentSubjectId === subj.id ? 'active' : ''}`;
    div.dataset.id = subj.id;
    div.innerHTML = `
      <span class="subject-name">
        <i class="fas fa-chalkboard"></i>
        <span class="subject-text-wrap">
          <span class="subject-text">${esc(subj.name)}</span>
        </span>
      </span>
      <div class="subject-actions">
        <button class="edit-subject" data-id="${subj.id}"><i class="fas fa-edit"></i></button>
        <button class="delete-subject" data-id="${subj.id}"><i class="fas fa-trash"></i></button>
      </div>
    `;
    div.onclick = (e) => { if (e.target.closest('button')) return; selectSubject(subj.id); };
    div.querySelector('.edit-subject').onclick = (e) => { e.stopPropagation(); openSubjectModal(subj.id); };
    div.querySelector('.delete-subject').onclick = async (e) => {
      e.stopPropagation();
      if (!isEditor()) { toastError('Нет прав на удаление'); return; }
      const ok = await confirmDialog({ title: 'Удалить предмет?', message: `«${subj.name}» и все его задания будут удалены.`, confirmText: 'Удалить', danger: true });
      if (!ok) return;
      await deleteSubject(subj.id);
    };
    container.appendChild(div);
    requestAnimationFrame(() => setupSubjectScroll(div));
  });
  const btn = document.getElementById('addTaskBtn');
  if (btn) btn.disabled = !homeworkState.currentSubjectId;
}

export function setupSubjectScroll(item) {
  const wrap = item.querySelector('.subject-text-wrap');
  const text = item.querySelector('.subject-text');
  if (!wrap || !text) return;
  wrap.classList.remove('has-scroll');
  text.style.removeProperty('--scroll-distance');
  text.style.removeProperty('--marquee-duration');
  const overflow = text.scrollWidth - wrap.clientWidth;
  if (overflow > 4) {
    text.style.setProperty('--scroll-distance', overflow + 'px');
    const duration = Math.max(8, Math.min(20, 4 + overflow / 8));
    text.style.setProperty('--marquee-duration', duration + 's');
    wrap.classList.add('has-scroll');
  }
}

function selectSubject(subjectId) {
  homeworkState.currentSubjectId = subjectId;
  sessionStorage.setItem('activeSubjectId', subjectId);
  renderSubjects();
  const subject = state.data.homework.subjects.find(s => s.id === subjectId);
  if (subject) {
    if (!Array.isArray(subject.tasks)) subject.tasks = [];
    document.getElementById('currentSubjectTitle').innerHTML = `<i class="fas fa-book-open"></i> ${esc(subject.name)}`;
    renderTasks(subject.tasks);
    const tc = document.getElementById('tasksContainer');
    if (window.enableDragSort) {
      window.enableDragSort(tc, {
        itemSelector: '.task-card',
        onReorder: async (newIds) => {
          if (!isEditor()) return;
          const subj = state.data.homework.subjects.find(s => s.id === homeworkState.currentSubjectId);
          if (!subj) return;
          const map = new Map(subj.tasks.map(t => [t.id, t]));
          subj.tasks = newIds.map(id => map.get(id)).filter(Boolean);
          const success = await dataManager.save('homework', state.data.homework);
          if (success) { renderTasks(subj.tasks); toastSuccess('Порядок сохранён'); }
        }
      });
    }
  } else clearTasksView();
}

function clearTasksView() {
  const titleEl = document.getElementById('currentSubjectTitle');
  if (titleEl) titleEl.innerHTML = '<i class="fas fa-folder"></i> Не выбран предмет';
  const tc = document.getElementById('tasksContainer');
  if (tc) renderEmpty(tc, 'homework', { title: 'Выберите предмет', subtitle: 'Слева в списке найди нужный предмет.' });
  const btn = document.getElementById('addTaskBtn');
  if (btn) btn.disabled = true;
}

function renderTasks(tasks) {
  const container = document.getElementById('tasksContainer');
  if (!container) return;
  if (!tasks || tasks.length === 0) {
    renderEmpty(container, 'homework', { title: 'Заданий нет', subtitle: 'Пока по этому предмету ничего не задали.', actionLabel: isEditor() ? '+ Добавить задание' : '', onAction: () => openTaskModal() });
    return;
  }
  container.innerHTML = '';
  
  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.id = task.id;
    let linksHtml = '';
    if (task.links && task.links.length) {
      linksHtml = '<div class="task-links"><i class="fas fa-link"></i> Ресурсы: ';
      task.links.forEach(link => { linksHtml += `<a href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.title || 'Ссылка')}</a> `; });
      linksHtml += '</div>';
    }
    const tagsHtml = task.tags ? `<div class="task-tags"><i class="fas fa-tags"></i> ${esc(task.tags)}</div>` : '';
    
    let deadlineHtml = '';
    if (task.deadline) {
      const d = new Date(task.deadline);
      const now = new Date();
      
      const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const diffMs = d - now;
      const diffDays = Math.round((dDate - nowDate) / (1000 * 60 * 60 * 24));
      
      let badgeClass = 'deadline-safe'; 
      let label = `До ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
      
      if (diffMs < 0) { badgeClass = 'deadline-danger'; label = 'ПРОСРОЧЕНО'; }
      else if (diffDays === 0) { badgeClass = 'deadline-warning'; label = 'Сегодня!'; }
      else if (diffDays === 1) { badgeClass = 'deadline-warning'; label = 'Завтра'; }
      else if (diffDays <= 3) { badgeClass = 'deadline-warning'; label = `Осталось ${diffDays} дн.`; }
      
      deadlineHtml = `<div class="task-deadline ${badgeClass}"><i class="fas fa-clock"></i> ${label}</div>`;
    }

    card.innerHTML = `
      <div class="task-content">
        ${deadlineHtml}
        <div class="task-desc rich-display">${sanitizeHtml(task.desc)}</div>
        ${linksHtml}
        ${tagsHtml}
      </div>
      <div class="task-actions">
        <button class="edit-task" data-id="${task.id}"><i class="fas fa-pen"></i></button>
        <button class="delete-task" data-id="${task.id}"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    card.querySelector('.edit-task').onclick = () => openTaskModal(task.id);
    card.querySelector('.delete-task').onclick = () => deleteTask(task.id);
    container.appendChild(card);
  });
  applyCollapse(container);
}

function setupHomeworkModals() {
  document.getElementById('saveSubjectBtn').onclick = saveSubjectFromModal;
  document.getElementById('saveTaskBtn').onclick = (e) => { e.preventDefault(); saveTaskFromModal(); };
  document.getElementById('addLinkBtn').onclick = () => addLinkGroup('', '');
}

function openSubjectModal(subjectId = null) {
  if (!isEditor()) return;
  homeworkState.editSubjectId = subjectId;
  if (subjectId) {
    const subj = state.data.homework.subjects.find(s => s.id === subjectId);
    if (subj) { document.getElementById('subjectModalTitle').innerHTML = '<i class="fas fa-pen"></i> Редактировать предмет'; document.getElementById('subjectNameInput').value = subj.name; }
  } else {
    document.getElementById('subjectModalTitle').innerHTML = '<i class="fas fa-plus"></i> Новый предмет'; document.getElementById('subjectNameInput').value = '';
  }
  openModal('subjectModal');
}

async function saveSubjectFromModal() {
  if (!isEditor()) { closeModal('subjectModal'); return; }
  const name = document.getElementById('subjectNameInput').value.trim();
  if (!name) { toastWarning('Введите название'); return; }
  const isEdit = !!homeworkState.editSubjectId;
  if (isEdit) {
    const subj = state.data.homework.subjects.find(s => s.id === homeworkState.editSubjectId);
    if (subj) subj.name = name;
  } else {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    state.data.homework.subjects.push({ id: newId, name, tasks: [] });
    homeworkState.currentSubjectId = newId; sessionStorage.setItem('activeSubjectId', newId);
  }
  const success = await dataManager.save('homework', state.data.homework);
  if (!success) return;
  renderSubjects();
  if (homeworkState.currentSubjectId) selectSubject(homeworkState.currentSubjectId);
  closeModal('subjectModal');
  toastSuccess(isEdit ? 'Предмет переименован' : 'Предмет добавлен');
  tgNotify(`📚 <b>Предмет ${isEdit ? 'переименован' : 'добавлен'}</b>\n📖 ${name}`);
}

async function deleteSubject(subjectId) {
  if (!isEditor()) { toastError('Нет прав на удаление'); return; }
  const idx = state.data.homework.subjects.findIndex(s => s.id === subjectId);
  if (idx === -1) return;
  const subjName = state.data.homework.subjects[idx].name;
  state.data.homework.subjects.splice(idx, 1);
  const success = await dataManager.save('homework', state.data.homework);
  if (!success) return;
  if (homeworkState.currentSubjectId === subjectId) { homeworkState.currentSubjectId = null; sessionStorage.removeItem('activeSubjectId'); clearTasksView(); }
  renderSubjects();
  toastSuccess('Предмет удалён');
  tgNotify(`🗑 <b>Предмет удалён</b>\n📖 ${subjName}`);
}

function addLinkGroup(urlVal = '', titleVal = '') {
  const group = document.createElement('div');
  group.className = 'link-input-group';
  group.innerHTML = `
    <input type="text" class="link-url" placeholder="URL / путь к файлу" value="${esc(urlVal)}">
    <input type="text" class="link-title" placeholder="Название ссылки" value="${esc(titleVal)}">
    <button class="remove-link-btn" type="button"><i class="fas fa-trash-alt"></i></button>
  `;
  group.querySelector('.remove-link-btn').onclick = () => group.remove();
  document.getElementById('linksContainer').appendChild(group);
}

function collectLinks() {
  const groups = document.querySelectorAll('#linksContainer .link-input-group');
  const links = [];
  groups.forEach(g => {
    const url = g.querySelector('.link-url').value.trim();
    const title = g.querySelector('.link-title').value.trim();
    if (url) links.push({ url, title: title || 'Ссылка' });
  });
  return links;
}

function openTaskModal(taskId = null) {
  if (!isEditor()) return;
  if (!homeworkState.currentSubjectId) { toastWarning('Выберите предмет'); return; }
  const subject = state.data.homework.subjects.find(s => s.id === homeworkState.currentSubjectId);
  if (!subject) return;
  if (!Array.isArray(subject.tasks)) subject.tasks = [];
  homeworkState.editTaskId = taskId;
  const task = taskId ? subject.tasks.find(t => t.id === taskId) : null;
  const initialHtml = task ? (task.desc || '') : '';
  const tagsVal = task ? (task.tags || '') : '';
  const linksVal = task ? (task.links || []) : [];

  document.getElementById('taskModalTitle').innerHTML = taskId ? '<i class="fas fa-edit"></i> Редактировать задание' : '<i class="fas fa-plus"></i> Новое задание';
  document.getElementById('taskTags').value = tagsVal;
  const lc = document.getElementById('linksContainer');
  lc.innerHTML = '';
  if (linksVal.length) linksVal.forEach(l => addLinkGroup(l.url, l.title)); else addLinkGroup('', '');

  homeworkState.taskDeadline = task ? (task.deadline || null) : null;
  const deadlineText = document.getElementById('taskDeadlineText');
  if (deadlineText) {
    deadlineText.textContent = homeworkState.taskDeadline ? formatDate(new Date(homeworkState.taskDeadline)) : 'Не указан';
    document.getElementById('taskDeadlinePickerBtn').onclick = () => {
      openDatePicker({
        anchorEl: document.getElementById('taskDeadlinePickerBtn'),
        initial: homeworkState.taskDeadline ? new Date(homeworkState.taskDeadline) : new Date(),
        onPick: (date) => { homeworkState.taskDeadline = date.toISOString(); deadlineText.textContent = formatDate(date); }
      });
    };
    document.getElementById('clearTaskDeadlineBtn').onclick = () => { homeworkState.taskDeadline = null; deadlineText.textContent = 'Не указан'; };
  }

  const container = document.getElementById('taskDescEditor');
  container.innerHTML = '';
  homeworkState.taskEditor = createRichEditor(container, { placeholder: 'Подробное описание задания...', minHeight: '120px' });
  homeworkState.taskEditor.setContent(initialHtml);
  openModal('taskModal');
}

async function saveTaskFromModal() {
  try {
    if (!isEditor()) { closeModal('taskModal'); return; }
    if (!homeworkState.currentSubjectId) { toastWarning('Не выбран предмет'); return; }
    const descHtml = homeworkState.taskEditor ? homeworkState.taskEditor.getContent() : '';
    const descText = homeworkState.taskEditor ? homeworkState.taskEditor.getText().trim() : '';
    if (!descText) { toastWarning('Введите описание'); return; }
    const links = collectLinks();
    const tags = document.getElementById('taskTags').value.trim();
    const subject = state.data.homework.subjects.find(s => s.id === homeworkState.currentSubjectId);
    if (!subject) { toastError('Предмет не найден'); return; }
    if (!Array.isArray(subject.tasks)) subject.tasks = [];
    const isEdit = !!homeworkState.editTaskId;
    if (isEdit) {
      const task = subject.tasks.find(t => t.id === homeworkState.editTaskId);
      if (task) { task.desc = sanitizeHtml(descHtml); task.links = links; task.tags = tags; task.deadline = homeworkState.taskDeadline; }
    } else {
      subject.tasks.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 6), desc: sanitizeHtml(descHtml), links, tags, deadline: homeworkState.taskDeadline });
    }
    const success = await dataManager.save('homework', state.data.homework);
    if (!success) return;
    renderTasks(subject.tasks);
    closeModal('taskModal');
    toastSuccess(isEdit ? 'Задание обновлено' : 'Задание добавлено');
    tgNotify(`📝 <b>Задание ${isEdit ? 'изменено' : 'добавлено'}</b>\n📚 ${subject.name}\n💬 ${descText.slice(0, 150)}${descText.length > 150 ? '…' : ''}`);
  } catch (err) {
    console.error(err); toastError('Ошибка сохранения: ' + err.message);
  }
}

async function deleteTask(taskId) {
  if (!isEditor()) { toastError('Нет прав на удаление'); return; }
  if (!homeworkState.currentSubjectId) return;
  const subject = state.data.homework.subjects.find(s => s.id === homeworkState.currentSubjectId);
  if (!subject || !Array.isArray(subject.tasks)) return;
  const task = subject.tasks.find(t => t.id === taskId);
  const ok = await confirmDialog({ title: 'Удалить задание?', message: task ? `«${(task.desc || '').slice(0, 80)}${(task.desc || '').length > 80 ? '…' : ''}» будет удалено.` : 'Задание будет удалено.', confirmText: 'Удалить', danger: true });
  if (!ok) return;
  const idx = subject.tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  subject.tasks.splice(idx, 1);
  const success = await dataManager.save('homework', state.data.homework);
  if (!success) return;
  renderTasks(subject.tasks);
  toastSuccess('Задание удалено');
  tgNotify(`🗑 <b>Задание удалено</b>\n📚 ${subject.name}`);
}