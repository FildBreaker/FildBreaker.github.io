// logo-fx.js
(function () {
  'use strict';

  const LETTER_ANIMS = [
    'logo-fx-letters-explode',
    'logo-fx-letters-wave',
    'logo-fx-letters-glitch',
    'logo-fx-letters-flip',
    'logo-fx-letters-bounce',
    'logo-fx-letters-squash',
    'logo-fx-letters-typewriter',
    'logo-fx-letters-vortex'
  ];
  const BLOCK_ANIMS = [
    'logo-fx-zoom-punch',
    'logo-fx-neon',
    'logo-fx-3d-rotate',
    'logo-fx-magnetic',
    'logo-fx-shockwave',
    'logo-fx-fire'
  ];

  let lastAnim = '';

  function pick(list) {
    let a, guard = 0;
    do {
      a = list[Math.floor(Math.random() * list.length)];
      guard++;
    } while (a === lastAnim && guard < 5);
    lastAnim = a;
    return a;
  }

  // Разбиваем текст h1 на буквы ВНУТРИ обёртки .logo-fx-text — ОДИН раз
  function splitLetters(h1) {
    if (h1.querySelector('.logo-fx-text')) return;

    const icon = h1.querySelector('i');
    let text = '';
    [...h1.childNodes].forEach(n => {
      if (n.nodeType === 3) text += n.textContent;
    });
    text = text.trim();
    if (!text) text = 'Б-31ЛЕС';

    h1.innerHTML = '';
    if (icon) h1.appendChild(icon);

    const wrapper = document.createElement('span');
    wrapper.className = 'logo-fx-text';
    [...text].forEach(ch => {
      if (ch === ' ') {
        wrapper.appendChild(document.createTextNode(' '));
      } else {
        const sp = document.createElement('span');
        sp.className = 'logo-fx-char';
        sp.textContent = ch;
        wrapper.appendChild(sp);
      }
    });
    h1.appendChild(wrapper);
  }

  function spawnParticles(el, count, palette) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const emojis = palette || ['✨','⭐','🌟','💫','🎉','⚡'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'logo-fx-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 70 + Math.random() * 70;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
      p.style.fontSize = (12 + Math.random() * 14) + 'px';
      p.style.animationDelay = (Math.random() * 0.15).toFixed(2) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1400);
    }
  }

  function playAnim(h1, animClass) {
    [...LETTER_ANIMS, ...BLOCK_ANIMS].forEach(c => h1.classList.remove(c));
    h1.classList.add('logo-fx-clicked');
    setTimeout(() => h1.classList.remove('logo-fx-clicked'), 220);

    if (LETTER_ANIMS.includes(animClass)) {
      const letters = h1.querySelectorAll('.logo-fx-char');
      letters.forEach((sp, i) => sp.style.setProperty('--i', i));
      void h1.offsetWidth;
      h1.classList.add(animClass);

      if (animClass === 'logo-fx-letters-explode' || animClass === 'logo-fx-letters-vortex') {
        spawnParticles(h1, 14);
      }
      if (animClass === 'logo-fx-letters-glitch') {
        spawnParticles(h1, 8, ['⚡','✖','▓','▒','░','█']);
      }
    } else {
      void h1.offsetWidth;
      h1.classList.add(animClass);

      if (animClass === 'logo-fx-shockwave') spawnParticles(h1, 18);
      if (animClass === 'logo-fx-fire') spawnParticles(h1, 12, ['🔥','✨','⚡','🌟']);
      if (animClass === 'logo-fx-neon') spawnParticles(h1, 6);
    }

    setTimeout(() => {
      h1.classList.remove(animClass);
      h1.querySelectorAll('.logo-fx-char').forEach(sp => sp.style.removeProperty('--i'));
    }, 1200);
  }

  function init() {
    const logo = document.querySelector('.logo');
    if (!logo) return;
    const h1 = logo.querySelector('h1');
    if (!h1) return;

    splitLetters(h1);
    logo.style.cursor = 'pointer';
    logo.setAttribute('title', 'Тыкни меня 👆');
    h1.classList.add('logo-fx-target');

    logo.addEventListener('click', () => {
      const useLetters = Math.random() < 0.6;
      const anim = useLetters ? pick(LETTER_ANIMS) : pick(BLOCK_ANIMS);
      playAnim(h1, anim);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
