import { type Contexto, errorVfs, resolver } from "../shell/executor";
import { nombreBase, normalizar, puedeEjecutar, puedeLeer, VfsError, type VNode } from "../vfs";
import { glosaError, separarBanderas } from "./comun";

/** Comandos de GNU coreutils para leer partes de archivos y manipular archivos (Turno 2). */

function lineasDe(n: string | undefined): number | null {
  if (n === undefined || !/^\d+$/.test(n)) return null;
  return Number(n);
}

/** Opciones `-n N`, `-nN` y `-N` de head/tail. */
function parsearCantidad(
  args: string[],
  prog: string,
  ctx: Contexto,
): { n: number; archivos: string[] } | null {
  let n = 10;
  const archivos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (a === "-n") {
      const v = lineasDe(args[++i]);
      if (v === null) {
        ctx.err(`${prog}: invalid number of lines: '${args[i] ?? ""}'\n`);
        return null;
      }
      n = v;
    } else if (/^-n\d+$/.test(a)) n = Number(a.slice(2));
    else if (/^-\d+$/.test(a)) n = Number(a.slice(1));
    else if (a.startsWith("-") && a !== "-") {
      ctx.err(`${prog}: invalid option -- '${a[1]}'\nTry '${prog} --help' for more information.\n`);
      return null;
    } else archivos.push(a);
  }
  return { n, archivos };
}

function partir(texto: string): string[] {
  if (texto === "") return [];
  const partes = texto.split("\n");
  if (texto.endsWith("\n")) partes.pop();
  return partes;
}

function cabezaOCola(ctx: Contexto, prog: "head" | "tail"): number {
  const op = parsearCantidad(ctx.argv.slice(1), prog, ctx);
  if (!op) return 1;
  const archivos = op.archivos.length ? op.archivos : ["-"];
  let codigo = 0;
  let primero = true;
  for (const a of archivos) {
    let texto: string;
    if (a === "-") texto = ctx.stdin;
    else {
      const abs = resolver(ctx, a);
      try {
        texto = ctx.vfs.readFile(abs, ctx.sesion.usuario);
        ctx.registro.leidos.add(abs);
      } catch (e) {
        if (e instanceof VfsError && e.code === "EISDIR")
          ctx.err(`${prog}: error reading '${a}': Is a directory\n`);
        else ctx.err(`${prog}: cannot open '${a}' for reading: ${errorVfs(e)}\n`);
        glosaError(ctx, a, e);
        codigo = 1;
        continue;
      }
    }
    if (archivos.length > 1) {
      ctx.out(`${primero ? "" : "\n"}==> ${a === "-" ? "standard input" : a} <==\n`);
    }
    primero = false;
    const lineas = partir(texto);
    const sinSalto = texto !== "" && !texto.endsWith("\n");
    const elegidas = prog === "head" ? lineas.slice(0, op.n) : op.n === 0 ? [] : lineas.slice(-op.n);
    const incluyeUltima = prog === "tail" || op.n >= lineas.length;
    let salida = elegidas.join("\n");
    if (elegidas.length) salida += sinSalto && incluyeUltima ? "" : "\n";
    ctx.out(salida);
  }
  return codigo;
}

export const head = (ctx: Contexto) => cabezaOCola(ctx, "head");
export const tail = (ctx: Contexto) => cabezaOCola(ctx, "tail");

function invalida(ctx: Contexto, prog: string, banderas: Set<string>, permitidas: string): boolean {
  for (const b of banderas) {
    if (!permitidas.includes(b)) {
      ctx.err(`${prog}: invalid option -- '${b}'\nTry '${prog} --help' for more information.\n`);
      return true;
    }
  }
  return false;
}

export function mkdir(ctx: Contexto): number {
  const { banderas, operandos } = separarBanderas(ctx.argv.slice(1));
  if (invalida(ctx, "mkdir", banderas, "p")) return 1;
  if (!operandos.length) {
    ctx.err("mkdir: missing operand\nTry 'mkdir --help' for more information.\n");
    return 1;
  }
  let codigo = 0;
  for (const op of operandos) {
    const abs = resolver(ctx, op);
    try {
      if (banderas.has("p")) {
        let actual = "";
        for (const parte of abs.split("/").filter(Boolean)) {
          actual += `/${parte}`;
          const existe = ctx.vfs.exists(actual);
          if (existe && ctx.vfs.lookup(actual).type !== "dir") throw new VfsError("EEXIST", actual);
          if (!existe) ctx.vfs.mkdir(actual, ctx.sesion.usuario, ctx.reloj.now());
        }
      } else ctx.vfs.mkdir(abs, ctx.sesion.usuario, ctx.reloj.now());
      ctx.registro.cambiados.add(abs);
    } catch (e) {
      ctx.err(`mkdir: cannot create directory '${op}': ${errorVfs(e)}\n`);
      glosaError(ctx, op, e);
      codigo = 1;
    }
  }
  return codigo;
}

