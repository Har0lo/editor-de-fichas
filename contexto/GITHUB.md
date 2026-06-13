# Conectar el proyecto a GitHub

El repositorio Git ya está inicializado y con el primer commit hecho (en esta
computadora). Falta crear el repo en GitHub y subirlo. Como no está instalado
`gh` (GitHub CLI), se hace por la web + 3 comandos.

## Pasos (una sola vez)

1. Entra a **https://github.com/new** (inicia sesión o crea cuenta gratis).
2. Pon de nombre, por ejemplo, `editor-de-fichas`.
   - Déjalo **vacío**: NO marques "Add README", ".gitignore" ni "license"
     (ya los tenemos localmente).
   - Puede ser **Private** (privado) sin problema.
3. Click en **Create repository**.
4. GitHub te muestra una URL tipo `https://github.com/TU-USUARIO/editor-de-fichas.git`.
   Cópiala.
5. En una terminal dentro de `E:\EditorDeFichas`, corre (reemplaza la URL):

```bash
git remote add origin https://github.com/TU-USUARIO/editor-de-fichas.git
git push -u origin main
```

   La primera vez se abrirá una ventana del navegador para iniciar sesión en
   GitHub (Git Credential Manager). Acepta y listo.

> Si pides ayuda a Claude, dile la URL del repo y él te arma estos comandos.

## Deploy automático (opcional pero recomendado)

Una vez el código está en GitHub, conéctalo a Netlify para que cada cambio se
publique solo (sin arrastrar `dist`):

1. En Netlify: **Add new site → Import an existing project → GitHub**.
2. Elige el repo `editor-de-fichas`.
3. Configura:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Deploy. Desde ahí, cada `git push` actualiza la web automáticamente.

## El día a día después

Cuando Claude (o tú) haga cambios:

```bash
git add -A
git commit -m "describe el cambio"
git push
```
Y Netlify reconstruye y publica solo.
