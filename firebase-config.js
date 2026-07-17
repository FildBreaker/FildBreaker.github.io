// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwMQhg9UAMo8wVzakwGWpdHSrINQjQJw",
  authDomain: "ibd2026-31a00.firebaseapp.com",
  databaseURL: "https://ibd2026-31a00-default-rtdb.firebaseio.com",
  projectId: "ibd2026-31a00",
  storageBucket: "ibd2026-31a00.firebasestorage.app",
  messagingSenderId: "826651327426",
  appId: "1:826651327426:web:ba6ae8f6afa7b16153345b",
  measurementId: "G-TP5LTG9Q9D"
};

const app = initializeApp(firebaseConfig);

// 👇 Добавьте инициализацию App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('ВАШ_SITE_KEY_ЗДЕСЬ'), // 👈 вставьте site key, а не secret key
  isTokenAutoRefreshEnabled: true
});

export const db = getDatabase(app);