export function touch(ctx: Contexto): number {
  const { banderas, operandos } = separarBanderas(ctx.argv.slice(1));
  if (invalida(ctx, "touch", banderas, "")) return 1;
  if (!operandos.length) {
    ctx.err("touch: missing file operand\nTry 'touch --help' for more information.\n");
    return 1;
  }
  let codigo = 0;
  for (const op of operandos) {
    const abs = resolver(ctx, op);
    try {
      if (ctx.vfs.exists(abs)) ctx.vfs.tocar(abs, ctx.sesion.usuario, ctx.reloj.now());
      else ctx.vfs.writeFile(abs, "", ctx.sesion.usuario, ctx.reloj.now());
      ctx.registro.cambiados.add(abs);
    } catch (e) {
      ctx.err(`touch: cannot touch '${op}': ${errorVfs(e)}\n`);
      glosaError(ctx, op, e);
      codigo = 1;
    }
  }
  return codigo;
}

/** Destino real de cp/mv: si el destino es un directorio existente, va dentro con el mismo nombre. */
function destinoFinal(ctx: Contexto, origen: string, destino: string): string {
  const abs = resolver(ctx, destino);
  try {
    if (ctx.vfs.lookup(abs).type === "dir") return normalizar(abs, nombreBase(resolver(ctx, origen)));
  } catch {
    // no existe: se usa tal cual
  }
  return abs;
}

/** `archivo destino/` con destino inexistente: GNU no crea un archivo con ese nombre, falla. */
function diagonalSinCarpeta(ctx: Contexto, origen: string, destino: string): boolean {
  if (!destino.endsWith("/") || ctx.vfs.exists(resolver(ctx, destino))) return false;
  try {
    return ctx.vfs.lookup(resolver(ctx, origen)).type === "file";
  } catch {
    return false;
  }
}

function glosaDiagonal(ctx: Contexto, destino: string): void {
  const carpeta = destino.replace(/\/+$/, "");
  ctx.glosa(`La carpeta ${carpeta}/ no existe. Créala primero con \`mkdir ${carpeta}\`.`);
}

function faltanOperandos(ctx: Contexto, prog: string, operandos: string[]): boolean {
  if (operandos.length === 0) {
    ctx.err(`${prog}: missing file operand\nTry '${prog} --help' for more information.\n`);
    return true;
  }
  if (operandos.length === 1) {
    ctx.err(
      `${prog}: missing destination file operand after '${operandos[0]}'\nTry '${prog} --help' for more information.\n`,
    );
    return true;
  }
  return false;
}

/** Copia recursiva con los mismos avisos que GNU cp. Devuelve false si algo no se pudo copiar. */
function copiarNodo(ctx: Contexto, nodo: VNode, origenVisible: string, destino: string): boolean {
  const u = ctx.sesion.usuario;
  const ahora = ctx.reloj.now();
  if (nodo.type === "file") {
    if (!puedeLeer(nodo, u)) {
      ctx.err(`cp: cannot open '${origenVisible}' for reading: Permission denied\n`);
      return false;
    }
    ctx.vfs.writeFile(destino, nodo.content, u, ahora);
    ctx.vfs.lookup(destino).mode = nodo.mode & 0o755;
    return true;
  }
  if (!ctx.vfs.exists(destino)) ctx.vfs.mkdir(destino, u, ahora);
  if (!puedeLeer(nodo, u) || !puedeEjecutar(nodo, u)) {
    ctx.err(`cp: cannot access '${origenVisible}': Permission denied\n`);
    return false;
  }
  let ok = true;
  for (const [nombre, hijo] of [...nodo.children].sort(([a], [b]) => (a < b ? -1 : 1))) {
    ok =
      copiarNodo(ctx, hijo, `${origenVisible}/${nombre}`, `${destino === "/" ? "" : destino}/${nombre}`) &&
      ok;
  }
  return ok;
}

