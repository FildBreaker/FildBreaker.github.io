// routes/teacher.js
import { dataManager } from '../dataManager.js';
import { escapeHtml as esc } from '../rich-editor.js';
import { toastSuccess, toastError, toastWarning, confirmDialog } from '../toast.js';
import { renderEmpty } from '../empty-states.js';
import { isEditor } from '../auth.js';
import { state } from '../state.js';
import { setSidebar, setMain, setSidebarNavHandlers, openModal, closeModal, tgNotify, showSkeletonMain, hideSkeletonMain } from '../utils.js';

// Импортируем Firebase Storage
import { storage } from '../firebase-config.js';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

const teacherEdit = { id: null };

export async function renderTeacher() {
  setSidebar(`
    <h3><i class="fas fa-compass"></i> Основное</h3>
    <div class="nav-buttons">
      <button class="nav-btn" data-nav="extracurricular"><i class="fas fa-calendar-alt"></i> Мероприятия</button>
      <button class="nav-btn" data-nav="teacher"><i class="fas fa-chalkboard-teacher"></i> Преподаватели</button>
      <button class="nav-btn" data-nav="resources"><i class="fas fa-link"></i> Ресурсы</button>
      <button class="nav-btn" data-nav="homework"><i class="fas fa-book-open"></i> Домашка</button>
    </div>
    <div class="sidebar-note"><i class="fas fa-users"></i><p>Преподавательский состав</p></div>
  `);
  setSidebarNavHandlers();

  setMain(`
    <div class="teachers-section">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <h2><i class="fas fa-leaf"></i> Выбери своего бойца!</h2>
        <button id="addTeacherBtn" class="reset-btn"><i class="fas fa-plus"></i> Добавить преподавателя</button>
      </div>
      <div class="teachers-grid" id="teachersGridContainer"></div>
    </div>
  `);

  showSkeletonMain('card', 3);
  if (!state.data.teachers) {
    const saved = await dataManager.load('teachers');
    state.data.teachers = (saved && Array.isArray(saved)) ? saved.filter(x => x && typeof x === 'object') : [];
  }
  hideSkeletonMain();
  renderTeachers();

  document.getElementById('addTeacherBtn').onclick = () => openTeacherModal();
  setupTeacherModal();

  const grid = document.getElementById('teachersGridContainer');
  if (window.enableDragSort) {
    window.enableDragSort(grid, {
      itemSelector: '.teacher-card',
      onReorder: async (newIds) => {
        if (!isEditor()) return;
        const map = new Map(state.data.teachers.map(t => [t.id, t]));
        state.data.teachers = newIds.map(id => map.get(id)).filter(Boolean);
        const success = await dataManager.save('teachers', state.data.teachers);
        if (success) renderTeachers();
      }
    });
  }
}

function renderTeachers() {
  const container = document.getElementById('teachersGridContainer');
  if (!container) return;
  if (!state.data.teachers.length) {
    renderEmpty(container, 'teachers', { title: 'Преподавателей нет', subtitle: 'Пусто, как в аудитории на первой паре.', actionLabel: isEditor() ? '+ Добавить преподавателя' : '', onAction: () => openTeacherModal() });
    return;
  }
  container.innerHTML = '';
  state.data.teachers.forEach(teacher => {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.dataset.id = teacher.id;
    card.innerHTML = `
      <div class="card-photo"><img src="${teacher.photo || 'https://via.placeholder.com/130x130?text=Нет+фото'}" alt="${esc(teacher.name)}" loading="lazy"></div>
      <div class="teacher-info">
        <div class="teacher-name"><i class="fas fa-user-tie"></i> ${esc(teacher.name)}</div>
        <div class="teacher-position"><i class="fas fa-briefcase"></i> ${esc(teacher.position)}</div>
        <div class="teacher-degree"><i class="fas fa-graduation-cap"></i> ${esc(teacher.degree)}</div>
        <div class="teacher-degree2"><i class="fas fa-graduation-cap"></i> ${esc(teacher.degree2)}</div>
        <div class="contact-details-card">
          <p><i class="fas fa-phone-alt"></i> ${esc(teacher.phone)}</p>
          <p><i class="fas fa-envelope"></i> <a href="mailto:${teacher.email}" style="color:var(--accent);">${esc(teacher.email)}</a></p>
        </div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="edit-teacher" style="background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-edit"></i></button>
          <button class="delete-teacher" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `;
    card.querySelector('.edit-teacher').onclick = () => openTeacherModal(teacher.id);
    card.querySelector('.delete-teacher').onclick = () => deleteTeacher(teacher.id);
    container.appendChild(card);
  });
}

