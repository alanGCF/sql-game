// Harness de contenido: npm run validate:content [-- rutas...] [--semillas N]
// Sin rutas revisa content/misiones/**/*.yaml y el ejemplo canónico. Sale con 1 si hay errores.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { parse } from "yaml";
import { CurriculoEsquema, PersonajesEsquema } from "../src/engine/mision/curriculo";
import { type Mision, validarMision } from "../src/engine/mision/esquema";
import { revisarMision } from "../src/engine/mision/harness";
import { revisarRepasos } from "../src/engine/mision/harness-curriculo";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { semillas: { type: "string", default: process.env.SEMILLAS ?? "25" } },
});

function yamls(dir: string): string[] {
  try {
    return readdirSync(dir).flatMap((n) => {
      const r = join(dir, n);
      return statSync(r).isDirectory() ? yamls(r) : /\.ya?ml$/.test(n) ? [r] : [];
    });
  } catch {
    return [];
  }
}

const curriculo = CurriculoEsquema.parse(parse(readFileSync("content/curriculo.yaml", "utf8")));
const personajes = PersonajesEsquema.parse(parse(readFileSync("content/personajes.yaml", "utf8")));
const validas: Mision[] = [];

const archivos = positionals.length
  ? positionals
  : ["docs/ejemplos/mision-ejemplo.yaml", ...yamls("content/misiones")];
let errores = 0;
for (const f of archivos) {
  let datos: unknown;
  try {
    datos = parse(readFileSync(f, "utf8"));
  } catch (e) {
    console.error(`✗ ${f}\n  YAML inválido: ${e instanceof Error ? e.message : String(e)}`);
    errores++;
    continue;
  }
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
