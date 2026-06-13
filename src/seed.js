// Ficha de ejemplo precargada (FORCE HIDROFUGADO).
// Se construye una sola vez con los mismos elementos del editor y se guarda,
// para que aparezca en el dashboard la primera vez que se abre la app.
import { StaticCanvas, Textbox } from 'fabric';
import { Bubble, Arrow, FichaTable } from './elements.js';
import { getFicha, saveFicha } from './storage.js';

const DEMO_ID = 'force-hidrofugado-demo';
const W = 3300;
const H = 2550;

// [título, descripción, fx, fy, targetFx, targetFy]
const BUBBLES = [
  ['TALONERA', 'Contrafuerte termoplástico de 2mm.', 0.005, 0.36, 0.30, 0.34],
  ['HILO', '100% Poliester de 3 hebras imputrescible', 0.005, 0.48, 0.42, 0.46],
  ['CORDONES', 'Redondos 100% Poliester con puntera de acetato', 0.005, 0.60, 0.42, 0.80],
  ['CAPELLADA', 'Cuero Nobuck con cuero impermeable hidrofugado (Waterproof) a plena flor de 2 a 2,2mm de espesor (UNE-EN ISO 2589). Resistente a la tracción y elongación (UNE-EN ISO 3376).', 0.005, 0.69, 0.34, 0.52],
  ['ENTRESUELA', 'Poliuretano de baja densidad ultraligero con excelente amortiguación, comodidad y buena aislación térmica.', 0.005, 0.87, 0.40, 0.66],
  ['FORRO', 'Malla wafer respirable con membrana impermeabilizante', 0.45, 0.20, 0.42, 0.235],
  ['OJALES Y/O GANCHOS', 'Termoplástico de alta resistencia con ganchos abiertos inyectados', 0.58, 0.31, 0.48, 0.34],
  ['PUNTERA', 'Composite Fiberglass Toe Cap resistencia a impactos de 200 Joules y 15Kn de compresión, antimagnética y con aislante térmico y eléctrico (EN 22568 - ISO 20345).', 0.70, 0.42, 0.55, 0.46],
  ['CUELLO', 'Acolchado con doble espuma.', 0.70, 0.61, 0.56, 0.56],
  ['PLANTILLA INTERIOR', 'Ergonómica de espuma de poliuretano (PU) con shock absorber, ultracómodo.', 0.70, 0.68, 0.88, 0.60],
  ['SUELA', 'TPU Italiano con la mejor resistencia al desgaste, aceites, hidrocarburos y derivados. Con diseño antideslizante (ISO 20345 e ISO 4649).', 0.62, 0.81, 0.80, 0.90],
  ['ANTIPERFORANTE', 'Tecnología Kevlar Flex Guard con resistencia de 2000 N de fuerza (Certificado con EN12568 - ISO 20345).', 0.005, 0.95, 0.46, 0.90],
  ['DIELÉCTRICO', 'Resistencia al peligro eléctrico de 18Kv con certificado ASTM F2413.', 0.43, 0.95, 0.58, 0.88],
];

function buildCanvasState() {
  const canvas = new StaticCanvas(null, { width: W, height: H });

  const titulo = new Textbox('FORCE\nHIDROFUGADO', {
    left: 70, top: 20, width: 1700, fontFamily: 'Archivo Black',
    fontSize: 150, fill: '#111111', lineHeight: 0.95,
  });
  canvas.add(titulo);

  const tabla = new FichaTable({
    left: 55, top: 510, colWidth: 545, padding: 18,
    labelSize: 44, descSize: 30, borderWidth: 3,
    rows: [
      [{ label: 'Fabricación', desc: 'Cementado y vulcanizado, diseño moderno con corte outdoor.' }, { label: 'Montaje', desc: 'Sistema Strobel' }],
      [{ label: 'Plomo', desc: 'Disponible en tallas de 35 a 44' }, { label: 'Peso (talla 40)', desc: '654gr.' }],
      [{ label: 'Fuelle', desc: 'A media altura' }, { label: 'Caña', desc: '16,5cm - 6,5"' }],
    ],
  });
  canvas.add(tabla);

  for (const [title, desc, fx, fy, tfx, tfy] of BUBBLES) {
    const b = new Bubble(`${title}\n${desc}`, {
      left: fx * W, top: fy * H, width: 760,
      fontFamily: 'Poppins', fontSize: 38, fill: '#111111',
      bubblePadding: 28, bubbleRadius: 34,
    });
    b.setSelectionStyles({ fontWeight: '700', fontSize: 52 }, 0, title.length);
    canvas.add(b);

    const tx = tfx * W;
    const ty = tfy * H;
    const cx = b.left + b.width / 2;
    const sx = tx >= cx ? b.left + b.width + 20 : b.left - 20;
    const sy = b.top + b.height / 2;
    canvas.add(new Arrow([sx, sy, tx, ty], { strokeWidth: 11, dotRadius: 16, strokeDashArray: [22, 16] }));
  }

  const state = canvas.toObject();
  canvas.dispose();
  return state;
}

export async function seedDemoFicha() {
  try {
    if (await getFicha(DEMO_ID)) return; // ya existe
    const blob = await (await fetch('./force-base.jpg')).blob();
    const now = Date.now();
    await saveFicha({
      id: DEMO_ID,
      name: 'FORCE HIDROFUGADO',
      backgroundBlob: blob,
      width: W,
      height: H,
      canvasState: buildCanvasState(),
      thumbnail: null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('No se pudo precargar la ficha de ejemplo:', err);
  }
}