function setupTeacherModal() {
  const fileInput = document.getElementById('teacherPhotoFile');
  const previewContainer = document.getElementById('teacherPhotoPreview');
  const previewImg = previewContainer.querySelector('img');
  const urlInput = document.getElementById('teacherPhoto');

  // Превью выбранного файла
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        const url = URL.createObjectURL(fileInput.files[0]);
        previewImg.src = url;
        previewContainer.style.display = 'block';
        urlInput.value = ''; // Очищаем ручной ввод, если выбрали файл
      } else {
        previewContainer.style.display = 'none';
      }
    });
  }

  document.getElementById('teacherForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!isEditor()) { closeModal('teacherModal'); return; }

    const name = document.getElementById('teacherName').value.trim();
    const position = document.getElementById('teacherPosition').value.trim();
    const degree = document.getElementById('teacherDegree').value.trim();
    const degree2 = document.getElementById('teacherDegree2').value.trim();
    const phone = document.getElementById('teacherPhone').value.trim();
    const email = document.getElementById('teacherEmail').value.trim();
    let photo = document.getElementById('teacherPhoto').value.trim();

    if (!name || !position || !degree || !degree2 || !phone || !email) {
      toastWarning('Заполните все поля'); 
      return; 
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

    try {
      // Если выбран файл — грузим его в Firebase Storage
      const file = fileInput.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Файл слишком большой (макс. 5 МБ)');
        }
        
        const ext = file.name.split('.').pop();
        const fileName = `teachers/teacher_${Date.now()}.${ext}`;
        const fileRef = storageRef(storage, fileName);

        const uploadTask = uploadBytesResumable(fileRef, file);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            null, 
            (error) => reject(error), 
            () => resolve()
          );
        });

        // Получаем прямую ссылку на загруженный файл
        photo = await getDownloadURL(fileRef);
      }

      const data = { name, position, degree, degree2, phone, email, photo };
      const isEdit = !!teacherEdit.id;

      if (isEdit) {
        const idx = state.data.teachers.findIndex(t => t.id === teacherEdit.id);
        if (idx !== -1) state.data.teachers[idx] = { ...state.data.teachers[idx], ...data };
      } else {
        state.data.teachers.push({ id: Date.now().toString(), ...data });
      }

      const success = await dataManager.save('teachers', state.data.teachers);
      if (!success) throw new Error('Ошибка сохранения в базу данных');

      renderTeachers();
      closeModal('teacherModal');
      toastSuccess(isEdit ? 'Преподаватель обновлён' : 'Преподаватель добавлен');
      
      tgNotify(`👤 <b>Преподаватель ${isEdit ? 'изменён' : 'добавлен'}</b>\n🎓 ${name}\n💼 ${position}`);

    } catch (err) {
      console.error(err);
      toastError(err.message || 'Ошибка при сохранении');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  };
}

function openTeacherModal(id = null) {
  if (!isEditor()) return;
  teacherEdit.id = id;
  const t = id ? state.data.teachers.find(x => x.id === id) : null;
  
  document.getElementById('teacherModalTitle').innerHTML = id ? '<i class="fas fa-edit"></i> Редактировать' : '<i class="fas fa-plus"></i> Добавить';
  document.getElementById('teacherName').value = t ? (t.name || '') : '';
  document.getElementById('teacherPosition').value = t ? (t.position || '') : '';
  document.getElementById('teacherDegree').value = t ? (t.degree || '') : '';
  document.getElementById('teacherDegree2').value = t ? (t.degree2 || '') : '';
  document.getElementById('teacherPhone').value = t ? (t.phone || '') : '';
  document.getElementById('teacherEmail').value = t ? (t.email || '') : '';
  document.getElementById('teacherPhoto').value = t ? (t.photo || '') : '';

  // Сброс загрузки файла и превью
  const fileInput = document.getElementById('teacherPhotoFile');
  if (fileInput) fileInput.value = '';
  document.getElementById('teacherPhotoFileText').textContent = 'Выбрать файл';
  
  const previewContainer = document.getElementById('teacherPhotoPreview');
  const previewImg = previewContainer.querySelector('img');
  if (t && t.photo) {
    previewImg.src = t.photo;
    previewContainer.style.display = 'block';
  } else {
    previewContainer.style.display = 'none';
  }

  openModal('teacherModal');
}

async function deleteTeacher(id) {
  if (!isEditor()) { toastError('Нет прав на удаление'); return; }
  const t = state.data.teachers.find(x => x.id === id);
  const ok = await confirmDialog({ title: 'Удалить преподавателя?', message: t ? `«${t.name}» будет удалён из списка.` : 'Преподаватель будет удалён.', confirmText: 'Удалить', danger: true });
  if (!ok) return;
  state.data.teachers = state.data.teachers.filter(t => t.id !== id);
  const success = await dataManager.save('teachers', state.data.teachers);
  if (!success) return;
  renderTeachers();
  toastSuccess('Преподаватель удалён');
  if (t) tgNotify(`🗑 <b>Преподаватель удалён</b>\n👤 ${t.name}`);
}
