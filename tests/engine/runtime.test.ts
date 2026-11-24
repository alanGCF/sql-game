import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { GameClock, Shell } from "../../src/engine";
import { type Mision, validarMision } from "../../src/engine/mision/esquema";
import { MisionEnCurso } from "../../src/engine/mision/runtime";
import { vfsDesde } from "../../src/engine/vfs";

function mision(): Mision {
  const r = validarMision(parse(readFileSync("docs/ejemplos/mision-ejemplo.yaml", "utf8")));
  if (!r.ok) throw new Error(r.errores.join("\n"));
  return r.mision;
}

function iniciar(semilla = 42) {
  const reloj = GameClock.desde("2026-10-28T15:40:00Z");
  const vfs = vfsDesde([{ ruta: "/home/becario/", dueno: "becario" }], reloj.now());
  const shell = Shell.crear(
    vfs,
    reloj,
    { name: "becario", groups: ["becario", "sistemas"], home: "/home/becario" },
    "srv-sistemas",
  );
  return new MisionEnCurso(mision(), shell, semilla, {}, new Set());
}

async function numTickets(m: MisionEnCurso): Promise<string> {
  const r = await m.shell.ejecutar("ls tickets", { sinTerminal: true });
  return String(
    r.fragmentos
      .filter((f) => f.tipo === "stdout")
      .map((f) => f.texto)
      .join("")
      .trim()
      .split("\n").length,
  );
}

