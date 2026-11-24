import { type Contexto, errorVfs, resolver } from "../shell/executor";
import { compararC } from "../shell/expand";
import { tamano, VfsError, type VNode } from "../vfs";
import { glosaError, separarBanderas } from "./comun";
import { ayuda } from "./man";

/** Imita GNU coreutils 9 `ls` con el alias de Debian `--color=auto`, ancho 80 y LC_ALL=C. */

const ANCHO_TERMINAL = 80;
const SEIS_MESES_MS = (31556952 / 2) * 1000;
const MESES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLOR_DIR = "\x1b[01;34m";
const COLOR_EJECUTABLE = "\x1b[01;32m";
const RESET = "\x1b[0m";

interface Item {
  nombre: string;
  nodo: VNode;
}

interface Opciones {
  todos: boolean;
  largo: boolean;
  humano: boolean;
  unoPorLinea: boolean;
  directorio: boolean;
  recursivo: boolean;
  porTiempo: boolean;
  inverso: boolean;
  color: boolean;
  columnas: boolean;
}

function colorDe(n: VNode): string | null {
  if (n.type === "dir") return COLOR_DIR;
  if (n.mode & 0o111) return COLOR_EJECUTABLE;
  return null;
}

/** GNU imprime un reset extra antes del primer nombre coloreado de toda la salida. */
class Pintor {
  private usado = false;
  constructor(private readonly activo: boolean) {}
  nombre(item: Item): string {
    const c = this.activo ? colorDe(item.nodo) : null;
    if (!c) return item.nombre;
    const previo = this.usado ? "" : RESET;
    this.usado = true;
    return `${previo}${c}${item.nombre}${RESET}`;
  }
}

function ordenar(items: Item[], o: Opciones): Item[] {
  const r = [...items].sort((a, b) =>
    o.porTiempo
      ? b.nodo.mtime - a.nodo.mtime || compararC(a.nombre, b.nombre)
      : compararC(a.nombre, b.nombre),
  );
  return o.inverso ? r.reverse() : r;
}

function modo(n: VNode): string {
  const bits = "rwxrwxrwx";
  let s = n.type === "dir" ? "d" : "-";
  for (let i = 0; i < 9; i++) s += n.mode & (1 << (8 - i)) ? bits[i] : "-";
  return s;
}

function bloques(n: VNode): number {
  return n.type === "dir" ? 4 : Math.ceil(tamano(n) / 4096) * 4;
}

/** Tamaño legible como GNU `-h` (redondeo hacia arriba, un decimal si es < 10). */
export function humano(bytes: number): string {
  if (bytes < 1024) return String(bytes);
  const unidades = ["K", "M", "G", "T"];
  let v = bytes;
  let u = -1;
  do {
    v /= 1024;
    u++;
  } while (v >= 1024 && u < unidades.length - 1);
  const texto = v < 10 ? (Math.ceil(v * 10) / 10).toFixed(1) : String(Math.ceil(v));
  // 9.95 → "10.0" no existe en GNU: se pasa a entero.
  return (texto === "10.0" ? "10" : texto) + unidades[u];
}

