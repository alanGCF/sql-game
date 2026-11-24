/** Sistema de archivos virtual en memoria con permisos Unix (sin enlaces simbólicos en v1). */

export interface Meta {
  mode: number;
  owner: string;
  group: string;
  mtime: number;
}
export interface FileNode extends Meta {
  type: "file";
  content: string;
}
export interface DirNode extends Meta {
  type: "dir";
  children: Map<string, VNode>;
}
export type VNode = FileNode | DirNode;

export interface User {
  name: string;
  groups: readonly string[];
  home: string;
}

export type VfsErrorCode = "ENOENT" | "EACCES" | "ENOTDIR" | "EISDIR" | "EEXIST" | "ENOTEMPTY";

export class VfsError extends Error {
  constructor(
    readonly code: VfsErrorCode,
    readonly path: string,
  ) {
    super(`${code}: ${path}`);
  }
}

/** Mensaje que imprime GNU coreutils para cada error (locale C). */
export const MENSAJE: Record<VfsErrorCode, string> = {
  ENOENT: "No such file or directory",
  EACCES: "Permission denied",
  ENOTDIR: "Not a directory",
  EISDIR: "Is a directory",
  EEXIST: "File exists",
  ENOTEMPTY: "Directory not empty",
};

const R = 4;
const W = 2;
const X = 1;

function permite(node: Meta, user: User, bit: number): boolean {
  if (user.name === "root") return true;
  if (node.owner === user.name) return ((node.mode >> 6) & bit) !== 0;
  if (user.groups.includes(node.group)) return ((node.mode >> 3) & bit) !== 0;
  return (node.mode & bit) !== 0;
}

export const puedeLeer = (n: Meta, u: User) => permite(n, u, R);
export const puedeEscribir = (n: Meta, u: User) => permite(n, u, W);
export const puedeEjecutar = (n: Meta, u: User) => permite(n, u, X);

export function bytes(texto: string): number {
  return new TextEncoder().encode(texto).length;
}

export function tamano(n: VNode): number {
  return n.type === "dir" ? 4096 : bytes(n.content);
}

/** Normaliza una ruta (absoluta o relativa a `cwd`): resuelve `.`, `..` y barras repetidas. */
export function normalizar(cwd: string, ruta: string): string {
  const base = ruta.startsWith("/") ? [] : cwd.split("/").filter(Boolean);
  for (const parte of ruta.split("/")) {
    if (parte === "" || parte === ".") continue;
    if (parte === "..") base.pop();
    else base.push(parte);
  }
  return `/${base.join("/")}`;
}

export function nombreBase(abs: string): string {
  return abs.split("/").filter(Boolean).pop() ?? "/";
}

export function padre(abs: string): string {
  return normalizar(abs, "..");
}

export class Vfs {
  constructor(readonly root: DirNode) {}

  static vacio(mtime: number): Vfs {
    return new Vfs({ type: "dir", mode: 0o755, owner: "root", group: "root", mtime, children: new Map() });
  }

  /** Busca un nodo. Si se da `user`, exige permiso de ejecución en cada directorio atravesado. */
  lookup(abs: string, user?: User): VNode {
    let nodo: VNode = this.root;
    for (const parte of abs.split("/").filter(Boolean)) {
      if (nodo.type !== "dir") throw new VfsError("ENOTDIR", abs);
      if (user && !puedeEjecutar(nodo, user)) throw new VfsError("EACCES", abs);
      const hijo: VNode | undefined = nodo.children.get(parte);
      if (!hijo) throw new VfsError("ENOENT", abs);
      nodo = hijo;
    }
    return nodo;
  }

  exists(abs: string): boolean {
    try {
      this.lookup(abs);
      return true;
    } catch {
      return false;
    }
  }

  readFile(abs: string, user: User): string {
    const n = this.lookup(abs, user);
    if (n.type === "dir") throw new VfsError("EISDIR", abs);
    if (!puedeLeer(n, user)) throw new VfsError("EACCES", abs);
    return n.content;
  }

  readdir(abs: string, user: User): [string, VNode][] {
    const n = this.lookup(abs, user);
    if (n.type !== "dir") throw new VfsError("ENOTDIR", abs);
    if (!puedeLeer(n, user)) throw new VfsError("EACCES", abs);
    return [...n.children.entries()];
  }

  private dirPadre(abs: string, user: User): DirNode {
    const p = this.lookup(padre(abs), user);
    if (p.type !== "dir") throw new VfsError("ENOTDIR", abs);
    return p;
  }

  writeFile(abs: string, contenido: string, user: User, mtime: number, append = false): void {
    const p = this.dirPadre(abs, user);
    const nombre = nombreBase(abs);
    const existente = p.children.get(nombre);
    if (existente) {
      if (existente.type === "dir") throw new VfsError("EISDIR", abs);
      if (!puedeEscribir(existente, user)) throw new VfsError("EACCES", abs);
      existente.content = append ? existente.content + contenido : contenido;
      existente.mtime = mtime;
      return;
    }
    if (!puedeEscribir(p, user) || !puedeEjecutar(p, user)) throw new VfsError("EACCES", abs);
    p.children.set(nombre, {
      type: "file",
      mode: 0o644,
      owner: user.name,
      group: user.groups[0] ?? user.name,
      mtime,
      content: contenido,
    });
    p.mtime = mtime;
  }

