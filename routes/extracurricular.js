// routes/extracurricular.js
import { dataManager } from '../dataManager.js';
import { createRichEditor, sanitizeHtml, escapeHtml as esc } from '../rich-editor.js';
import { toastSuccess, toastError, toastWarning, confirmDialog } from '../toast.js';
import { renderEmpty } from '../empty-states.js';
import { applyCollapse } from '../collapse.js';
import { isEditor } from '../auth.js';
import { state } from '../state.js';
import { setSidebar, setMain, setSidebarNavHandlers, openModal, closeModal, tgNotify, showSkeletonMain, hideSkeletonMain } from '../utils.js';

const ecState = { currentSection: 'events', editModalSection: null, editModalId: null, eventDescEditor: null, currentTestId: null };

export async function renderExtracurricular() {
  setSidebar(`
    <h3><i class="fas fa-compass"></i> Разделы</h3>
    <div class="nav-sections">
      <button class="section-btn active" data-section="events"><i class="fas fa-bullhorn"></i> Мероприятия</button>
      <button class="section-btn" data-section="polls"><i class="fas fa-chart-simple"></i> Опросы</button>
      <button class="section-btn" data-section="tests"><i class="fas fa-puzzle-piece"></i> Тесты</button>
    </div>
    <button class="add-global-btn" id="globalAddBtn"><i class="fas fa-plus-circle"></i> Добавить</button>
    <div class="sidebar-note"><i class="fas fa-database"></i><p>День прошёл, число сменилось...</p></div>
  `);
  setSidebarNavHandlers();

  setMain(`
    <div class="section-header" id="ecSectionHeader">
      <h2><i class="fas fa-bullhorn"></i> Мероприятия</h2>
      <p>Ближайшие события</p>
    </div>
    <div class="content-container" id="ecContentContainer"></div>
  `);

  showSkeletonMain('card', 2);
  if (!state.data.extracurricular) {
    const saved = await dataManager.load('extracurricular');
    if (saved) {
      state.data.extracurricular = { events: Array.isArray(saved.events) ? saved.events : [], polls: Array.isArray(saved.polls) ? saved.polls : [], tests: Array.isArray(saved.tests) ? saved.tests : [] };
    } else {
      state.data.extracurricular = { events: [], polls: [], tests: [] };
    }
  }
  state.data.extracurricular.polls.forEach(p => {
    if (!p.totalVotes) p.totalVotes = p.options.reduce((s, o) => s + (o.votes || 0), 0);
    if (p.userVoted === undefined) p.userVoted = false;
  });
  hideSkeletonMain();

  ecState.currentSection = 'events';
  renderEcCurrent();

  document.querySelectorAll('.section-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.section-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ecState.currentSection = btn.dataset.section;
      renderEcCurrent();
    };
  });
  document.getElementById('globalAddBtn').onclick = () => openEcEditModal(ecState.currentSection);
  setupEcModals();

  if (window.enableDragSort) {
    window.enableDragSort(document.getElementById('ecContentContainer'), {
      itemSelector: '.event-card, .poll-card, .test-card',
      onReorder: async (newIds) => {
        if (!isEditor()) return;
        const d = state.data.extracurricular;
        if (ecState.currentSection === 'events') { const map = new Map(d.events.map(x => [x.id, x])); d.events = newIds.map(id => map.get(id)).filter(Boolean); }
        else if (ecState.currentSection === 'polls') { const map = new Map(d.polls.map(x => [x.id, x])); d.polls = newIds.map(id => map.get(id)).filter(Boolean); }
        else { const map = new Map(d.tests.map(x => [x.id, x])); d.tests = newIds.map(id => map.get(id)).filter(Boolean); }
        const success = await dataManager.save('extracurricular', d);
        if (success) renderEcCurrent();
      }
    });
  }
}

