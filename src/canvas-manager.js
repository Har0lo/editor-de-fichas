// Wrapper de Fabric.js: fondo, zoom, historial undo/redo y auto-guardado.
import { Canvas, FabricImage } from 'fabric';

const MAX_HISTORY = 50;

export class CanvasManager {
  constructor(canvasEl, { width, height, onDirty }) {
    this.baseWidth = width;
    this.baseHeight = height;
    this.onDirty = onDirty;
    this.zoom = 1;
    this.history = [];
    this.historyIndex = -1;
    this.suspendHistory = false;

    this.canvas = new Canvas(canvasEl, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      targetFindTolerance: 8,
    });

    const markDirty = () => {
      if (this.suspendHistory) return;
      this.pushHistoryDebounced();
      this.onDirty?.();
    };
    this.canvas.on('object:added', markDirty);
    this.canvas.on('object:removed', markDirty);
    this.canvas.on('object:modified', markDirty);
    this.canvas.on('text:changed', markDirty);

    this._historyTimer = null;
  }

  // Carga el fondo desde una URL (imagen base en Storage). crossOrigin evita que el
  // canvas quede "tainted" y rompa la exportación a PDF.
  async setBackground(url) {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    img.set({
      scaleX: this.baseWidth / img.width,
      scaleY: this.baseHeight / img.height,
    });
    this.canvas.backgroundImage = img;
    this.canvas.requestRenderAll();
  }

  /* ---------- estado ---------- */

  getState() {
    // El fondo se guarda aparte (como blob en la ficha), nunca dentro del JSON:
    // serializarlo como blob: URL produce un enlace muerto que rompe la recarga.
    const obj = this.canvas.toObject();
    delete obj.backgroundImage;
    return obj;
  }

  async loadState(state) {
    this.suspendHistory = true;
    const bg = this.canvas.backgroundImage; // preservar el fondo actual (blob)
    // descartar cualquier fondo serializado en estados viejos (enlaces blob: muertos)
    const clean = { ...state };
    delete clean.backgroundImage;
    try {
      await this.canvas.loadFromJSON(clean);
    } finally {
      this.canvas.backgroundImage = bg;
      this.canvas.backgroundColor = '#ffffff';
      this.canvas.requestRenderAll();
      this.suspendHistory = false;
    }
  }

  /* ---------- historial ---------- */

  pushHistoryDebounced() {
    clearTimeout(this._historyTimer);
    this._historyTimer = setTimeout(() => this.pushHistory(), 300);
  }

  pushHistory() {
    const snapshot = JSON.stringify(this.getState());
    if (this.history[this.historyIndex] === snapshot) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snapshot);
    if (this.history.length > MAX_HISTORY) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  async undo() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    await this.loadState(JSON.parse(this.history[this.historyIndex]));
    this.onDirty?.();
  }

  async redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    await this.loadState(JSON.parse(this.history[this.historyIndex]));
    this.onDirty?.();
  }

  /* ---------- zoom ---------- */

  setZoom(zoom) {
    this.zoom = Math.min(3, Math.max(0.2, zoom));
    this.canvas.setDimensions({
      width: this.baseWidth * this.zoom,
      height: this.baseHeight * this.zoom,
    });
    this.canvas.setViewportTransform([this.zoom, 0, 0, this.zoom, 0, 0]);
  }

  fitTo(containerWidth, containerHeight) {
    const scale = Math.min(
      containerWidth / this.baseWidth,
      containerHeight / this.baseHeight,
      1
    );
    this.setZoom(scale);
  }

  /* ---------- utilidades ---------- */

  deleteSelected() {
    const objects = this.canvas.getActiveObjects();
    if (!objects.length) return;
    this.canvas.discardActiveObject();
    objects.forEach((o) => this.canvas.remove(o));
    this.canvas.requestRenderAll();
  }

  // exporta a resolución real (ignorando el zoom de pantalla)
  toDataURL({ multiplier = 1, format = 'jpeg', quality = 0.92 } = {}) {
    const prevVpt = this.canvas.viewportTransform;
    this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    const url = this.canvas.toDataURL({
      format,
      quality,
      multiplier,
      left: 0,
      top: 0,
      width: this.baseWidth,
      height: this.baseHeight,
    });
    this.canvas.viewportTransform = prevVpt;
    this.canvas.requestRenderAll();
    return url;
  }

  dispose() {
    clearTimeout(this._historyTimer);
    this.canvas.dispose();
  }
}
