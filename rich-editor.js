// rich-editor.js
import { openColorPicker } from './color-picker.js';

const ALLOWED_TAGS = [
  'B','I','U','S','BR','SPAN','STRONG','EM','FONT','MARK','SUB','SUP',
  'H1','H2','H3','H4','H5','H6',
  'UL','OL','LI',
  'BLOCKQUOTE','PRE','CODE',
  'A','HR','P','DIV'
];

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  function walk(node) {
    if (node.nodeType === 3) return;
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (!ALLOWED_TAGS.includes(tag)) {
      const frag = document.createDocumentFragment();
      while (node.firstChild) frag.appendChild(node.firstChild);
      node.parentNode.replaceChild(frag, node);
      return;
    }
    [...node.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      if (name.startsWith('on')) node.removeAttribute(attr.name);

      if (name === 'href' || name === 'src') {
        if (/^\s*(javascript|data|vbscript):/i.test(value)) {
          node.removeAttribute(attr.name);
        }
      }

      if (name === 'class') {
        const safe = value.split(/\s+/).filter(c => c.startsWith('anim-')).join(' ');
        if (safe) node.setAttribute('class', safe);
        else node.removeAttribute('class');
      }

      if (name === 'style') {
        const safeStyle = value.split(';').filter(s => {
          return /^\s*(color|background-color|text-align|font-size|font-weight|font-style|text-decoration)\s*:/i.test(s);
        }).join(';');
        if (safeStyle) node.setAttribute('style', safeStyle);
        else node.removeAttribute('style');
      }

      if (name === 'target' && value !== '_blank') node.removeAttribute('target');
      if (name === 'rel' && !/noopener|noreferrer/.test(value)) node.removeAttribute('rel');
    });
    [...node.childNodes].forEach(walk);
  }
  [...tmp.childNodes].forEach(walk);
  return tmp.innerHTML;
}

