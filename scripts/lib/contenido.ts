// Lectura de content/ compartida por build-content, validate-content y play.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { CurriculoEsquema, PersonajesEsquema } from "../../src/engine/mision/curriculo";
import { type Mision, validarMision } from "../../src/engine/mision/esquema";
import { type MundoBase, MundoEsquema } from "../../src/engine/mundo-esquema";

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

/** content/mundo/: variables de partida + un archivo por host en hosts/ (el nombre debe ser el host). */
export function cargarMundo(dir = "content/mundo"): MundoBase {
  const hosts = archivosYaml(join(dir, "hosts")).map((ruta) => {
    const y = leerYaml(ruta);
    if (!y.ok) throw new Error(y.error);
    const nombre = ruta.replace(/^.*\//, "").replace(/\.ya?ml$/, "");
    const host = (y.datos as { host?: unknown } | null)?.host;
    if (host !== nombre)
      throw new Error(`${ruta}: el campo host (${String(host)}) debe llamarse como el archivo`);
    return y.datos;
  });
  const variables = leerYaml(join(dir, "variables.yaml"));
  if (!variables.ok) throw new Error(variables.error);
  const r = MundoEsquema.safeParse({ variables: variables.datos ?? {}, hosts });
  if (!r.success)
    throw new Error(
      r.error.issues.map((i) => `${dir}: ${i.path.join(".") || "(raíz)"}: ${i.message}`).join("\n"),
    );
  return r.data;
}

/** Busca una misión o favor por id en content/misiones/ y en el ejemplo canónico; la valida. */
export function buscarMision(id: string): Mision {
  for (const ruta of [...archivosYaml("content/misiones"), "docs/ejemplos/mision-ejemplo.yaml"]) {
    const y = leerYaml(ruta);
    if (!y.ok || (y.datos as { id?: unknown } | null)?.id !== id) continue;
    const v = validarMision(y.datos);
    if (!v.ok) throw new Error(`${ruta} no es válida:\n${v.errores.join("\n")}`);
    return v.mision;
  }
  throw new Error(`no existe la misión ${id}`);
}
