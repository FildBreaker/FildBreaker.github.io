// routes/resources.js
import { dataManager } from '../dataManager.js';
import { createRichEditor, sanitizeHtml, escapeHtml as esc } from '../rich-editor.js';
import { toastSuccess, toastError, toastWarning, confirmDialog } from '../toast.js';
import { renderEmpty } from '../empty-states.js';
import { applyCollapse } from '../collapse.js';
import { isEditor } from '../auth.js';
import { state } from '../state.js';
import { setSidebar, setMain, setSidebarNavHandlers, openModal, closeModal, tgNotify, showSkeletonMain, hideSkeletonMain } from '../utils.js';

const iconList = ['fa-book','fa-book-open','fa-file-pdf','fa-file-alt','fa-video','fa-film','fa-youtube','fa-play-circle','fa-tasks','fa-check-circle','fa-question-circle','fa-puzzle-piece','fa-laptop-code','fa-desktop','fa-download','fa-cloud-download-alt','fa-link','fa-external-link-alt','fa-folder-open','fa-archive','fa-graduation-cap','fa-chalkboard-teacher','fa-user-graduate'];
const resourceEdit = { id: null, descEditor: null };

export async function renderResources() {
  setSidebar(`
    <h3><i class="fas fa-filter"></i> Фильтры</h3>
    <div class="filter-buttons">
      <button class="filter-btn active-filter" data-category="all"><i class="fas fa-th-large"></i> Все</button>
      <button class="filter-btn" data-category="study"><i class="fas fa-book"></i> Учебники</button>
      <button class="filter-btn" data-category="video"><i class="fas fa-video"></i> Видео</button>
      <button class="filter-btn" data-category="test"><i class="fas fa-tasks"></i> Конспекты</button>
      <button class="filter-btn" data-category="soft"><i class="fas fa-laptop-code"></i> Прочее</button>
    </div>
    <div class="sidebar-note"><i class="fas fa-database"></i><p>Архив для всякого хлама.</p></div>
  `);
  setSidebarNavHandlers();

  setMain(`
    <div class="hero-resources">
      <div class="hero-text"><h2><i class="fas fa-cloud-upload-alt"></i> Ресурсный центр</h2><p>Электронные книги, видео, конспекты, Прочее</p></div>
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <div class="hero-search"><div class="search-box"><i class="fas fa-search"></i><input type="text" id="searchInput" placeholder="Поиск..."></div></div>
        <button id="addResourceBtn" class="reset-btn"><i class="fas fa-plus"></i> Добавить</button>
      </div>
    </div>
    <div class="resources-grid" id="resourcesGrid"></div>
  `);

  showSkeletonMain('card', 3);
  if (!state.data.resources) {
    const saved = await dataManager.load('resources');
    state.data.resources = (saved && Array.isArray(saved)) ? saved.filter(x => x && typeof x === 'object') : [];
  }
  hideSkeletonMain();
  renderResourceCards();

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
      applyResourceFilters();
    };
  });
  document.getElementById('searchInput').oninput = applyResourceFilters;
  document.getElementById('addResourceBtn').onclick = () => openResourceModal();
  setupResourceModal();

  const grid = document.getElementById('resourcesGrid');
  if (window.enableDragSort) {
    window.enableDragSort(grid, {
      itemSelector: '.resource-card',
      onReorder: async (newIds) => {
        if (!isEditor()) return;
        const map = new Map(state.data.resources.map(r => [r.id, r]));
        state.data.resources = newIds.map(id => map.get(id)).filter(Boolean);
        const success = await dataManager.save('resources', state.data.resources);
        if (success) { renderResourceCards(); toastSuccess('Порядок сохранён'); }
      }
    });
  }
}

function renderResourceCards() {
  const grid = document.getElementById('resourcesGrid');
  if (!grid) return;
  if (!state.data.resources.length) {
    renderEmpty(grid, 'resources', { title: 'Ресурсный центр пуст', subtitle: 'Ни одного файла, ссылки или видео.', actionLabel: isEditor() ? '+ Добавить ресурс' : '', onAction: () => openResourceModal() });
    return;
  }
  grid.innerHTML = '';
  state.data.resources.forEach(res => {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.dataset.id = res.id;
    card.dataset.category = res.category;
    const icon = res.icon || 'fa-file';
    card.innerHTML = `
      <div class="card-icon"><i class="fas ${icon}"></i></div>
      <div class="card-content">
        <h3>${esc(res.title)}</h3>
        <div class="rich-display">${sanitizeHtml(res.desc)}</div>
        <div class="card-meta">
          <span><i class="fas fa-tag"></i> ${esc(res.meta || '')}</span>
          <div style="display:flex; gap:8px;">
            <a href="${esc(res.link || '#')}" class="card-link">Скачать <i class="fas fa-arrow-right"></i></a>
            <button class="edit-resource" data-id="${res.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-edit"></i></button>
            <button class="delete-resource" data-id="${res.id}" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
      </div>
    `;
    card.querySelector('.edit-resource').onclick = () => openResourceModal(res.id);
    card.querySelector('.delete-resource').onclick = () => deleteResource(res.id);
    grid.appendChild(card);
  });
  applyResourceFilters();
  applyCollapse(grid);
}

