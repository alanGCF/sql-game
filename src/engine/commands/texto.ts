import { type Contexto, errorVfs, resolver } from "../shell/executor";
import { compararC } from "../shell/expand";
import { bytes, puedeEjecutar, puedeLeer, VfsError, type VNode } from "../vfs";
import { glosaError } from "./comun";

/** Comandos de texto del Turno 3 (GNU grep 3.11 y coreutils 9, LC_ALL=C). */

function lineas(texto: string): string[] {
  if (texto === "") return [];
  const partes = texto.split("\n");
  if (texto.endsWith("\n")) partes.pop();
  return partes;
}

/** Lee un operando (o stdin con "-"). Devuelve null y reporta el error con el formato de `formato`. */
function leer(ctx: Contexto, op: string, formato: (op: string, msg: string) => string): string | null {
  if (op === "-") return ctx.stdin;
  const abs = resolver(ctx, op);
  try {
    const t = ctx.vfs.readFile(abs, ctx.sesion.usuario);
    ctx.registro.leidos.add(abs);
    return t;
  } catch (e) {
    ctx.err(formato(op, errorVfs(e)));
    glosaError(ctx, op, e);
    return null;
  }
}

// ───────────────────────────── grep ─────────────────────────────

const CLASES_POSIX: Record<string, string> = {
  alpha: "a-zA-Z",
  digit: "0-9",
  alnum: "a-zA-Z0-9",
  upper: "A-Z",
  lower: "a-z",
  space: " \\t\\n\\r\\f\\v",
  blank: " \\t",
  punct: "!-\\/:-@\\[-`{-~",
  xdigit: "0-9A-Fa-f",
};

/** Copia una expresión entre corchetes POSIX a JS. Devuelve [fragmento, índice siguiente]. */
function corchetes(p: string, i: number): [string, number] {
  let j = i + 1;
  let out = "[";
  if (p[j] === "^") {
    out += "^";
    j++;
  }
  if (p[j] === "]") {
    out += "\\]";
    j++;
  }
  while (j < p.length && p[j] !== "]") {
    const clase = /^\[:([a-z]+):\]/.exec(p.slice(j));
    if (clase) {
      out += CLASES_POSIX[clase[1] as string] ?? "";
      j += clase[0].length;
      continue;
    }
    const c = p[j] as string;
    out += c === "\\" || c === "[" ? `\\${c}` : c;
    j++;
  }
  if (j >= p.length) throw new Error("Unmatched [, [^, [:, [., or [=");
  return [`${out}]`, j + 1];
}

/** Traduce una expresión regular POSIX (básica o extendida) a una RegExp de JavaScript. */
export function posixARegex(p: string, extendida: boolean): string {
  let out = "";
  for (let i = 0; i < p.length; ) {
    const c = p[i] as string;
    if (c === "[") {
      const [frag, sig] = corchetes(p, i);
      out += frag;
      i = sig;
      continue;
    }
    if (c === "\\" && i + 1 < p.length) {
      const n = p[i + 1] as string;
      if (n === "<" || n === ">") out += "\\b";
      else if ("wWsS".includes(n) || /\d/.test(n)) out += `\\${n}`;
      else if (!extendida && "(){}|+?".includes(n)) out += n;
      else out += `\\${n}`;
      i += 2;
      continue;
    }
    if (!extendida && "(){}|+?".includes(c)) out += `\\${c}`;
    else if (c === "*" && (out === "" || out.endsWith("(") || out === "^")) out += "\\*";
    else if (c === "^" && out !== "" && !out.endsWith("(") && !out.endsWith("|")) out += "\\^";
    else if (c === "$" && i !== p.length - 1 && !(extendida && "|)".includes(p[i + 1] as string)))
      out += "\\$";
    else if ("/".includes(c)) out += `\\${c}`;
    else out += c;
    i++;
  }
  return out;
}