function renderEcCurrent() {
  const headerEl = document.getElementById('ecSectionHeader');
  const container = document.getElementById('ecContentContainer');
  if (!container) return;
  const d = state.data.extracurricular;
  if (ecState.currentSection === 'events') { headerEl.innerHTML = `<h2><i class="fas fa-bullhorn"></i> Мероприятия</h2><p>Ближайшие события и дни сурка</p>`; renderEcEvents(container, d.events); }
  else if (ecState.currentSection === 'polls') { headerEl.innerHTML = `<h2><i class="fas fa-chart-simple"></i> Опросы</h2><p>Выразите своё мнение</p>`; renderEcPolls(container, d.polls); }
  else { headerEl.innerHTML = `<h2><i class="fas fa-puzzle-piece"></i> Тесты</h2><p>Проверьте знания</p>`; renderEcTests(container, d.tests); }
}

function renderEcEvents(container, events) {
  if (!events.length) {
    renderEmpty(container, 'events', { title: 'Тишина', subtitle: 'Никаких мероприятий пока не запланировано.', actionLabel: isEditor() ? '+ Добавить мероприятие' : '', onAction: () => openEcEditModal('events') });
    return;
  }
  container.innerHTML = '';
  events.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.dataset.id = ev.id;
    card.innerHTML = `
      <div class="card-header-event">
        <div class="event-date"><i class="fas fa-calendar-day"></i> ${esc(ev.date)}</div>
        <div class="event-actions">
          <button class="edit-event"><i class="fas fa-edit"></i></button>
          <button class="delete-event"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <h3>${esc(ev.title)}</h3>
      <div class="rich-display">${sanitizeHtml(ev.description)}</div>
      ${ev.link && ev.link !== '#' ? `<a href="${esc(ev.link)}" target="_blank" class="event-link">Подробнее <i class="fas fa-external-link-alt"></i></a>` : ''}
    `;
    card.querySelector('.edit-event').onclick = () => openEcEditModal('events', ev.id);
    card.querySelector('.delete-event').onclick = () => deleteEcItem('events', ev.id);
    container.appendChild(card);
  });
  applyCollapse(container);
}

function renderEcPolls(container, polls) {
  if (!polls.length) {
    renderEmpty(container, 'polls', { title: 'Опросов нет', subtitle: 'Никто не спрашивал мнения. Может, ты первый?', actionLabel: isEditor() ? '+ Создать опрос' : '', onAction: () => openEcEditModal('polls') });
    return;
  }
  container.innerHTML = '';
  polls.forEach(poll => {
    const card = document.createElement('div');
    card.className = 'poll-card';
    card.dataset.id = poll.id;
    const total = poll.totalVotes || poll.options.reduce((s, o) => s + (o.votes || 0), 0);
    const userVoted = poll.userVoted === true;
    card.innerHTML = `
      <div class="poll-header">
        <h3><i class="fas fa-poll"></i> ${esc(poll.question)}</h3>
        <button class="delete-poll"><i class="fas fa-trash-alt"></i></button>
      </div>
      <div class="poll-options">
        ${poll.options.map((opt, idx) => `
          <div class="poll-option">
            <div class="option-text">${esc(opt.text)}</div>
            ${userVoted ? `<div class="option-bar"><div class="bar-fill" style="width:${(opt.votes/total*100)}%"></div></div><div class="option-stats">${opt.votes} (${total ? ((opt.votes/total)*100).toFixed(1) : 0}%)</div>` : `<button class="vote-btn" data-poll="${poll.id}" data-optidx="${idx}">Голосовать</button>`}
          </div>`).join('')}
      </div>
      <div class="poll-footer">Всего голосов: ${total}</div>
    `;
    if (!userVoted) { card.querySelectorAll('.vote-btn').forEach(btn => { btn.onclick = () => voteEcPoll(btn.dataset.poll, parseInt(btn.dataset.optidx)); }); }
    card.querySelector('.delete-poll').onclick = () => deleteEcItem('polls', poll.id);
    container.appendChild(card);
  });
}

