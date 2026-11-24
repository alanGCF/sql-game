import { GameClock, Shell } from "./index";
import type { MundoBase } from "./mundo-esquema";
import { plantilla, resolverVariables, type Variables } from "./vars";
import { type Entrada, vfsDesde } from "./vfs";

// El esquema vive en mundo-esquema.ts: el cliente recibe el mundo ya validado en build y no carga Zod.
export type { MundoBase } from "./mundo-esquema";

export interface OpcionesSesion {
  host: string;
  usuario: string;
  /** Reloj de juego al iniciar (ISO 8601). */
  ahora: string;
  cwd?: string;
}

/** Shell sobre el mundo base con las variables de partida resueltas con la semilla. */
export function crearShellBase(
  mundo: MundoBase,
  semilla: number,
  o: OpcionesSesion,
): { shell: Shell; vars: Variables } {
  const host = mundo.hosts.find((h) => h.host === o.host);
  if (!host) throw new Error(`host desconocido: ${o.host}`);
  const u = host.usuarios[o.usuario];
  if (!u) throw new Error(`el usuario ${o.usuario} no existe en ${o.host}`);
  const vars = resolverVariables(semilla, mundo.variables);
  const entradas = host.fs.map((e): Entrada => {
    const r: Entrada = { ruta: e.ruta };
    if (e.contenido !== undefined) r.contenido = plantilla(e.contenido, vars);
    if (e.modo !== undefined) r.modo = e.modo;
    if (e.dueno !== undefined) r.dueno = e.dueno;
    if (e.grupo !== undefined) r.grupo = e.grupo;
    if (e.mtime !== undefined) r.mtime = e.mtime;
    return r;
  });
  const reloj = GameClock.desde(o.ahora);
  const shell = Shell.crear(
    vfsDesde(entradas, reloj.now()),
    reloj,
    { name: o.usuario, groups: u.grupos, home: u.home },
    host.host,
    o.cwd ?? u.home,
  );
  return { shell, vars };
}
