import {
  listFichas, createFicha, deleteFicha, duplicateFicha,
  listBases, uploadBase, baseUrl,
} from '../storage.js';
import { navigate } from '../router.js';
import { signOut, getEmail, isAdmin, changePassword } from '../auth.js';

// usuario "disfrazado" de correo -> mostrar solo la parte antes de @
const userLabel = (email) => (email || '').split('@')[0];

// dimensiones naturales de una imagen dada su URL
function imageSize(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

function fechaCorta(ts) {
  return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function renderDashboard(app) {
  const admin = await isAdmin();

  app.innerHTML = `
    <div class="dashboard">
      <header class="dash-header">
        <div>
          <h1>Fichas Técnicas</h1>
          <p class="subtitle">
            ${admin ? 'Admin · ves todas las fichas' : `Hola, ${userLabel(getEmail())}`}
          </p>
        </div>
        <div class="dash-actions">
          <button class="btn btn-primary" id="btn-nueva">+ Nueva ficha</button>
          <button class="btn" id="btn-password">Cambiar contraseña</button>
          <button class="btn" id="btn-logout">Salir</button>
        </div>
      </header>
      <input type="search" id="buscar" class="search" placeholder="Buscar ficha…" />
      <div class="grid" id="grid"></div>
      <p class="empty hidden" id="empty">Aún no hay fichas. Crea la primera con “+ Nueva ficha”.</p>
    </div>

    <dialog id="modal-password" class="modal">
      <form method="dialog" id="form-password">
        <h2>Cambiar contraseña</h2>
        <label>
          Nueva contraseña
          <input type="password" id="pwd-nueva" minlength="6" autocomplete="new-password" required />
        </label>
        <label>
          Repite la contraseña
          <input type="password" id="pwd-repite" minlength="6" autocomplete="new-password" required />
        </label>
        <p class="login-error hidden" id="pwd-msg"></p>
        <div class="modal-actions">
          <button type="button" class="btn" id="pwd-cancelar">Cancelar</button>
          <button type="submit" class="btn btn-primary" id="pwd-guardar">Guardar</button>
        </div>
      </form>
    </dialog>

    <dialog id="modal-nueva" class="modal modal-wide">
      <form method="dialog" id="form-nueva">
        <h2>Nueva ficha</h2>
        <label>
          Nombre de la ficha
          <input type="text" id="nueva-nombre" placeholder="Ej: FORCE HIDROFUGADO — Cliente X" required />
        </label>
        <p class="field-label">Elige una base gráfica</p>
        <div class="bases-grid" id="bases-grid"></div>
        <label class="upload-base">
          ⬆ Subir una base nueva al banco
          <input type="file" id="nueva-base-file" accept="image/png,image/jpeg,image/webp" />
        </label>
        <p class="login-error hidden" id="nueva-msg"></p>
        <div class="modal-actions">
          <button type="button" class="btn" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn-primary" id="btn-crear" disabled>Crear y abrir</button>
        </div>
      </form>
    </dialog>
  `;

  const grid = app.querySelector('#grid');
  const empty = app.querySelector('#empty');
  const buscar = app.querySelector('#buscar');
  const modal = app.querySelector('#modal-nueva');
  const basesGrid = app.querySelector('#bases-grid');
  const msg = app.querySelector('#nueva-msg');
  const btnCrear = app.querySelector('#btn-crear');

  let fichas = [];
  let selectedBase = null; // { path, url }

  try {
    fichas = await listFichas();
  } catch (err) {
    empty.textContent = `No se pudieron cargar las fichas: ${err.message}`;
    empty.classList.remove('hidden');
  }

  function pintar() {
    const q = buscar.value.trim().toLowerCase();
    const visibles = fichas.filter((f) => f.name.toLowerCase().includes(q));
    empty.classList.toggle('hidden', visibles.length > 0);
    grid.innerHTML = visibles
      .map(
        (f) => `
        <article class="card" data-id="${f.id}">
          <div class="card-thumb">
            ${f.thumbnail ? `<img src="${f.thumbnail}" alt="" />` : '<span class="thumb-placeholder">Sin vista previa</span>'}
          </div>
          <div class="card-body">
            <h3>${f.name}</h3>
            <p>Editado: ${fechaCorta(f.updatedAt)}</p>
          </div>
          <div class="card-actions">
            <button class="btn btn-small" data-action="abrir">Abrir</button>
            <button class="btn btn-small" data-action="duplicar">Duplicar</button>
            <button class="btn btn-small btn-danger" data-action="eliminar">Eliminar</button>
          </div>
        </article>`
      )
      .join('');
  }

  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    const card = e.target.closest('.card');
    if (!card) return;
    const id = card.dataset.id;
    const action = btn?.dataset.action;

    if (action === 'eliminar') {
      const ficha = fichas.find((f) => f.id === id);
      if (confirm(`¿Eliminar "${ficha.name}"? Esto no se puede deshacer.`)) {
        await deleteFicha(id);
        fichas = await listFichas();
        pintar();
      }
    } else if (action === 'duplicar') {
      await duplicateFicha(id);
      fichas = await listFichas();
      pintar();
    } else {
      navigate(`/editor/${id}`);
    }
  });

  buscar.addEventListener('input', pintar);

  app.querySelector('#btn-logout').addEventListener('click', async () => {
    await signOut();
    navigate('/login');
  });

  /* ---------- cambiar contraseña ---------- */
  const modalPwd = app.querySelector('#modal-password');
  const pwdMsg = app.querySelector('#pwd-msg');
  app.querySelector('#btn-password').addEventListener('click', () => {
    app.querySelector('#form-password').reset();
    pwdMsg.classList.add('hidden');
    modalPwd.showModal();
  });
  app.querySelector('#pwd-cancelar').addEventListener('click', () => modalPwd.close());
  app.querySelector('#form-password').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nueva = app.querySelector('#pwd-nueva').value;
    const repite = app.querySelector('#pwd-repite').value;
    pwdMsg.classList.add('hidden');
    if (nueva !== repite) {
      pwdMsg.textContent = 'Las contraseñas no coinciden.';
      pwdMsg.classList.remove('hidden', 'login-ok');
      pwdMsg.classList.add('login-error');
      return;
    }
    const btn = app.querySelector('#pwd-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    try {
      await changePassword(nueva);
      pwdMsg.textContent = '✅ ¡Contraseña actualizada!';
      pwdMsg.classList.remove('hidden', 'login-error');
      pwdMsg.classList.add('login-ok');
      setTimeout(() => modalPwd.close(), 1400);
    } catch (err) {
      pwdMsg.textContent = `No se pudo cambiar: ${err.message}`;
      pwdMsg.classList.remove('hidden', 'login-ok');
      pwdMsg.classList.add('login-error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  });

  /* ---------- modal nueva ficha + banco de bases ---------- */

  function renderBases(bases) {
    basesGrid.innerHTML = bases.length
      ? bases
          .map(
            (b) => `<button type="button" class="base-thumb" data-path="${b.path}">
              <img src="${b.url}" alt="" loading="lazy" />
            </button>`
          )
          .join('')
      : '<p class="bases-empty">Aún no hay bases. Sube una abajo ⬇</p>';
  }

  function selectBase(path) {
    selectedBase = path ? { path, url: baseUrl(path) } : null;
    basesGrid.querySelectorAll('.base-thumb').forEach((el) =>
      el.classList.toggle('selected', el.dataset.path === path)
    );
    btnCrear.disabled = !selectedBase;
  }

  basesGrid.addEventListener('click', (e) => {
    const thumb = e.target.closest('.base-thumb');
    if (thumb) selectBase(thumb.dataset.path);
  });

  app.querySelector('#btn-nueva').addEventListener('click', async () => {
    selectedBase = null;
    btnCrear.disabled = true;
    msg.classList.add('hidden');
    basesGrid.innerHTML = '<p class="bases-empty">Cargando bases…</p>';
    modal.showModal();
    try {
      renderBases(await listBases());
    } catch (err) {
      basesGrid.innerHTML = `<p class="bases-empty">Error al cargar bases: ${err.message}</p>`;
    }
  });

  app.querySelector('#btn-cancelar').addEventListener('click', () => modal.close());

  app.querySelector('#nueva-base-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    msg.classList.add('hidden');
    try {
      const { path } = await uploadBase(file);
      renderBases(await listBases());
      selectBase(path);
    } catch (err) {
      msg.textContent = `No se pudo subir la base: ${err.message}`;
      msg.classList.remove('hidden');
    }
  });

  app.querySelector('#form-nueva').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = app.querySelector('#nueva-nombre').value.trim();
    if (!name || !selectedBase) return;
    btnCrear.disabled = true;
    btnCrear.textContent = 'Creando…';
    try {
      const { width, height } = await imageSize(selectedBase.url);
      const ficha = await createFicha({ name, backgroundPath: selectedBase.path, width, height });
      modal.close();
      navigate(`/editor/${ficha.id}`);
    } catch (err) {
      msg.textContent = `No se pudo crear la ficha: ${err.message}`;
      msg.classList.remove('hidden');
      btnCrear.disabled = false;
      btnCrear.textContent = 'Crear y abrir';
    }
  });

  pintar();
  return null;
}
