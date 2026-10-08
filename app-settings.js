// app-settings.js
import { dataManager } from './dataManager.js';

// Русские названия для сообщений
const SECTION_NAMES = {
  schedule: 'Расписание',
  homework: 'Домашка',
  exams: 'Экзамены',
  resources: 'Ресурсы',
  extracurricular: 'Внеурочка',
  teachers: 'Преподаватели'
};

// Сколько элементов в разделе — для превью перед импортом
function countItems(key, value) {
  if (!value) return 0;
  if (key === 'homework' && value.subjects) return value.subjects.length + ' предметов';
  if (Array.isArray(value)) return value.length + ' шт.';
  if (typeof value === 'object') return Object.keys(value).length + ' шт.';
  return '';
}

// ===== ЭКСПОРТ ДАННЫХ =====
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
  }).catch(err => alert('Ошибка экспорта: ' + err.message));
}

// ===== ИМПОРТ ДАННЫХ =====
export function importData(file) {
  const reader = new FileReader();

  reader.onload = async (e) => {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch (err) {
      alert('❌ Файл повреждён или это не JSON.\n\n' + err.message);
      return;
    }

    // Что вообще есть в файле
    const found = Object.keys(SECTION_NAMES).filter(k => data[k] !== undefined);

    if (found.length === 0) {
      alert('❌ В файле нет данных сайта Б-31ЛЕС.\n\nВозможно, это не наш бэкап.');
      return;
    }

    // Что пропустим
    const missing = Object.keys(SECTION_NAMES).filter(k => data[k] === undefined);

    // Превью — что будет импортировано
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

    preview += '\n\n⚠️ Всё, что есть сейчас в этих разделах, будет заменено на данные из файла.\n\nПродолжить?';

    if (!confirm(preview)) return;

    // Импортируем по одному разделу
    const results = [];
    for (const key of Object.keys(SECTION_NAMES)) {
      if (data[key] === undefined) continue;
      try {
        await dataManager.save(key, data[key]);
        results.push('✅ ' + SECTION_NAMES[key]);
      } catch (err) {
        results.push('❌ ' + SECTION_NAMES[key] + ': ' + err.message);
      }
    }

    alert('Импорт завершён:\n\n' + results.join('\n') + '\n\nСтраница сейчас перезагрузится.');

    // Небольшая задержка, чтобы алерт успел прочитаться
    setTimeout(() => location.reload(), 500);
  };

  reader.onerror = () => {
    alert('❌ Не удалось прочитать файл.');
  };

  reader.readAsText(file);
}

// ===== ДОБАВЛЕНИЕ КНОПОК В САЙДБАР =====
export function initSidebarButtons() {
  const themeBtn = document.getElementById('settingsThemeBtn');
  const exportBtn = document.getElementById('settingsExportBtn');
  const importBtn = document.getElementById('settingsImportBtn');
  const fileInput = document.getElementById('settingsImportInput');

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
      fileInput.value = ''; // чтобы можно было выбрать тот же файл снова
    });
  }
}

document.addEventListener('DOMContentLoaded', initSidebarButtons);
