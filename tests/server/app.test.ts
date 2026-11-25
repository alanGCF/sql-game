import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildApp } from "../../server/src/app.js";
import { leerEntorno } from "../../server/src/entorno.js";

function staticFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "planta7-static-"));
  writeFileSync(join(dir, "index.html"), "<!doctype html><title>x</title>");
  writeFileSync(join(dir, ".env"), "SECRETO=1");
  return dir;
}

describe("servidor", () => {
  it("responde /healthz sin datos internos", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("pone cabeceras de seguridad en estáticos y API", async () => {
    const app = await buildApp({ staticDir: staticFixture() });
    for (const url of ["/", "/healthz"]) {
      const res = await app.inject({ method: "GET", url });
      expect(res.statusCode).toBe(200);
      const csp = String(res.headers["content-security-policy"]);
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).not.toContain("unsafe-inline");
      expect(csp).not.toMatch(/'unsafe-eval'/);
      expect(res.headers["strict-transport-security"]).toContain("max-age=31536000");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("DENY");
      expect(res.headers["referrer-policy"]).toBe("no-referrer");
      expect(res.headers["permissions-policy"]).toContain("camera=()");
    }
  });

  it("no sirve archivos ocultos ni revela detalles en 404", async () => {
    const app = await buildApp({ staticDir: staticFixture() });
    const env = await app.inject({ method: "GET", url: "/.env" });
    expect(env.statusCode).toBeGreaterThanOrEqual(400);
    expect(env.body).not.toContain("SECRETO");
    const nada = await app.inject({ method: "GET", url: "/no-existe" });
    expect(nada.statusCode).toBe(404);
    expect(nada.json()).toEqual({ error: "no_encontrado" });
  });

  it("aplica límite de tasa por IP real detrás de un proxy", async () => {
    const app = await buildApp({ rateLimitMax: 3, trustProxyHops: 1 });
    const pedir = (xff: string) =>
      app.inject({ method: "GET", url: "/healthz", headers: { "x-forwarded-for": xff } });
    // El atacante falsifica la primera IP; el proxy agrega la real al final.
    for (let i = 0; i < 3; i++) expect((await pedir(`1.1.1.${i}, 203.0.113.7`)).statusCode).toBe(200);
    const bloqueada = await pedir("9.9.9.9, 203.0.113.7");
    expect(bloqueada.statusCode).toBe(429);
    expect(bloqueada.json()).toEqual({ error: "demasiadas_solicitudes" });
    expect((await pedir("203.0.113.8")).statusCode).toBe(200);
  });

  it("una URL malformada responde 400 uniforme y con cabeceras de seguridad", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/%E0%A4%A" });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "solicitud_invalida" });
    expect(res.body).not.toMatch(/FST_|Fastify|%E0/);
    expect(res.headers["content-security-policy"]).toContain("default-src 'none'");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["strict-transport-security"]).toContain("max-age=31536000");
  });

  it("los 404 también gastan límite de tasa", async () => {
    const app = await buildApp({ rateLimitMax: 2 });
    const codigos = [];
    for (let i = 0; i < 3; i++)
      codigos.push((await app.inject({ method: "GET", url: `/nada${i}` })).statusCode);
    expect(codigos).toEqual([404, 404, 429]);
  });

  it("los archivos con hash de /assets/ tienen su propio límite, más alto", async () => {
    const dir = staticFixture();
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "assets", "app-abc123.js"), "1");
    const app = await buildApp({ staticDir: dir, rateLimitMax: 2, rateLimitAssetsMax: 5 });
    for (let i = 0; i < 5; i++)
      expect((await app.inject({ method: "GET", url: "/assets/app-abc123.js" })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/assets/app-abc123.js" })).statusCode).toBe(429);
    // La página y la API conservan su propio contador.
    expect((await app.inject({ method: "GET", url: "/healthz" })).statusCode).toBe(200);
  });

  it("el log de solicitudes registra la ruta declarada, no la URL real", async () => {
    const lineas: string[] = [];
    const app = await buildApp({ logStream: { write: (l: string) => void lineas.push(l) } });
    app.get("/api/partidas/:codigo", async () => ({ ok: true }));
    await app.inject({ method: "GET", url: "/api/partidas/ABCD-SECRETO-1234?x=1" });
    const log = lineas.join("");
    expect(log).toContain("/api/partidas/:codigo");
    expect(log).not.toContain("SECRETO");
  });
});

describe("variables de entorno del servidor", () => {
  it("usa valores por omisión seguros", () => {
    expect(leerEntorno({})).toEqual({
      port: 3000,
      trustProxyHops: 1,
      produccion: false,
      partidasEnMemoria: false,
    });
  });

  it("acepta valores válidos", () => {
    expect(
      leerEntorno({
        PORT: "8080",
        TRUST_PROXY_HOPS: "2",
        STATIC_DIR: "/app/x",
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://u:p@postgres.railway.internal:5432/railway",
        PARTIDAS_PEPPER: "0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
        PARTIDAS_EN_MEMORIA: "1",
      }),
    ).toEqual({
      port: 8080,
      trustProxyHops: 2,
      staticDir: "/app/x",
      produccion: true,
      databaseUrl: "postgresql://u:p@postgres.railway.internal:5432/railway",
      pepper: Buffer.from("0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f", "hex"),
      partidasEnMemoria: true,
    });
  });

  it.each([
    [{ PORT: "abc" }, /PORT/],
    [{ PORT: "70000" }, /PORT/],
    [{ TRUST_PROXY_HOPS: "Infinity" }, /TRUST_PROXY_HOPS/],
    [{ TRUST_PROXY_HOPS: "" }, /TRUST_PROXY_HOPS/],
    [{ TRUST_PROXY_HOPS: "9" }, /TRUST_PROXY_HOPS/],
    [{ DATABASE_URL: "mysql://x" }, /DATABASE_URL/],
    [{ DATABASE_URL: "" }, /DATABASE_URL/],
    [{ PARTIDAS_PEPPER: "corto" }, /PARTIDAS_PEPPER/],
    [{ PARTIDAS_PEPPER: "z".repeat(64) }, /PARTIDAS_PEPPER/],
    [{ PARTIDAS_EN_MEMORIA: "si" }, /PARTIDAS_EN_MEMORIA/],
  ])("rechaza %o", (env, error) => {
    expect(() => leerEntorno(env)).toThrow(error);
  });
});