export function cp(ctx: Contexto): number {
  const { banderas, operandos } = separarBanderas(ctx.argv.slice(1));
  if (invalida(ctx, "cp", banderas, "r")) return 1;
  if (faltanOperandos(ctx, "cp", operandos)) return 1;
  const destino = operandos.pop() as string;
  if (operandos.length > 1) {
    const absDestino = resolver(ctx, destino);
    if (!ctx.vfs.exists(absDestino) || ctx.vfs.lookup(absDestino).type !== "dir") {
      ctx.err(
        `cp: target '${destino}': ${ctx.vfs.exists(absDestino) ? "Not a directory" : "No such file or directory"}\n`,
      );
      return 1;
    }
  }
  let codigo = 0;
  for (const origen of operandos) {
    try {
      const nodo = ctx.vfs.lookup(resolver(ctx, origen), ctx.sesion.usuario);
      if (nodo.type === "dir" && !banderas.has("r")) {
        ctx.err(`cp: -r not specified; omitting directory '${origen}'\n`);
        ctx.glosa("Para copiar una carpeta completa agrega -r: `cp -r carpeta destino`.");
        codigo = 1;
        continue;
      }
      if (nodo.type === "file") ctx.vfs.readFile(resolver(ctx, origen), ctx.sesion.usuario);
      if (diagonalSinCarpeta(ctx, origen, destino)) {
        ctx.err(`cp: cannot create regular file '${destino}': Not a directory\n`);
        glosaDiagonal(ctx, destino);
        codigo = 1;
        continue;
      }
      const absFinal = destinoFinal(ctx, origen, destino);
      if (!copiarNodo(ctx, nodo, origen.replace(/\/+$/, ""), absFinal)) codigo = 1;
      ctx.registro.leidos.add(resolver(ctx, origen));
      ctx.registro.cambiados.add(absFinal);
    } catch (e) {
      if (
        e instanceof VfsError &&
        (e.code === "ENOENT" || e.code === "ENOTDIR") &&
        !ctx.vfs.exists(resolver(ctx, origen))
      ) {
        ctx.err(`cp: cannot stat '${origen}': ${errorVfs(e)}\n`);
      } else if (e instanceof VfsError && e.code === "EACCES" && e.path === resolver(ctx, origen)) {
        ctx.err(`cp: cannot open '${origen}' for reading: Permission denied\n`);
      } else ctx.err(`cp: cannot create regular file '${destino}': ${errorVfs(e)}\n`);
      glosaError(ctx, origen, e);
      codigo = 1;
    }
  }
  return codigo;
}

export function mv(ctx: Contexto): number {
  const { banderas, operandos } = separarBanderas(ctx.argv.slice(1));
  if (invalida(ctx, "mv", banderas, "")) return 1;
  if (faltanOperandos(ctx, "mv", operandos)) return 1;
  const destino = operandos.pop() as string;
  let codigo = 0;
  for (const origen of operandos) {
    const absOrigen = resolver(ctx, origen);
    if (!ctx.vfs.exists(absOrigen)) {
      ctx.err(`mv: cannot stat '${origen}': No such file or directory\n`);
      glosaError(ctx, origen, new VfsError("ENOENT", absOrigen));
      codigo = 1;
      continue;
    }
    if (diagonalSinCarpeta(ctx, origen, destino)) {
      ctx.err(`mv: cannot move '${origen}' to '${destino}': Not a directory\n`);
      glosaDiagonal(ctx, destino);
      codigo = 1;
      continue;
    }
    const absFinal = destinoFinal(ctx, origen, destino);
    try {
      ctx.vfs.rename(absOrigen, absFinal, ctx.sesion.usuario, ctx.reloj.now());
      ctx.registro.cambiados.add(absOrigen);
      ctx.registro.cambiados.add(absFinal);
    } catch (e) {
      ctx.err(`mv: cannot move '${origen}' to '${destino}': ${errorVfs(e)}\n`);
      glosaError(ctx, origen, e);
      codigo = 1;
    }
  }
  return codigo;
}

export function rm(ctx: Contexto): number {
  const { banderas, operandos } = separarBanderas(ctx.argv.slice(1));
  if (invalida(ctx, "rm", banderas, "rf")) return 1;
  const forzar = banderas.has("f");
  if (!operandos.length) {
    if (forzar) return 0;
    ctx.err("rm: missing operand\nTry 'rm --help' for more information.\n");
    return 1;
  }
  let codigo = 0;
  for (const op of operandos) {
    const base = nombreBase(op.replace(/\/+$/, "") || "/");
    if (base === "." || base === "..") {
      ctx.err(`rm: refusing to remove '.' or '..' directory: skipping '${op}'\n`);
      codigo = 1;
      continue;
    }
    const abs = resolver(ctx, op);
    try {
      ctx.vfs.remove(abs, ctx.sesion.usuario, banderas.has("r"));
      ctx.registro.cambiados.add(abs);
    } catch (e) {
      if (forzar && e instanceof VfsError && e.code === "ENOENT") continue;
      ctx.err(`rm: cannot remove '${op}': ${errorVfs(e)}\n`);
      if (e instanceof VfsError && e.code === "EISDIR")
        ctx.glosa("Es una carpeta: para borrarla con todo lo que tiene usa `rm -r`.");
      else glosaError(ctx, op, e);
      codigo = 1;
    }
  }
  return codigo;
}
