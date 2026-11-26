import { describe, expect, it } from "vitest";
import { leerEntorno } from "../../server/src/entorno.js";
import { LIMITE_CREAR_EN_PRUEBAS, modoPartidas } from "../../server/src/modo-partidas.js";
import { repositorioEnMemoria } from "../../server/src/partidas.js";

const PEPPER = "ab".repeat(32);
const crear = { postgres: () => repositorioEnMemoria(), memoria: () => repositorioEnMemoria() };
const modo = (env: Record<string, string>) => modoPartidas(leerEntorno(env), crear);

describe("modo de partidas del servidor", () => {
  it("con Postgres (producción) se quedan los límites de siempre, aunque pidan memoria", () => {
    const r = modo({
      DATABASE_URL: "postgres://u:p@h/db",
      PARTIDAS_PEPPER: PEPPER,
      PARTIDAS_EN_MEMORIA: "1",
      NODE_ENV: "production",
    });
    expect(r.falta).toBeNull();
    expect(r.partidas?.limiteCreacionPorHora).toBeUndefined();
  });

  it("memoria solo fuera de producción y fuera de Railway, y ahí sube el límite de crear", () => {
    expect(modo({ PARTIDAS_EN_MEMORIA: "1" }).partidas?.limiteCreacionPorHora).toBe(LIMITE_CREAR_EN_PRUEBAS);
    expect(modo({ PARTIDAS_EN_MEMORIA: "1", NODE_ENV: "production" })).toEqual({
      partidas: null,
      falta: "DATABASE_URL",
    });
    expect(modo({ PARTIDAS_EN_MEMORIA: "1", RAILWAY_PROJECT_ID: "x" }).partidas).toBeNull();
    expect(modo({ PARTIDAS_EN_MEMORIA: "1", RAILWAY_ENVIRONMENT_ID: "x" }).partidas).toBeNull();
  });

  it("sin base ni memoria, dice qué falta (la API contesta 503)", () => {
    expect(modo({}).falta).toBe("DATABASE_URL");
    expect(modo({ DATABASE_URL: "postgres://u:p@h/db" }).falta).toBe("PARTIDAS_PEPPER");
  });
});