export function grep(ctx: Contexto): number {
  const args = ctx.argv.slice(1);
  const op = new Set<string>();
  let patron: string | undefined;
  const archivos: string[] = [];
  for (const a of args) {
    if (patron === undefined && a.startsWith("-") && a.length > 1) {
      for (const l of a.slice(1)) {
        if (!"invcrwE".includes(l)) {
          ctx.err(
            `grep: invalid option -- '${l}'\nUsage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.\n`,
          );
          return 2;
        }
        op.add(l);
      }
    } else if (patron === undefined) patron = a;
    else archivos.push(a);
  }
  if (patron === undefined) {
    ctx.err("Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.\n");
    return 2;
  }
  let re: RegExp;
  try {
    let fuente = posixARegex(patron, op.has("E"));
    if (op.has("w")) fuente = `(?<![A-Za-z0-9_])(?:${fuente})(?![A-Za-z0-9_])`;
    re = new RegExp(fuente, op.has("i") ? "i" : "");
  } catch (e) {
    ctx.err(
      `grep: ${e instanceof Error && e.message.startsWith("Unmatched") ? e.message : "Invalid regular expression"}\n`,
    );
    return 2;
  }

  const recursivo = op.has("r");
  let hubo = false;
  let error = false;
  // Con -r sin operando se busca en "." pero las rutas se muestran sin "./".
  const objetivos = archivos.length ? archivos : recursivo ? [""] : ["-"];
  const conNombre = recursivo || objetivos.length > 1;

  const buscar = (nombre: string, texto: string) => {
    let cuenta = 0;
    lineas(texto).forEach((l, idx) => {
      if (re.test(l) === op.has("v")) return;
      cuenta++;
      if (op.has("c")) return;
      ctx.out(`${conNombre ? `${nombre}:` : ""}${op.has("n") ? `${idx + 1}:` : ""}${l}\n`);
    });
    if (op.has("c")) ctx.out(`${conNombre ? `${nombre}:` : ""}${cuenta}\n`);
    if (cuenta > 0) hubo = true;
  };

  const recorrer = (visible: string, abs: string, nodo: VNode) => {
    const u = ctx.sesion.usuario;
    if (nodo.type === "file") {
      if (!puedeLeer(nodo, u)) {
        ctx.err(`grep: ${visible}: Permission denied\n`);
        error = true;
        return;
      }
      ctx.registro.leidos.add(abs);
      buscar(visible, nodo.content);
      return;
    }
    if (!puedeLeer(nodo, u) || !puedeEjecutar(nodo, u)) {
      ctx.err(`grep: ${visible}: Permission denied\n`);
      error = true;
      return;
    }
    // shortcut: orden alfabético; en Linux real depende del sistema de archivos (desviación documentada).
    for (const [n, hijo] of [...nodo.children].sort(([a], [b]) => compararC(a, b))) {
      recorrer(visible === "" ? n : `${visible}/${n}`, abs === "/" ? `/${n}` : `${abs}/${n}`, hijo);
    }
  };

  for (const obj of objetivos) {
    if (obj === "-") {
      buscar("(standard input)", ctx.stdin);
      continue;
    }
    const abs = resolver(ctx, obj === "" ? "." : obj);
    let nodo: VNode;
    try {
      nodo = ctx.vfs.lookup(abs, ctx.sesion.usuario);
    } catch (e) {
      ctx.err(`grep: ${obj}: ${errorVfs(e)}\n`);
      glosaError(ctx, obj, e);
      error = true;
      continue;
    }
    if (nodo.type === "dir" && !recursivo) {
      ctx.err(`grep: ${obj}: Is a directory\n`);
      ctx.glosa(`"${obj}" es una carpeta. Para buscar dentro de todos sus archivos usa \`grep -r\`.`);
      error = true;
      continue;
    }
    recorrer(obj, abs, nodo);
  }
  return error ? 2 : hubo ? 0 : 1;
}

// ───────────────────────────── wc ─────────────────────────────

