// progress.js
// Тонкая полоска загрузки сверху экрана

let bar = null;
let activeRequests = 0;
let hideTimeout = null;
let resetTimeout = null;
let fakeProgressInterval = null;
let currentProgress = 0;

function ensureBar() {
  if (bar && bar.isConnected) return bar;
  bar = document.createElement('div');
  bar.className = 'top-progress';
  bar.innerHTML = '<div class="top-progress-fill"></div>';
  document.body.appendChild(bar);
  return bar;
}

function setProgress(value) {
  if (!bar) return;
  currentProgress = Math.max(0, Math.min(100, value));
  const fill = bar.querySelector('.top-progress-fill');
  if (fill) {
    fill.style.width = currentProgress + '%';
    fill.style.opacity = currentProgress > 0 ? '1' : '0';
  }
}

export function startProgress() {
  // Счётчик активных запросов
  activeRequests++;

  // Отменяем запланированное исчезновение
  if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
  if (resetTimeout) { clearTimeout(resetTimeout); resetTimeout = null; }

  // Первый запрос — показываем полоску
  if (activeRequests === 1) {
    ensureBar();
    bar.classList.add('top-progress-active');

    // Стартуем с нуля, чтобы анимация шла
    currentProgress = 0;
    setProgress(8);

    // Быстро до 70%, потом медленно ползём к 90%
    setTimeout(() => setProgress(70), 100);

    // Плавно «ползём» к 90%, пока ждём ответа
    if (fakeProgressInterval) clearInterval(fakeProgressInterval);
    let fakeCurrent = 70;
    fakeProgressInterval = setInterval(() => {
      // Чем ближе к 90, тем медленнее
      const remaining = 90 - fakeCurrent;
      fakeCurrent += Math.max(0.2, remaining * 0.05);
      setProgress(fakeCurrent);
    }, 400);
  }
}

export function endProgress() {
  activeRequests = Math.max(0, activeRequests - 1);

  // Ещё есть активные запросы — ничего не делаем
  if (activeRequests > 0) return;

  // Все запросы завершены — добиваем до 100%
  if (fakeProgressInterval) {
    clearInterval(fakeProgressInterval);
    fakeProgressInterval = null;
  }

  setProgress(100);

  // Прячем полоску и сбрасываем
  hideTimeout = setTimeout(() => {
    if (bar) bar.classList.remove('top-progress-active');

    resetTimeout = setTimeout(() => {
      setProgress(0);
      if (bar) bar.classList.remove('top-progress-active');
    }, 400);
  }, 300);
}

// Сброс на случай если что-то пошло не так
export function resetProgress() {
  activeRequests = 0;
  if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
  if (resetTimeout) { clearTimeout(resetTimeout); resetTimeout = null; }
  if (fakeProgressInterval) { clearInterval(fakeProgressInterval); fakeProgressInterval = null; }
  setProgress(0);
  if (bar) bar.classList.remove('top-progress-active');
}