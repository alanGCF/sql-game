import { type Contexto, errorVfs, resolver } from "../shell/executor";
import { glosaError, separarBanderas } from "./comun";
import { ayuda } from "./man";

/** GNU coreutils `cat` con `-n`. Sin operandos (o con `-`) lee la entrada estándar. */
export function cat(ctx: Contexto): number {
  if (ctx.argv.includes("--help")) return ayuda(ctx, "cat");
  const { banderas, operandos } = separarBanderas(ctx.argv.slice(1));
  for (const b of banderas) {
    if (b !== "n") {
      ctx.err(`cat: invalid option -- '${b}'\nTry 'cat --help' for more information.\n`);
      return 1;
    }
  }
  const numerar = banderas.has("n");
  let linea = 1;
  let codigo = 0;
  let pendiente = "";
  const emitir = (texto: string) => {
    if (!numerar) {
      ctx.out(texto);
      return;
    }
    // Numeración continua entre archivos, como GNU (formato "%6d\t").
    const partes = (pendiente + texto).split("\n");
    pendiente = "";
    let s = "";
    partes.forEach((p, i) => {
      const ultima = i === partes.length - 1;
      if (ultima) {
        if (p) s += `${String(linea++).padStart(6)}\t${p}`;
      } else s += `${String(linea++).padStart(6)}\t${p}\n`;
    });
    ctx.out(s);
  };

  for (const op of operandos.length ? operandos : ["-"]) {
    if (op === "-") {
      emitir(ctx.stdin);
      continue;
    }
    const abs = resolver(ctx, op);
    try {
      emitir(ctx.vfs.readFile(abs, ctx.sesion.usuario));
      ctx.registro.leidos.add(abs);
    } catch (e) {
      ctx.err(`cat: ${op}: ${errorVfs(e)}\n`);
      glosaError(ctx, op, e);
      codigo = 1;
    }
  }
  return codigo;
}
