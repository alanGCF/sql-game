// Lectura de content/ compartida por build-content, validate-content y play.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { CurriculoEsquema, PersonajesEsquema } from "../../src/engine/mision/curriculo";

/** Archivos .yaml/.yml bajo `dir`, recursivo y ordenado; [] si no existe. */
export function archivosYaml(dir: string): string[] {
  let nombres: string[];
  try {
    nombres = readdirSync(dir).sort();
  } catch {
    return [];
  }
  return nombres.flatMap((n) => {
    const r = join(dir, n);
    return statSync(r).isDirectory() ? archivosYaml(r) : /\.ya?ml$/.test(n) ? [r] : [];
  });
}

/** Lee un YAML; los errores de sintaxis salen como texto con la ruta. */
export function leerYaml(ruta: string): { ok: true; datos: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, datos: parse(readFileSync(ruta, "utf8")) };
  } catch (e) {
    return { ok: false, error: `${ruta}: YAML inválido: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export const cargarCurriculo = () =>
  CurriculoEsquema.parse(parse(readFileSync("content/curriculo.yaml", "utf8")));
export const cargarPersonajes = () =>
  PersonajesEsquema.parse(parse(readFileSync("content/personajes.yaml", "utf8")));
