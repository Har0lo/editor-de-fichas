# Editor de Fichas Técnicas — Plan v3

Web app para que cada vendedor de institucional arme y edite **sus propias** fichas
técnicas sobre las bases gráficas que prepara Harold (diseño), y las exporte a PDF
con un botón grande.

## Modelo de uso (definido 2026-06-12)

- **Harold (diseño):** prepara las bases gráficas limpias (botín + logos + normativas
  + rectángulos del diseño, SIN textos de características) y las pone a disposición.
- **Vendedores:** cada uno crea fichas a partir de una base y agrega lo suyo con
  botones simples. Cada quien ve y edita solo sus archivos.
- Los elementos que agregan los vendedores son 100% suyos: los mueven, editan y
  borran. La base gráfica es intocable (es el fondo del canvas).

## Botonera del editor (el corazón de la UX)

| Botón | Qué crea |
|:---|:---|
| ➕ Modelo | Texto grande tipo título de modelo (negro, pesado) |
| ➕ Título | Texto mediano en negrita |
| ➕ Descripción | Texto chico regular |
| 🟡 Burbuja | Burbuja amarilla con título + descripción, editable con doble click |
| ↘ Flecha | Flecha punteada amarilla con puntas arrastrables para conectar burbujas |
| ↩ Deshacer / ↪ Rehacer | Historial de cambios |
| 🗑 Eliminar | Borra lo seleccionado (también tecla Supr) |
| 💾 Guardar | Manual (también hay auto-guardado) |
| **PDF** | Botón grande amarillo: descarga el PDF de la ficha |

Al seleccionar un elemento aparece un mini panel: tamaño de letra, color
(negro/blanco/amarillo/azul), negrita.

## Stack

- Vite + Vanilla JS, Fabric.js v6 (canvas), jsPDF (PDF directo del canvas, sin html2canvas).
- Tipografías: Archivo Black (títulos de modelo) + Poppins (textos), como el estilo de las fichas.
- **Persistencia hoy:** IndexedDB local (capa `storage.js` con interfaz tipo API).
- **Persistencia futura (Fase 2):** Supabase — login por vendedor, fichas propias por
  usuario (RLS por user_id), banco de bases gráficas subidas por Harold, hosting en Vercel.
  La interfaz de `storage.js` se mantiene; solo se cambia el adaptador.

## Fases

### Fase 1 — Editor funcionando local (en curso)
- [x] Scaffold Vite + estructura
- [ ] Dashboard: crear ficha (nombre + imagen base), lista con thumbnails, buscar, duplicar, eliminar
- [ ] Editor: canvas con base de fondo, botonera completa, burbujas y flechas
- [ ] Undo/redo, auto-guardado, atajos (Ctrl+S, Ctrl+Z, Supr)
- [ ] Botón PDF (alta resolución, A4)

### Fase 2 — Multi-usuario real
- [ ] Proyecto Supabase + Auth (cuenta por vendedor)
- [ ] Fichas por usuario (RLS) + banco de bases gráficas de Harold
- [ ] Deploy en Vercel con dominio para el equipo

### Fase 3 — Pulido con usuarios reales
- [ ] Probar con 1–2 vendedores, ajustar fricciones
- [ ] Estados vacíos, toasts, manejo de errores de red

### Pendiente de Harold (en paralelo)
- [ ] Bases gráficas limpias de las fichas (botín, logos, normativas, formas — sin textos de características). Ideal ≥ 2000px de ancho, JPG/PNG.
