// dataManager.js
import { db } from './firebase-config.js';
import { ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const ROOT = 'B21LES';

export const dataManager = {
  // Загрузка данных по ключу
  async load(key) {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `${ROOT}/${key}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (e) {
      console.error(`Ошибка загрузки ${key}:`, e);
      return null;
    }
  },

  // Сохранение данных по ключу (полная замена)
  async save(key, data) {
    try {
      const pathRef = ref(db, `${ROOT}/${key}`);
      await set(pathRef, data);
      return true;
    } catch (e) {
      console.error(`Ошибка сохранения ${key}:`, e);
      return false;
    }
  },

  // Частичное обновление
  async update(key, updates) {
    try {
      const pathRef = ref(db, `${ROOT}/${key}`);
      await update(pathRef, updates);
      return true;
    } catch (e) {
      console.error(`Ошибка обновления ${key}:`, e);
      return false;
    }
  },

  // Удаление данных
  async remove(key) {
    try {
      const pathRef = ref(db, `${ROOT}/${key}`);
      await remove(pathRef);
      return true;
    } catch (e) {
      console.error(`Ошибка удаления ${key}:`, e);
      return false;
    }
  }
};
