import { createHash } from "node:crypto";
import pg from "pg";
import type { Partida } from "../../shared/partida.js";

/**
 * Almacén de partidas (05-arquitectura.md §Servidor, 08-seguridad.md). Solo se guarda sha256(código):
 * el código en claro nunca llega a la base ni a los logs. `revision` crece en cada guardado y evita que un
 * checkpoint viejo pise uno nuevo.
 */
export interface Guardada {
  datos: unknown;
  revision: number;
}

export type ResultadoGuardar =
  | { tipo: "ok"; revision: number }
  | { tipo: "no_existe" }
  | { tipo: "conflicto"; revision: number };

export interface RepositorioPartidas {
  /** false si el hash ya existía (colisión de código: se genera otro). */
  crear(hash: Buffer, datos: Partida): Promise<boolean>;
  leer(hash: Buffer): Promise<Guardada | null>;
  /** Guarda si `revision` es la vigente; la nueva es `revision + 1`. */
  guardar(hash: Buffer, datos: Partida, revision: number): Promise<ResultadoGuardar>;
  /** Borra las partidas sin actividad en `dias` días (D-18); devuelve cuántas. */
  borrarInactivas(dias: number): Promise<number>;
  cerrar(): Promise<void>;
}

export const hashCodigo = (codigo: string): Buffer => createHash("sha256").update(codigo).digest();

const DIA_MS = 86_400_000;

/** Para desarrollo local y pruebas: se pierde al reiniciar. */
export function repositorioEnMemoria(ahora: () => number = Date.now): RepositorioPartidas {
  const filas = new Map<string, { datos: string; revision: number; actualizada: number }>();
  return {
    async crear(hash, datos) {
      const k = hash.toString("hex");
      if (filas.has(k)) return false;
      filas.set(k, { datos: JSON.stringify(datos), revision: 1, actualizada: ahora() });
      return true;
    },
    async leer(hash) {
      const f = filas.get(hash.toString("hex"));
      return f ? { datos: JSON.parse(f.datos), revision: f.revision } : null;
    },
    async guardar(hash, datos, revision) {
      const f = filas.get(hash.toString("hex"));
      if (!f) return { tipo: "no_existe" };
      if (f.revision !== revision) return { tipo: "conflicto", revision: f.revision };
      f.datos = JSON.stringify(datos);
      f.revision++;
      f.actualizada = ahora();
      return { tipo: "ok", revision: f.revision };
    },
    async borrarInactivas(dias) {
      const limite = ahora() - dias * DIA_MS;
      let n = 0;
      for (const [k, f] of filas)
        if (f.actualizada < limite) {
          filas.delete(k);
          n++;
        }
      return n;
    },
    async cerrar() {},
  };
}

const MIGRACION = `
CREATE TABLE IF NOT EXISTS partidas (
  codigo_hash bytea PRIMARY KEY CHECK (octet_length(codigo_hash) = 32),
  datos jsonb NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  creada timestamptz NOT NULL DEFAULT now(),
  actualizada timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partidas_actualizada ON partidas (actualizada);
`;

/**
 * Postgres con consultas siempre parametrizadas. La tabla se crea en la primera operación; si la base no
 * responde, la operación falla (la API contesta 503) y la siguiente vuelve a intentar: el sitio no se cae.
 */
export function repositorioPostgres(url: string): RepositorioPartidas {
  const pool = new pg.Pool({
    connectionString: url,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 5_000,
    application_name: "rastro-en-el-log",
  });
  // Un cliente inactivo que pierde la conexión emite "error"; sin este manejador tumbaría el proceso.
  pool.on("error", () => {});
  let tabla: Promise<void> | null = null;
  const lista = () => {
    tabla ??= pool.query(MIGRACION).then(
      () => undefined,
      (e: unknown) => {
        tabla = null;
        throw e;
      },
    );
    return tabla;
  };
  return {
    async crear(hash, datos) {
      await lista();
      const r = await pool.query(
        "INSERT INTO partidas (codigo_hash, datos, revision) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING",
        [hash, JSON.stringify(datos)],
      );
      return r.rowCount === 1;
    },
    async leer(hash) {
      await lista();
      const r = await pool.query<{ datos: unknown; revision: number }>(
        "SELECT datos, revision FROM partidas WHERE codigo_hash = $1",
        [hash],
      );
      return r.rows[0] ?? null;
    },
    async guardar(hash, datos, revision) {
      await lista();
      const r = await pool.query<{ revision: number }>(
        `UPDATE partidas SET datos = $2, revision = revision + 1, actualizada = now()
         WHERE codigo_hash = $1 AND revision = $3 RETURNING revision`,
        [hash, JSON.stringify(datos), revision],
      );
      const nueva = r.rows[0];
      if (nueva) return { tipo: "ok", revision: nueva.revision };
      const actual = await pool.query<{ revision: number }>(
        "SELECT revision FROM partidas WHERE codigo_hash = $1",
        [hash],
      );
      const fila = actual.rows[0];
      return fila ? { tipo: "conflicto", revision: fila.revision } : { tipo: "no_existe" };
    },
    async borrarInactivas(dias) {
      await lista();
      const r = await pool.query(
        "DELETE FROM partidas WHERE actualizada < now() - make_interval(days => $1)",
        [dias],
      );
      return r.rowCount ?? 0;
    },
    async cerrar() {
      await pool.end();
    },
  };
}

/**
 * Borrado diario de partidas inactivas (D-18): una vez al minuto de arrancar y luego cada día. Un solo
 * proceso en Railway; si algún día hay réplicas, el DELETE es idempotente.
 */
export function programarRetencion(
  repo: RepositorioPartidas,
  dias: number,
  avisar: (borradas: number) => void,
  fallar: (e: unknown) => void,
  cadaMs = DIA_MS,
): () => void {
  const correr = () =>
    repo.borrarInactivas(dias).then((n) => {
      if (n > 0) avisar(n);
    }, fallar);
  const primero = setTimeout(correr, 60_000);
  const diario = setInterval(correr, cadaMs);
  primero.unref();
  diario.unref();
  return () => {
    clearTimeout(primero);
    clearInterval(diario);
  };
}
