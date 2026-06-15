import { signIn } from '../auth.js';
import { isConfigured } from '../supabase.js';
import { navigate } from '../router.js';

export async function renderLogin(app) {
  app.innerHTML = `
    <div class="login-wrap">
      <form class="login-card" id="login-form">
        <h1>Fichas Técnicas</h1>
        <p class="subtitle">Inicia sesión para continuar</p>
        ${
          isConfigured
            ? ''
            : '<p class="login-error">⚠️ La app aún no está conectada a la nube. Avisa al administrador.</p>'
        }
        <label>
          Correo
          <input type="email" id="login-email" autocomplete="username" required />
        </label>
        <label>
          Contraseña
          <input type="password" id="login-password" autocomplete="current-password" required />
        </label>
        <p class="login-error hidden" id="login-msg"></p>
        <button type="submit" class="btn btn-primary" id="login-btn" ${isConfigured ? '' : 'disabled'}>
          Entrar
        </button>
        <p class="login-hint">¿No tienes cuenta? Pídesela al administrador.</p>
      </form>
    </div>
  `;

  const form = app.querySelector('#login-form');
  const msg = app.querySelector('#login-msg');
  const btn = app.querySelector('#login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Entrando…';
    try {
      await signIn(
        app.querySelector('#login-email').value.trim(),
        app.querySelector('#login-password').value
      );
      navigate('/');
    } catch (err) {
      msg.textContent =
        err?.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : `No se pudo iniciar sesión: ${err?.message || err}`;
      msg.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });

  return null;
}
