// search.js
export function initSearch() {
  const modal = document.createElement('div');
  modal.id = 'searchModal';
  modal.className = 'search-modal';
  modal.innerHTML = `
    <div class="search-modal-content">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="globalSearchInput" placeholder="Поиск по сайту (Ctrl+K)..." autocomplete="off">
        <span class="search-close" id="globalSearchClose">ESC</span>
      </div>
      <div class="search-results" id="searchResults">
        <div class="search-hint">Введите запрос для поиска по расписанию, домашке, преподам и ресурсам...</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input = document.getElementById('globalSearchInput');
  const resultsBox = document.getElementById('searchResults');
  const closeBtn = document.getElementById('globalSearchClose');

  // Обработка Ctrl+K (или Cmd+K на Mac)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      modal.classList.add('active');
      input.focus();
    }
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      input.value = '';
      resultsBox.innerHTML = '<div class="search-hint">Введите запрос для поиска...</div>';
    }
  });

  closeBtn.onclick = () => {
    modal.classList.remove('active');
  };

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Логика поиска
  input.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length < 2) {
      resultsBox.innerHTML = '<div class="search-hint">Введите хотя бы 2 символа...</div>';
      return;
    }

    // Берем данные из глобального стейта (предполагаем, что app.js экспортирует state или мы передаем его)
    // Так как app.js не экспортирует state, нам нужно будет прокинуть его сюда при инициализации, 
    // либо использовать window.appState, либо просто получать данные из dataManager.
    // Для простоты, в app.js мы сделаем window.globalSearchData = state.data; при каждом обновлении.
    const data = window.globalSearchData || {};
    const results = [];
    const pushResult = (type, title, text, url, icon) => {
      if (title.toLowerCase().includes(query) || (text && text.toLowerCase().includes(query))) {
        results.push({ type, title, text, url, icon });
      }
    };

    // Поиск по Расписанию
    if (data.schedule) {
      Object.keys(data.schedule).forEach(day => {
        Object.keys(data.schedule[day]).forEach(pair => {
          const lesson = data.schedule[day][pair];
          if (lesson.subject) {
            pushResult('Расписание', lesson.subject, `${lesson.room || ''}`, '#/schedule', 'fa-calendar-alt');
          }
        });
      });
    }

    // Поиск по Домашке
    if (data.homework && data.homework.subjects) {
      data.homework.subjects.forEach(subj => {
        if (subj.tasks) {
          subj.tasks.forEach(task => {
            pushResult('Домашка', subj.name, task.desc.replace(/<[^>]+>/g, ''), '#/homework', 'fa-book-open');
          });
        }
      });
    }

    // Поиск по Экзаменам
    if (data.exams) {
      data.exams.forEach(exam => {
        pushResult('Экзамен', exam.subject, `Ауд: ${exam.room}, ${exam.teacher}`, '#/exam', 'fa-graduation-cap');
      });
    }

    // Поиск по Преподам
    if (data.teachers) {
      data.teachers.forEach(t => {
        pushResult('Преподаватель', t.name, t.position, '#/teacher', 'fa-user-tie');
      });
    }

    // Поиск по Ресурсам
    if (data.resources) {
      data.resources.forEach(r => {
        pushResult('Ресурс', r.title, r.desc.replace(/<[^>]+>/g, ''), '#/resources', 'fa-link');
      });
    }

    // Рендер результатов
    if (results.length === 0) {
      resultsBox.innerHTML = `<div class="search-hint">Ничего не найдено по запросу «${query}»</div>`;
    } else {
      resultsBox.innerHTML = results.slice(0, 15).map(r => `
        <a href="${r.url}" class="search-result-item" onclick="document.getElementById('searchModal').classList.remove('active')">
          <div class="search-res-icon"><i class="fas ${r.icon}"></i></div>
          <div class="search-res-info">
            <div class="search-res-type">${r.type}</div>
            <div class="search-res-title">${r.title}</div>
            <div class="search-res-text">${r.text || ''}</div>
          </div>
        </a>
      `).join('');
    }
  });
}