export function createRichEditor(target, options = {}) {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return null;
  const placeholder = options.placeholder || 'Введите текст...';
  const initial = options.value || '';
  const minHeight = options.minHeight || '100px';

  container.classList.add('rich-editor-wrapper');
  container.innerHTML = `
    <div class="rich-toolbar" role="toolbar">
      <select class="rich-format-select" title="Стиль текста">
        <option value="p">Обычный</option>
        <option value="h1">Заголовок 1</option>
        <option value="h2">Заголовок 2</option>
        <option value="h3">Заголовок 3</option>
        <option value="h4">Заголовок 4</option>
      </select>
      <span class="rich-sep"></span>
      <button type="button" data-cmd="bold" title="Жирный (Ctrl+B)"><i class="fas fa-bold"></i></button>
      <button type="button" data-cmd="italic" title="Курсив (Ctrl+I)"><i class="fas fa-italic"></i></button>
      <button type="button" data-cmd="underline" title="Подчёркнутый (Ctrl+U)"><i class="fas fa-underline"></i></button>
      <button type="button" data-cmd="strikeThrough" title="Зачёркнутый"><i class="fas fa-strikethrough"></i></button>
      <button type="button" data-cmd="subscript" title="Нижний индекс"><i class="fas fa-subscript"></i></button>
      <button type="button" data-cmd="superscript" title="Верхний индекс"><i class="fas fa-superscript"></i></button>
      <span class="rich-sep"></span>
      <button type="button" class="rich-color-btn" data-cmd="foreColor" title="Цвет текста">
        <i class="fas fa-font"></i>
        <span class="rich-color-swatch" data-swatch="foreColor" data-color="#ffb347" style="background:#ffb347;"></span>
      </button>
      <button type="button" class="rich-color-btn" data-cmd="hiliteColor" title="Выделение">
        <i class="fas fa-highlighter"></i>
        <span class="rich-color-swatch" data-swatch="hiliteColor" data-color="#fff3b0" style="background:#fff3b0;"></span>
      </button>
      <span class="rich-sep"></span>
      <button type="button" data-cmd="justifyLeft" title="По левому краю"><i class="fas fa-align-left"></i></button>
      <button type="button" data-cmd="justifyCenter" title="По центру"><i class="fas fa-align-center"></i></button>
      <button type="button" data-cmd="justifyRight" title="По правому краю"><i class="fas fa-align-right"></i></button>
      <button type="button" data-cmd="justifyFull" title="По ширине"><i class="fas fa-align-justify"></i></button>
      <span class="rich-sep"></span>
      <button type="button" data-cmd="insertUnorderedList" title="Маркированный список"><i class="fas fa-list-ul"></i></button>
      <button type="button" data-cmd="insertOrderedList" title="Нумерованный список"><i class="fas fa-list-ol"></i></button>
      <button type="button" data-cmd="formatBlock" data-value="blockquote" title="Цитата"><i class="fas fa-quote-right"></i></button>
      <button type="button" data-cmd="formatBlock" data-value="pre" title="Код"><i class="fas fa-code"></i></button>
      <button type="button" data-action="link" title="Вставить ссылку"><i class="fas fa-link"></i></button>
      <button type="button" data-cmd="insertHorizontalRule" title="Разделитель"><i class="fas fa-minus"></i></button>
      <span class="rich-sep"></span>
      <button type="button" data-anim="anim-glow" title="Свечение"><i class="fas fa-sun"></i></button>
      <button type="button" data-anim="anim-pulse" title="Пульсация"><i class="fas fa-heartbeat"></i></button>
      <button type="button" data-anim="anim-shake" title="Тряска"><i class="fas fa-bolt"></i></button>
      <button type="button" data-anim="anim-gradient" title="Градиент"><i class="fas fa-fill-drip"></i></button>
      <span class="rich-sep"></span>
      <button type="button" data-cmd="removeFormat" title="Очистить формат"><i class="fas fa-eraser"></i></button>
    </div>
    <div class="rich-content" contenteditable="true" data-placeholder="${escapeHtml(placeholder)}" style="min-height:${minHeight};">${initial}</div>
  `;
  const content = container.querySelector('.rich-content');
  const toolbar = container.querySelector('.rich-toolbar');

  function updateState() {
    ['bold','italic','underline','strikeThrough','subscript','superscript'].forEach(cmd => {
      const btn = toolbar.querySelector(`[data-cmd="${cmd}"]`);
      if (!btn) return;
      try {
        if (document.queryCommandState(cmd)) btn.classList.add('active');
        else btn.classList.remove('active');
      } catch (_) {}
    });
    ['justifyLeft','justifyCenter','justifyRight','justifyFull','insertUnorderedList','insertOrderedList'].forEach(cmd => {
      const btn = toolbar.querySelector(`[data-cmd="${cmd}"]`);
      if (!btn) return;
      try {
        if (document.queryCommandState(cmd)) btn.classList.add('active');
        else btn.classList.remove('active');
      } catch (_) {}
    });
  }

  function updatePlaceholder() {
    const empty = content.textContent.trim() === '' && !content.querySelector('span');
    content.classList.toggle('empty', empty);
  }

  // Обычные команды (учитываем data-value для formatBlock)
  toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
    if (btn.classList.contains('rich-color-btn')) return;
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', e => {
      e.preventDefault();
      content.focus();
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.value || null;
      document.execCommand(cmd, false, val);
      updateState();
    });
  });

  // Дропдаун стилей (обычный текст / заголовки)
  const formatSelect = toolbar.querySelector('.rich-format-select');
  if (formatSelect) {
    formatSelect.addEventListener('mousedown', e => e.stopPropagation());
    formatSelect.addEventListener('change', (e) => {
      content.focus();
      const val = e.target.value;
      document.execCommand('formatBlock', false, val);
      updateState();
    });
  }

  // Кнопка «Вставить ссылку»
  const linkBtn = toolbar.querySelector('[data-action="link"]');
  if (linkBtn) {
    linkBtn.addEventListener('mousedown', e => e.preventDefault());
    linkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sel = window.getSelection();
      let savedRange = null;
      if (sel.rangeCount) {
        try { savedRange = sel.getRangeAt(0).cloneRange(); } catch (_) {}
      }
      const url = prompt('Введите URL ссылки:', 'https://');
      if (!url || !/^https?:\/\//i.test(url)) return;
      content.focus();
      if (savedRange) {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(savedRange);
      }
      const sel2 = window.getSelection();
      if (sel2.isCollapsed) {
        const text = prompt('Текст ссылки:', url) || url;
        document.execCommand('insertHTML', false,
          `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`);
      } else {
        document.execCommand('createLink', false, url);
      }
      updateState();
    });
  }

  // Кнопки выбора цвета → открывают кастомный пикер
  toolbar.querySelectorAll('.rich-color-btn').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const cmd = btn.dataset.cmd;
      const swatch = toolbar.querySelector(`.rich-color-swatch[data-swatch="${cmd}"]`);
      const initial = swatch?.dataset.color || '#ffb347';

      const sel = window.getSelection();
      let savedRange = null;
      if (sel.rangeCount) {
        try { savedRange = sel.getRangeAt(0).cloneRange(); } catch (_) {}
      }

      openColorPicker({
        anchorEl: btn,
        initial,
        onPick: (color) => {
          content.focus();
          if (savedRange) {
            const s = window.getSelection();
            s.removeAllRanges();
            s.addRange(savedRange);
          }
          document.execCommand(cmd, false, color);
          if (swatch) {
            swatch.style.background = color;
            swatch.dataset.color = color;
          }
          updateState();
        }
      });
    });
  });

  // Анимации текста
  toolbar.querySelectorAll('[data-anim]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', e => {
      e.preventDefault();
      applyAnimation(content, btn.dataset.anim);
    });
  });

  content.addEventListener('keyup', updateState);
  content.addEventListener('mouseup', updateState);
  content.addEventListener('focus', updateState);
  content.addEventListener('input', updatePlaceholder);
  content.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
    const html = escapeHtml(text).replace(/\r?\n/g, '<br>');
    document.execCommand('insertHTML', false, html);
    updatePlaceholder();
  });
  content.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      const k = e.key.toLowerCase();
      const map = { b: 'bold', i: 'italic', u: 'underline' };
      if (map[k]) {
        e.preventDefault();
        document.execCommand(map[k], false, null);
        updateState();
      }
    }
  });

  updatePlaceholder();

  return {
    getContent: () => content.innerHTML,
    getText: () => content.innerText,
    setContent: (html) => { content.innerHTML = html || ''; updatePlaceholder(); },
    isEmpty: () => content.textContent.trim() === '' && content.innerHTML.replace(/<br\s*\/?>/gi, '').trim() === '',
    element: content,
    focus: () => content.focus()
  };
}

function applyAnimation(content, animClass) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  let parent = range.commonAncestorContainer;
  if (parent.nodeType === 3) parent = parent.parentNode;
  if (parent && parent.classList && parent.classList.contains(animClass)) {
    parent.classList.remove(animClass);
    if (!parent.className) {
      const frag = document.createDocumentFragment();
      while (parent.firstChild) frag.appendChild(parent.firstChild);
      parent.parentNode.replaceChild(frag, parent);
    }
    return;
  }
  const span = document.createElement('span');
  span.className = animClass;
  try { range.surroundContents(span); }
  catch (_) {
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
  }
  sel.removeAllRanges();
}
