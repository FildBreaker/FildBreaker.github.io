// dataManager.js
import { db } from './firebase-config.js';
import { ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const ROOT = 'IBD2026';

export const dataManager = {
  async load(key) {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `${ROOT}/${key}`));
    return snapshot.exists() ? snapshot.val() : null;
  },
  async save(key, data) {
    const pathRef = ref(db, `${ROOT}/${key}`);
    await set(pathRef, data);
  },
  async update(key, updates) {
    const pathRef = ref(db, `${ROOT}/${key}`);
    await update(pathRef, updates);
  },
  async remove(key) {
    const pathRef = ref(db, `${ROOT}/${key}`);
    await remove(pathRef);
  }
};