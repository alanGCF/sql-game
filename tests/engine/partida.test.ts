import { describe, expect, it } from "vitest";
import { leerPartida, type Partida } from "../../shared/partida";

const valida = (): Partida => ({
  formato: 1,
  semilla: 123456,
  nombre: "Alan",
  contenido: "abc123",
  turno: 1,
  completadas: { "t1-m01-donde-estoy": { estrellas: 3 } },
  favores: [],
  flags: ["leyo_leeme"],
  xp: 50,
  notas: ["ls -a muestra ocultos"],
  reloj: Date.parse("2026-10-28T17:45:00Z"),
  mundo: { cambiados: [], borrados: [] },
  mision: {
    id: "t1-m02-el-leeme",
    cumplidos: ["leer-leeme"],
    respuestas: { "responder-firma": "R" },
    pistas: { "leer-leeme": 1 },
    historial: ["cat LEEME.txt"],
    cwd: "/home/becario",
    leidos: ["/home/becario/LEEME.txt"],
  },
  llamadas: { companero: 1 },
  pistas: [{ mision: "t1-m02-el-leeme", objetivo: "leer-leeme", nivel: 1, texto: "¿Ya viste qué hay ahí?" }],
  buzon: [{ quien: "companero", lineas: ["¡Eso! Ya te ubicas."] }],
  postits: ["Ext. de Karla: 402"],
});

describe("formato de partida (cliente y servidor)", () => {
  it("acepta una partida válida", () => {
    expect(leerPartida(valida()).ok).toBe(true);
  });

  it("un guardado de antes de F4-02/03 (sin llamadas ni pistas) se lee con la paciencia completa", () => {
    const { llamadas: _, pistas: __, buzon: ___, postits: ____, ...vieja } = valida();
    const r = leerPartida(vieja);
    expect(r.ok && r.partida.llamadas).toEqual({});
    expect(r.ok && r.partida.pistas).toEqual([]);
    expect(r.ok && r.partida.buzon).toEqual([]);
    expect(r.ok && r.partida.postits).toEqual([]);
  });

  it.each<[string, (p: Record<string, unknown>) => void]>([
    ["clave desconocida", (p) => (p.admin = true)],
    ["formato futuro", (p) => (p.formato = 2)],
    ["semilla negativa", (p) => (p.semilla = -1)],
    ["nombre vacío", (p) => (p.nombre = "   ")],
    ["nombre demasiado largo", (p) => (p.nombre = "x".repeat(41))],
    ["estrellas fuera de rango", (p) => (p.completadas = { "t1-m01-x": { estrellas: 9 } })],
    ["id con caracteres raros", (p) => (p.flags = ["<script>"])],
    ["llamadas fuera de rango", (p) => (p.llamadas = { companero: 1000 })],
    ["llamadas a un contacto raro", (p) => (p.llamadas = { "<x>": 1 })],
    ["demasiados post-its", (p) => (p.postits = Array.from({ length: 13 }, () => "x"))],
    ["buzón con un mensaje vacío", (p) => (p.buzon = [{ quien: "companero", lineas: [] }])],
    ["pista de nivel 4", (p) => (p.pistas = [{ mision: "m", objetivo: "o", nivel: 4, texto: "x" }])],
    [
      "llamadas a demasiados contactos",
      (p) => (p.llamadas = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`c${i}`, 1]))),
    ],
    ["demasiadas notas", (p) => (p.notas = Array(201).fill("n"))],
    ["nota demasiado larga", (p) => (p.notas = ["x".repeat(501)])],
    ["xp como texto", (p) => (p.xp = "50")],
    ["más de 64 KB", (p) => (p.notas = Array(150).fill("x".repeat(500)))],
  ])("rechaza: %s", (_n, mutar) => {
    const p = valida() as unknown as Record<string, unknown>;
    mutar(p);
    const r = leerPartida(p);
    expect(r.ok).toBe(false);
  });

  it("solo acepta rutas canónicas en el mundo, el cwd y los leídos (una ruta rara rompía la terminal)", () => {
    const entrada = { tipo: "dir", mode: 0o755, owner: "x", group: "x", mtime: 0 };
    for (const ruta of ["//", "///", "/a//b", "/a/", "/..", "/a/../b", "/a/./b", "relativa"]) {
      expect(
        leerPartida({ ...valida(), mundo: { cambiados: [{ ruta, ...entrada }], borrados: [] } }).ok,
      ).toBe(false);
      expect(leerPartida({ ...valida(), mundo: { cambiados: [], borrados: [ruta] } }).ok).toBe(false);
    }
    expect(leerPartida({ ...valida(), mision: { ...valida().mision, cwd: "//" } }).ok).toBe(false);
    for (const ruta of ["/", "/home/becario/.r", "/srv/lineas/linea1.log"])
      expect(
        leerPartida({ ...valida(), mundo: { cambiados: [{ ruta, ...entrada }], borrados: [] } }).ok,
      ).toBe(true);
  });

  it("rechaza NUL y surrogates sueltos en cualquier texto (Postgres jsonb no los acepta)", () => {
    for (const malo of ["A\u0000B", "A\ud800B", "\udc00"]) {
      expect(leerPartida({ ...valida(), nombre: malo }).ok).toBe(false);
      expect(leerPartida({ ...valida(), notas: [malo] }).ok).toBe(false);
    }
    expect(leerPartida({ ...valida(), notas: ["emoji 🦎 y acentos ñ á"] }).ok).toBe(true);
  });

  it("el texto del jugador se guarda tal cual (se muestra como texto, nunca como HTML)", () => {
    const p = valida();
    p.notas = ["<img src=x onerror=alert(1)>"];
    const r = leerPartida(p);
    expect(r.ok && r.partida.notas[0]).toBe("<img src=x onerror=alert(1)>");
  });
});
