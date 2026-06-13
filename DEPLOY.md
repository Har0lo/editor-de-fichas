# Cómo desplegar la web (piloto)

La carpeta `dist/` ya tiene la web lista para subir. Elige UNA opción.

---

## Opción A — Netlify Drop (la más fácil, 30 segundos) ✅ recomendada para el piloto

1. Abre en tu navegador: **https://app.netlify.com/drop**
2. Abre el explorador de archivos en: `E:\EditorDeFichas\dist`
3. **Arrastra la carpeta `dist` completa** y suéltala en la página de Netlify.
4. Espera unos segundos → te da un link público tipo `https://algo-random-123.netlify.app`
5. Ese link se lo pasas a tus compañeros. ¡Listo!

> Consejo: crea una cuenta gratis en Netlify (con tu Google/email) ANTES de arrastrar,
> así el sitio queda guardado en tu cuenta y le puedes poner un nombre bonito
> (ej: `fichas-tnt.netlify.app`) en Site settings → Change site name.

### Cuando yo haga cambios
Vuelvo a correr `npm run build` (se regenera `dist`) y tú arrastras la carpeta otra vez
al mismo sitio (en Netlify: pestaña "Deploys" → arrastras `dist` ahí). Se actualiza solo.

---

## Opción B — Conectar con GitHub (mejor a largo plazo)

Si subimos el código a un repositorio de GitHub y lo conectas a Netlify o Vercel,
cada cambio se publica solo, sin arrastrar nada. Es lo ideal para cuando entremos
a la fase de Supabase. Cuando quieras, te guío para crear el repo.

- Build command: `npm run build`
- Publish directory: `dist`

---

## ⚠️ Recordatorio sobre los datos (versión piloto)

En esta versión las fichas se guardan **en el navegador de cada persona**:
- Cada compañero verá la ficha de ejemplo FORCE HIDROFUGADO y podrá crear las suyas.
- Sus fichas NO se comparten entre computadoras y se pierden si limpian el caché.
- Esto es solo para PROBAR. La versión con cuentas y nube (Supabase) viene en paralelo.
