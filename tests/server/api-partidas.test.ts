import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../server/src/app.js";
import { hashCodigo, type RepositorioPartidas, repositorioEnMemoria } from "../../server/src/partidas.js";
import { formatearCodigo, generarCodigo, normalizarCodigo } from "../../shared/codigo.js";
import { leerPartida } from "../../shared/partida.js";

let app: FastifyInstance;
let log: string[];

async function crearApp(repo: RepositorioPartidas | null = repositorioEnMemoria()) {
  log = [];
  app = await buildApp({ partidas: repo, logStream: { write: (l) => log.push(l) } });
  return app;
}

afterEach(async () => {
  await app?.close();
});

const crear = (cuerpo: unknown = { nombre: "Ale", contenido: "abc123" }, ip = "198.51.100.1") =>
  app.inject({ method: "POST", url: "/api/partidas", payload: cuerpo as object, remoteAddress: ip });

describe("API de partidas", () => {
  it("POST crea la partida: código válido, semilla del servidor, revisión 1 y sin caché", async () => {
    await crearApp();
    const r = await crear();
    expect(r.statusCode).toBe(201);
    expect(r.headers["cache-control"]).toBe("no-store");
    const cuerpo = r.json();
    expect(normalizarCodigo(cuerpo.codigo)).toBe(cuerpo.codigo);
    expect(cuerpo.revision).toBe(1);
    expect(leerPartida(cuerpo.partida).ok).toBe(true);
    expect(cuerpo.partida).toMatchObject({ formato: 1, nombre: "Ale", contenido: "abc123", turno: 0 });
    const otra = (await crear()).json();
    expect(otra.codigo).not.toBe(cuerpo.codigo);
  });

  it("GET devuelve la partida con el código tecleado como sea (guiones, minúsculas)", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    const r = await app.inject({
      method: "GET",
      url: `/api/partidas/${formatearCodigo(codigo).toLowerCase()}`,
    });
    expect(r.statusCode).toBe(200);
    expect(r.headers["cache-control"]).toBe("no-store");
    expect(r.json()).toEqual({ revision: 1, partida });
  });

  it("código mal formado, con verificador malo o inexistente: misma respuesta 404", async () => {
    await crearApp();
    const valido = generarCodigo();
    const malVerificador = valido.slice(0, 11) + (valido[11] === "0" ? "1" : "0");
    const respuestas = await Promise.all(
      ["nada", malVerificador, valido, "'%20OR%201=1--", "x".repeat(90)].map((c) =>
        app.inject({ method: "GET", url: `/api/partidas/${c}` }),
      ),
    );
    for (const r of respuestas) {
      expect(r.statusCode).toBe(404);
      expect(r.json()).toEqual({ error: "no_encontrado" });
    }
    // Más largo que maxParamLength: Fastify lo corta antes de la ruta con un 400 genérico.
    const larga = await app.inject({ method: "GET", url: `/api/partidas/${"x".repeat(300)}` });
    expect(larga.statusCode).toBe(400);
    expect(larga.json()).toEqual({ error: "solicitud_invalida" });
  });

  it("PUT guarda con la revisión vigente y rechaza una vieja con 409", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    const guardar = (revision: number, p: unknown) =>
      app.inject({ method: "PUT", url: `/api/partidas/${codigo}`, payload: { revision, partida: p } });
    const ok = await guardar(1, { ...partida, turno: 1, xp: 30 });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toEqual({ revision: 2 });
    const vieja = await guardar(1, { ...partida, turno: 0 });
    expect(vieja.statusCode).toBe(409);
    expect(vieja.json()).toEqual({ error: "revision_vieja", revision: 2 });
    const leida = (await app.inject({ method: "GET", url: `/api/partidas/${codigo}` })).json();
    expect(leida.partida).toMatchObject({ turno: 1, xp: 30 });
  });

  it("PUT rechaza partidas inválidas, cuerpos raros y códigos inexistentes", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    const put = (url: string, payload: unknown) =>
      app.inject({ method: "PUT", url, payload: payload as object });
    for (const malo of [
      { revision: 1, partida: { ...partida, extra: 1 } },
      { revision: 1, partida: { ...partida, nombre: "" } },
      { revision: 0, partida },
      { revision: 1, partida, otro: true },
      { revision: "1", partida },
    ]) {
      const r = await put(`/api/partidas/${codigo}`, malo);
      expect(r.statusCode).toBe(400);
      expect(r.json()).toEqual({ error: "solicitud_invalida" });
    }
    const inexistente = await put(`/api/partidas/${generarCodigo()}`, { revision: 1, partida });
    expect(inexistente.statusCode).toBe(404);
    const enorme = await put(`/api/partidas/${codigo}`, {
      revision: 1,
      partida: { ...partida, notas: Array.from({ length: 200 }, () => "n".repeat(500)) },
    });
    expect([400, 413]).toContain(enorme.statusCode);
  });

  it("POST valida el cuerpo", async () => {
    await crearApp();
    for (const malo of [
      {},
      { nombre: "" },
      { nombre: "a".repeat(41), contenido: "" },
      { nombre: "A", contenido: "", x: 1 },
    ])
      expect((await crear(malo)).statusCode).toBe(400);
  });

  it("límites por IP: crear 10 por hora, leer 30 por minuto", async () => {
    await crearApp();
    for (let i = 0; i < 10; i++) expect((await crear(undefined, "203.0.113.9")).statusCode).toBe(201);
    expect((await crear(undefined, "203.0.113.9")).statusCode).toBe(429);
    expect((await crear(undefined, "203.0.113.10")).statusCode).toBe(201);
    const codigo = generarCodigo();
    const leer = () =>
      app.inject({ method: "GET", url: `/api/partidas/${codigo}`, remoteAddress: "203.0.113.11" });
    for (let i = 0; i < 30; i++) expect((await leer()).statusCode).toBe(404);
    expect((await leer()).statusCode).toBe(429);
  });

  it("el código nunca aparece en los logs (ni en claro ni como hash)", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    await app.inject({ method: "GET", url: `/api/partidas/${codigo}` });
    await app.inject({ method: "PUT", url: `/api/partidas/${codigo}`, payload: { revision: 1, partida } });
    const todo = log.join("\n");
    expect(todo).toContain("/api/partidas/:codigo");
    expect(todo).not.toContain(codigo);
    expect(todo).not.toContain(hashCodigo(codigo).toString("hex"));
  });

  it("sin base de datos la API contesta 503 y el resto del sitio sigue", async () => {
    await crearApp(null);
    expect((await crear()).statusCode).toBe(503);
    expect((await app.inject({ method: "GET", url: `/api/partidas/${generarCodigo()}` })).statusCode).toBe(
      503,
    );
    expect((await app.inject({ method: "GET", url: "/healthz" })).statusCode).toBe(200);
  });

  it("si la base falla, 503 sin detalles internos", async () => {
    const roto: RepositorioPartidas = {
      ...repositorioEnMemoria(),
      crear: () => Promise.reject(new Error("connect ECONNREFUSED 10.0.0.5:5432")),
    };
    await crearApp(roto);
    const r = await crear();
    expect(r.statusCode).toBe(503);
    expect(r.body).not.toContain("ECONNREFUSED");
    expect(r.json()).toEqual({ error: "sin_servicio" });
  });
});
