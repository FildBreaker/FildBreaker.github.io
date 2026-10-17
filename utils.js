// utils.js
import { getCurrentUser, isEditor } from './auth.js';

const TG_WORKER_URL = 'https://jolly-violet-3d1eb31les.fildbreaker.workers.dev';

export function toArray(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') {
    return Object.keys(val).sort((a, b) => Number(a) - Number(b)).map(k => val[k]);
  }
  return [];
}

export function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

export function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'flex';
}

export function setupModalGlobals() {
  document.addEventListener('click', (e) => {
    const closeEl = e.target.closest('[data-close]');
    if (closeEl) {
      const id = closeEl.dataset.close;
      if (id) closeModal(id);
    }
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modals = [...document.querySelectorAll('.modal')].filter(m => m.style.display === 'flex');
    if (modals.length) modals[modals.length - 1].style.display = 'none';
  });
}

export function setSidebar(html) { 
  document.getElementById('sidebarDynamic').innerHTML = html; 
}

export function setMain(html) { 
  document.getElementById('mainContent').innerHTML = html; 
}

export function showSkeletonMain(kind, count) {
  if (window.showSkeleton) window.showSkeleton('mainContent', count || 3, kind || 'card');
}

export function hideSkeletonMain() {
  if (window.hideSkeleton) window.hideSkeleton('mainContent');
}

export function setSidebarNavHandlers() {
  document.querySelectorAll('#sidebarDynamic [data-nav]').forEach(btn => {
    btn.onclick = () => { location.hash = '#/' + btn.dataset.nav; };
  });
}

export async function tgNotify(message) {
  const user = getCurrentUser();
  if (!user || !isEditor()) return; 

  try {
    const token = await user.getIdToken();
    await fetch(TG_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    console.warn('TG notify failed:', err);
  }
}