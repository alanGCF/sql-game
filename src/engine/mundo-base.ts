import { GameClock, Shell } from "./index";
import { GENERADORES } from "./mision/generadores";
import type { MundoBase } from "./mundo-esquema";
import { crearRng, subSemilla } from "./rng";
import { conUsuario, USUARIO_POR_OMISION } from "./usuario";
import { plantilla, resolverVariables, type Variables } from "./vars";
import { agregarEntradas, type Entrada, vfsDesde } from "./vfs";

// El esquema vive en mundo-esquema.ts: el cliente recibe el mundo ya validado en build y no carga Zod.
export type { MundoBase } from "./mundo-esquema";

export interface OpcionesSesion {
  host: string;
  usuario: string;
  /** Reloj de juego al iniciar (ISO 8601). */
  ahora: string;
  cwd?: string;
  /** Tu usuario (F4-17): reemplaza `{{usuario}}` en el mundo y en la sesión; por omisión, "tecnico". */
  jugador?: string;
}

/** Shell sobre el mundo base con las variables de partida resueltas con la semilla. */
export function crearShellBase(
  mundo: MundoBase,
  semilla: number,
  o: OpcionesSesion,
): { shell: Shell; vars: Variables } {
  const jugador = o.jugador ?? USUARIO_POR_OMISION;
  const crudo = mundo.hosts.find((h) => h.host === o.host);
  if (!crudo) throw new Error(`host desconocido: ${o.host}`);
  const host = conUsuario(crudo, jugador);
  o = conUsuario(o, jugador);
  const u = host.usuarios[o.usuario];
  if (!u) throw new Error(`el usuario ${o.usuario} no existe en ${o.host}`);
  const vars = { ...resolverVariables(semilla, mundo.variables), usuario: jugador };
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
  const vfs = vfsDesde(entradas, reloj.now());
  for (const g of host.generadores ?? []) {
    const generar = GENERADORES[g.generador];
    if (!generar) throw new Error(`generador desconocido: ${g.generador}`);
    const rng = crearRng(subSemilla(semilla, `mundo:${host.host}:${g.generador}:${g.destino}`));
    const cantidad = Number(plantilla(String(g.cantidad), vars));
    agregarEntradas(vfs, generar(rng, g.destino, cantidad, g.dueno ?? "root", vars), reloj.now());
  }
  const shell = Shell.crear(
    vfs,
    reloj,
    { name: o.usuario, groups: u.grupos, home: u.home },
    host.host,
    o.cwd ?? u.home,
  );
  return { shell, vars };
}