export function wc(ctx: Contexto): number {
  const op = new Set<string>();
  const archivos: string[] = [];
  for (const a of ctx.argv.slice(1)) {
    if (a.startsWith("-") && a.length > 1) {
      for (const l of a.slice(1)) {
        if (!"lwc".includes(l)) {
          ctx.err(`wc: invalid option -- '${l}'\nTry 'wc --help' for more information.\n`);
          return 1;
        }
        op.add(l);
      }
    } else archivos.push(a);
  }
  const columnas = op.size ? (["l", "w", "c"] as const).filter((c) => op.has(c)) : (["l", "w", "c"] as const);
  const entradas = archivos.length ? archivos : ["-"];
  const filas: { nombre: string; cuentas: number[] }[] = [];
  let tamanoRegular = 0;
  let hayNoRegular = false;
  let codigo = 0;
  for (const a of entradas) {
    const texto = leer(ctx, a, (o, m) => `wc: ${o}: ${m}\n`);
    if (texto === null) {
      codigo = 1;
      continue;
    }
    if (a === "-") hayNoRegular = true;
    else tamanoRegular += bytes(texto);
    const cuentas = {
      l: (texto.match(/\n/g) ?? []).length,
      // En locale C una "palabra" debe contener al menos un carácter ASCII imprimible (una "—" suelta no cuenta).
      w: texto.split(/[ \t\n\v\f\r]+/).filter((p) => /[\x21-\x7e]/.test(p)).length,
      c: bytes(texto),
    };
    filas.push({ nombre: a === "-" ? "" : a, cuentas: columnas.map((c) => cuentas[c]) });
  }
  // Ancho como GNU: dígitos del tamaño total de archivos regulares (mínimo 7 si hay stdin);
  // sin relleno cuando se imprime una sola cuenta de una sola entrada.
  let ancho = Math.max(1, String(tamanoRegular).length);
  if (hayNoRegular) ancho = Math.max(ancho, 7);
  if (columnas.length === 1 && entradas.length === 1) ancho = 1;
  const imprimir = (cuentas: number[], nombre: string) =>
    ctx.out(`${cuentas.map((n) => String(n).padStart(ancho)).join(" ")}${nombre ? ` ${nombre}` : ""}\n`);
  for (const f of filas) imprimir(f.cuentas, f.nombre);
  if (entradas.length > 1) {
    imprimir(
      columnas.map((_, i) => filas.reduce((t, f) => t + (f.cuentas[i] as number), 0)),
      "total",
    );
  }
  return codigo;
}

// ───────────────────────────── sort ─────────────────────────────

function inicioCampo(linea: string, campo: number, sep: string | undefined): number {
  if (sep !== undefined) {
    let pos = 0;
    for (let i = 1; i < campo; i++) {
      const s = linea.indexOf(sep, pos);
      if (s === -1) return linea.length;
      pos = s + 1;
    }
    return pos;
  }
  // Sin -t, cada campo incluye los blancos que lo preceden (comportamiento GNU sin -b).
  let pos = 0;
  for (let i = 1; i < campo; i++) {
    while (pos < linea.length && (linea[pos] === " " || linea[pos] === "\t")) pos++;
    while (pos < linea.length && linea[pos] !== " " && linea[pos] !== "\t") pos++;
  }
  return pos;
}

function numeroInicial(s: string): number {
  const m = /^[ \t]*(-?\d*(?:\.\d+)?)/.exec(s);
  const v = m?.[1] ? Number(m[1]) : 0;
  return Number.isNaN(v) ? 0 : v;
}

export function sort(ctx: Contexto): number {
  const args = ctx.argv.slice(1);
  const op = new Set<string>();
  let sep: string | undefined;
  let campo: number | undefined;
  const archivos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (!a.startsWith("-") || a.length === 1) {
      archivos.push(a);
      continue;
    }
    for (let j = 1; j < a.length; j++) {
      const l = a[j] as string;
      if (l === "t" || l === "k") {
        const valor = a.slice(j + 1) || (args[++i] ?? "");
        if (l === "t") sep = valor;
        else campo = Number.parseInt(valor, 10);
        break;
      }
      if (!"rnu".includes(l)) {
        ctx.err(`sort: invalid option -- '${l}'\nTry 'sort --help' for more information.\n`);
        return 2;
      }
      op.add(l);
    }
  }
  let todas: string[] = [];
  for (const a of archivos.length ? archivos : ["-"]) {
    const texto = leer(ctx, a, (o, m) =>
      m === "Is a directory" ? `sort: read failed: ${o}: ${m}\n` : `sort: cannot read: ${o}: ${m}\n`,
    );
    if (texto === null) return 2;
    todas = todas.concat(lineas(texto));
  }
  const clave = (l: string) => (campo ? l.slice(inicioCampo(l, campo, sep)) : l);
  const compararClave = (a: string, b: string) => {
    const ka = clave(a);
    const kb = clave(b);
    return op.has("n") ? Math.sign(numeroInicial(ka) - numeroInicial(kb)) : compararC(ka, kb);
  };
  const signo = op.has("r") ? -1 : 1;
  const ordenadas = [...todas].sort(
    (a, b) => signo * (compararClave(a, b) || (op.has("u") ? 0 : compararC(a, b))),
  );
  const salida = op.has("u")
    ? ordenadas.filter((l, i) => i === 0 || compararClave(ordenadas[i - 1] as string, l) !== 0)
    : ordenadas;
  if (salida.length) ctx.out(`${salida.join("\n")}\n`);
  return 0;
}

