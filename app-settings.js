// app-settings.js
import { dataManager } from './dataManager.js';

// ===== ЭКСПОРТ ДАННЫХ =====
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

// ===== ИМПОРТ ДАННЫХ =====
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

// ===== РЕГИСТРАЦИЯ SERVICE WORKER =====
export function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => console.log('✅ Service Worker зарегистрирован'))
      .catch(err => console.error('❌ SW регистрация не удалась:', err));
  }
}

// ===== ДОБАВЛЕНИЕ КНОПОК В САЙДБАР =====
export function initSidebarButtons() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  if (document.getElementById('settingsContainer')) return; // уже добавлено

  const container = document.createElement('div');
  container.id = 'settingsContainer';
  container.style.cssText = 'margin-top: 20px; padding-top: 16px; border-top: 2px solid rgba(255,255,255,0.2);';

  // Кнопка "Тема"
  const themeBtn = document.createElement('button');
  themeBtn.className = 'nav-btn';
  themeBtn.innerHTML = '<i class="fas fa-palette"></i> Тема';
  themeBtn.addEventListener('click', () => {
    // Вызываем глобальную функцию из theme.js
    if (window.openThemeModal) {
      window.openThemeModal();
    } else {
      alert('Модуль theme.js не загружен');
    }
  });
  container.appendChild(themeBtn);

  // Кнопка экспорта
  const exportBtn = document.createElement('button');
  exportBtn.className = 'nav-btn';
  exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Экспорт данных';
  exportBtn.addEventListener('click', exportData);
  container.appendChild(exportBtn);

  // Кнопка импорта (скрытый input)
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

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  initSidebarButtons();
  registerSW();
});