import type { Contexto } from "../shell/executor";
import { nombreBase, normalizar, padre, VfsError } from "../vfs";

/** Separa banderas cortas (agrupadas) de operandos. `--` termina las banderas. */
export function separarBanderas(args: readonly string[]): {
  banderas: Set<string>;
  operandos: string[];
  invalida?: string;
} {
  const banderas = new Set<string>();
  const operandos: string[] = [];
  let fin = false;
  for (const a of args) {
    if (!fin && a === "--") {
      fin = true;
      continue;
    }
    if (!fin && a.startsWith("-") && a.length > 1 && !a.startsWith("--")) {
      for (const l of a.slice(1)) banderas.add(l);
      continue;
    }
    operandos.push(a);
  }
  return { banderas, operandos };
}

/** Glosa en español para un error de archivo, con pista de mayúsculas si aplica. */
export function glosaError(ctx: Contexto, operando: string, e: unknown): void {
  if (!(e instanceof VfsError)) return;
  if (e.code === "ENOENT") {
    const abs = normalizar(ctx.sesion.cwd, operando);
    const nombre = nombreBase(abs).toLowerCase();
    try {
      const hermanos = ctx.vfs.readdir(padre(abs), ctx.sesion.usuario).map(([n]) => n);
      const parecido = hermanos.find((h) => h.toLowerCase() === nombre && h !== nombreBase(abs));
      if (parecido) {
        ctx.glosa(`No existe "${operando}" aquí. Linux distingue mayúsculas: ¿será ${parecido}?`);
        return;
      }
    } catch {
      // la carpeta tampoco existe; sigue con la glosa general
    }
    ctx.glosa(`No existe "${operando}" aquí. Usa \`ls\` para ver qué hay.`);
  } else if (e.code === "EACCES") {
    ctx.glosa("No tienes permiso para eso con tu usuario.");
  } else if (e.code === "EISDIR") {
    ctx.glosa(`"${operando}" es una carpeta, no un archivo. Para ver lo que tiene usa \`ls ${operando}\`.`);
  } else if (e.code === "ENOTDIR") {
    ctx.glosa(`"${operando}" es un archivo, no una carpeta.`);
  }
}
