// Pipeline de contenido: content/**/*.yaml → .generated/contenido/*.json (validado con Zod).
// Un JSON por turno (turno-01.json … turno-te.json) que el cliente carga bajo demanda, y comun.json.
// La revisión pedagógica con semillas es aparte: npm run validate:content.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type ArchivoContenido, compilarContenido } from "../src/engine/mision/compilar";
import { archivosYaml, cargarPersonajes, leerYaml } from "./lib/contenido";

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

let personajes: ReturnType<typeof cargarPersonajes> | undefined;
try {
  personajes = cargarPersonajes();
} catch (e) {
  errores.push(`content/personajes.yaml: ${e instanceof Error ? e.message : String(e)}`);
}

if (errores.length || !personajes) {
  for (const e of errores) console.error(`✗ ${e}`);
  console.error(`\nbuild-content: ${errores.length} error(es); no se generó nada.`);
  process.exit(1);
}

rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });
writeFileSync(join(SALIDA, "comun.json"), JSON.stringify({ personajes }));
for (const [llave, turno] of turnos)
  writeFileSync(join(SALIDA, `turno-${llave}.json`), JSON.stringify(turno));
const n = [...turnos.values()].reduce((s, t) => s + t.misiones.length + t.favores.length, 0);
console.log(`build-content: ${turnos.size} turno(s), ${n} misión(es) y favor(es) → ${SALIDA}/`);
