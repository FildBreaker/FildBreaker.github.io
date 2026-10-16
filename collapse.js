// collapse.js
// Автоматическое сворачивание длинных текстов в карточках

const COLLAPSIBLE_SELECTORS = [
  '.task-desc',
  '.resource-card .rich-display',
  '.event-card .rich-display',
  '.exam-notes',
  '.cell-notes'
];

// Максимальная высота свёрнутого текста (в пикселях)
const COLLAPSED_HEIGHT = 140;
// Запас, чтобы не сворачивать текст, который чуть-чуть превышает лимит
const SAFE_MARGIN = 30;

let observer = null;

function attachCollapsible(el) {
  // Уже обработан — выходим
  if (el.dataset.collapsible === '1') return;
  // Только текст
  if (!el.textContent.trim()) return;
  // Если внутри уже есть кнопка сворачивания — тоже выходим
  if (el.classList.contains('collapse-wrap')) return;

  const fullHeight = el.scrollHeight;

  // Если контент короткий — не трогаем
  if (fullHeight <= COLLAPSED_HEIGHT + SAFE_MARGIN) return;

  el.dataset.collapsible = '1';

  // Оборачиваем содержимое
  const inner = document.createElement('div');
  inner.className = 'collapse-inner';
  while (el.firstChild) inner.appendChild(el.firstChild);
  el.appendChild(inner);

  // Обёртка с ограничением высоты
  el.classList.add('collapse-wrap', 'is-collapsed', 'has-fade');

  // Кнопка
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'collapse-btn';
  btn.innerHTML = '<span>Показать полностью</span><i class="fas fa-chevron-down"></i>';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCollapse(el, btn);
  });

  // Вставляем кнопку после элемента
  el.parentNode.insertBefore(btn, el.nextSibling);
}

function toggleCollapse(el, btn) {
  const collapsed = el.classList.contains('is-collapsed');

  if (collapsed) {
    el.classList.remove('is-collapsed');
    el.classList.add('is-expanded');
    btn.querySelector('span').textContent = 'Свернуть';
    btn.querySelector('i').className = 'fas fa-chevron-up';

    // Закрываем другие открытые
    document.querySelectorAll('.collapse-wrap.is-expanded').forEach(other => {
      if (other === el) return;
      other.classList.remove('is-expanded');
      other.classList.add('is-collapsed');
      const otherBtn = other.nextElementSibling;
      if (otherBtn && otherBtn.classList.contains('collapse-btn')) {
        otherBtn.querySelector('span').textContent = 'Показать полностью';
        otherBtn.querySelector('i').className = 'fas fa-chevron-down';
      }
    });
  } else {
    el.classList.remove('is-expanded');
    el.classList.add('is-collapsed');
    btn.querySelector('span').textContent = 'Показать полностью';
    btn.querySelector('i').className = 'fas fa-chevron-down';
  }
}

// Применяет сворачивание ко всем длинным текстам в указанном корне
export function applyCollapse(root = document) {
  COLLAPSIBLE_SELECTORS.forEach(sel => {
    root.querySelectorAll(sel).forEach(attachCollapsible);
  });
}

// Следит за новыми элементами в DOM
export function watchCollapse() {
  if (observer) observer.disconnect();
  observer = new MutationObserver((mutations) => {
    let touched = false;
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (COLLAPSIBLE_SELECTORS.some(sel => node.matches?.(sel) || node.querySelector?.(sel))) {
          touched = true;
        }
      });
    });
    if (touched) {
      clearTimeout(window.__collapseTimer);
      window.__collapseTimer = setTimeout(() => applyCollapse(), 80);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
