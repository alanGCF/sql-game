// Harness de contenido: npm run validate:content [-- rutas...] [--semillas N]
// Sin rutas revisa content/misiones/**/*.yaml y el ejemplo canónico. Sale con 1 si hay errores.
import { parseArgs } from "node:util";
import { type Mision, validarMision } from "../src/engine/mision/esquema";
import { revisarMision } from "../src/engine/mision/harness";
import { revisarRepasos } from "../src/engine/mision/harness-curriculo";
import { archivosYaml, cargarCurriculo, cargarPersonajes, leerYaml } from "./lib/contenido";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { semillas: { type: "string", default: process.env.SEMILLAS ?? "25" } },
});

const curriculo = cargarCurriculo();
const personajes = cargarPersonajes();
const validas: Mision[] = [];

const archivos = positionals.length
  ? positionals
  : ["docs/ejemplos/mision-ejemplo.yaml", ...archivosYaml("content/misiones")];
let errores = 0;
for (const f of archivos) {
  const y = leerYaml(f);
  if (!y.ok) {
    console.error(`✗ ${y.error}`);
    errores++;
    continue;
  }
  const datos = y.datos;
  const h = await revisarMision(datos, { semillas: Number(values.semillas), curriculo, personajes });
  const v = validarMision(datos);
  if (v.ok) validas.push(v.mision);
  const e = h.filter((x) => x.severidad === "error");
  errores += e.length;
  console.log(`${e.length ? "✗" : "✓"} ${f}`);
  for (const x of h) console.log(`  ${x.severidad === "error" ? "ERROR" : "aviso"} ${x.regla}: ${x.mensaje}`);
}
for (const x of revisarRepasos(validas)) console.log(`aviso ${x.regla}: ${x.mensaje}`);
console.log(`\n${archivos.length} archivo(s), ${errores} error(es), ${values.semillas} semillas.`);
process.exit(errores ? 1 : 0);
