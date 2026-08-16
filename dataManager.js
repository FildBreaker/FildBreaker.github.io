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
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        return cached ? JSON.parse(cached) : null;
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки из Firebase, используем кэш:', error);
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      return cached ? JSON.parse(cached) : null;
    }
  },
  async save(key, data) {
    const pathRef = ref(db, `${ROOT}/${key}`);
    try {
      await set(pathRef, data);
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Ошибка сохранения в Firebase, сохраняем локально:', error);
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
      console.warn('⚠️ Ошибка обновления в Firebase, обновляем локально:', error);
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
      console.warn('⚠️ Ошибка удаления из Firebase, удаляем локально:', error);
      localStorage.removeItem(CACHE_PREFIX + key);
    }
  },
  async loadTheme() {
    return await this.load('theme');
  },
  async saveTheme(themeName) {
    await this.save('theme', themeName);
  }
};
