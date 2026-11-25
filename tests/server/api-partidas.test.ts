import { createHash, createHmac } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../server/src/app.js";
import { type RepositorioPartidas, repositorioEnMemoria } from "../../server/src/partidas.js";
import { formatearCodigo, generarCodigo, normalizarCodigo } from "../../shared/codigo.js";
import { leerPartida } from "../../shared/partida.js";

const PEPPER = Buffer.alloc(32, 7);
let app: FastifyInstance;
let log: string[];

async function crearApp(repo: RepositorioPartidas | null = repositorioEnMemoria()) {
  log = [];
  app = await buildApp({
    partidas: repo ? { repo, pepper: PEPPER } : null,
    logStream: { write: (l) => log.push(l) },
  });
  return app;
}

afterEach(async () => {
  await app?.close();
});

const IP = "198.51.100.1";
const crear = (cuerpo: unknown = { nombre: "Ale", contenido: "abc123" }, ip = IP) =>
  app.inject({ method: "POST", url: "/api/partidas", payload: cuerpo as object, remoteAddress: ip });
const leer = (codigo: string, ip = IP) =>
  app.inject({
    method: "GET",
    url: "/api/partida",
    headers: { "x-codigo-partida": codigo },
    remoteAddress: ip,
  });
const guardar = (codigo: string, payload: unknown, ip = IP) =>
  app.inject({
    method: "PUT",
    url: "/api/partida",
    headers: { "x-codigo-partida": codigo },
    payload: payload as object,
    remoteAddress: ip,
  });

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
    expect((await crear()).json().codigo).not.toBe(cuerpo.codigo);
  });

  it("GET lee con el código en una cabecera (no en la URL), tecleado como sea", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    const r = await leer(formatearCodigo(codigo).toLowerCase());
    expect(r.statusCode).toBe(200);
    expect(r.headers["cache-control"]).toBe("no-store");
    expect(r.json()).toEqual({ revision: 1, partida });
  });

  it("sin cabecera, mal formado, verificador malo, inexistente o enorme: el mismo 404", async () => {
    await crearApp();
    const valido = generarCodigo();
    const malVerificador = valido.slice(0, 11) + (valido[11] === "0" ? "1" : "0");
    const respuestas = [
      await app.inject({ method: "GET", url: "/api/partida", remoteAddress: IP }),
      ...(await Promise.all(
        ["nada", malVerificador, valido, "' OR 1=1--", "x".repeat(300)].map((c) => leer(c)),
      )),
    ];
    for (const r of respuestas) {
      expect(r.statusCode).toBe(404);
      expect(r.json()).toEqual({ error: "no_encontrado" });
    }
  });

  it("no hay HEAD que sirva de oráculo aparte", async () => {
    await crearApp();
    const { codigo } = (await crear()).json();
    const r = await app.inject({
      method: "HEAD",
      url: "/api/partida",
      headers: { "x-codigo-partida": codigo },
    });
    expect(r.statusCode).toBe(404);
  });

  it("PUT guarda con la revisión vigente y rechaza una vieja con 409", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    const ok = await guardar(codigo, { revision: 1, partida: { ...partida, turno: 1, xp: 30 } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toEqual({ revision: 2 });
    const vieja = await guardar(codigo, { revision: 1, partida: { ...partida, turno: 0 } });
    expect(vieja.statusCode).toBe(409);
    expect(vieja.json()).toEqual({ error: "revision_vieja", revision: 2 });
    expect((await leer(codigo)).json().partida).toMatchObject({ turno: 1, xp: 30 });
  });

  it("PUT rechaza partidas inválidas, cuerpos raros y códigos inexistentes", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    for (const malo of [
      { revision: 1, partida: { ...partida, extra: 1 } },
      { revision: 1, partida: { ...partida, nombre: "" } },
      { revision: 1, partida: { ...partida, nombre: "A\u0000B" } },
      { revision: 1, partida: { ...partida, notas: ["\ud800"] } },
      { revision: 0, partida },
      { revision: 1, partida, otro: true },
      { revision: "1", partida },
    ]) {
      const r = await guardar(codigo, malo);
      expect(r.statusCode).toBe(400);
      expect(r.json()).toEqual({ error: "solicitud_invalida" });
    }
    expect((await guardar(generarCodigo(), { revision: 1, partida })).statusCode).toBe(404);
    const enorme = await guardar(codigo, {
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
      { nombre: "A\u0000", contenido: "" },
    ])
      expect((await crear(malo)).statusCode).toBe(400);
  });

  it("los límites agrupan IPv6 por /64: crear 10 por hora", async () => {
    await crearApp();
    for (let i = 1; i <= 10; i++) expect((await crear(undefined, `2001:db8:1::${i}`)).statusCode).toBe(201);
    expect((await crear(undefined, "2001:db8:1::ffff")).statusCode).toBe(429);
    expect((await crear(undefined, "2001:db8:2::1")).statusCode).toBe(201);
  });

  it("leer y guardar comparten un contador de 60 por minuto", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    let revision = 1;
    for (let i = 0; i < 30; i++) expect((await leer(codigo, "203.0.113.20")).statusCode).toBe(200);
    for (let i = 0; i < 30; i++) {
      const r = await guardar(codigo, { revision, partida }, "203.0.113.20");
      expect(r.statusCode).toBe(200);
      revision = r.json().revision;
    }
    expect((await leer(codigo, "203.0.113.20")).statusCode).toBe(429);
    expect((await leer(codigo, "203.0.113.21")).statusCode).toBe(200);
  });

  it("20 códigos inexistentes por hora bloquean ese /64 aunque luego atine, y queda en el log", async () => {
    await crearApp();
    const { codigo } = (await crear()).json();
    for (let i = 0; i < 20; i++) expect((await leer(generarCodigo(), "2001:db8:9::1")).statusCode).toBe(404);
    expect((await leer(codigo, "2001:db8:9::2")).statusCode).toBe(429);
    expect((await guardar(codigo, {}, "2001:db8:9::3")).statusCode).toBe(429);
    expect((await leer(codigo, "2001:db8:8::1")).statusCode).toBe(200);
    expect(log.join("\n")).toContain("demasiados códigos inexistentes");
  });

  it("en la base va HMAC(código) con la clave del servidor, no sha256 sin sal", async () => {
    const hashes: Buffer[] = [];
    const base = repositorioEnMemoria();
    await crearApp({
      ...base,
      crear: (h, d) => {
        hashes.push(h);
        return base.crear(h, d);
      },
    });
    const { codigo } = (await crear()).json();
    expect(hashes[0]?.equals(createHmac("sha256", PEPPER).update(codigo).digest())).toBe(true);
    expect(hashes[0]?.equals(createHash("sha256").update(codigo).digest())).toBe(false);
  });

  it("el código nunca aparece en los logs (ni en claro ni como hash)", async () => {
    await crearApp();
    const { codigo, partida } = (await crear()).json();
    await leer(codigo);
    await guardar(codigo, { revision: 1, partida });
    const todo = log.join("\n");
    expect(todo).toContain("/api/partida");
    expect(todo).not.toContain(codigo);
    expect(todo).not.toContain(createHmac("sha256", PEPPER).update(codigo).digest("hex"));
  });

  it("sin base de datos la API contesta 503 y el resto del sitio sigue", async () => {
    await crearApp(null);
    expect((await crear()).statusCode).toBe(503);
    expect((await leer(generarCodigo())).statusCode).toBe(503);
    expect((await app.inject({ method: "GET", url: "/healthz" })).statusCode).toBe(200);
  });

  it("si la base falla: 503 sin detalles al cliente y el código de error en el log", async () => {
    const falla = Object.assign(new Error("connect ECONNREFUSED 10.0.0.5:5432"), { code: "ECONNREFUSED" });
    await crearApp({ ...repositorioEnMemoria(), crear: () => Promise.reject(falla) });
    const r = await crear();
    expect(r.statusCode).toBe(503);
    expect(r.json()).toEqual({ error: "sin_servicio" });
    const todo = log.join("\n");
    expect(todo).toContain("ECONNREFUSED");
    expect(todo).not.toContain("10.0.0.5");
  });
});
