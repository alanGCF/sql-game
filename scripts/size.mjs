// Presupuestos de tamaño (docs/plan/05-arquitectura.md §Presupuestos).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = "dist/client";
const LIMITE_JS_INICIAL_GZ = 450 * 1024;
const LIMITE_TOTAL = 25 * 1024 * 1024;

const archivos = [];
const recorrer = (dir) => {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else archivos.push(ruta);
  }
};
try {
  recorrer(DIST);
} catch {
  console.error(`No existe ${DIST}: corre npm run build primero.`);
  process.exit(1);
}

// JS inicial = scripts referenciados directamente desde index.html (los chunks diferidos no cuentan).
const html = readFileSync(join(DIST, "index.html"), "utf8");
const iniciales = [...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.js)"/g)].map((m) => join(DIST, m[1]));
const jsInicial = iniciales.reduce((t, f) => t + gzipSync(readFileSync(f)).length, 0);
const total = archivos.reduce((t, f) => t + statSync(f).size, 0);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
let ok = true;
const fila = (nombre, valor, limite) => {
  const pasa = valor <= limite;
  ok &&= pasa;
  console.log(
    `${pasa ? "OK " : "MAL"}  ${nombre.padEnd(22)} ${kb(valor).padStart(12)}  (límite ${kb(limite)})`,
  );
};
fila("JS inicial (gzip)", jsInicial, LIMITE_JS_INICIAL_GZ);
fila("Total dist/client", total, LIMITE_TOTAL);
process.exit(ok ? 0 : 1);
