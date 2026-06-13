// Elementos de ficha: burbujas, flechas, textos y tablas predefinidos.
import { Textbox, Line, Control, FabricObject, util, classRegistry } from 'fabric';

export const COLORS = {
  amarillo: '#FFD400',
  negro: '#111111',
  azul: '#2D9CDB',
  blanco: '#ffffff',
};

/* ---------- Burbuja amarilla (texto con fondo redondeado) ---------- */

export class Bubble extends Textbox {
  static type = 'bubble';

  constructor(text, options = {}) {
    super(text, {
      bubbleFill: COLORS.amarillo,
      bubblePadding: 14,
      bubbleRadius: 10,
      ...options,
    });
    // que el borde de selección abarque el fondo amarillo
    this.padding = this.bubblePadding;
  }

  _render(ctx) {
    const pad = this.bubblePadding;
    const w = this.width + pad * 2;
    const h = this.height + pad * 2;
    ctx.save();
    ctx.fillStyle = this.bubbleFill;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, this.bubbleRadius);
    ctx.fill();
    ctx.restore();
    super._render(ctx);
  }

  toObject(props = []) {
    return super.toObject(['bubbleFill', 'bubblePadding', 'bubbleRadius', ...props]);
  }
}
classRegistry.setClass(Bubble);

/* ---------- Flecha punteada con extremos arrastrables ---------- */

