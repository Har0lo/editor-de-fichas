import { listFichas, createFicha, deleteFicha, duplicateFicha } from '../storage.js';
import { navigate } from '../router.js';
import { seedDemoFicha } from '../seed.js';

const DEFAULT_W = 1240;
const DEFAULT_H = 950;

function fechaCorta(ts) {
  return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function renderDashboard(app) {
  app.innerHTML = `
    <div class="dashboard">
      <header class="dash-header">
        <div>
          <h1>Fichas Técnicas</h1>
          <p class="subtitle">Tus fichas, listas para editar y exportar</p>
        </div>
        <button class="btn btn-primary" id="btn-nueva">+ Nueva ficha</button>
      </header>
      <input type="search" id="buscar" class="search" placeholder="Buscar ficha…" />
      <div class="grid" id="grid"></div>
      <p class="empty hidden" id="empty">No hay fichas todavía. Crea la primera con “+ Nueva ficha”.</p>
    </div>

    <dialog id="modal-nueva" class="modal">
      <form method="dialog" id="form-nueva">
        <h2>Nueva ficha</h2>
        <label>
          Nombre de la ficha
          <input type="text" id="nueva-nombre" placeholder="Ej: FORCE HIDROFUGADO — Cliente X" required />
        </label>
        <label>
          Imagen base (la que te pasa diseño)
          <input type="file" id="nueva-imagen" accept="image/png,image/jpeg,image/webp" />
          <small>Opcional: si no la subes ahora, la ficha empieza en blanco.</small>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn-primary">Crear y abrir</button>
        </div>
      </form>
    </dialog>
  `;

  const grid = app.querySelector('#grid');
  const empty = app.querySelector('#empty');
  const buscar = app.querySelector('#buscar');
  const modal = app.querySelector('#modal-nueva');

  await seedDemoFicha();
  let fichas = await listFichas();

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

  app.querySelector('#btn-nueva').addEventListener('click', () => modal.showModal());
  app.querySelector('#btn-cancelar').addEventListener('click', () => modal.close());

  app.querySelector('#form-nueva').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = app.querySelector('#nueva-nombre').value.trim();
    const file = app.querySelector('#nueva-imagen').files[0] || null;
    if (!name) return;

    let width = DEFAULT_W;
    let height = DEFAULT_H;
    if (file) {
      const bmp = await createImageBitmap(file);
      width = bmp.width;
      height = bmp.height;
      bmp.close();
    }
    const ficha = await createFicha({ name, backgroundBlob: file, width, height });
    modal.close();
    navigate(`/editor/${ficha.id}`);
  });

  pintar();
  return null; // sin cleanup especial
}