async function voteEcPoll(pollId, optionIndex) {
  const poll = state.data.extracurricular.polls.find(p => p.id === pollId);
  if (!poll || poll.userVoted) return;
  poll.options[optionIndex].votes = (poll.options[optionIndex].votes || 0) + 1;
  poll.totalVotes = (poll.totalVotes || 0) + 1;
  poll.userVoted = true;
  const success = await dataManager.save('extracurricular', state.data.extracurricular);
  if (success) renderEcCurrent();
}

function renderEcTests(container, tests) {
  if (!tests.length) {
    renderEmpty(container, 'tests', { title: 'Тестов нет', subtitle: 'Ни одного теста, ни одной проверки.', actionLabel: isEditor() ? '+ Создать тест' : '', onAction: () => openEcEditModal('tests') });
    return;
  }
  container.innerHTML = '';
  tests.forEach(test => {
    const card = document.createElement('div');
    card.className = 'test-card';
    card.dataset.id = test.id;
    card.innerHTML = `
      <div class="test-header">
        <h3><i class="fas fa-brain"></i> ${esc(test.title)}</h3>
        <div class="test-actions">
          <button class="take-test"><i class="fas fa-play"></i> Пройти</button>
          <button class="edit-test"><i class="fas fa-edit"></i></button>
          <button class="delete-test"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <p>Вопросов: ${test.questions.length}</p>
    `;
    card.querySelector('.take-test').onclick = () => openEcTest(test.id);
    card.querySelector('.edit-test').onclick = () => openEcEditModal('tests', test.id);
    card.querySelector('.delete-test').onclick = () => deleteEcItem('tests', test.id);
    container.appendChild(card);
  });
}

async function deleteEcItem(section, id) {
  if (!isEditor()) { toastError('Нет прав на удаление'); return; }
  const d = state.data.extracurricular;
  let title = ''; let typeRu = '';
  if (section === 'events') { const item = d.events.find(e => e.id === id); title = item?.title || ''; typeRu = 'Мероприятие'; }
  else if (section === 'polls') { const item = d.polls.find(p => p.id === id); title = item?.question || ''; typeRu = 'Опрос'; }
  else { const item = d.tests.find(t => t.id === id); title = item?.title || ''; typeRu = 'Тест'; }

  const ok = await confirmDialog({ title: `Удалить ${typeRu.toLowerCase()}?`, message: title ? `«${title}» будет удалён.` : `${typeRu} будет удалён.`, confirmText: 'Удалить', danger: true });
  if (!ok) return;
  if (section === 'events') d.events = d.events.filter(e => e.id !== id);
  else if (section === 'polls') d.polls = d.polls.filter(p => p.id !== id);
  else d.tests = d.tests.filter(t => t.id !== id);
  const success = await dataManager.save('extracurricular', d);
  if (!success) return;
  renderEcCurrent();
  toastSuccess(`${typeRu} удалён`);
  tgNotify(`🗑 <b>Удалено из внеурочки</b>\n📄 ${title}`);
}

function setupEcModals() {
  document.getElementById('ecSaveModalBtn').onclick = saveEcModalItem;
}

