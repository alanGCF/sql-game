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
  mision: {
    id: "t1-m02-el-leeme",
    cumplidos: ["leer-leeme"],
    respuestas: { "responder-firma": "R" },
    pistas: { "leer-leeme": 1 },
    diff: { cambiados: [], borrados: [] },
    historial: ["cat LEEME.txt"],
    cwd: "/home/becario",
    leidos: ["/home/becario/LEEME.txt"],
  },
});

describe("formato de partida (cliente y servidor)", () => {
  it("acepta una partida válida", () => {
    expect(leerPartida(valida()).ok).toBe(true);
  });

  it.each<[string, (p: Record<string, unknown>) => void]>([
    ["clave desconocida", (p) => (p.admin = true)],
    ["formato futuro", (p) => (p.formato = 2)],
    ["semilla negativa", (p) => (p.semilla = -1)],
    ["nombre vacío", (p) => (p.nombre = "   ")],
    ["nombre demasiado largo", (p) => (p.nombre = "x".repeat(41))],
    ["estrellas fuera de rango", (p) => (p.completadas = { "t1-m01-x": { estrellas: 9 } })],
    ["id con caracteres raros", (p) => (p.flags = ["<script>"])],
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

  it("el texto del jugador se guarda tal cual (se muestra como texto, nunca como HTML)", () => {
    const p = valida();
    p.notas = ["<img src=x onerror=alert(1)>"];
    const r = leerPartida(p);
    expect(r.ok && r.partida.notas[0]).toBe("<img src=x onerror=alert(1)>");
  });
});
