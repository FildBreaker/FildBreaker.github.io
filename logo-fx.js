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

  let busy = false;
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

  function ensureLetters(h1) {
    if (h1.dataset.letters === '1') return h1.querySelectorAll('.logo-fx-char');
    const nodes = [...h1.childNodes];
    nodes.forEach(node => {
      if (node.nodeType !== 3) return;
      const text = node.textContent;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      [...text].forEach(ch => {
        if (ch === ' ') {
          frag.appendChild(document.createTextNode(' '));
        } else {
          const sp = document.createElement('span');
          sp.className = 'logo-fx-char';
          sp.textContent = ch;
          frag.appendChild(sp);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    h1.dataset.letters = '1';
    return h1.querySelectorAll('.logo-fx-char');
  }

  function spawnParticles(el, count, colors) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const palette = colors || ['✨','⭐','🌟','💫','🎉','⚡'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'logo-fx-particle';
      p.textContent = palette[Math.floor(Math.random() * palette.length)];
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

  function flashClass(el, cls, ms) {
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms || 900);
  }

  function playAnim(h1, animClass) {
    if (busy) return;
    busy = true;

    try {
      flashClass(h1, 'logo-fx-clicked', 250);

      if (LETTER_ANIMS.includes(animClass)) {
        const letters = ensureLetters(h1);
        LETTER_ANIMS.forEach(c => h1.classList.remove(c));
        letters.forEach(sp => sp.style.removeProperty('--i'));
        letters.forEach((sp, i) => sp.style.setProperty('--i', i));
        void h1.offsetWidth;
        h1.classList.add(animClass);

        if (animClass === 'logo-fx-letters-explode' || animClass === 'logo-fx-letters-vortex') {
          spawnParticles(h1, 14);
        }
        if (animClass === 'logo-fx-letters-glitch') {
          spawnParticles(h1, 8, ['⚡','✖','▓','▒','░','█']);
        }

        setTimeout(() => {
          h1.classList.remove(animClass);
          letters.forEach(sp => sp.style.removeProperty('--i'));
          busy = false;
        }, 1100);
      } else {
        BLOCK_ANIMS.forEach(c => h1.classList.remove(c));
        void h1.offsetWidth;
        h1.classList.add(animClass);

        if (animClass === 'logo-fx-shockwave') spawnParticles(h1, 18);
        if (animClass === 'logo-fx-fire') spawnParticles(h1, 12, ['🔥','✨','⚡','🌟']);
        if (animClass === 'logo-fx-neon') spawnParticles(h1, 6);

        setTimeout(() => {
          h1.classList.remove(animClass);
          busy = false;
        }, 1100);
      }
    } catch (err) {
      console.error('[logo-fx] error:', err);
      busy = false; // в любом случае разблокируем
    }
  }

  // Ловим клик на ВСЁМ блоке .logo — так надёжнее,
  // даже если клик пришёлся на иконку или на span-букву.
  document.addEventListener('click', (e) => {
    const logo = e.target.closest('.logo');
    if (!logo) return;
    const h1 = logo.querySelector('h1');
    if (!h1) return;
    const useLetters = Math.random() < 0.6;
    const anim = useLetters ? pick(LETTER_ANIMS) : pick(BLOCK_ANIMS);
    playAnim(h1, anim);
  });

  // Меняем курсор на pointer на всём блоке .logo
  document.addEventListener('mouseover', (e) => {
    const logo = e.target.closest('.logo');
    if (!logo || logo.dataset.logoFx === '1') return;
    logo.dataset.logoFx = '1';
    logo.style.cursor = 'pointer';
    logo.setAttribute('title', 'Тыкни меня 👆');
    const h1 = logo.querySelector('h1');
    if (h1) h1.classList.add('logo-fx-target');
  });

  // Диагностика — открой F12, кликни на лого, увидишь лог
  console.log('[logo-fx] initialized, click on logo to test');
})();
