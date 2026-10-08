// empty-states.js
// Иллюстрации для пустых состояний — SVG в тон темы

export const emptyStates = {

  // Домашка: пустой предмет (нет заданий)
  homework: `
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="30" width="120" height="100" rx="12" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <line x1="60" y1="60" x2="140" y2="60" stroke="currentColor" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>
      <line x1="60" y1="80" x2="120" y2="80" stroke="currentColor" stroke-width="2.5" opacity="0.3" stroke-linecap="round"/>
      <line x1="60" y1="100" x2="100" y2="100" stroke="currentColor" stroke-width="2.5" opacity="0.25" stroke-linecap="round"/>
      <circle cx="155" cy="125" r="14" fill="currentColor" opacity="0.15"/>
      <path d="M155 118 v14 M148 125 h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
    </svg>
  `,

  // Ресурсы: пустая коробка
  resources: `
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 60 L100 40 L150 60 L150 120 L100 140 L50 120 Z"
            stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" opacity="0.6"/>
      <path d="M50 60 L100 80 L150 60 M100 80 V140"
            stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" opacity="0.4"/>
      <circle cx="100" cy="30" r="3" fill="currentColor" opacity="0.5"/>
      <circle cx="80" cy="22" r="2" fill="currentColor" opacity="0.35"/>
      <circle cx="120" cy="24" r="2" fill="currentColor" opacity="0.35"/>
    </svg>
  `,

  // Экзамены: пустой свиток
  exams: `
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 35 Q60 25 70 25 L130 25 Q140 25 140 35 L140 125 Q140 135 130 135 L70 135 Q60 135 60 125 Z"
            stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <line x1="78" y1="55" x2="122" y2="55" stroke="currentColor" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>
      <line x1="78" y1="75" x2="110" y2="75" stroke="currentColor" stroke-width="2.5" opacity="0.3" stroke-linecap="round"/>
      <line x1="78" y1="95" x2="118" y2="95" stroke="currentColor" stroke-width="2.5" opacity="0.25" stroke-linecap="round"/>
      <path d="M92 118 L100 110 L108 118 L100 126 Z" stroke="currentColor" stroke-width="2" opacity="0.5" fill="none"/>
    </svg>
  `,

  // Мероприятия: пустой календарь с флажком
  events: `
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="45" width="100" height="85" rx="10" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <line x1="50" y1="68" x2="150" y2="68" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
      <line x1="72" y1="35" x2="72" y2="55" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="128" y1="35" x2="128" y2="55" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <path d="M148 22 L148 55" stroke="currentColor" stroke-width="2" opacity="0.5"/>
      <path d="M148 22 L168 28 L148 36 Z" fill="currentColor" opacity="0.4"/>
    </svg>
  `,

  // Опросы: пустая диаграмма
  polls: `
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="45" y="110" width="22" height="30" rx="4" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>
      <rect x="89" y="85" width="22" height="55" rx="4" stroke="currentColor" stroke-width="2.5" opacity="0.5"/>
      <rect x="133" y="60" width="22" height="80" rx="4" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <path d="M40 145 H160" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
      <circle cx="56" cy="30" r="8" stroke="currentColor" stroke-width="2" opacity="0.4" fill="none"/>
      <path d="M56 26 V30 L59 32" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
    </svg>
  `,

  // Тесты: пустой чек-лист
  tests: `
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="55" y="35" width="90" height="100" rx="8" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <rect x="70" y="55" width="14" height="14" rx="3" stroke="currentColor" stroke-width="2" opacity="0.4" fill="none"/>
      <rect x="70" y="80" width="14" height="14" rx="3" stroke="currentColor" stroke-width="2" opacity="0.4" fill="none"/>
      <rect x="70" y="105" width="14" height="14" rx="3" stroke="currentColor" stroke-width="2" opacity="0.4" fill="none"/>
      <line x1="94" y1="62" x2="128" y2="62" stroke="currentColor" stroke-width="2" opacity="0.3" stroke-linecap="round"/>
      <line x1="94" y1="87" x2="128" y2="87" stroke="currentColor" stroke-width="2" opacity="0.3" stroke-linecap="round"/>
      <line x1="94" y1="112" x2="128" y2="112" stroke="currentColor" stroke-width="2" opacity="0.3" stroke-linecap="round"/>
      <path d="M73 60 L76 63 L81 57" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    </svg>
  `,

  // Преподаватели: пустой портрет
  teachers: `
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="60" r="22" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
      <path d="M60 130 Q60 100 100 100 Q140 100 140 130"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <circle cx="100" cy="60" r="6" fill="currentColor" opacity="0.2"/>
    </svg>
  `,

  // Общий fallback
  generic: `
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="50" stroke="currentColor" stroke-width="2.5" opacity="0.4" fill="none"/>
      <path d="M80 80 H120 M100 60 V100" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
    </svg>
  `
};

// Универсальная функция отрисовки
export function renderEmpty(target, type = 'generic', options = {}) {
  const {
    title = 'Здесь пока пусто',
    subtitle = '',
    actionLabel = '',
    onAction = null
  } = options;

  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) return;

  const svg = emptyStates[type] || emptyStates.generic;

  container.innerHTML = `
    <div class="empty-state-v2">
      <div class="empty-illustration">${svg}</div>
      <h3 class="empty-title">${title}</h3>
      ${subtitle ? `<p class="empty-subtitle">${subtitle}</p>` : ''}
      ${actionLabel ? `<button type="button" class="empty-action">${actionLabel}</button>` : ''}
    </div>
  `;

  if (actionLabel && typeof onAction === 'function') {
    container.querySelector('.empty-action').onclick = onAction;
  }
}