  mkdir(abs: string, user: User, mtime: number): void {
    const p = this.dirPadre(abs, user);
    const nombre = nombreBase(abs);
    if (p.children.has(nombre)) throw new VfsError("EEXIST", abs);
    if (!puedeEscribir(p, user) || !puedeEjecutar(p, user)) throw new VfsError("EACCES", abs);
    p.children.set(nombre, {
      type: "dir",
      mode: 0o755,
      owner: user.name,
      group: user.groups[0] ?? user.name,
      mtime,
      children: new Map(),
    });
    p.mtime = mtime;
  }

  /** Borra un archivo o (con `recursivo`) un directorio. Requiere escritura y paso en el padre. */
  remove(abs: string, user: User, recursivo: boolean): void {
    const p = this.dirPadre(abs, user);
    const nombre = nombreBase(abs);
    const nodo = p.children.get(nombre);
    if (!nodo) throw new VfsError("ENOENT", abs);
    if (nodo.type === "dir" && !recursivo) throw new VfsError("EISDIR", abs);
    if (!puedeEscribir(p, user) || !puedeEjecutar(p, user)) throw new VfsError("EACCES", abs);
    if (nodo.type === "dir") {
      for (const hijo of [...nodo.children.keys()])
        this.remove(`${abs === "/" ? "" : abs}/${hijo}`, user, true);
    }
    p.children.delete(nombre);
  }

  /** Mueve o renombra. Requiere escritura y paso en ambos padres. */
  rename(origen: string, destino: string, user: User, mtime: number): void {
    const po = this.dirPadre(origen, user);
    const nodo = po.children.get(nombreBase(origen));
    if (!nodo) throw new VfsError("ENOENT", origen);
    const pd = this.dirPadre(destino, user);
    for (const p of [po, pd]) {
      if (!puedeEscribir(p, user) || !puedeEjecutar(p, user)) throw new VfsError("EACCES", destino);
    }
    const existente = pd.children.get(nombreBase(destino));
    if (existente?.type === "dir") throw new VfsError("EISDIR", destino);
    po.children.delete(nombreBase(origen));
    pd.children.set(nombreBase(destino), nodo);
    po.mtime = mtime;
    pd.mtime = mtime;
  }

  /** Actualiza la fecha de modificación (touch) de un nodo existente. */
  tocar(abs: string, user: User, mtime: number): void {
    const n = this.lookup(abs, user);
    if (n.owner !== user.name && !puedeEscribir(n, user)) throw new VfsError("EACCES", abs);
    n.mtime = mtime;
  }

  /** Copia profunda (para restaurar misiones y para calcular respuestas en un mundo oculto). */
  clone(): Vfs {
    const copiar = (n: VNode): VNode =>
      n.type === "file"
        ? { ...n }
        : { ...n, children: new Map([...n.children].map(([k, v]) => [k, copiar(v)])) };
    return new Vfs(copiar(this.root) as DirNode);
  }
}

/** Descripción declarativa de archivos para mundos y fixtures de pruebas. */
export interface Entrada {
  /** Ruta absoluta; termina en `/` si es directorio. */
  ruta: string;
  contenido?: string;
  modo?: string;
  dueno?: string;
  grupo?: string;
  mtime?: string;
}

export function vfsDesde(entradas: readonly Entrada[], mtimeBase: number): Vfs {
  const vfs = Vfs.vacio(mtimeBase);
  agregarEntradas(vfs, entradas, mtimeBase);
  return vfs;
}

/** Agrega o reemplaza entradas declarativas en un VFS existente (mundos base y parches de misión). */
export function agregarEntradas(vfs: Vfs, entradas: readonly Entrada[], mtimeBase: number): void {
  const asegurarDir = (abs: string, e?: Entrada): DirNode => {
    let nodo = vfs.root;
    for (const parte of abs.split("/").filter(Boolean)) {
      let hijo = nodo.children.get(parte);
      if (!hijo) {
        hijo = {
          type: "dir",
          mode: 0o755,
          owner: "root",
          group: "root",
          mtime: mtimeBase,
          children: new Map(),
        };
        nodo.children.set(parte, hijo);
      }
      if (hijo.type !== "dir") throw new Error(`agregarEntradas: ${abs} no es directorio`);
      nodo = hijo;
    }
    if (e) aplicarMeta(nodo, e, mtimeBase);
    return nodo;
  };
  for (const e of entradas) {
    if (e.ruta.endsWith("/")) {
      asegurarDir(e.ruta, e);
      continue;
    }
    const p = asegurarDir(padre(e.ruta));
    const archivo: FileNode = {
      type: "file",
      mode: 0o644,
      owner: "root",
      group: "root",
      mtime: mtimeBase,
      content: e.contenido ?? "",
    };
    aplicarMeta(archivo, e, mtimeBase);
    p.children.set(nombreBase(e.ruta), archivo);
  }
}

function aplicarMeta(n: Meta, e: Entrada, mtimeBase: number): void {
  if (e.modo) n.mode = Number.parseInt(e.modo, 8);
  if (e.dueno) {
    n.owner = e.dueno;
    n.group = e.grupo ?? e.dueno;
  }
  if (e.grupo) n.group = e.grupo;
  n.mtime = e.mtime ? Date.parse(e.mtime) : mtimeBase;
}
