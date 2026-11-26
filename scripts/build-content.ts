// Pipeline de contenido: content/**/*.yaml → .generated/contenido/*.json (validado con Zod).
// Un JSON por turno (turno-01.json … turno-te.json) que el cliente carga bajo demanda, y comun.json
// (personajes, mundo base y guiones de llamadas).
// La revisión pedagógica con semillas es aparte: npm run validate:content.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { revisarLlamadas } from "../src/engine/llamadas";
import { type ArchivoContenido, compilarContenido } from "../src/engine/mision/compilar";
import {
  archivosYaml,
  cargarCurriculo,
  cargarLlamadas,
  cargarMundo,
  cargarPersonajes,
  flagsConocidas,
  leerYaml,
} from "./lib/contenido";

const SALIDA = ".generated/contenido";
const errores: string[] = [];
const archivos: ArchivoContenido[] = [];
for (const ruta of archivosYaml("content/misiones")) {
  const y = leerYaml(ruta);
  if (y.ok) archivos.push({ ruta, datos: y.datos });
  else errores.push(y.error);
}
const { turnos, errores: deCompilar } = compilarContenido(archivos);
errores.push(...deCompilar);

function intentar<T>(origen: string, f: () => T): T | undefined {
  try {
    return f();
  } catch (e) {
    errores.push(`${origen}: ${e instanceof Error ? e.message : String(e)}`);
    return undefined;
  }
}
/**
 * Libreta (F4-05): las páginas de content/libreta/comandos/*.md y qué página abre cada concepto del currículo
 * (el primer comando de su sintaxis, si tiene página).
 */
function cargarLibreta(): { paginas: Record<string, string>; conceptos: Record<string, string> } {
  const dir = "content/libreta/comandos";
  const paginas = Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => [f.replace(/\.md$/, ""), readFileSync(`${dir}/${f}`, "utf8")]),
  );
  const conceptos: Record<string, string> = {};
  for (const [id, c] of Object.entries(cargarCurriculo().conceptos)) {
    const comando = /`([a-z0-9]+)/.exec(c.sintaxis ?? "")?.[1];
    if (comando && paginas[comando]) conceptos[id] = comando;
  }
  return { paginas, conceptos };
}

const personajes = intentar("content/personajes.yaml", cargarPersonajes);
const mundo = intentar("content/mundo", () => cargarMundo());
const llamadas = intentar("content/llamadas", () => cargarLlamadas());
if (llamadas && personajes) {
  const misiones = [...turnos.values()].flatMap((t) => [...t.misiones, ...t.favores]);
  errores.push(...revisarLlamadas(llamadas, personajes.personajes, flagsConocidas(misiones, llamadas)));
}

const libreta = intentar("content/libreta", () => cargarLibreta());

if (errores.length || !personajes || !mundo || !llamadas || !libreta) {
  for (const e of errores) console.error(`✗ ${e}`);
  console.error(`\nbuild-content: ${errores.length} error(es); no se generó nada.`);
  process.exit(1);
}

rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });
writeFileSync(join(SALIDA, "comun.json"), JSON.stringify({ personajes, mundo, llamadas, libreta }));
for (const [llave, turno] of turnos)
  writeFileSync(join(SALIDA, `turno-${llave}.json`), JSON.stringify(turno));
const n = [...turnos.values()].reduce((s, t) => s + t.misiones.length + t.favores.length, 0);
console.log(`build-content: ${turnos.size} turno(s), ${n} misión(es) y favor(es) → ${SALIDA}/`);
