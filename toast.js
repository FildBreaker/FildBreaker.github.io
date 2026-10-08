// toast.js
// Красивые уведомления и диалоги вместо системных alert/confirm

// ============================================================
// ТОСТЫ — короткие всплывающие сообщения в углу
// ============================================================

const TOAST_STYLES = {
  success: { icon: 'fa-check-circle', color: '#4caf50' },
  error:   { icon: 'fa-times-circle', color: '#e74c3c' },
  warning: { icon: 'fa-exclamation-triangle', color: '#ffb347' },
  info:    { icon: 'fa-info-circle', color: '#4a8cff' }
};

let toastContainer = null;

function ensureToastContainer() {
  if (toastContainer && toastContainer.isConnected) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.id = 'toastContainer';
  document.body.appendChild(toastContainer);
  return toastContainer;
}

export function toast(text, type = 'info', duration = 3500) {
  const container = ensureToastContainer();
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-icon"><i class="fas ${style.icon}"></i></div>
    <div class="toast-text">${text}</div>
    <button class="toast-close" type="button" title="Закрыть">&times;</button>
    <div class="toast-progress"></div>
  `;

  // Клик по крестику
  el.querySelector('.toast-close').addEventListener('click', () => closeToast(el));

  container.appendChild(el);

  // Анимация появления
  requestAnimationFrame(() => el.classList.add('toast-visible'));

  // Автозакрытие
  if (duration > 0) {
    const progress = el.querySelector('.toast-progress');
    progress.style.transition = `width ${duration}ms linear`;
    requestAnimationFrame(() => progress.style.width = '0%');

    setTimeout(() => closeToast(el), duration);
  }

  return el;
}

function closeToast(el) {
  if (!el || el.dataset.closing === '1') return;
  el.dataset.closing = '1';
  el.classList.remove('toast-visible');
  el.classList.add('toast-hiding');
  setTimeout(() => el.remove(), 300);
}

// Удобные шорткаты
export const toastSuccess = (t, d) => toast(t, 'success', d);
export const toastError   = (t, d) => toast(t, 'error', d);
export const toastWarning = (t, d) => toast(t, 'warning', d);
export const toastInfo    = (t, d) => toast(t, 'info', d);

// ============================================================
// CONFIRM — красивый диалог подтверждения (Promise<boolean>)
// ============================================================

export function confirmDialog(options = {}) {
  const {
    title = 'Подтверждение',
    message = 'Ты уверен?',
    confirmText = 'Да',
    cancelText = 'Отмена',
    danger = false
  } = typeof options === 'string' ? { message: options } : options;

  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal confirm-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content confirm-content">
        <div class="confirm-icon ${danger ? 'danger' : ''}">
          <i class="fas ${danger ? 'fa-exclamation-triangle' : 'fa-question-circle'}"></i>
        </div>
        <h3 class="confirm-title">${title}</h3>
        <p class="confirm-message">${message}</p>
        <div class="modal-buttons">
          <button type="button" class="cancel-btn" data-action="cancel">${cancelText}</button>
          <button type="button" class="${danger ? 'danger-btn' : 'save-btn'}" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const finish = (result) => {
      modal.classList.add('confirm-closing');
      setTimeout(() => modal.remove(), 200);
      resolve(result);
    };

    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => finish(false));
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => finish(true));

    // Клик по фону — отмена
    modal.addEventListener('click', (e) => { if (e.target === modal) finish(false); });

    // Escape — отмена
    const onKey = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        finish(false);
      }
    };
    document.addEventListener('keydown', onKey);
  });
}

// ============================================================
// PROMPT — красивый ввод строки (Promise<string|null>)
// ============================================================

export function promptDialog(options = {}) {
  const {
    title = 'Введите значение',
    message = '',
    placeholder = '',
    defaultValue = '',
    confirmText = 'ОК',
    cancelText = 'Отмена'
  } = options;

  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal prompt-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content confirm-content">
        <h3 class="confirm-title">${title}</h3>
        ${message ? `<p class="confirm-message">${message}</p>` : ''}
        <input type="text" class="prompt-input" placeholder="${placeholder}" value="${defaultValue}">
        <div class="modal-buttons">
          <button type="button" class="cancel-btn" data-action="cancel">${cancelText}</button>
          <button type="button" class="save-btn" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const input = modal.querySelector('.prompt-input');
    setTimeout(() => { input.focus(); input.select(); }, 50);

    const finish = (result) => {
      modal.classList.add('confirm-closing');
      setTimeout(() => modal.remove(), 200);
      resolve(result);
    };

    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => finish(null));
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => finish(input.value.trim()));
    modal.addEventListener('click', (e) => { if (e.target === modal) finish(null); });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(input.value.trim());
      if (e.key === 'Escape') finish(null);
    });
  });
}