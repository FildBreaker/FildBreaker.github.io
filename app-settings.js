// app-settings.js
import { dataManager } from './dataManager.js';
import { toast, toastSuccess, toastError, toastWarning, confirmDialog } from './toast.js';
import { login, logout, onAuthChange, isEditor, getCurrentUser } from './auth.js';

const SECTION_NAMES = {
  schedule: 'Расписание',
  homework: 'Домашка',
  exams: 'Экзамены',
  resources: 'Ресурсы',
  extracurricular: 'Внеурочка',
  teachers: 'Преподаватели'
};

function countItems(key, value) {
  if (!value) return '';
  if (key === 'homework' && value.subjects) return value.subjects.length + ' предметов';
  if (Array.isArray(value)) return value.length + ' шт.';
  if (typeof value === 'object') return Object.keys(value).length + ' шт.';
  return '';
}

export function exportData() {
  Promise.all([
    dataManager.load('schedule'),
    dataManager.load('homework'),
    dataManager.load('exams'),
    dataManager.load('resources'),
    dataManager.load('extracurricular'),
    dataManager.load('teachers')
  ]).then(([schedule, homework, exams, resources, extracurricular, teachers]) => {
    const data = { schedule, homework, exams, resources, extracurricular, teachers };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `backup-b31les-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Файл экспорта скачан');
  }).catch(err => toastError('Ошибка экспорта: ' + err.message));
}

export function importData(file) {
  const reader = new FileReader();

  reader.onload = async (e) => {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch (err) {
      toastError('Файл повреждён или это не JSON');
      return;
    }

    const found = Object.keys(SECTION_NAMES).filter(k => data[k] !== undefined);
    if (found.length === 0) {
      toastError('В файле нет данных сайта Б-31ЛЕС');
      return;
    }

    const missing = Object.keys(SECTION_NAMES).filter(k => data[k] === undefined);

    let preview = '📦 В файле найдены разделы:\n\n';
    found.forEach(k => {
      preview += `• ${SECTION_NAMES[k]} — ${countItems(k, data[k])}\n`;
    });

    if (missing.length > 0) {
      preview += '\n⚠️ Отсутствуют (останутся как есть):\n';
      missing.forEach(k => {
        preview += `• ${SECTION_NAMES[k]}\n`;
      });
    }

    const ok = await confirmDialog({
      title: 'Импортировать данные?',
      message: preview + '\n\n⚠️ Всё, что есть сейчас в этих разделах, будет заменено на данные из файла.',
      confirmText: 'Импортировать',
      danger: true
    });
    if (!ok) return;

    const results = [];
    let successCount = 0;
    for (const key of Object.keys(SECTION_NAMES)) {
      if (data[key] === undefined) continue;
      try {
        await dataManager.save(key, data[key]);
        results.push('✅ ' + SECTION_NAMES[key]);
        successCount++;
      } catch (err) {
        results.push('❌ ' + SECTION_NAMES[key] + ': ' + err.message);
      }
    }

    if (successCount === found.length) {
      toastSuccess(`Импортировано разделов: ${successCount}. Обновляю страницу...`, 2500);
    } else {
      toastWarning(`Импорт завершён с ошибками:\n${results.join('\n')}`, 5000);
    }

    setTimeout(() => location.reload(), 2000);
  };

  reader.onerror = () => toastError('Не удалось прочитать файл');
  reader.readAsText(file);
}

// ============================================================
// МОДАЛКА ВХОДА
// ============================================================
function openLoginModal() {
  const existing = document.getElementById('loginModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'loginModal';
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <span class="close-modal" id="loginModalClose">&times;</span>
      <h3><i class="fas fa-lock"></i> Вход для редактора</h3>
      <label>Email</label>
      <input type="email" id="loginEmail" placeholder="admin@b31les.local" autocomplete="email">
      <label>Пароль</label>
      <input type="password" id="loginPassword" placeholder="Пароль" autocomplete="current-password">
      <div id="loginError" style="color: #e74c3c; margin-top: 10px; font-size: 0.85rem; display: none;"></div>
      <div class="modal-buttons" style="margin-top: 20px;">
        <button type="button" class="save-btn" id="loginSubmitBtn">Войти</button>
        <button type="button" class="cancel-btn" id="loginCancelBtn">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  const errDiv = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmitBtn');

  const submit = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    errDiv.style.display = 'none';
    if (!email || !pass) {
      errDiv.textContent = 'Заполните оба поля';
      errDiv.style.display = 'block';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Вход...';
    try {
      await login(email, pass);
      toastSuccess('Вход выполнен. Режим редактирования включён.');
      close();
    } catch (err) {
      errDiv.textContent = err.message || 'Не удалось войти';
      errDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Войти';
    }
  };

  document.getElementById('loginModalClose').onclick = close;
  document.getElementById('loginCancelBtn').onclick = close;
  submitBtn.onclick = submit;
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.getElementById('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
  setTimeout(() => document.getElementById('loginEmail').focus(), 50);
}

// ============================================================
// КНОПКИ В САЙДБАРЕ
// ============================================================
export function initSidebarButtons() {
  const themeBtn = document.getElementById('settingsThemeBtn');
  const exportBtn = document.getElementById('settingsExportBtn');
  const importBtn = document.getElementById('settingsImportBtn');
  const fileInput = document.getElementById('settingsImportInput');
  const container = document.getElementById('settingsContainer');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      if (window.openThemeModal) window.openThemeModal();
    });
  }
  if (exportBtn) exportBtn.addEventListener('click', exportData);
  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) importData(e.target.files[0]);
      fileInput.value = '';
    });
  }

  // Кнопка входа/выхода
  if (container && !document.getElementById('authBtn')) {
    const authBtn = document.createElement('button');
    authBtn.className = 'nav-btn';
    authBtn.id = 'authBtn';
    authBtn.innerHTML = '<i class="fas fa-lock"></i> Войти в режим редактора';
    authBtn.addEventListener('click', async () => {
      if (isEditor()) {
        const ok = await confirmDialog({
          title: 'Выйти из режима редактора?',
          message: 'Кнопки редактирования снова будут скрыты.',
          confirmText: 'Выйти',
          danger: true
        });
        if (ok) {
          await logout();
          toastSuccess('Вы вышли из режима редактора');
        }
      } else {
        openLoginModal();
      }
    });
    container.insertBefore(authBtn, container.firstChild);

    onAuthChange((user, editor) => {
      if (editor && user) {
        const name = user.email ? user.email.split('@')[0] : 'редактор';
        authBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Выйти (${name})`;
      } else {
        authBtn.innerHTML = '<i class="fas fa-lock"></i> Войти в режим редактора';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initSidebarButtons);
