// dataManager.js
import { db } from './firebase-config.js';
import { ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { startProgress, endProgress, resetProgress } from './progress.js';
import { toastError } from './toast.js'; // <--- ДОБАВИЛИ ИМПОРТ ТОСТА

const ROOT = 'IBD2026';
const CACHE_PREFIX = 'cache_';

// Обёртка для запросов с полоской загрузки
async function withProgress(fn) {
  startProgress();
  try {
    return await fn();
  } finally {
    endProgress();
  }
}

export const dataManager = {
  async load(key) {
    return withProgress(async () => {
      const dbRef = ref(db);
      try {
        const snapshot = await get(child(dbRef, `${ROOT}/${key}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
          return data;
        } else {
          const cached = localStorage.getItem(CACHE_PREFIX + key);
          return cached ? JSON.parse(cached) : null;
        }
      } catch (error) {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (cached) {
          console.warn(`⚠️ Загрузка "${key}" не удалась, берем из кэша.`);
          return JSON.parse(cached);
        }
        console.error(`❌ Не удалось загрузить "${key}" и нет кэша:`, error);
        return null;
      }
    });
  },

  async save(key, data) {
    return withProgress(async () => {
      const pathRef = ref(db, `${ROOT}/${key}`);
      try {
        await set(pathRef, data);
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
        return true; // Всё четко
      } catch (error) {
        console.error(`❌ Ошибка сохранения "${key}" в Firebase:`, error);
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data)); // Сохраняем локально, чтобы не потерять

        // Проверяем, почему не сохранилось
        if (error.message && error.message.includes('PERMISSION_DENIED')) {
          toastError('Нет прав на сохранение! Возможно, сессия истекла. Перезайдите в аккаунт. Данные сохранены только локально.', 7000);
        } else {
          toastError('Ошибка сети. Не удалось сохранить на сервер. Данные сохранены локально.', 5000);
        }
        
        return false; // Сигнализируем, что на сервер не ушло
      }
    });
  },

  async update(key, updates) {
    return withProgress(async () => {
      const pathRef = ref(db, `${ROOT}/${key}`);
      try {
        await update(pathRef, updates);
        // Обновляем кэш
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (cached) {
          const current = JSON.parse(cached);
          const newData = { ...current, ...updates };
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(newData));
        }
        return true;
      } catch (error) {
        console.warn(`⚠️ Не удалось обновить "${key}" в Firebase, обновляем локально`);
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (cached) {
          const current = JSON.parse(cached);
          const newData = { ...current, ...updates };
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(newData));
        }
        
        if (error.message && error.message.includes('PERMISSION_DENIED')) {
          toastError(`Ошибка доступа при обновлении "${key}". Проверьте авторизацию.`, 6000);
        }
        return false;
      }
    });
  },

  async remove(key) {
    return withProgress(async () => {
      const pathRef = ref(db, `${ROOT}/${key}`);
      try {
        await remove(pathRef);
        localStorage.removeItem(CACHE_PREFIX + key);
      } catch (error) {
        console.warn(`⚠️ Не удалось удалить "${key}" из Firebase, удаляем локально`);
        localStorage.removeItem(CACHE_PREFIX + key);
      }
    });
  },

  async loadTheme() {
    return await this.load('theme');
  },

  async saveTheme(themeName) {
    await this.save('theme', themeName);
  }
};

// На случай если сайт перезагрузили с активной полоской
window.addEventListener('beforeunload', () => resetProgress());
