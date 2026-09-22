/**
 * Build del sitio estático → carpeta `dist/` para subir a Hostinger.
 *
 * El sitio no tiene bundler: lo que se sirve en el dominio es el contenido de
 * `web/`. Este build:
 *   1) Copia `web/` → `dist/` (deja afuera archivos de desarrollo).
 *   2) Renueva el `?v=` de los assets en los .html (cache-busting) para que los
 *      navegadores tomen el JS/CSS nuevo al instante, sin Ctrl+F5.
 *
 * Uso:  node build.js       (o  npm run build)
 * Después: subir el CONTENIDO de `dist/` a la raíz del sitio en Hostinger
 * (public_html), reemplazando lo que haya.
 *
 * Sin dependencias. Requiere Node 16.7+ (fs.cpSync). Idempotente: reconstruye
 * `dist/` desde cero en cada corrida.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "web");
const OUT = path.join(ROOT, "dist");

// Archivos de `web/` que NO son parte del sitio publicado.
const EXCLUIR = new Set(["README.md", "server.js"]);

// Sello de versión para el cache-busting: fecha+hora, ordenable y legible.
function sello() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes())
  );
}

function limpiarDist() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
}

function copiar() {
  for (const nombre of fs.readdirSync(SRC)) {
    if (EXCLUIR.has(nombre)) continue;
    fs.cpSync(path.join(SRC, nombre), path.join(OUT, nombre), { recursive: true });
  }
}

/**
 * Reescribe `?v=...` de los assets (js/css) en todos los .html de `dist/`.
 * Si un asset no traía `?v=`, se lo agrega. No toca URLs absolutas (http...).
 */
function cacheBust(version) {
  let tocados = 0;
  const htmls = fs.readdirSync(OUT).filter((f) => f.endsWith(".html"));
  for (const f of htmls) {
    const abs = path.join(OUT, f);
    let html = fs.readFileSync(abs, "utf8");
    // (src|href)="ruta-relativa.(js|css)[?v=...]"
    html = html.replace(
      /((?:src|href)=")(?!https?:)([^"?]+\.(?:js|css))(\?v=[^"]*)?(")/g,
      (_m, pre, ruta, _vieja, post) => `${pre}${ruta}?v=${version}${post}`
    );
    fs.writeFileSync(abs, html);
    tocados++;
  }
  return tocados;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error("No existe la carpeta web/ — ¿estás en la raíz del repo?");
    process.exit(1);
  }
  const version = sello();
  limpiarDist();
  copiar();
  const n = cacheBust(version);
  console.log(`Build OK → dist/  (version assets: ${version}, ${n} .html actualizados)`);
  console.log("Subí el CONTENIDO de dist/ a public_html en Hostinger.");
}

main();
