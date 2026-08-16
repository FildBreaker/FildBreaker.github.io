// app-settings.js
import { dataManager } from './dataManager.js';

export function exportData() {
  Promise.all([
    dataManager.load('schedule'),
    dataManager.load('homework')
  ]).then(([schedule, homework]) => {
    const ext = localStorage.getItem('extracurricularDB');
    const data = {
      schedule,
      homework,
      extracurricular: ext ? JSON.parse(ext) : null
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-ibd2026.json';
    a.click();
    URL.revokeObjectURL(url);
  }).catch(console.error);
}

export function importData(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.schedule) await dataManager.save('schedule', data.schedule);
      if (data.homework) await dataManager.save('homework', data.homework);
      if (data.extracurricular) {
        localStorage.setItem('extracurricularDB', JSON.stringify(data.extracurricular));
      }
      alert('✅ Данные успешно восстановлены!');
      location.reload();
    } catch (err) {
      alert('❌ Ошибка при импорте: ' + err.message);
    }
  };
  reader.readAsText(file);
}

export function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => {
        // Убираем лог, чтобы не засорять консоль (можно оставить, но я убираю)
        // console.log('✅ Service Worker зарегистрирован');
      })
      .catch(err => console.error('❌ SW регистрация не удалась:', err));
  }
}

export function initSidebarButtons() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  if (document.getElementById('settingsContainer')) return;

  const container = document.createElement('div');
  container.id = 'settingsContainer';

  const themeBtn = document.createElement('button');
  themeBtn.className = 'nav-btn';
  themeBtn.innerHTML = '<i class="fas fa-palette"></i> Тема оформления';
  themeBtn.addEventListener('click', () => {
    if (window.openThemeModal) {
      window.openThemeModal();
    } else {
      alert('Модуль theme.js не загружен');
    }
  });
  container.appendChild(themeBtn);

  const exportBtn = document.createElement('button');
  exportBtn.className = 'nav-btn';
  exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Экспорт данных';
  exportBtn.addEventListener('click', exportData);
  container.appendChild(exportBtn);

  const importBtn = document.createElement('button');
  importBtn.className = 'nav-btn';
  importBtn.innerHTML = '<i class="fas fa-file-import"></i> Импорт данных';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) importData(e.target.files[0]);
  });
  importBtn.appendChild(fileInput);
  importBtn.addEventListener('click', () => fileInput.click());
  container.appendChild(importBtn);

  sidebar.appendChild(container);
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebarButtons();
  registerSW();
});
