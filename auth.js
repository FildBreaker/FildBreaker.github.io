// auth.js
import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Кому разрешено редактировать сайт
const ALLOWED_UIDS = [
  '3JdRBCv7Z5QR9NQzjBATtF044ZG3',
  'I6ixRUigC7TC74ZN7EDI1JrqCcI2'
];

let currentUser = null;
const listeners = [];

export function isEditor() {
  return !!(currentUser && ALLOWED_UIDS.includes(currentUser.uid));
}

export function getCurrentUser() {
  return currentUser;
}

export function onAuthChange(cb) {
  listeners.push(cb);
  cb(currentUser, isEditor());
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function notify() {
  listeners.forEach(cb => {
    try { cb(currentUser, isEditor()); } catch (e) { console.error(e); }
  });
  document.body.classList.toggle('is-editor', isEditor());
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  notify();
});

export async function login(email, password) {
  const res = await signInWithEmailAndPassword(auth, email, password);
  if (!ALLOWED_UIDS.includes(res.user.uid)) {
    await signOut(auth);
    throw new Error('Этот аккаунт не имеет прав редактирования');
  }
  return res.user;
}

export async function logout() {
  await signOut(auth);
}