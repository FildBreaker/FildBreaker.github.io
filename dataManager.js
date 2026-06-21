// dataManager.js
import { db } from './firebase-config.js';
import { ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Корневой путь для всех данных в базе
const ROOT = 'B21LES';

export const dataManager = {
  /**
   * Загрузить данные по ключу
   * @param {string} key - ключ в базе (например, 'schedule', 'homework')
   * @returns {Promise<any>} данные или null
   */
  async load(key) {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `${ROOT}/${key}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`Ошибка загрузки данных "${key}":`, error);
      return null;
    }
  },

  /**
   * Сохранить данные по ключу (полная замена)
   * @param {string} key - ключ в базе
   * @param {any} data - данные для сохранения
   */
  async save(key, data) {
    try {
      const pathRef = ref(db, `${ROOT}/${key}`);
      await set(pathRef, data);
    } catch (error) {
      console.error(`Ошибка сохранения данных "${key}":`, error);
      throw error;
    }
  },

  /**
   * Обновить часть данных по ключу
   * @param {string} key - ключ в базе
   * @param {object} updates - объект с обновлениями
   */
  async update(key, updates) {
    try {
      const pathRef = ref(db, `${ROOT}/${key}`);
      await update(pathRef, updates);
    } catch (error) {
      console.error(`Ошибка обновления данных "${key}":`, error);
      throw error;
    }
  },

  /**
   * Удалить данные по ключу
   * @param {string} key - ключ в базе
   */
  async remove(key) {
    try {
      const pathRef = ref(db, `${ROOT}/${key}`);
      await remove(pathRef);
    } catch (error) {
      console.error(`Ошибка удаления данных "${key}":`, error);
      throw error;
    }
  }
};
