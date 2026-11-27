import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  hashCodigo,
  type RepositorioPartidas,
  repositorioEnMemoria,
  repositorioPostgres,
} from "../../server/src/partidas.js";
import { generarCodigo } from "../../shared/codigo.js";
import type { Partida } from "../../shared/partida.js";

const PEPPER = Buffer.alloc(32, 3);

const partida = (nombre = "Ale"): Partida => ({
  formato: 1,
  semilla: 7,
  nombre,
  contenido: "x",
  turno: 0,
  completadas: {},
  favores: [],
  flags: [],
  xp: 0,
  notas: [],
  reloj: 0,
  mundo: { cambiados: [], borrados: [] },
  mision: null,
  llamadas: {},
  pistas: [],
  buzon: [],
  postits: [],
});

interface Banco {
  repo: RepositorioPartidas;
  /** Hace que la partida parezca sin actividad desde hace `dias` días. */
  envejecer(hash: Buffer, dias: number): Promise<void>;
}

/** El mismo contrato para la memoria (pruebas y desarrollo) y para Postgres (producción). */
function contrato(nombre: string, preparar: () => Promise<Banco>, terminar: () => Promise<void>) {
  describe(`repositorio de partidas: ${nombre}`, () => {
    let b: Banco;
    beforeAll(async () => {
      b = await preparar();
    });
    afterAll(terminar);

    it("crea, lee y no deja crear dos veces el mismo código", async () => {
      const h = hashCodigo(generarCodigo(), PEPPER);
      expect(await b.repo.crear(h, partida())).toBe(true);
      expect(await b.repo.crear(h, partida("Otro"))).toBe(false);
      expect(await b.repo.leer(h)).toEqual({ datos: partida(), revision: 1 });
      expect(await b.repo.leer(hashCodigo(generarCodigo(), PEPPER))).toBeNull();
    });

    it("guarda solo con la revisión vigente y la incrementa", async () => {
      const h = hashCodigo(generarCodigo(), PEPPER);
      await b.repo.crear(h, partida());
      expect(await b.repo.guardar(h, partida("Dos"), 1)).toEqual({ tipo: "ok", revision: 2 });
      expect(await b.repo.guardar(h, partida("Vieja"), 1)).toEqual({ tipo: "conflicto", revision: 2 });
      expect((await b.repo.leer(h))?.datos).toMatchObject({ nombre: "Dos" });
      expect(await b.repo.guardar(hashCodigo(generarCodigo(), PEPPER), partida(), 1)).toEqual({
        tipo: "no_existe",
      });
    });

    it("borra solo las partidas con 60 días o más sin actividad", async () => {
      const vieja = hashCodigo(generarCodigo(), PEPPER);
      const reciente = hashCodigo(generarCodigo(), PEPPER);
      await b.repo.crear(vieja, partida());
      await b.repo.crear(reciente, partida());
      await b.envejecer(vieja, 61);
      await b.envejecer(reciente, 59);
      expect(await b.repo.borrarInactivas(60)).toBeGreaterThanOrEqual(1);
      expect(await b.repo.leer(vieja)).toBeNull();
      expect(await b.repo.leer(reciente)).not.toBeNull();
    });

    it("informa cuánto espacio ocupan las partidas", async () => {
      const h = hashCodigo(generarCodigo(), PEPPER);
      await b.repo.crear(h, partida());
      expect(await b.repo.tamanoBytes()).toBeGreaterThan(0);
    });

    it("guarda texto hostil como dato, sin interpretarlo", async () => {
      const h = hashCodigo(generarCodigo(), PEPPER);
      const raro = partida("'); DROP TABLE partidas; --");
      await b.repo.crear(h, raro);
      expect((await b.repo.leer(h))?.datos).toEqual(raro);
    });
  });
}

{
  let reloj = Date.now();
  contrato(
    "memoria",
    async () => {
      // Reloj por partida: envejecer mueve la hora con que se registró la última actividad.
      const repo = repositorioEnMemoria(() => reloj);
      return {
        repo,
        async envejecer(hash, dias) {
          const original = reloj;
          reloj = original - dias * 86_400_000;
          const datos = await repo.leer(hash);
          if (datos) await repo.guardar(hash, datos.datos as Partida, datos.revision);
          reloj = original;
        },
      };
    },
    async () => {},
  );
}

// Postgres real: en CI (servicio postgres) y en local con PRUEBAS_PG_URL apuntando a una base de pruebas.
const url = process.env.PRUEBAS_PG_URL;
if (url) {
  let repo: RepositorioPartidas;
  const admin = new pg.Client({ connectionString: url });
  contrato(
    "postgres",
    async () => {
      await admin.connect();
      await admin.query("DROP TABLE IF EXISTS partidas");
      repo = repositorioPostgres(url);
      return {
        repo,
        async envejecer(hash, dias) {
          await admin.query(
            "UPDATE partidas SET actualizada = now() - make_interval(days => $2) WHERE codigo_hash = $1",
            [hash, dias],
          );
        },
      };
    },
    async () => {
      await repo.cerrar();
      await admin.end();
    },
  );
} else {
  describe("repositorio de partidas: postgres", () => {
    it.skip("necesita PRUEBAS_PG_URL (en CI corre contra el servicio postgres)", () => {});
  });
}

describe("retención programada", () => {
  it("borra al minuto de arrancar y en cada intervalo, y se puede detener", async () => {
    const { vi } = await import("vitest");
    const { programarRetencion } = await import("../../server/src/partidas.js");
    vi.useFakeTimers();
    try {
      const llamadas: number[] = [];
      const repo = {
        ...repositorioEnMemoria(),
        borrarInactivas: async (d: number) => {
          llamadas.push(d);
          return 2;
        },
      };
      const avisos: number[] = [];
      const detener = programarRetencion(
        repo,
        60,
        (n) => avisos.push(n),
        () => {},
        1000,
      );
      await vi.advanceTimersByTimeAsync(999);
      expect(llamadas).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      expect(llamadas).toEqual([60]);
      // 60 ciclos del intervalo de prueba + la pasada inicial al minuto.
      await vi.advanceTimersByTimeAsync(59_000);
      expect(llamadas.length).toBe(61);
      expect(avisos.every((n) => n === 2)).toBe(true);
      detener();
      const antes = llamadas.length;
      await vi.advanceTimersByTimeAsync(10_000);
      expect(llamadas.length).toBe(antes);
    } finally {
      vi.useRealTimers();
    }
  });
});
