// logo-fx.js
(function () {
  'use strict';

  const ANIMS = [
    'logo-fx-zoom-punch',
    'logo-fx-neon',
    'logo-fx-3d-rotate',
    'logo-fx-magnetic',
    'logo-fx-shockwave',
    'logo-fx-fire'
  ];

  let lastAnim = '';

  function pick() {
    let a, guard = 0;
    do {
      a = ANIMS[Math.floor(Math.random() * ANIMS.length)];
      guard++;
    } while (a === lastAnim && guard < 5);
    lastAnim = a;
    return a;
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

  function playAnim(logo, animClass) {
    ANIMS.forEach(c => logo.classList.remove(c));
    void logo.offsetWidth;
    logo.classList.add(animClass);

    if (animClass === 'logo-fx-shockwave') spawnParticles(logo, 18);
    if (animClass === 'logo-fx-fire') spawnParticles(logo, 12, ['🔥','✨','⚡','🌟']);
    if (animClass === 'logo-fx-neon') spawnParticles(logo, 6);

    setTimeout(() => logo.classList.remove(animClass), 1200);
  }

  function init() {
    const logo = document.querySelector('.logo');
    if (!logo) return;
    logo.style.cursor = 'pointer';
    logo.setAttribute('title', 'Тыкни меня 👆');
    logo.classList.add('logo-fx-target');

    logo.addEventListener('click', () => {
      playAnim(logo, pick());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