function applyResourceFilters() {
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const activeCat = document.querySelector('.filter-btn.active-filter')?.dataset.category || 'all';
  document.querySelectorAll('.resource-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    const cat = card.dataset.category;
    const matchSearch = text.includes(search);
    const matchCat = activeCat === 'all' || cat === activeCat;
    card.style.display = (matchSearch && matchCat) ? 'flex' : 'none';
  });
}

function setupResourceModal() {
  document.getElementById('resourceForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!isEditor()) { closeModal('resourceModal'); return; }
    const title = document.getElementById('resourceTitle').value.trim();
    const category = document.getElementById('resourceCategory').value;
    const icon = document.getElementById('resourceIcon').value.trim() || 'fa-file';
    const meta = document.getElementById('resourceMeta').value.trim();
    const link = document.getElementById('resourceLink').value.trim() || '#';
    const desc = resourceEdit.descEditor ? sanitizeHtml(resourceEdit.descEditor.getContent()) : '';
    const descText = resourceEdit.descEditor ? resourceEdit.descEditor.getText().trim() : '';
    if (!title) { toastWarning('Введите название'); return; }
    if (!descText) { toastWarning('Введите описание'); return; }
    const resData = { title, desc, category, icon, meta, link };
    const isEdit = !!resourceEdit.id;
    if (isEdit) { const idx = state.data.resources.findIndex(r => r.id === resourceEdit.id); if (idx !== -1) state.data.resources[idx] = { ...state.data.resources[idx], ...resData }; }
    else { state.data.resources.push({ id: Date.now().toString(), ...resData }); }
    const success = await dataManager.save('resources', state.data.resources);
    if (!success) return;
    renderResourceCards();
    closeModal('resourceModal');
    toastSuccess(isEdit ? 'Ресурс обновлён' : 'Ресурс добавлен');
    tgNotify(`📂 <b>Ресурс ${isEdit ? 'изменён' : 'добавлен'}</b>\n📄 ${title}\n🏷 ${category}`);
  };
  document.getElementById('clearIconBtn').onclick = () => { document.getElementById('resourceIcon').value = ''; renderIconPicker(''); };
}

function renderIconPicker(selectedIcon) {
  const container = document.getElementById('iconPicker');
  container.innerHTML = '';
  iconList.forEach(icon => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `icon-option ${selectedIcon === icon ? 'active' : ''}`;
    btn.innerHTML = `<i class="fas ${icon}"></i>`;
    btn.title = icon;
    btn.onclick = () => { container.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active')); btn.classList.add('active'); document.getElementById('resourceIcon').value = icon; };
    container.appendChild(btn);
  });
}

function openResourceModal(id = null) {
  if (!isEditor()) return;
  resourceEdit.id = id;
  let currentIcon = '', currentDesc = '';
  if (id) {
    const res = state.data.resources.find(r => r.id === id);
    if (!res) return;
    document.getElementById('resourceModalTitle').innerHTML = '<i class="fas fa-edit"></i> Редактировать ресурс';
    document.getElementById('resourceTitle').value = res.title || '';
    document.getElementById('resourceCategory').value = res.category || 'study';
    currentIcon = res.icon || ''; document.getElementById('resourceIcon').value = currentIcon;
    document.getElementById('resourceMeta').value = res.meta || '';
    document.getElementById('resourceLink').value = res.link || '';
    currentDesc = res.desc || '';
  } else {
    document.getElementById('resourceModalTitle').innerHTML = '<i class="fas fa-plus"></i> Добавить ресурс';
    document.getElementById('resourceTitle').value = ''; document.getElementById('resourceCategory').value = 'study';
    document.getElementById('resourceIcon').value = ''; document.getElementById('resourceMeta').value = ''; document.getElementById('resourceLink').value = '';
  }
  renderIconPicker(currentIcon);
  const ed = document.getElementById('resourceDescEditor');
  ed.innerHTML = '';
  resourceEdit.descEditor = createRichEditor(ed, { placeholder: 'Краткое описание ресурса...', minHeight: '80px' });
  resourceEdit.descEditor.setContent(currentDesc);
  openModal('resourceModal');
}

async function deleteResource(id) {
  if (!isEditor()) { toastError('Нет прав на удаление'); return; }
  const res = state.data.resources.find(r => r.id === id);
  const ok = await confirmDialog({ title: 'Удалить ресурс?', message: res ? `«${res.title}» будет удалён.` : 'Ресурс будет удалён.', confirmText: 'Удалить', danger: true });
  if (!ok) return;
  state.data.resources = state.data.resources.filter(r => r.id !== id);
  const success = await dataManager.save('resources', state.data.resources);
  if (!success) return;
  renderResourceCards();
  toastSuccess('Ресурс удалён');
  if (res) tgNotify(`🗑 <b>Ресурс удалён</b>\n📄 ${res.title || 'Без названия'}`);
}