// logo-fx.js
(function () {
  'use strict';

  const ANIMS = [
    'logo-fx-spin', 'logo-fx-bounce', 'logo-fx-shake',
    'logo-fx-rainbow', 'logo-fx-pop', 'logo-fx-flip',
    'logo-fx-wiggle', 'logo-fx-glow', 'logo-fx-drunk'
  ];

  let busy = false;
  let lastAnim = '';

  function pickAnim() {
    let a, guard = 0;
    do {
      a = ANIMS[Math.floor(Math.random() * ANIMS.length)];
      guard++;
    } while (a === lastAnim && guard < 5);
    lastAnim = a;
    return a;
  }

  function spawnParticles(el, count) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const emojis = ['✨','⭐','🌟','💫','🎉','⚡'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'logo-fx-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 55 + Math.random() * 45;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
      p.style.fontSize = (12 + Math.random() * 10) + 'px';
      p.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  }

  function playAnim(el, animClass) {
    if (busy) return;
    busy = true;
    ANIMS.forEach(c => el.classList.remove(c));
    void el.offsetWidth;
    el.classList.add(animClass);
    if (animClass === 'logo-fx-pop' || animClass === 'logo-fx-spin') spawnParticles(el, 8);
    else if (animClass === 'logo-fx-rainbow') spawnParticles(el, 12);
    setTimeout(() => {
      el.classList.remove(animClass);
      busy = false;
    }, 900);
  }

  // Делегирование: клик ловится на любом .logo h1 в любой момент
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.logo h1');
    if (!target) return;
    playAnim(target, pickAnim());
  });

  // Добавляем курсор и подсказку на все .logo h1 (в т.ч. будущие)
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('.logo h1');
    if (!target || target.dataset.logoFx === '1') return;
    target.dataset.logoFx = '1';
    target.classList.add('logo-fx-target');
    target.style.cursor = 'pointer';
    target.setAttribute('title', 'Тыкни меня 👆');
  });
})();
