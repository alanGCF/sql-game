import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildApp } from "../../server/src/app.js";

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
});