describe("misión en curso (ejemplo T1-M02)", () => {
  it("la cantidad de tickets cambia con la semilla (respuesta no memorizable)", async () => {
    const cantidades = new Set<string>();
    for (let s = 0; s < 30; s++) cantidades.add(await numTickets(iniciar(s)));
    expect(cantidades.size).toBeGreaterThan(1);
  });

  it("se completa con la solución, dispara eventos y da 3 estrellas", async () => {
    const m = iniciar();
    expect(m.pendientes().every((p) => !p.cumplido)).toBe(true);
    const r1 = await m.ejecutar("cat LEEME.txt");
    expect(r1.cumplidos).toEqual(["leer-leeme"]);
    expect((await m.responder("responder-firma", "Rebeca")).correcta).toBe(false);
    expect((await m.responder("responder-firma", "r.")).correcta).toBe(true);
    const n = await numTickets(m);
    expect((await m.responder("responder-conteo", String(Number(n) + 1))).correcta).toBe(false);
    const fin = await m.responder("responder-conteo", n);
    expect(fin.completada).toBe(true);
    expect(fin.efectos.map((e) => e.tipo)).toEqual(["llamada_entrante", "flag"]);
    expect(m.flags.has("leyo_leeme")).toBe(true);
    expect(m.estrellas()).toBe(3);
  });

  it("ls no cumple 'leer' (contraejemplo) y el globo de pensamiento no avanza nada", async () => {
    const m = iniciar();
    expect((await m.ejecutar("ls -l LEEME.txt")).cumplidos).toEqual([]);
    const r = await m.ejecutar("awk 1 LEEME.txt");
    expect(r.ejecutada).toBe(false);
    expect(r.cumplidos).toEqual([]);
  });

  it("pistas por nivel y estrellas", () => {
    const m = iniciar();
    expect(m.pista("leer-leeme")?.nivel).toBe(1);
    expect(m.estrellas()).toBe(2);
    m.pista("leer-leeme");
    const tercera = m.pista("leer-leeme");
    expect(tercera?.texto).toContain("`cat LEEME.txt`");
    expect(m.pista("leer-leeme")).toBeNull();
    expect(m.estrellas()).toBe(1);
  });

  it("restaurar regresa el mundo y el avance, pero conserva las pistas usadas", async () => {
    const m = iniciar();
    await m.ejecutar("cat LEEME.txt");
    m.pista("leer-leeme");
    await m.ejecutar("rm -r tickets");
    m.restaurar();
    expect(m.cumplidos.size).toBe(0);
    expect(m.shell.mundo.vfs.exists("/home/becario/tickets")).toBe(true);
    expect(m.estrellas()).toBe(2);
  });

  it("guardar y cargar reproduce la partida con la misma semilla", async () => {
    const a = iniciar(7);
    await a.ejecutar("cat LEEME.txt");
    await a.ejecutar("mkdir notas && echo pendiente > notas/hoy.txt");
    a.pista("responder-conteo");
    const g = JSON.parse(JSON.stringify(a.guardar()));
    const b = iniciar(7);
    b.cargar(g);
    expect([...b.cumplidos]).toEqual(["leer-leeme"]);
    expect(b.shell.mundo.vfs.readFile("/home/becario/notas/hoy.txt", b.shell.sesion.usuario)).toBe(
      "pendiente\n",
    );
    expect(b.estrellas()).toBe(2);
    expect(JSON.stringify(g).length).toBeLessThan(64 * 1024);
  });

  it("los archivos leídos sobreviven a guardar y cargar (objetivos de varias lecturas)", async () => {
    const m = mision();
    const [primero] = m.objetivos;
    if (!primero) throw new Error("el ejemplo no tiene objetivos");
    m.objetivos = [
      {
        ...primero,
        id: "leer-dos",
        cuando: {
          todos: [
            { archivo_leido: { host: "srv-sistemas", ruta: "/home/becario/LEEME.txt" } },
            { archivo_leido: { host: "srv-sistemas", ruta: "/home/becario/notas.txt" } },
          ],
        },
      },
    ];
    const nueva = () => {
      const reloj = GameClock.desde("2026-10-28T15:40:00Z");
      const vfs = vfsDesde(
        [
          { ruta: "/home/becario/", dueno: "becario" },
          { ruta: "/home/becario/notas.txt", dueno: "becario", contenido: "x\n" },
        ],
        reloj.now(),
      );
      const usuario = { name: "becario", groups: ["becario"], home: "/home/becario" };
      return new MisionEnCurso(m, Shell.crear(vfs, reloj, usuario, "srv-sistemas"), 1, {}, new Set());
    };
    const a = nueva();
    await a.ejecutar("cat LEEME.txt");
    const b = nueva();
    b.cargar(JSON.parse(JSON.stringify(a.guardar())));
    const r = await b.ejecutar("cat notas.txt");
    expect(r.completada).toBe(true);
  });

  it("una respuesta equivocada común recibe su comentario; una correcta no", async () => {
    const m = mision();
    const firma = m.objetivos.find((o) => o.id === "responder-firma");
    if (!firma || !("respuesta" in firma.cuando)) throw new Error("ejemplo sin responder-firma");
    firma.cuando.respuesta.comentarios = [
      { si: ["Rebeca", "rebeca salcido"], texto: "Te pido la inicial, no el nombre." },
      { si: ["{{n_tickets}}"], texto: "Eso es el conteo, no la firma." },
    ];
    const reloj = GameClock.desde("2026-10-28T15:40:00Z");
    const vfs = vfsDesde([{ ruta: "/home/becario/", dueno: "becario" }], reloj.now());
    const usuario = { name: "becario", groups: ["becario"], home: "/home/becario" };
    const mc = new MisionEnCurso(m, Shell.crear(vfs, reloj, usuario, "srv-sistemas"), 1, {}, new Set());
    expect((await mc.responder("responder-firma", "  REBECA ")).comentario).toBe(
      "Te pido la inicial, no el nombre.",
    );
    expect((await mc.responder("responder-firma", "x")).comentario).toBeUndefined();
    expect((await mc.responder("responder-firma", mc.vars.n_tickets ?? "")).comentario).toBe(
      "Eso es el conteo, no la firma.",
    );
    const bien = await mc.responder("responder-firma", "R");
    expect(bien.correcta).toBe(true);
    expect(bien.comentario).toBeUndefined();
  });
});