function openEcEditModal(section, id = null) {
  if (!isEditor()) return;
  ecState.editModalSection = section;
  ecState.editModalId = id;
  const title = document.getElementById('ecModalTitle');
  const fields = document.getElementById('ecModalDynamicFields');
  fields.innerHTML = '';
  const d = state.data.extracurricular;

  if (section === 'events') {
    title.innerHTML = id ? '<i class="fas fa-edit"></i> Редактировать' : '<i class="fas fa-plus"></i> Добавить';
    fields.innerHTML = `<label>Название</label><input type="text" id="ecEvTitle"><label>Дата (ГГГГ-ММ-ДД)</label><input type="date" id="ecEvDate"><label>Описание</label><div id="ecEvDescEditor"></div><label>Ссылка</label><input type="url" id="ecEvLink" placeholder="https://...">`;
    const ev = id ? d.events.find(x => x.id === id) : null;
    if (ev) { document.getElementById('ecEvTitle').value = ev.title || ''; document.getElementById('ecEvDate').value = ev.date || ''; document.getElementById('ecEvLink').value = ev.link || ''; }
    const ed = document.getElementById('ecEvDescEditor');
    ecState.eventDescEditor = createRichEditor(ed, { placeholder: 'Описание...', minHeight: '90px' });
    ecState.eventDescEditor.setContent(ev ? (ev.description || '') : '');
  } else if (section === 'polls') {
    title.innerHTML = id ? '<i class="fas fa-edit"></i> Редактировать опрос' : '<i class="fas fa-plus"></i> Создать опрос';
    fields.innerHTML = `<label>Вопрос</label><input type="text" id="ecPollQuestion"><label>Варианты (каждый с новой строки)</label><textarea id="ecPollOptions" rows="3"></textarea>`;
    const poll = id ? d.polls.find(p => p.id === id) : null;
    if (poll) { document.getElementById('ecPollQuestion').value = poll.question; document.getElementById('ecPollOptions').value = poll.options.map(o => o.text).join('\n'); }
  } else {
    title.innerHTML = id ? '<i class="fas fa-edit"></i> Редактировать тест' : '<i class="fas fa-plus"></i> Создать тест';
    fields.innerHTML = `<label>Название</label><input type="text" id="ecTestTitle"><div id="ecQuestionsEditor"></div><button type="button" id="ecAddQuestionBtn" class="add-link-btn"><i class="fas fa-plus"></i> Добавить вопрос</button>`;
    let questions = id ? (d.tests.find(t => t.id === id)?.questions || []) : [];
    const renderQE = () => {
      const c = document.getElementById('ecQuestionsEditor');
      c.innerHTML = '';
      questions.forEach((q, idx) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question-editor';
        qDiv.innerHTML = `<div class="question-text"><input type="text" value="${esc(q.text)}" class="q-text"></div><div class="question-options">${q.options.map(opt => `<div class="opt-row"><input type="text" value="${esc(opt)}" class="q-opt"></div>`).join('')}</div><select class="q-correct">${q.options.map((_, oi) => `<option value="${oi}" ${oi === q.correctIndex ? 'selected' : ''}>Правильный: ${oi+1}</option>`).join('')}</select><button class="remove-question-btn" type="button">Удалить</button>`;
        qDiv.querySelector('.remove-question-btn').onclick = () => { questions.splice(idx, 1); renderQE(); };
        c.appendChild(qDiv);
      });
    };
    renderQE();
    document.getElementById('ecAddQuestionBtn').onclick = () => { questions.push({ text: 'Новый вопрос', options: ['Вариант 1', 'Вариант 2'], correctIndex: 0 }); renderQE(); };
    if (id) document.getElementById('ecTestTitle').value = d.tests.find(t => t.id === id).title;
  }
  openModal('ecEditModal');
}

