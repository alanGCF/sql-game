import { type Contexto, errorVfs, resolver } from "../shell/executor";
import { puedeEjecutar } from "../vfs";
import { glosaError } from "./comun";

export function pwd(ctx: Contexto): number {
  ctx.out(`${ctx.sesion.cwd}\n`);
  return 0;
}

export function cd(ctx: Contexto): number {
  const args = ctx.argv.slice(1);
  if (args.length > 1) {
    ctx.err("bash: cd: too many arguments\n");
    return 1;
  }
  let destino = args[0] ?? ctx.sesion.usuario.home;
  const imprimir = destino === "-";
  if (destino === "-") {
    const anterior = ctx.sesion.env.get("OLDPWD");
    if (!anterior) {
      ctx.err("bash: cd: OLDPWD not set\n");
      return 1;
    }
    destino = anterior;
  }
  const abs = resolver(ctx, destino);
  try {
    const nodo = ctx.vfs.lookup(abs, ctx.sesion.usuario);
    if (nodo.type !== "dir") {
      ctx.err(`bash: cd: ${destino}: Not a directory\n`);
      ctx.glosa(`"${destino}" es un archivo, no una carpeta. Para leerlo usa \`cat ${destino}\`.`);
      return 1;
    }
    if (!puedeEjecutar(nodo, ctx.sesion.usuario)) {
      ctx.err(`bash: cd: ${destino}: Permission denied\n`);
      ctx.glosa("No tienes permiso para entrar a esa carpeta.");
      return 1;
    }
  } catch (e) {
    ctx.err(`bash: cd: ${destino}: ${errorVfs(e)}\n`);
    glosaError(ctx, destino, e);
    return 1;
  }
  ctx.sesion.env.set("OLDPWD", ctx.sesion.cwd);
  ctx.sesion.cwd = abs;
  ctx.sesion.env.set("PWD", abs);
  if (imprimir) ctx.out(`${abs}\n`);
  return 0;
}

export function echo(ctx: Contexto): number {
  let args = ctx.argv.slice(1);
  let nuevaLinea = true;
  let escapes = false;
  while (args[0] && /^-[neE]+$/.test(args[0])) {
    for (const l of args[0].slice(1)) {
      if (l === "n") nuevaLinea = false;
      if (l === "e") escapes = true;
      if (l === "E") escapes = false;
    }
    args = args.slice(1);
  }
  let texto = args.join(" ");
  if (escapes) texto = texto.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");
  ctx.out(nuevaLinea ? `${texto}\n` : texto);
  return 0;
}

export function clear(ctx: Contexto): number {
  ctx.out("\x1b[H\x1b[2J\x1b[3J");
  return 0;
}

export function history(ctx: Contexto): number {
  ctx.sesion.historial.forEach((linea, i) => {
    ctx.out(`${String(i + 1).padStart(5)}  ${linea}\n`);
  });
  return 0;
}

export function exit(ctx: Contexto): number {
  ctx.pensar("Todavía no acaba mi turno. Mejor me quedo.");
  return 0;
}