// ───────────────────────────── uniq ─────────────────────────────

export function uniq(ctx: Contexto): number {
  const op = new Set<string>();
  const archivos: string[] = [];
  for (const a of ctx.argv.slice(1)) {
    if (a.startsWith("-") && a.length > 1) {
      for (const l of a.slice(1)) {
        if (!"cd".includes(l)) {
          ctx.err(`uniq: invalid option -- '${l}'\nTry 'uniq --help' for more information.\n`);
          return 1;
        }
        op.add(l);
      }
    } else archivos.push(a);
  }
  const texto = leer(ctx, archivos[0] ?? "-", (o, m) => `uniq: ${o}: ${m}\n`);
  if (texto === null) return 1;
  const grupos: { linea: string; n: number }[] = [];
  for (const l of lineas(texto)) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.linea === l) ultimo.n++;
    else grupos.push({ linea: l, n: 1 });
  }
  let salida = "";
  for (const g of grupos) {
    if (op.has("d") && g.n < 2) continue;
    salida += op.has("c") ? `${String(g.n).padStart(7)} ${g.linea}\n` : `${g.linea}\n`;
  }
  ctx.out(salida);
  return 0;
}

// ───────────────────────────── cut ─────────────────────────────

function parsearLista(lista: string): ((n: number) => boolean) | null {
  const rangos: [number, number][] = [];
  for (const parte of lista.split(",")) {
    const m = /^(\d*)-(\d*)$/.exec(parte);
    if (m) {
      const desde = m[1] ? Number(m[1]) : 1;
      const hasta = m[2] ? Number(m[2]) : Number.POSITIVE_INFINITY;
      if (!m[1] && !m[2]) return null;
      rangos.push([desde, hasta]);
    } else if (/^\d+$/.test(parte) && Number(parte) > 0) rangos.push([Number(parte), Number(parte)]);
    else return null;
  }
  return (n) => rangos.some(([a, b]) => n >= a && n <= b);
}

export function cut(ctx: Contexto): number {
  const args = ctx.argv.slice(1);
  let delim = "\t";
  let lista: string | undefined;
  const archivos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (a.startsWith("-d")) delim = a.length > 2 ? a.slice(2) : (args[++i] ?? "");
    else if (a.startsWith("-f")) lista = a.length > 2 ? a.slice(2) : args[++i];
    else if (a.startsWith("-") && a.length > 1) {
      ctx.err(`cut: invalid option -- '${a[1]}'\nTry 'cut --help' for more information.\n`);
      return 1;
    } else archivos.push(a);
  }
  if (lista === undefined) {
    ctx.err(
      "cut: you must specify a list of bytes, characters, or fields\nTry 'cut --help' for more information.\n",
    );
    ctx.glosa("Dile a cut qué campos quieres con -f, por ejemplo: `cut -d, -f1 archivo`.");
    return 1;
  }
  if (delim.length !== 1) {
    ctx.err("cut: the delimiter must be a single character\nTry 'cut --help' for more information.\n");
    return 1;
  }
  const elegido = parsearLista(lista);
  if (!elegido) {
    ctx.err(`cut: invalid field value '${lista}'\nTry 'cut --help' for more information.\n`);
    return 1;
  }
  let codigo = 0;
  for (const a of archivos.length ? archivos : ["-"]) {
    const texto = leer(ctx, a, (o, m) => `cut: ${o}: ${m}\n`);
    if (texto === null) {
      codigo = 1;
      continue;
    }
    let salida = "";
    for (const l of lineas(texto)) {
      if (!l.includes(delim)) {
        salida += `${l}\n`;
        continue;
      }
      salida += `${l
        .split(delim)
        .filter((_, i) => elegido(i + 1))
        .join(delim)}\n`;
    }
    ctx.out(salida);
  }
  return codigo;
}
