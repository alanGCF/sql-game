import { normalizarCodigo } from "../../shared/codigo";
import {
  leerPartida,
  type MensajeBuzon,
  type Partida,
  type PistaAnotada,
  partidaNueva,
} from "../../shared/partida";
import type { ApiPartidas, Motivo } from "./api";
import type { EstadoJornada, Jornada } from "./jornada";

/**
 * Guardado de la partida (F4-12, 04-mecanicas.md §Guardado): en el navegador tras cada acción y en el
 * servidor en cada checkpoint (misión, favor o turno terminados). Sin conexión se sigue en local y se sube
 * al volver. El código de partida es la única llave.
 */
export interface GuardadoLocal {
  /** Código de partida canónico (12 símbolos) o null si la partida se creó sin servidor. */
  codigo: string | null;
  revision: number;
  /** Hay cambios locales que el servidor todavía no tiene. */
  pendiente: boolean;
  partida: Partida;
}

export interface AlmacenLocal {
  leer(): Promise<unknown>;
  escribir(g: GuardadoLocal): Promise<void>;
  borrar(): Promise<void>;
}

/** Lo guardado en el navegador también se valida: alguien pudo editarlo a mano. */
export function leerGuardadoLocal(d: unknown): GuardadoLocal | null {
  if (!d || typeof d !== "object") return null;
  const g = d as Record<string, unknown>;
  const codigo =
    g.codigo === null ? null : typeof g.codigo === "string" ? normalizarCodigo(g.codigo) : undefined;
  if (codigo === undefined || (g.codigo !== null && codigo === null)) return null;
  if (!Number.isInteger(g.revision) || (g.revision as number) < 0 || typeof g.pendiente !== "boolean")
    return null;
  const partida = leerPartida(g.partida);
  if (!partida.ok) return null;
  return { codigo, revision: g.revision as number, pendiente: g.pendiente, partida: partida.partida };
}

export interface DatosPartida {
  semilla: number;
  nombre: string;
  contenido: string;
  xp: number;
  notas: string[];
  pistas: PistaAnotada[];
  buzon: MensajeBuzon[];
  postits: string[];
}

export function aPartida(j: Jornada, d: DatosPartida): Partida {
  const e = j.guardar();
  return {
    formato: 1,
    semilla: d.semilla,
    nombre: d.nombre,
    contenido: d.contenido,
    turno: typeof j.turno.turno === "number" ? j.turno.turno : 0,
    completadas: Object.fromEntries(
      Object.entries(e.completadas).map(([id, estrellas]) => [id, { estrellas }]),
    ),
    favores: e.favores,
    flags: e.flags,
    xp: d.xp,
    notas: d.notas,
    reloj: e.reloj,
    mundo: e.mundo,
    mision: e.mision,
    llamadas: e.llamadas,
    pistas: d.pistas,
    buzon: d.buzon,
    postits: d.postits,
  };
}

export function estadoDe(p: Partida): EstadoJornada {
  return {
    reloj: p.reloj,
    // Zod tipa los opcionales como `T | undefined`; el VFS los quiere ausentes.
    mundo: {
      cambiados: p.mundo.cambiados.map(({ contenido, ...resto }) =>
        contenido === undefined ? resto : { ...resto, contenido },
      ),
      borrados: p.mundo.borrados,
    },
    mision: p.mision,
    completadas: Object.fromEntries(
      Object.entries(p.completadas).map(([id, c]) => [id, c.estrellas as 1 | 2 | 3]),
    ),
    favores: p.favores,
    flags: p.flags,
    llamadas: p.llamadas,
  };
}

export type ResultadoEntrada = { ok: true; codigo: string; partida: Partida } | { ok: false; motivo: Motivo };

export class Guardian {
  estado: GuardadoLocal | null = null;
  private cola: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly almacen: AlmacenLocal,
    private readonly api: ApiPartidas,
  ) {}

  /** Las escrituras van en fila: dos guardados seguidos nunca se pisan fuera de orden. */
  private enFila<T>(f: () => Promise<T>): Promise<T> {
    const r = this.cola.then(f, f);
    this.cola = r.catch(() => undefined);
    return r;
  }

  private async escribir(): Promise<void> {
    if (!this.estado) return;
    try {
      await this.almacen.escribir(this.estado);
    } catch {
      // Sin almacenamiento (modo privado, cuota llena): se sigue jugando; el servidor tiene los checkpoints.
    }
  }

  async cargarLocal(): Promise<GuardadoLocal | null> {
    let crudo: unknown = null;
    try {
      crudo = await this.almacen.leer();
    } catch {
      crudo = null;
    }
    this.estado = leerGuardadoLocal(crudo);
    return this.estado;
  }

  /** "No soy yo" (D-26): esta computadora olvida la partida; en el servidor sigue con su número. */
  olvidar(): Promise<void> {
    return this.enFila(async () => {
      this.estado = null;
      try {
        await this.almacen.borrar();
      } catch {
        // Sin almacenamiento no había nada que borrar.
      }
    });
  }

  /** Primer día: la partida se crea en el servidor (código y semilla); sin servidor, solo en local. */
  async empezar(
    nombre: string,
    contenido: string,
    semillaLocal: () => number,
  ): Promise<{ codigo: string | null; partida: Partida; sinServidor: boolean }> {
    const r = await this.api.crear(nombre, contenido);
    this.estado = r.ok
      ? { codigo: r.valor.codigo, revision: r.valor.revision, pendiente: false, partida: r.valor.partida }
      : {
          codigo: null,
          revision: 0,
          pendiente: false,
          partida: partidaNueva(semillaLocal(), nombre, contenido),
        };
    await this.enFila(() => this.escribir());
    return { codigo: this.estado.codigo, partida: this.estado.partida, sinServidor: !r.ok };
  }

  async checarEntrada(entrada: string): Promise<ResultadoEntrada> {
    const codigo = normalizarCodigo(entrada);
    if (!codigo) return { ok: false, motivo: "invalido" };
    const r = await this.api.leer(codigo);
    if (!r.ok) return { ok: false, motivo: r.motivo };
    this.estado = { codigo, revision: r.valor.revision, pendiente: false, partida: r.valor.partida };
    await this.enFila(() => this.escribir());
    return { ok: true, codigo, partida: r.valor.partida };
  }

  /** Tras cada acción: solo en el navegador (el servidor lo recibe en el siguiente checkpoint). */
  guardarLocal(partida: Partida): Promise<void> {
    return this.enFila(async () => {
      if (!this.estado) return;
      this.estado = { ...this.estado, partida, pendiente: this.estado.codigo !== null };
      await this.escribir();
    });
  }

  /** Misión, favor o turno terminados: en el navegador y en el servidor. */
  async checkpoint(partida: Partida): Promise<void> {
    await this.guardarLocal(partida);
    await this.subir();
  }

  /** Sube lo pendiente. Una revisión vieja (otra computadora guardó antes) se toma y se reintenta: gana el último checkpoint. */
  subir(): Promise<void> {
    return this.enFila(async () => {
      for (let intento = 0; intento < 2; intento++) {
        const e = this.estado;
        if (!e?.codigo || !e.pendiente) return;
        const r = await this.api.guardar(e.codigo, e.revision, e.partida);
        if (r.ok) {
          this.estado = { ...e, revision: r.valor.revision, pendiente: false };
          await this.escribir();
          return;
        }
        if (r.motivo === "conflicto" && r.revision !== undefined) {
          this.estado = { ...e, revision: r.revision };
          continue;
        }
        return; // sin conexión o sin servicio: queda pendiente
      }
    });
  }
}
