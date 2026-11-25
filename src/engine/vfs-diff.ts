import { type DirNode, Vfs, type VNode } from "./vfs";

/** Diferencias de un mundo respecto a su mundo base: es lo único que se guarda de la partida. */
export interface EntradaDiff {
  ruta: string;
  tipo: "file" | "dir";
  contenido?: string;
  mode: number;
  owner: string;
  group: string;
  mtime: number;
}

export interface DiffVfs {
  cambiados: EntradaDiff[];
  borrados: string[];
}

function meta(ruta: string, n: VNode): EntradaDiff {
  const e: EntradaDiff = { ruta, tipo: n.type, mode: n.mode, owner: n.owner, group: n.group, mtime: n.mtime };
  if (n.type === "file") e.contenido = n.content;
  return e;
}

function igualMeta(a: VNode, b: VNode): boolean {
  return (
    a.type === b.type &&
    a.mode === b.mode &&
    a.owner === b.owner &&
    a.group === b.group &&
    a.mtime === b.mtime &&
    (a.type !== "file" || b.type !== "file" || a.content === b.content)
  );
}

export function diferencias(base: Vfs, actual: Vfs): DiffVfs {
  const diff: DiffVfs = { cambiados: [], borrados: [] };
  const recorrer = (ruta: string, b: VNode | undefined, a: VNode | undefined) => {
    if (!a) {
      if (b) diff.borrados.push(ruta);
      return;
    }
    if (!b || !igualMeta(a, b)) diff.cambiados.push(meta(ruta, a));
    if (b && b.type !== a.type) {
      // cambió de tipo: se trata como borrado + nuevo (ya registrado arriba)
    }
    if (a.type === "dir") {
      const hijosBase = b?.type === "dir" ? b.children : new Map<string, VNode>();
      for (const [n, h] of a.children) recorrer(`${ruta === "/" ? "" : ruta}/${n}`, hijosBase.get(n), h);
      for (const [n, h] of hijosBase)
        if (!a.children.has(n)) recorrer(`${ruta === "/" ? "" : ruta}/${n}`, h, undefined);
    }
  };
  recorrer("/", base.root, actual.root);
  return diff;
}

/** Reconstruye el mundo actual a partir del base y sus diferencias (el base no se modifica). */
export function aplicarDiferencias(base: Vfs, diff: DiffVfs): Vfs {
  const v = base.clone();
  // Segunda defensa (el esquema ya exige rutas canónicas): nada de nombres vacíos, "." ni "..".
  const nombreDe = (ruta: string): string => {
    const partes = ruta.split("/");
    const nombre = partes[partes.length - 1];
    if (partes[0] !== "" || partes.slice(1).some((p) => p === "" || p === "." || p === "..") || !nombre)
      throw new Error(`diff inválido: ruta no canónica ${JSON.stringify(ruta)}`);
    return nombre;
  };
  const buscarPadre = (ruta: string): DirNode => {
    const partes = ruta.split("/").filter(Boolean);
    partes.pop();
    let n: VNode = v.root;
    for (const p of partes) {
      const h: VNode | undefined = n.type === "dir" ? n.children.get(p) : undefined;
      if (!h || h.type !== "dir") throw new Error(`diff inválido: falta carpeta para ${ruta}`);
      n = h;
    }
    return n as DirNode;
  };
  for (const ruta of [...diff.borrados].sort((a, b) => b.length - a.length)) {
    const nombre = nombreDe(ruta);
    buscarPadre(ruta).children.delete(nombre);
  }
  for (const e of [...diff.cambiados].sort((a, b) => a.ruta.split("/").length - b.ruta.split("/").length)) {
    const metaN = { mode: e.mode, owner: e.owner, group: e.group, mtime: e.mtime };
    if (e.ruta === "/") {
      Object.assign(v.root, metaN);
      continue;
    }
    const nombre = nombreDe(e.ruta);
    const padre = buscarPadre(e.ruta);
    const existente = padre.children.get(nombre);
    if (e.tipo === "dir") {
      if (existente?.type === "dir") Object.assign(existente, metaN);
      else padre.children.set(nombre, { type: "dir", ...metaN, children: new Map() });
    } else padre.children.set(nombre, { type: "file", ...metaN, content: e.contenido ?? "" });
  }
  return v;
}

export { Vfs };
