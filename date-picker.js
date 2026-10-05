// date-picker.js
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAYS_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

let popoverEl = null;
let currentCleanup = null;

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(d) {
  if (!d) return '--.--.---- --:--';
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Возвращает массив дней (Date) для отображения в сетке месяца
// с учётом сдвига (неделя начинается с понедельника)
function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay(); // 0=вс, 1=пн...
  if (startWeekday === 0) startWeekday = 7;
  startWeekday -= 1; // 0=пн, 6=вс

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  // Дни предыдущего месяца
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      other: true
    });
  }
  // Дни текущего месяца
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), other: false });
  }
  // Дни следующего месяца — добиваем до 42 (6 недель)
  while (cells.length < 42) {
    const lastDate = cells[cells.length - 1].date;
    const next = new Date(lastDate);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, other: true });
  }
  return cells;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

export function openDatePicker({ anchorEl, initial, onPick }) {
  closeDatePicker();
  if (!anchorEl) return;

  let selected = initial ? new Date(initial) : new Date();
  let viewYear = selected.getFullYear();
  let viewMonth = selected.getMonth();

  const pop = document.createElement('div');
  pop.className = 'date-picker-popover';
  pop.innerHTML = `
    <div class="dp-header">
      <button type="button" class="dp-nav" data-nav="-1" title="Предыдущий месяц"><i class="fas fa-chevron-left"></i></button>
      <div class="dp-month-label" id="dpMonthLabel"></div>
      <button type="button" class="dp-nav" data-nav="1" title="Следующий месяц"><i class="fas fa-chevron-right"></i></button>
    </div>
    <div class="dp-weekdays">
      ${DAYS_RU.map(d => `<span>${d}</span>`).join('')}
    </div>
    <div class="dp-grid" id="dpGrid"></div>
    <div class="dp-time">
      <div class="dp-time-row">
        <button type="button" class="dp-time-nav" data-time="h-1"><i class="fas fa-minus"></i></button>
        <div class="dp-time-value" id="dpHours">00</div>
        <button type="button" class="dp-time-nav" data-time="h+1"><i class="fas fa-plus"></i></button>
      </div>
      <div class="dp-time-sep">:</div>
      <div class="dp-time-row">
        <button type="button" class="dp-time-nav" data-time="m-1"><i class="fas fa-minus"></i></button>
        <div class="dp-time-value" id="dpMinutes">00</div>
        <button type="button" class="dp-time-nav" data-time="m+1"><i class="fas fa-plus"></i></button>
      </div>
    </div>
    <div class="dp-actions">
      <button type="button" class="dp-btn dp-btn-ghost" id="dpToday">Сегодня</button>
      <button type="button" class="dp-btn dp-btn-ghost" id="dpClear">Очистить</button>
      <button type="button" class="dp-btn dp-btn-primary" id="dpOk">Готово</button>
    </div>
  `;
  document.body.appendChild(pop);
  popoverEl = pop;

  const monthLabel = pop.querySelector('#dpMonthLabel');
  const grid = pop.querySelector('#dpGrid');
  const hoursEl = pop.querySelector('#dpHours');
  const minutesEl = pop.querySelector('#dpMinutes');

  function renderGrid() {
    monthLabel.textContent = `${MONTHS_RU[viewMonth]} ${viewYear}`;
    const today = new Date();
    grid.innerHTML = '';
    const cells = getMonthGrid(viewYear, viewMonth);
    cells.forEach(cell => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dp-day';
      btn.textContent = cell.date.getDate();
      if (cell.other) btn.classList.add('dp-day-other');
      if (isSameDay(cell.date, today)) btn.classList.add('dp-day-today');
      if (isSameDay(cell.date, selected)) btn.classList.add('dp-day-selected');
      btn.addEventListener('click', () => {
        // Сохраняем часы/минуты, меняем только дату
        const h = selected.getHours();
        const m = selected.getMinutes();
        selected = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate(), h, m);
        // Если кликнули в соседний месяц — переключаем вид
        if (cell.other) {
          viewYear = selected.getFullYear();
          viewMonth = selected.getMonth();
        }
        renderGrid();
        renderTime();
      });
      grid.appendChild(btn);
    });
  }

  function renderTime() {
    hoursEl.textContent = pad(selected.getHours());
    minutesEl.textContent = pad(selected.getMinutes());
  }

  // Навигация по месяцам
  pop.querySelectorAll('.dp-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.dataset.nav);
      viewMonth += delta;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderGrid();
    });
  });

  // Часы / минуты
  pop.querySelectorAll('.dp-time-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.dataset.time;
      let h = selected.getHours();
      let m = selected.getMinutes();
      const step = 1;
      if (op === 'h+1') h = (h + step) % 24;
      if (op === 'h-1') h = (h - step + 24) % 24;
      if (op === 'm+1') m = (m + 5) % 60;
      if (op === 'm-1') m = (m - 5 + 60) % 60;
      selected.setHours(h);
      selected.setMinutes(m);
      renderTime();
    });
  });

  // Сегодня
  pop.querySelector('#dpToday').addEventListener('click', () => {
    const now = new Date();
    const h = selected.getHours();
    const m = selected.getMinutes();
    selected = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    viewYear = selected.getFullYear();
    viewMonth = selected.getMonth();
    renderGrid();
    renderTime();
  });

  // Очистить — сбрасываем на "сейчас" (для пустого значения логику можно добавить позже)
  pop.querySelector('#dpClear').addEventListener('click', () => {
    selected = new Date();
    viewYear = selected.getFullYear();
    viewMonth = selected.getMonth();
    renderGrid();
    renderTime();
  });

  // Готово
  pop.querySelector('#dpOk').addEventListener('click', () => {
    if (typeof onPick === 'function') onPick(new Date(selected));
    closeDatePicker();
  });

  renderGrid();
  renderTime();

  // Позиционирование
  const rect = anchorEl.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + popRect.width > window.innerWidth - 8) left = window.innerWidth - popRect.width - 8;
  if (left < 8) left = 8;
  if (rect.bottom + popRect.height + 12 > window.innerHeight) {
    top = rect.top - popRect.height - 8;
    if (top < 8) top = rect.bottom + 8;
  }
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';

  // Закрытие по клику вне и Escape
  const onDocClick = (e) => {
    if (!pop.contains(e.target) && !anchorEl.contains(e.target)) closeDatePicker();
  };
  const onKey = (e) => { if (e.key === 'Escape') closeDatePicker(); };
  const onScroll = () => closeDatePicker();

  setTimeout(() => {
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
  }, 0);

  currentCleanup = () => {
    document.removeEventListener('mousedown', onDocClick);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll);
  };
}

export function closeDatePicker() {
  if (currentCleanup) { currentCleanup(); currentCleanup = null; }
  if (popoverEl) { popoverEl.remove(); popoverEl = null; }
}

export { formatDate };