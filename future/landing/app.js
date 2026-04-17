const params = new URLSearchParams(window.location.search);

const inferBaseUrl = (port) => {
  if (window.location.protocol === 'file:') {
    return `http://127.0.0.1:${port}`;
  }
  const protocol = window.location.protocol || 'http:';
  const host = window.location.hostname || '127.0.0.1';
  return `${protocol}//${host}:${port}`;
};

const futureConfig = {
  userAppUrl: params.get('user') || 'https://www.fundcoai.com',
  adminAppUrl: params.get('admin') || 'https://admin.fundcoai.com',
  themeStorageKey: 'fundco-future-theme',
};

const root = document.documentElement;
const toggleButton = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');

const setHref = (selector, href) => {
  document.querySelectorAll(selector).forEach((node) => {
    node.setAttribute('href', href);
  });
};

const applyTheme = (theme) => {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  root.setAttribute('data-theme', nextTheme);
  localStorage.setItem(futureConfig.themeStorageKey, nextTheme);
  if (toggleButton) {
    toggleButton.setAttribute('aria-pressed', String(nextTheme === 'dark'));
    toggleButton.setAttribute('title', nextTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (themeLabel) {
    themeLabel.textContent = nextTheme === 'dark' ? 'Dark' : 'Light';
  }
};

applyTheme(localStorage.getItem(futureConfig.themeStorageKey) || 'light');

if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    const currentTheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });
}

setHref('[data-link="user"]', futureConfig.userAppUrl);
setHref('[data-link="admin"]', futureConfig.adminAppUrl);

document.querySelectorAll('[data-scroll]').forEach((node) => {
  node.addEventListener('click', () => {
    const target = document.querySelector(node.getAttribute('data-scroll'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const yearNode = document.querySelector('[data-year]');
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}