import { GameClock } from "./clock";
import { COMANDOS } from "./commands";
import { clasificar, frasePensamiento } from "./shell/classify";
import { ejecutar, type Fragmento, type Mundo, type Registro, type Sesion } from "./shell/executor";
import type { User, Vfs } from "./vfs";

export type { Fragmento, Mundo, Registro, Sesion } from "./shell/executor";

export interface ResultadoLinea {
  /** false si la línea no se ejecutó (globo de pensamiento): la UI la deja en el input. */
  ejecutada: boolean;
  fragmentos: Fragmento[];
  pensamiento?: string;
}

export interface OpcionesShell {
  /** Solo pruebas: forzar que la salida no vaya a una terminal (sin columnas ni color). */
  sinTerminal?: boolean;
}

/** Sesión de terminal del jugador sobre un mundo. API pública del motor para la UI y las pruebas. */
export class Shell {
  readonly registro: Registro = { leidos: new Set(), cambiados: new Set() };

  constructor(
    readonly mundo: Mundo,
    readonly sesion: Sesion,
  ) {}

  static crear(vfs: Vfs, reloj: GameClock, usuario: User, host: string, cwd = usuario.home): Shell {
    const sesion: Sesion = {
      usuario,
      host,
      cwd,
      env: new Map([
        ["HOME", usuario.home],
        ["USER", usuario.name],
        ["LOGNAME", usuario.name],
        ["PWD", cwd],
        ["SHELL", "/bin/bash"],
        ["PATH", "/usr/local/bin:/usr/bin:/bin"],
        ["HOSTNAME", host],
      ]),
      historial: [],
      ultimoCodigo: 0,
      contadorPensamientos: 0,
    };
    return new Shell({ vfs, reloj, comandos: COMANDOS }, sesion);
  }

  prompt(): string {
    const { usuario, host, cwd } = this.sesion;
    const home = usuario.home;
    const corto = cwd === home ? "~" : cwd.startsWith(`${home}/`) ? `~${cwd.slice(home.length)}` : cwd;
    return `${usuario.name}@${host}:${corto}$`;
  }

  async ejecutar(linea: string, opciones: OpcionesShell = {}): Promise<ResultadoLinea> {
    const c = clasificar(linea);
    if (c.tipo === "pensamiento") {
      const texto = frasePensamiento(c.motivo, this.sesion.contadorPensamientos++, c.sugerencia);
      return { ejecutada: false, fragmentos: [], pensamiento: texto };
    }
    if (c.tipo === "vacio") return { ejecutada: true, fragmentos: [] };
    this.sesion.historial.push(linea);
    if (c.tipo === "error_sintaxis") {
      this.sesion.ultimoCodigo = 2;
      return { ejecutada: true, fragmentos: [{ tipo: "stderr", texto: `bash: ${c.mensaje}\n` }] };
    }
    const fragmentos = await ejecutar(
      c.programa,
      this.sesion,
      this.mundo,
      this.registro,
      opciones.sinTerminal,
    );
    const pensamiento = fragmentos.find((f) => f.tipo === "pensamiento")?.texto;
    return {
      ejecutada: true,
      fragmentos: fragmentos.filter((f) => f.tipo !== "pensamiento"),
      ...(pensamiento ? { pensamiento } : {}),
    };
  }
}

export { GameClock };
