// Router SPA por hash: #/ (dashboard) y #/editor/:id
import { renderDashboard } from './pages/dashboard.js';
import { renderEditor } from './pages/editor.js';

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
  location.hash = path;
}
