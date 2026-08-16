// dataManager.js
import { db } from './firebase-config.js';
import { ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const ROOT = 'IBD2026';
const CACHE_PREFIX = 'cache_';

export const dataManager = {
  async load(key) {
    const dbRef = ref(db);
    try {
      const snapshot = await get(child(dbRef, `${ROOT}/${key}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
        return data;
      } else {
        // Если в Firebase нет данных, пробуем кэш
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        return cached ? JSON.parse(cached) : null;
      }
    } catch (error) {
      // Если ошибка, например, нет сети, просто используем кэш без лишнего шума
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (cached) {
        // Можно вывести одно предупреждение, но только если действительно проблема
        // Я убрал предупреждение, чтобы не засорять консоль
        return JSON.parse(cached);
      }
      // Если нет ни Firebase, ни кэша, возвращаем null и логируем только реальную ошибку
      console.error(`❌ Не удалось загрузить данные "${key}" и нет кэша:`, error);
      return null;
    }
  },

  async save(key, data) {
    const pathRef = ref(db, `${ROOT}/${key}`);
    try {
      await set(pathRef, data);
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
      // Если не удалось сохранить в Firebase, сохраняем локально и тихо логируем (можно убрать)
      console.warn(`⚠️ Не удалось сохранить "${key}" в Firebase, сохранено локально:`, error);
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    }
  },

  async update(key, updates) {
    const pathRef = ref(db, `${ROOT}/${key}`);
    try {
      await update(pathRef, updates);
      const current = await this.load(key);
      if (current) {
        const newData = { ...current, ...updates };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(newData));
      }
    } catch (error) {
      console.warn(`⚠️ Не удалось обновить "${key}" в Firebase, обновляем локально:`, error);
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (cached) {
        const current = JSON.parse(cached);
        const newData = { ...current, ...updates };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(newData));
      }
    }
  },

  async remove(key) {
    const pathRef = ref(db, `${ROOT}/${key}`);
    try {
      await remove(pathRef);
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.warn(`⚠️ Не удалось удалить "${key}" из Firebase, удаляем локально:`, error);
      localStorage.removeItem(CACHE_PREFIX + key);
    }
  },

  // Методы для темы
  async loadTheme() {
    return await this.load('theme');
  },
  async saveTheme(themeName) {
    await this.save('theme', themeName);
  }
};