// Reescribe x1..y2 como coordenadas absolutas actuales (tras mover la línea,
// left/top cambian pero x1..y2 quedan viejos).
export function syncArrowCoords(line) {
  const p = line.calcLinePoints();
  const m = line.calcTransformMatrix();
  const p1 = util.transformPoint({ x: p.x1, y: p.y1 }, m);
  const p2 = util.transformPoint({ x: p.x2, y: p.y2 }, m);
  line.set({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  line.setCoords();
}

function endpointControl(end) {
  return new Control({
    cursorStyle: 'crosshair',
    actionName: 'moveEndpoint',
    positionHandler(dim, finalMatrix, line) {
      const p = line.calcLinePoints();
      const pt = end === 1 ? { x: p.x1, y: p.y1 } : { x: p.x2, y: p.y2 };
      return util.transformPoint(
        pt,
        util.multiplyTransformMatrices(line.canvas.viewportTransform, line.calcTransformMatrix())
      );
    },
    actionHandler(eventData, transform, x, y) {
      const line = transform.target;
      syncArrowCoords(line);
      line.set(end === 1 ? { x1: x, y1: y } : { x2: x, y2: y });
      line.setCoords();
      return true;
    },
    render(ctx, left, top) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(left, top, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  });
}

export class Arrow extends Line {
  static type = 'arrow';

  constructor(points, options = {}) {
    super(points, {
      stroke: COLORS.amarillo,
      strokeWidth: 11,
      strokeDashArray: [22, 16],
      strokeLineCap: 'round',
      dotRadius: 16,
      hasBorders: false,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      ...options,
    });
    this.controls = { p1: endpointControl(1), p2: endpointControl(2) };
  }

  _render(ctx) {
    super._render(ctx);
    // punto sólido en el extremo que apunta al detalle
    const p = this.calcLinePoints();
    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle = this.stroke;
    ctx.beginPath();
    ctx.arc(p.x2, p.y2, this.dotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  toObject(props = []) {
    return super.toObject(['dotRadius', ...props]);
  }
}
classRegistry.setClass(Arrow);

/* ---------- Tabla de especificaciones ---------- */

// canvas auxiliar solo para medir y envolver texto
const _measureCtx = document.createElement('canvas').getContext('2d');

function wrapText(text, maxWidth, font) {
  _measureCtx.font = font;
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && _measureCtx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

const TABLE_DEFAULTS = {
  fill: '#ffffff',
  colWidth: 235,
  padding: 9,
  minRowHeight: 38,
  labelSize: 18,
  descSize: 12.5,
  borderColor: '#111111',
  borderWidth: 1.6,
  labelColor: '#111111',
  descColor: '#333333',
};

export class FichaTable extends FabricObject {
  static type = 'fichatable';

  constructor(options = {}) {
    const { type, ...rest } = options; // 'type' lo fija la clase; pasarlo dispara un warning
    super({ ...TABLE_DEFAULTS, ...rest, objectCaching: false });
    this.rows = options.rows
      ? JSON.parse(JSON.stringify(options.rows))
      : [
          [{ label: 'Fabricación', desc: 'Detalle' }, { label: 'Montaje', desc: 'Detalle' }],
          [{ label: 'Material', desc: 'Detalle' }, { label: 'Peso', desc: 'Detalle' }],
        ];
    this._computeLayout();
  }

  get cols() {
    return this.rows[0]?.length || 1;
  }

  _computeLayout() {
    const innerW = this.colWidth - this.padding * 2;
    const labelFont = `700 ${this.labelSize}px Poppins`;
    const descFont = `400 ${this.descSize}px Poppins`;
    const labelLineH = this.labelSize * 1.15;
    const descLineH = this.descSize * 1.3;

    this._layout = this.rows.map((row) => {
      const cells = row.map((cell) => {
        const labelLines = cell.label ? wrapText(cell.label, innerW, labelFont) : [];
        const descLines = cell.desc ? wrapText(cell.desc, innerW, descFont) : [];
        const h =
          this.padding * 2 +
          labelLines.length * labelLineH +
          (descLines.length ? descLines.length * descLineH + 3 : 0);
        return { labelLines, descLines, h };
      });
      const rowHeight = Math.max(this.minRowHeight, ...cells.map((c) => c.h));
      return { cells, rowHeight };
    });

    const width = this.cols * this.colWidth;
    const height = this._layout.reduce((sum, r) => sum + r.rowHeight, 0);
    this.set({ width, height });
    this.dirty = true;
  }

  _render(ctx) {
    if (!this._layout) this._computeLayout();
    const w = this.width;
    const h = this.height;
    const labelFont = `700 ${this.labelSize}px Poppins`;
    const descFont = `400 ${this.descSize}px Poppins`;
    const labelLineH = this.labelSize * 1.15;
    const descLineH = this.descSize * 1.3;

    ctx.save();
    ctx.translate(-w / 2, -h / 2);

    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.textBaseline = 'top';
    let y = 0;
    for (const row of this._layout) {
      let x = 0;
      for (let ci = 0; ci < this.cols; ci++) {
        const cell = row.cells[ci];
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.strokeRect(x, y, this.colWidth, row.rowHeight);

        let ty = y + this.padding;
        ctx.fillStyle = this.labelColor;
        ctx.font = labelFont;
        for (const line of cell.labelLines) {
          ctx.fillText(line, x + this.padding, ty);
          ty += labelLineH;
        }
        ty += cell.descLines.length ? 3 : 0;
        ctx.fillStyle = this.descColor;
        ctx.font = descFont;
        for (const line of cell.descLines) {
          ctx.fillText(line, x + this.padding, ty);
          ty += descLineH;
        }
        x += this.colWidth;
      }
      y += row.rowHeight;
    }
    ctx.restore();
  }

  // localX/localY relativos a la esquina superior izquierda de la tabla
  getCellAt(localX, localY) {
    if (localX < 0 || localY < 0 || localX > this.width || localY > this.height) return null;
    const colIndex = Math.min(this.cols - 1, Math.floor(localX / this.colWidth));
    let y = 0;
    for (let r = 0; r < this._layout.length; r++) {
      const rh = this._layout[r].rowHeight;
      if (localY < y + rh) {
        return { rowIndex: r, colIndex, cellX: colIndex * this.colWidth, cellY: y };
      }
      y += rh;
    }
    return null;
  }

  toObject(props = []) {
    return super.toObject([
      'rows', 'colWidth', 'padding', 'minRowHeight', 'labelSize', 'descSize',
      'borderColor', 'borderWidth', 'labelColor', 'descColor', ...props,
    ]);
  }

  static fromObject(object) {
    return Promise.resolve(new FichaTable(object));
  }
}
classRegistry.setClass(FichaTable);

/* ---------- Fábricas para la botonera ---------- */

// posiciones en cascada para que lo nuevo no caiga siempre en el mismo punto.
// Usa las dimensiones reales del lienzo (canvas.width está afectado por el zoom).
let spawnCount = 0;
function spawnPos(canvas, w = 760) {
  const zoom = canvas.getZoom() || 1;
  const sceneW = canvas.width / zoom;
  const sceneH = canvas.height / zoom;
  const offset = (spawnCount++ % 6) * 50;
  return {
    left: sceneW / 2 - w / 2 + offset,
    top: sceneH / 3 + offset,
  };
}

function place(canvas, obj) {
  canvas.add(obj);
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();
  return obj;
}

export function addModelo(canvas) {
  const t = new Textbox('NUEVO MODELO', {
    ...spawnPos(canvas, 1700),
    width: 1700,
    fontFamily: 'Archivo Black',
    fontSize: 150,
    fill: COLORS.negro,
    lineHeight: 0.95,
  });
  return place(canvas, t);
}

export function addTitulo(canvas) {
  const t = new Textbox('TÍTULO', {
    ...spawnPos(canvas, 600),
    width: 600,
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 52,
    fill: COLORS.negro,
  });
  return place(canvas, t);
}

export function addDescripcion(canvas) {
  const t = new Textbox('Escribe aquí la descripción.', {
    ...spawnPos(canvas, 760),
    width: 760,
    fontFamily: 'Poppins',
    fontSize: 38,
    fill: COLORS.negro,
  });
  return place(canvas, t);
}

export function addBurbuja(canvas) {
  const title = 'TÍTULO';
  const desc = 'Descripción del componente.';
  const b = new Bubble(`${title}\n${desc}`, {
    ...spawnPos(canvas, 760),
    width: 760,
    fontFamily: 'Poppins',
    fontSize: 38,
    fill: COLORS.negro,
    bubblePadding: 28,
    bubbleRadius: 34,
  });
  b.setSelectionStyles({ fontWeight: '700', fontSize: 52 }, 0, title.length);
  return place(canvas, b);
}

export function addFlecha(canvas) {
  const { left, top } = spawnPos(canvas, 300);
  const a = new Arrow([left, top + 220, left + 300, top]);
  return place(canvas, a);
}

export function addTabla(canvas) {
  const t = new FichaTable({ ...spawnPos(canvas) });
  return place(canvas, t);
}

// Agrega una fila a la tabla seleccionada (o a la última tabla del canvas).
export function addFila(canvas) {
  let table = canvas.getActiveObject();
  if (!table || table.type !== 'fichatable') {
    const tables = canvas.getObjects().filter((o) => o.type === 'fichatable');
    table = tables[tables.length - 1];
  }
  if (!table) return null;
  const row = Array.from({ length: table.cols }, () => ({ label: 'Característica', desc: 'Detalle' }));
  table.rows.push(row);
  table._computeLayout();
  table.setCoords();
  canvas.setActiveObject(table);
  canvas.requestRenderAll();
  canvas.fire('object:modified', { target: table });
  return table;
}

// Cambia el tamaño de letra de un texto escalando también los estilos
// por-carácter (p. ej. el título de la burbuja, que tiene fontSize propio),
// para que todo el texto crezca/encoja en proporción.
export function setFontSize(obj, newSize) {
  const ratio = newSize / obj.fontSize;
  const styles = obj.styles;
  if (styles) {
    for (const line of Object.values(styles)) {
      for (const charStyle of Object.values(line)) {
        if (charStyle.fontSize) charStyle.fontSize *= ratio;
      }
    }
  }
  obj.set('fontSize', newSize);
}
