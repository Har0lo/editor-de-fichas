# Contexto del proyecto — Editor de Fichas Técnicas

> Léeme primero al retomar el proyecto (incluido cuando se abre Claude en otra
> computadora). Resume qué es, en qué punto está y qué sigue.

## Qué es

Web app para que el equipo de **ventas institucionales** (calzado de seguridad,
marca Sander/TNT) edite los **textos** de las fichas técnicas sobre las **bases
gráficas** que prepara Harold (diseño), y exporte el resultado a **PDF**.
Antes Harold hacía todas las variaciones a mano y se le acumulaban; la idea es que
cada vendedor arme las suyas.

## Quién es el usuario

Harold — trabaja en diseño. No es programador; explicar en simple y verificar las
cosas por él (no pedirle que "revise el código"). Idioma: español.

## Estado actual (al 2026-06-13)

**Funciona (piloto en producción):**
- Dashboard: crear / abrir / duplicar / eliminar fichas, buscador.
- Editor (Fabric.js v6): botones para agregar **Modelo, Título, Descripción,
  Burbuja** (amarilla, título negrita + descripción), **Flecha** (punteada gruesa
  con extremos arrastrables) y **Tabla** (celdas etiqueta+descripción; ＋Fila;
  doble click en celda para editar).
- Panel flotante: tamaño de letra (editable), negrita, color, eliminar.
- Undo/redo, auto-guardado (debounce 2.5s) + Ctrl+S, zoom, atajos.
- Exportar **PDF** en alta resolución (botón grande amarillo).
- Ficha de ejemplo **FORCE HIDROFUGADO** precargada (ver `src/seed.js`) sobre
  `public/force-base.jpg` (base limpia, 3300×2550).

**Persistencia hoy:** IndexedDB local (en el navegador de cada persona).
**Limitación conocida del piloto:** las fichas NO se sincronizan entre PCs y se
pierden si se limpia el caché. Es solo para probar.

**Desplegado en:** Netlify → https://creative-daifuku-97125c.netlify.app/
(deploy manual arrastrando la carpeta `dist`; ver `DEPLOY.md`).

## Cómo correrlo en local

```bash
npm install
npm run dev      # abre http://localhost:5173
npm run build    # genera dist/ para desplegar
```
Requiere Node.js. Las fuentes (Archivo Black, Poppins) se cargan de Google Fonts.

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `src/elements.js` | Burbuja, Flecha y Tabla (clases Fabric) + fábricas `add*` con los tamaños/estilos por defecto |
| `src/canvas-manager.js` | Wrapper Fabric: fondo, zoom, undo/redo, export. OJO: `getState()` NO serializa el fondo (era el bug del "se ve gigante") |
| `src/pages/editor.js` | Pantalla del editor: toolbar, panel, doble-click de tabla |
| `src/pages/dashboard.js` | Lista de fichas; llama a `seedDemoFicha()` |
| `src/seed.js` | Construye y precarga la ficha FORCE de ejemplo |
| `src/storage.js` + `src/db.js` | Capa de datos (IndexedDB). Interfaz pensada para cambiar a Supabase sin tocar el resto |

## Decisiones tomadas

- Cada vendedor edita SUS propias fichas (no compartidas).
- Stack: Vite + Vanilla JS + Fabric.js v6 + jsPDF (sin html2canvas).
- Tamaños por defecto pensados para bases de ~3300px de ancho (alta resolución).
- Las bases gráficas (botín + logos + normativas, SIN textos) las prepara Harold;
  pendiente preparar el resto del catálogo (empezamos con FORCE).

## Lo que sigue — Fase 2 (Supabase) y GitHub

1. **GitHub** (en proceso): conectar el repo para que el deploy sea automático.
   Pasos en `contexto/GITHUB.md`.
2. **Supabase** (el gran salto): login por vendedor, fichas en la nube (acceso
   desde cualquier PC, sin perderse), banco de bases gráficas compartido que sube
   Harold. Requiere que Harold cree cuenta gratis en supabase.com.
   - Mantener la interfaz de `src/storage.js`; solo cambiar el adaptador.
3. **Pendiente menor:** afinar posiciones de burbujas/flechas de la ficha demo.

## Para retomar con Claude

Decir algo como: *"Lee contexto/CONTEXTO.md, seguimos con el Editor de Fichas"*.
Si el código se clonó de GitHub, correr `npm install` antes de `npm run dev`.
