import type { PartidaCreada } from "../../shared/api";
import { normalizarCodigo } from "../../shared/codigo";
import { CABECERA_CODIGO } from "../../shared/limites";
import { leerPartida, type Partida } from "../../shared/partida";

/**
 * Cliente de /api/partidas (F4-11). El código viaja en la cabecera x-codigo-partida, nunca en la URL. Todo
 * lo que llega del servidor se valida con el mismo esquema que usa el servidor antes de usarse.
 */
export type Motivo =
  | "no_encontrado"
  | "invalido"
  | "demasiadas"
  | "sin_servicio"
  | "sin_conexion"
  | "conflicto";
export type RespuestaApi<T> = { ok: true; valor: T } | { ok: false; motivo: Motivo; revision?: number };

export interface ApiPartidas {
  crear(nombre: string, contenido: string): Promise<RespuestaApi<PartidaCreada>>;
  leer(codigo: string): Promise<RespuestaApi<{ revision: number; partida: Partida }>>;
  guardar(codigo: string, revision: number, partida: Partida): Promise<RespuestaApi<{ revision: number }>>;
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

const esRevision = (r: unknown): r is number => Number.isInteger(r) && (r as number) >= 1;

function motivoDe(status: number): Motivo {
  if (status === 404) return "no_encontrado";
  if (status === 429) return "demasiadas";
  if (status === 409) return "conflicto";
  if (status === 400 || status === 413) return "invalido";
  return "sin_servicio";
}

export function crearApiPartidas(f: Fetch = (url, init) => fetch(url, init)): ApiPartidas {
  async function pedir(url: string, init: RequestInit): Promise<{ status: number; cuerpo: unknown } | null> {
    try {
      const r = await f(url, { ...init, credentials: "same-origin", cache: "no-store" });
      let cuerpo: unknown = null;
      try {
        cuerpo = await r.json();
      } catch {
        cuerpo = null;
      }
      return { status: r.status, cuerpo };
    } catch {
      return null;
    }
  }
  const json = { "content-type": "application/json" };

  return {
    async crear(nombre, contenido) {
      const r = await pedir("/api/partidas", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ nombre, contenido }),
      });
      if (!r) return { ok: false, motivo: "sin_conexion" };
      if (r.status !== 201) return { ok: false, motivo: motivoDe(r.status) };
      const c = r.cuerpo as Partial<PartidaCreada> | null;
      const codigo = typeof c?.codigo === "string" ? normalizarCodigo(c.codigo) : null;
      const partida = leerPartida(c?.partida);
      if (!codigo || !esRevision(c?.revision) || !partida.ok) return { ok: false, motivo: "invalido" };
      return { ok: true, valor: { codigo, revision: c.revision, partida: partida.partida } };
    },
    async leer(codigo) {
      const r = await pedir("/api/partida", { method: "GET", headers: { [CABECERA_CODIGO]: codigo } });
      if (!r) return { ok: false, motivo: "sin_conexion" };
      if (r.status !== 200) return { ok: false, motivo: motivoDe(r.status) };
      const c = r.cuerpo as { revision?: unknown; partida?: unknown } | null;
      const partida = leerPartida(c?.partida);
      if (!esRevision(c?.revision) || !partida.ok) return { ok: false, motivo: "invalido" };
      return { ok: true, valor: { revision: c.revision, partida: partida.partida } };
    },
    async guardar(codigo, revision, partida) {
      const r = await pedir("/api/partida", {
        method: "PUT",
        headers: { ...json, [CABECERA_CODIGO]: codigo },
        body: JSON.stringify({ revision, partida }),
      });
      if (!r) return { ok: false, motivo: "sin_conexion" };
      const c = r.cuerpo as { revision?: unknown } | null;
      if (r.status === 409)
        return esRevision(c?.revision)
          ? { ok: false, motivo: "conflicto", revision: c.revision }
          : { ok: false, motivo: "invalido" };
      if (r.status !== 200) return { ok: false, motivo: motivoDe(r.status) };
      return esRevision(c?.revision)
        ? { ok: true, valor: { revision: c.revision } }
        : { ok: false, motivo: "invalido" };
    },
  };
}
