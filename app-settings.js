// app-settings.js
import { dataManager } from './dataManager.js';
import { toast, toastSuccess, toastError, toastWarning, confirmDialog } from './toast.js';

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
      fileInput.value = '';
    });
  }
}

document.addEventListener('DOMContentLoaded', initSidebarButtons);