async function saveEcModalItem() {
  if (!isEditor()) { closeModal('ecEditModal'); return; }
  const section = ecState.editModalSection;
  const id = ecState.editModalId;
  const d = state.data.extracurricular;
  const isEdit = !!id;
  let tgText = '';

  if (section === 'events') {
    const title = document.getElementById('ecEvTitle')?.value.trim();
    const date = document.getElementById('ecEvDate')?.value;
    const link = document.getElementById('ecEvLink')?.value.trim();
    const descHtml = ecState.eventDescEditor ? sanitizeHtml(ecState.eventDescEditor.getContent()) : '';
    const descText = ecState.eventDescEditor ? ecState.eventDescEditor.getText().trim() : '';
    if (!title || !date) { toastWarning('Заполните название и дату'); return; }
    if (!descText) { toastWarning('Введите описание'); return; }
    if (id) { const ev = d.events.find(x => x.id === id); if (ev) { ev.title = title; ev.date = date; ev.description = descHtml; ev.link = link || '#'; } }
    else { d.events.push({ id: Date.now().toString(), title, date, description: descHtml, link: link || '#' }); }
    tgText = `🎉 <b>Мероприятие ${isEdit ? 'изменено' : 'добавлено'}</b>\n📌 ${title}\n📅 ${date}`;
  } else if (section === 'polls') {
    const question = document.getElementById('ecPollQuestion')?.value.trim();
    const optsText = document.getElementById('ecPollOptions')?.value;
    if (!question || !optsText) { toastWarning('Введите вопрос и варианты'); return; }
    const optionsArray = optsText.split('\n').filter(s => s.trim()).map(t => ({ text: t.trim(), votes: 0 }));
    if (optionsArray.length < 2) { toastWarning('Нужно минимум 2 варианта'); return; }
    if (id) { const poll = d.polls.find(p => p.id === id); if (poll) { poll.question = question; poll.options = optionsArray; poll.totalVotes = 0; poll.userVoted = false; } }
    else { d.polls.push({ id: Date.now().toString(), question, options: optionsArray, totalVotes: 0, userVoted: false }); }
    tgText = `📊 <b>Опрос ${isEdit ? 'изменён' : 'создан'}</b>\n❓ ${question}`;
  } else {
    const testTitle = document.getElementById('ecTestTitle')?.value.trim();
    if (!testTitle) { toastWarning('Введите название'); return; }
    const questions = [];
    document.querySelectorAll('#ecQuestionsEditor .question-editor').forEach(div => {
      const qText = div.querySelector('.q-text')?.value.trim();
      const options = Array.from(div.querySelectorAll('.q-opt')).map(i => i.value.trim()).filter(Boolean);
      const correctIdx = parseInt(div.querySelector('.q-correct')?.value);
      if (qText && options.length >= 2) questions.push({ text: qText, options, correctIndex: correctIdx });
    });
    if (!questions.length) { toastWarning('Добавьте хотя бы один вопрос'); return; }
    if (id) { const test = d.tests.find(t => t.id === id); if (test) { test.title = testTitle; test.questions = questions; } }
    else { d.tests.push({ id: Date.now().toString(), title: testTitle, questions }); }
    tgText = `🧠 <b>Тест ${isEdit ? 'изменён' : 'создан'}</b>\n📝 ${testTitle}\n❓ Вопросов: ${questions.length}`;
  }
  const success = await dataManager.save('extracurricular', d);
  if (!success) return;
  closeModal('ecEditModal');
  renderEcCurrent();
  toastSuccess(isEdit ? 'Сохранено' : 'Добавлено');
  if (tgText) tgNotify(tgText);
}

function openEcTest(testId) {
  const test = state.data.extracurricular.tests.find(t => t.id === testId);
  if (!test) return;
  ecState.currentTestId = testId;
  document.getElementById('ecTestModalTitle').innerHTML = `<i class="fas fa-question-circle"></i> ${esc(test.title)}`;
  const c = document.getElementById('ecTestQuestionsContainer');
  c.innerHTML = '';
  test.questions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'test-question';
    qDiv.innerHTML = `<p><strong>${idx+1}. ${esc(q.text)}</strong></p><div class="test-options">${q.options.map((opt, oi) => `<label><input type="radio" name="ecq${idx}" value="${oi}"> ${esc(opt)}</label>`).join('')}</div>`;
    c.appendChild(qDiv);
  });
  document.getElementById('ecTestResult').innerHTML = '';
  document.getElementById('ecSubmitTestBtn').onclick = () => {
    let score = 0;
    test.questions.forEach((q, idx) => {
      const sel = document.querySelector(`input[name="ecq${idx}"]:checked`);
      if (sel && parseInt(sel.value) === q.correctIndex) score++;
    });
    document.getElementById('ecTestResult').innerHTML = `<i class="fas fa-chart-line"></i> ${score} из ${test.questions.length} (${Math.round(score/test.questions.length*100)}%)`;
  };
  openModal('ecTestModal');
}