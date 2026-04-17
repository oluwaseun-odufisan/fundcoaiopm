/* ─────────────────────────────────────────
   FUNDCO AI FUTURE — app.js
   Config, theme, routing, animations
───────────────────────────────────────── */

const params = new URLSearchParams(window.location.search);

const futureConfig = {
  userAppUrl:      params.get('user')  || 'https://www.fundcoai.com',
  adminAppUrl:     params.get('admin') || 'https://admin.fundcoai.com',
  themeStorageKey: 'fundco-ai-theme',
};

/* ─── ELEMENT REFS ───────────────────────── */
const root         = document.documentElement;
const toggleBtn    = document.querySelector('[data-theme-toggle]');
const themeLabel   = document.querySelector('[data-theme-label]');

/* ─── THEME ──────────────────────────────── */
function applyTheme(theme) {
  const t = (theme === 'dark') ? 'dark' : 'light';
  root.setAttribute('data-theme', t);
  localStorage.setItem(futureConfig.themeStorageKey, t);
  if (toggleBtn) toggleBtn.setAttribute('aria-pressed', String(t === 'dark'));
  if (themeLabel) themeLabel.textContent = (t === 'dark') ? 'Dark' : 'Light';
}

applyTheme(localStorage.getItem(futureConfig.themeStorageKey) || 'light');

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}

/* ─── LINKS ──────────────────────────────── */
function setLinks(selector, href) {
  document.querySelectorAll(selector).forEach(el => el.setAttribute('href', href));
}
setLinks('[data-link="user"]',  futureConfig.userAppUrl);
setLinks('[data-link="admin"]', futureConfig.adminAppUrl);

/* ─── SMOOTH SCROLL ──────────────────────── */
document.querySelectorAll('[data-scroll]').forEach(el => {
  el.addEventListener('click', () => {
    const target = document.querySelector(el.getAttribute('data-scroll'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ─── COPYRIGHT YEAR ─────────────────────── */
const yearNode = document.querySelector('[data-year]');
if (yearNode) yearNode.textContent = new Date().getFullYear();

/* ─── SCROLL REVEAL ──────────────────────── */
function initReveal() {
  const revealEls = document.querySelectorAll(
    '.pillar, .ptile, .loop-step, .rm-item, .acard, .proof-card, .state-block'
  );

  const css = document.createElement('style');
  css.textContent = `
    .reveal-ready {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 500ms ease, transform 500ms ease;
    }
    .reveal-ready.revealed {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(css);

  revealEls.forEach(el => el.classList.add('reveal-ready'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // stagger siblings
        const parent = entry.target.parentElement;
        const siblings = [...parent.querySelectorAll('.reveal-ready')];
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 60, 360);
        setTimeout(() => entry.target.classList.add('revealed'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  revealEls.forEach(el => io.observe(el));
}

/* ─── NAV ACTIVE STATE ───────────────────── */
function initNavActive() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        links.forEach(l => {
          l.classList.toggle('nav-active', l.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => io.observe(s));
}

/* ─── PROGRESS BAR ANIMATE ───────────────── */
function initProgressBars() {
  const bars = document.querySelectorAll('.ptile-fill');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = el.style.width;
        el.style.width = '0%';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { el.style.width = target; });
        });
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  bars.forEach(b => io.observe(b));
}

/* ─── HERO ACCENT BAR ANIM ───────────────── */
function initHeroBar() {
  const bar = document.querySelector('.hero-accent-bar');
  if (!bar) return;
  bar.style.height = '0%';
  bar.style.transition = 'height 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { bar.style.height = '100%'; });
  });
}

/* ─── NAV ACTIVE STYLE INJECTION ─────────── */
const navStyle = document.createElement('style');
navStyle.textContent = `.nav-active { color: var(--t0) !important; }
.nav-active::after { transform: scaleX(1) !important; }`;
document.head.appendChild(navStyle);

/* ─── INIT ───────────────────────────────── */
if ('IntersectionObserver' in window) {
  initReveal();
  initNavActive();
  initProgressBars();
}
initHeroBar();