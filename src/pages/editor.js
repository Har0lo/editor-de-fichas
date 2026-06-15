import { getFicha, saveFicha, uploadBase, baseUrl } from '../storage.js';
import { navigate } from '../router.js';
import { util, Textbox } from 'fabric';
import { CanvasManager } from '../canvas-manager.js';
import { exportPDF } from '../pdf-export.js';
import {
  COLORS, addModelo, addTitulo, addDescripcion, addBurbuja, addFlecha,
  addTabla, addFila, setFontSize, Bubble, Arrow, FichaTable,
} from '../elements.js';

export async function renderEditor(app, fichaId) {
  const ficha = await getFicha(fichaId);
  if (!ficha) {
    navigate('/');
    return null;
  }

  app.innerHTML = `
    <div class="editor">
      <header class="toolbar">
        <button class="btn" id="btn-volver" title="Volver al inicio">← Volver</button>
        <span class="ficha-name" title="${ficha.name}">${ficha.name}</span>
        <span class="divider"></span>
        <button class="btn btn-add" id="btn-modelo">＋ Modelo</button>
        <button class="btn btn-add" id="btn-titulo">＋ Título</button>
        <button class="btn btn-add" id="btn-desc">＋ Descripción</button>
        <button class="btn btn-add" id="btn-burbuja">🟡 Burbuja</button>
        <button class="btn btn-add" id="btn-flecha">↘ Flecha</button>
        <button class="btn btn-add" id="btn-tabla">▦ Tabla</button>
        <button class="btn btn-add" id="btn-fila">＋ Fila</button>
        <span class="divider"></span>
        <button class="btn" id="btn-undo" title="Deshacer (Ctrl+Z)">↩</button>
        <button class="btn" id="btn-redo" title="Rehacer (Ctrl+Y)">↪</button>
        <button class="btn" id="btn-zoom-out" title="Alejar">−</button>
        <button class="btn" id="btn-zoom-in" title="Acercar">＋</button>
        <span class="divider"></span>
        <label class="btn" id="btn-fondo" title="Subir o cambiar la imagen base">
          🖼 Base<input type="file" id="input-fondo" accept="image/png,image/jpeg,image/webp" hidden />
        </label>
        <span class="spacer"></span>
        <span class="save-status" id="save-status">Guardado ✓</span>
        <button class="btn" id="btn-guardar" title="Guardar (Ctrl+S)">💾 Guardar</button>
        <button class="btn btn-pdf" id="btn-pdf">PDF</button>
      </header>

      <div class="canvas-area" id="canvas-area">
        <div class="canvas-holder"><canvas id="lienzo"></canvas></div>
      </div>

      <div class="props hidden" id="props">
        <label class="props-item">Tamaño
          <input type="number" id="prop-size" min="8" max="400" step="1" />
        </label>
        <button class="btn btn-small" id="prop-bold"><b>N</b></button>
        <span class="swatches">
          ${Object.entries(COLORS)
            .map(([k, v]) => `<button class="swatch" data-color="${v}" title="${k}" style="background:${v}"></button>`)
            .join('')}
        </span>
        <button class="btn btn-small btn-danger" id="prop-delete">🗑 Eliminar</button>
      </div>
    </div>
  `;

  const area = app.querySelector('#canvas-area');
  const status = app.querySelector('#save-status');
  const props = app.querySelector('#props');
  const propSize = app.querySelector('#prop-size');

  let dirty = false;
  let saveTimer = null;

  const manager = new CanvasManager(app.querySelector('#lienzo'), {
    width: ficha.width,
    height: ficha.height,
    onDirty: () => {
      dirty = true;
      status.textContent = 'Sin guardar…';
      clearTimeout(saveTimer);
      saveTimer = setTimeout(guardar, 2500);
    },
  });
  const canvas = manager.canvas;
  if (import.meta.env.DEV) {
    window.__canvas = canvas;
    window.__build = { canvas, manager, COLORS, Bubble, Arrow, FichaTable, Textbox, save: () => guardar() };
  }

  try {
    if (ficha.backgroundPath) await manager.setBackground(baseUrl(ficha.backgroundPath));
    if (ficha.canvasState) await manager.loadState(ficha.canvasState);
  } catch (err) {
    console.error('Error al cargar la ficha:', err);
  }
  manager.pushHistory(); // estado inicial como base del historial
  manager.fitTo(area.clientWidth - 48, area.clientHeight - 48);

  async function guardar() {
    clearTimeout(saveTimer);
    status.textContent = 'Guardando…';
    ficha.canvasState = manager.getState();
    ficha.thumbnail = manager.toDataURL({ multiplier: 360 / ficha.width, quality: 0.7 });
    await saveFicha(ficha);
    dirty = false;
    status.textContent = 'Guardado ✓';
  }

  /* ---------- botonera ---------- */
  const on = (sel, fn) => app.querySelector(sel).addEventListener('click', fn);
  on('#btn-volver', async () => {
    if (dirty) await guardar();
    navigate('/');
  });
  on('#btn-modelo', () => addModelo(canvas));
  on('#btn-titulo', () => addTitulo(canvas));
  on('#btn-desc', () => addDescripcion(canvas));
  on('#btn-burbuja', () => addBurbuja(canvas));
  on('#btn-flecha', () => addFlecha(canvas));
  on('#btn-tabla', () => addTabla(canvas));
  on('#btn-fila', () => addFila(canvas));
  on('#btn-undo', () => manager.undo());
  on('#btn-redo', () => manager.redo());
  on('#btn-zoom-in', () => manager.setZoom(manager.zoom * 1.2));
  on('#btn-zoom-out', () => manager.setZoom(manager.zoom / 1.2));
  on('#btn-guardar', guardar);
  on('#btn-pdf', async () => {
    if (dirty) await guardar();
    exportPDF(manager, ficha.name);
  });

  app.querySelector('#input-fondo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    status.textContent = 'Subiendo base…';
    const bmp = await createImageBitmap(file);
    ficha.width = bmp.width;
    ficha.height = bmp.height;
    bmp.close();
    const { path } = await uploadBase(file); // sube al banco compartido
    ficha.backgroundPath = path;
    await guardar();
    // re-renderizar el editor con las dimensiones de la nueva base
    const next = await renderEditor(app, fichaId);
    cleanupFns.length = 0;
    if (next) cleanupFns.push(next);
  });

  /* ---------- panel de propiedades ---------- */
  function refreshProps() {
    const obj = canvas.getActiveObject();
    if (!obj) {
      props.classList.add('hidden');
      return;
    }
    props.classList.remove('hidden');
    const isText = 'fontSize' in obj;
    propSize.parentElement.style.display = isText ? '' : 'none';
    app.querySelector('#prop-bold').style.display = isText ? '' : 'none';
    if (isText) propSize.value = Math.round(obj.fontSize);
  }
  canvas.on('selection:created', refreshProps);
  canvas.on('selection:updated', refreshProps);
  canvas.on('selection:cleared', refreshProps);

  propSize.addEventListener('change', () => {
    const obj = canvas.getActiveObject();
    if (!obj || !('fontSize' in obj)) return;
    setFontSize(obj, Number(propSize.value));
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: obj });
  });

  on('#prop-bold', () => {
    const obj = canvas.getActiveObject();
    if (!obj || !('fontWeight' in obj)) return;
    obj.set('fontWeight', obj.fontWeight === '700' || obj.fontWeight === 'bold' ? '400' : '700');
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: obj });
  });

  props.querySelectorAll('.swatch').forEach((sw) =>
    sw.addEventListener('click', () => {
      const obj = canvas.getActiveObject();
      if (!obj) return;
      const color = sw.dataset.color;
      if (obj.type === 'arrow') obj.set('stroke', color);
      else if (obj.type === 'bubble') obj.set('bubbleFill', color);
      else obj.set('fill', color);
      canvas.requestRenderAll();
      canvas.fire('object:modified', { target: obj });
    })
  );

  on('#prop-delete', () => manager.deleteSelected());

  /* ---------- editor de celda de tabla (doble click) ---------- */
  let cellEditorEl = null;
  function closeCellEditor() {
    cellEditorEl?.remove();
    cellEditorEl = null;
  }

  function openCellEditor(table, r, c, screenX, screenY) {
    closeCellEditor();
    const cell = table.rows[r][c];
    const el = document.createElement('div');
    el.className = 'cell-editor';
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.innerHTML = `
      <input class="ce-label" placeholder="Etiqueta" />
      <textarea class="ce-desc" placeholder="Descripción" rows="3"></textarea>
      <div class="ce-actions">
        <button type="button" class="btn btn-small" data-ce="cancel">Cancelar</button>
        <button type="button" class="btn btn-small btn-primary" data-ce="save">Guardar</button>
      </div>`;
    document.body.appendChild(el);
    cellEditorEl = el;

    const labelInput = el.querySelector('.ce-label');
    const descInput = el.querySelector('.ce-desc');
    labelInput.value = cell.label || '';
    descInput.value = cell.desc || '';
    labelInput.focus();
    labelInput.select();

    const save = () => {
      cell.label = labelInput.value;
      cell.desc = descInput.value;
      table._computeLayout();
      table.setCoords();
      canvas.requestRenderAll();
      canvas.fire('object:modified', { target: table });
      closeCellEditor();
    };
    el.querySelector('[data-ce="save"]').addEventListener('click', save);
    el.querySelector('[data-ce="cancel"]').addEventListener('click', closeCellEditor);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCellEditor();
      else if (e.key === 'Enter' && e.ctrlKey) save();
    });
  }

  canvas.on('mouse:dblclick', (opt) => {
    const t = opt.target;
    if (!t || t.type !== 'fichatable') return;
    const pointer = canvas.getScenePoint(opt.e);
    const inv = util.invertTransform(t.calcTransformMatrix());
    const p = util.transformPoint(pointer, inv);
    const cell = t.getCellAt(p.x + t.width / 2, p.y + t.height / 2);
    if (!cell) return;
    const m = util.multiplyTransformMatrices(canvas.viewportTransform, t.calcTransformMatrix());
    const tl = util.transformPoint({ x: cell.cellX - t.width / 2, y: cell.cellY - t.height / 2 }, m);
    const rect = canvas.upperCanvasEl.getBoundingClientRect();
    openCellEditor(t, cell.rowIndex, cell.colIndex, rect.left + tl.x, rect.top + tl.y);
  });

  /* ---------- teclado y resize ---------- */
  function onKeyDown(e) {
    const editingText = canvas.getActiveObject()?.isEditing;
    const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (e.key === 'Delete' && !editingText && !inInput) {
      manager.deleteSelected();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      if (!editingText) {
        e.preventDefault();
        manager.undo();
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      if (!editingText) {
        e.preventDefault();
        manager.redo();
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      guardar();
    }
  }
  document.addEventListener('keydown', onKeyDown);

  const onResize = () => manager.fitTo(area.clientWidth - 48, area.clientHeight - 48);
  window.addEventListener('resize', onResize);

  const cleanupFns = [
    () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      clearTimeout(saveTimer);
      closeCellEditor();
      manager.dispose();
    },
  ];
  return () => cleanupFns.forEach((fn) => fn());
}
