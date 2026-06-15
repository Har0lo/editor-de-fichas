// Router SPA por hash: #/login, #/ (dashboard) y #/editor/:id
import { renderDashboard } from './pages/dashboard.js';
import { renderEditor } from './pages/editor.js';
import { renderLogin } from './pages/login.js';
import { getSession } from './auth.js';

let cleanup = null;

async function route() {
  const app = document.getElementById('app');
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  app.innerHTML = '';

  const hash = location.hash.replace(/^#\/?/, '');
  const [page, param] = hash.split('/');
  const loggedIn = Boolean(getSession());

  // sin sesión: solo se puede ver el login
  if (!loggedIn) {
    cleanup = await renderLogin(app);
    return;
  }
  // con sesión: el login redirige al dashboard
  if (page === 'login') {
    navigate('/');
    return;
  }

  if (page === 'editor' && param) {
    cleanup = await renderEditor(app, param);
  } else {
    cleanup = await renderDashboard(app);
  }
}

export function startRouter() {
  window.addEventListener('hashchange', route);
  route();
}

export function navigate(path) {
  if (location.hash === `#${path}`) route();
  else location.hash = path;
}