function fecha(ms: number, ahora: number): string {
  const d = new Date(ms);
  const mes = MESES[d.getUTCMonth()];
  const dia = String(d.getUTCDate()).padStart(2, " ");
  const reciente = ms <= ahora && ahora - ms < SEIS_MESES_MS;
  if (reciente) {
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${mes} ${dia} ${hh}:${mm}`;
  }
  return `${mes} ${dia}  ${d.getUTCFullYear()}`;
}

function enlaces(n: VNode): number {
  if (n.type !== "dir") return 1;
  let subdirs = 0;
  for (const h of n.children.values()) if (h.type === "dir") subdirs++;
  return 2 + subdirs;
}

function formatoLargo(items: Item[], o: Opciones, ahora: number, pintor: Pintor, conTotal: boolean): string {
  const filas = items.map((it) => ({
    modo: modo(it.nodo),
    enlaces: String(enlaces(it.nodo)),
    dueno: it.nodo.owner,
    grupo: it.nodo.group,
    tam: o.humano ? humano(tamano(it.nodo)) : String(tamano(it.nodo)),
    fecha: fecha(it.nodo.mtime, ahora),
    item: it,
  }));
  const w = (k: "enlaces" | "dueno" | "grupo" | "tam") => Math.max(0, ...filas.map((f) => f[k].length));
  const [wE, wD, wG, wT] = [w("enlaces"), w("dueno"), w("grupo"), w("tam")];
  let s = "";
  if (conTotal) {
    const total = items.reduce((t, it) => t + bloques(it.nodo), 0);
    s += `total ${o.humano ? humano(total * 1024) : total}\n`;
  }
  for (const f of filas) {
    s += `${f.modo} ${f.enlaces.padStart(wE)} ${f.dueno.padEnd(wD)} ${f.grupo.padEnd(wG)} ${f.tam.padStart(wT)} ${f.fecha} ${pintor.nombre(f.item)}\n`;
  }
  return s;
}

/** Columnas verticales como `ls -C` de GNU (separación de 2 espacios; con color no usa tabuladores). */
function formatoColumnas(items: Item[], pintor: Pintor): string {
  if (items.length === 0) return "";
  const largos = items.map((i) => i.nombre.length);
  let mejor = { columnas: 1, filas: items.length, anchos: [Math.max(...largos)] };
  // GNU: cada columna mide al menos 3 (1 carácter + 2 de separación).
  for (let cols = 2; cols <= Math.min(items.length, Math.floor(ANCHO_TERMINAL / 3)); cols++) {
    const filas = Math.ceil(items.length / cols);
    const usadas = Math.ceil(items.length / filas);
    const anchos: number[] = [];
    for (let c = 0; c < usadas; c++) {
      const columna = largos.slice(c * filas, (c + 1) * filas);
      anchos.push(Math.max(...columna) + (c === usadas - 1 ? 0 : 2));
    }
    if (anchos.reduce((a, b) => a + b, 0) < ANCHO_TERMINAL) mejor = { columnas: usadas, filas, anchos };
  }
  let s = "";
  for (let f = 0; f < mejor.filas; f++) {
    let linea = "";
    for (let c = 0; c < mejor.columnas; c++) {
      const idx = c * mejor.filas + f;
      const it = items[idx];
      if (!it) break;
      const siguiente = items[(c + 1) * mejor.filas + f];
      linea += pintor.nombre(it);
      if (siguiente) linea += " ".repeat((mejor.anchos[c] as number) - it.nombre.length);
    }
    s += `${linea}\n`;
  }
  return s;
}

function listar(items: Item[], o: Opciones, ahora: number, pintor: Pintor, conTotal: boolean): string {
  if (o.largo) return formatoLargo(items, o, ahora, pintor, conTotal);
  if (o.columnas) return formatoColumnas(items, pintor);
  return items.map((it) => `${pintor.nombre(it)}\n`).join("");
}

function contenido(ctx: Contexto, abs: string, nodo: VNode, o: Opciones): Item[] {
  const entradas = ctx.vfs.readdir(abs, ctx.sesion.usuario);
  const items: Item[] = entradas
    .filter(([n]) => o.todos || !n.startsWith("."))
    .map(([nombre, n]) => ({ nombre, nodo: n }));
  if (o.todos) {
    items.push({ nombre: ".", nodo });
    const padreAbs = abs === "/" ? "/" : abs.slice(0, abs.lastIndexOf("/")) || "/";
    items.push({ nombre: "..", nodo: ctx.vfs.lookup(padreAbs) });
  }
  return ordenar(items, o);
}

export function ls(ctx: Contexto): number {
  const args = ctx.argv.slice(1).map((a) => (a === "--all" ? "-a" : a));
  if (args.includes("--help")) return ayuda(ctx, "ls");
  const { banderas, operandos } = separarBanderas(args);
  for (const b of banderas) {
    if (!"alh1dRtr".includes(b)) {
      ctx.err(`ls: invalid option -- '${b}'\nTry 'ls --help' for more information.\n`);
      return 2;
    }
  }
  const o: Opciones = {
    todos: banderas.has("a"),
    largo: banderas.has("l"),
    humano: banderas.has("h"),
    unoPorLinea: banderas.has("1"),
    directorio: banderas.has("d"),
    recursivo: banderas.has("R"),
    porTiempo: banderas.has("t"),
    inverso: banderas.has("r"),
    color: ctx.isatty,
    columnas: ctx.isatty && !banderas.has("1"),
  };
  const ahora = ctx.reloj.now();
  const pintor = new Pintor(o.color);
  const objetivos = operandos.length ? operandos : ["."];
  let codigo = 0;

  const archivos: Item[] = [];
  const directorios: { etiqueta: string; abs: string; nodo: VNode }[] = [];
  for (const op of objetivos) {
    const abs = resolver(ctx, op);
    try {
      const nodo = ctx.vfs.lookup(abs, ctx.sesion.usuario);
      if (nodo.type === "dir" && !o.directorio) directorios.push({ etiqueta: op, abs, nodo });
      else archivos.push({ nombre: op, nodo });
    } catch (e) {
      ctx.err(`ls: cannot access '${op}': ${errorVfs(e)}\n`);
      glosaError(ctx, op, e);
      codigo = 2;
    }
  }

  let salida = "";
  const ordenados = ordenar(archivos, o);
  if (ordenados.length) salida += listar(ordenados, o, ahora, pintor, false);
  const conEncabezado = o.recursivo || objetivos.length > 1;
  const pendientes = [...directorios].sort((a, b) => compararC(a.etiqueta, b.etiqueta));
  if (o.inverso) pendientes.reverse();
  let primero = ordenados.length === 0;
  while (pendientes.length) {
    const d = pendientes.shift() as { etiqueta: string; abs: string; nodo: VNode };
    try {
      const items = contenido(ctx, d.abs, d.nodo, o);
      if (!primero) salida += "\n";
      if (conEncabezado) salida += `${d.etiqueta}:\n`;
      salida += listar(items, o, ahora, pintor, true);
      primero = false;
      if (o.recursivo) {
        const subdirs = items
          .filter((it) => it.nodo.type === "dir" && it.nombre !== "." && it.nombre !== "..")
          .map((it) => ({
            etiqueta: d.etiqueta === "/" ? `/${it.nombre}` : `${d.etiqueta}/${it.nombre}`,
            abs: d.abs === "/" ? `/${it.nombre}` : `${d.abs}/${it.nombre}`,
            nodo: it.nodo,
          }));
        pendientes.unshift(...subdirs);
      }
    } catch (e) {
      if (!(e instanceof VfsError)) throw e;
      ctx.err(`ls: cannot open directory '${d.etiqueta}': ${errorVfs(e)}\n`);
      glosaError(ctx, d.etiqueta, e);
      codigo = 2;
    }
  }
  if (salida) ctx.out(salida);
  return codigo;
}
