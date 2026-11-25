import { describe, expect, it } from "vitest";
import { archivosYaml, cargarMundo, leerYaml } from "../../scripts/lib/contenido";
import { compilarContenido, type TurnoCompilado } from "../../src/engine/mision/compilar";
import type { Mision } from "../../src/engine/mision/esquema";
import { respuestaEsperada } from "../../src/engine/mision/harness";
import { plantilla } from "../../src/engine/vars";
import { type EventoJornada, Jornada } from "../../src/game/jornada";

const mundo = cargarMundo();
const { turnos, errores } = compilarContenido(
  archivosYaml("content/misiones").map((ruta) => {
    const y = leerYaml(ruta);
    if (!y.ok) throw new Error(y.error);
    return { ruta, datos: y.datos };
  }),
);
if (errores.length) throw new Error(errores.join("\n"));
const t1 = turnos.get("01") as TurnoCompilado;

/** Juega la solución de referencia de una misión a través de la jornada; devuelve los eventos. */
async function resolver(j: Jornada, m: Mision): Promise<EventoJornada[]> {
  const mc = j.misionDe(m.id);
  if (!mc) throw new Error(`${m.id} no está activa`);
  const eventos: EventoJornada[] = [];
  for (const p of m.solucion) {
    if (typeof p === "string") eventos.push(...(await j.ejecutar(plantilla(p, mc.vars))).eventos);
    else if ("responder" in p) {
      const { objetivo, valor } = p.responder;
      const v = valor.includes("{{respuesta.")
        ? await respuestaEsperada(mc, objetivo)
        : plantilla(valor, mc.vars);
      eventos.push(...(await j.responder(m.id, objetivo, v)).eventos);
    }
  }
  return eventos;
}

describe("jornada: T1 encadenado sobre un solo mundo", () => {
  it("empieza en T1-M1 con su briefing en la cola", () => {
    const j = Jornada.iniciar(t1, mundo, 1);
    expect(j.actual()?.mision.id).toBe("t1-m01-donde-estoy");
    const ev = j.tomarEventos();
    expect(ev[0]).toMatchObject({ tipo: "mision_iniciada", mision: "t1-m01-donde-estoy" });
    expect(ev.filter((e) => e.tipo === "dialogo").length).toBeGreaterThanOrEqual(2);
    expect(j.tomarEventos()).toEqual([]);
  });

  it("con 25 semillas, las soluciones completan T1 en orden y el favor llega con T1-M4", async () => {
    for (let semilla = 0; semilla < 25; semilla++) {
      const j = Jornada.iniciar(t1, mundo, semilla);
      const orden: string[] = [];
      for (const m of t1.misiones) {
        expect(j.actual()?.mision.id).toBe(m.id);
        if (m.id === "t1-m04-preguntale-al-manual")
          expect(j.favoresActivos().map((f) => f.mision.id)).toEqual(["t1-f01-lentes-de-don-chuy"]);
        else expect(j.favoresActivos()).toEqual([]);
        const ev = await resolver(j, m);
        orden.push(...ev.filter((e) => e.tipo === "mision_completada").map((e) => e.mision));
      }
      expect(orden).toEqual(t1.misiones.map((m) => m.id));
      expect(j.actual()).toBeNull();
      expect(j.turnoCompletado()).toBe(true);
      const favor = t1.favores[0] as Mision;
      const ev = await resolver(j, favor);
      expect(ev.some((e) => e.tipo === "mision_completada" && e.mision === favor.id)).toBe(true);
      expect(j.favoresActivos()).toEqual([]);
    }
  });

  it("lo que el jugador hace en una misión sigue ahí en la siguiente", async () => {
    const j = Jornada.iniciar(t1, mundo, 5);
    await j.ejecutar("mkdir notas");
    await resolver(j, t1.misiones[0] as Mision);
    expect(j.actual()?.mision.id).toBe("t1-m02-el-leeme");
    const r = await j.ejecutar("ls");
    expect(r.resultado.fragmentos.map((f) => f.texto).join("")).toContain("notas");
  });

  it("responder a un objetivo de otra misión o inexistente es un error claro", async () => {
    const j = Jornada.iniciar(t1, mundo, 1);
    await expect(j.responder("t1-m02-el-leeme", "responder-firma", "R")).rejects.toThrow(/no está activa/);
    await expect(j.responder("t1-m01-donde-estoy", "nada", "x")).rejects.toThrow(/objetivo inexistente/);
  });

  it("un comando fuera de alcance no avanza nada", async () => {
    const j = Jornada.iniciar(t1, mundo, 1);
    j.tomarEventos();
    const r = await j.ejecutar("awk 1 x");
    expect(r.resultado.ejecutada).toBe(false);
    expect(r.eventos).toEqual([]);
  });
});

describe("jornada: reloj de juego", () => {
  it("empieza a las 15:30, cada comando suma 15 s y cada misión principal adelanta la tarde", async () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    expect(j.minutoDelDia()).toBe(15 * 60 + 30);
    for (let i = 0; i < 4; i++) await j.ejecutar("pwd");
    expect(j.minutoDelDia()).toBe(15 * 60 + 31);
    const n = t1.misiones.length;
    for (const [k, m] of t1.misiones.entries()) {
      const antes = j.minutoDelDia();
      await resolver(j, m);
      // Al cerrar la misión k el reloj llega al menos a su parte del turno (15:30 → 23:30).
      expect(j.minutoDelDia()).toBeGreaterThanOrEqual(15 * 60 + 30 + ((k + 1) / n) * 8 * 60);
      expect(j.minutoDelDia()).toBeGreaterThan(antes);
    }
    expect(j.minutoDelDia()).toBeLessThan(24 * 60);
  });

  it("completar un favor no adelanta el reloj más que sus comandos", async () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    for (const m of t1.misiones.slice(0, -1)) await resolver(j, m);
    const favor = t1.favores[0] as Mision;
    const antes = j.minutoDelDia();
    await resolver(j, favor);
    expect(j.minutoDelDia() - antes).toBeLessThan(favor.solucion.length);
  });
});

describe("jornada: guardar y restaurar (F4-12)", () => {
  const texto = (r: Awaited<ReturnType<Jornada["ejecutar"]>>) =>
    r.resultado.fragmentos.map((f) => f.texto).join("");

  it("restaura a mitad del turno: misión, avance, mundo y reloj, sin repetir diálogos", async () => {
    const j = Jornada.iniciar(t1, mundo, 7);
    await j.ejecutar("mkdir notas");
    await resolver(j, t1.misiones[0] as Mision);
    const m2 = t1.misiones[1] as Mision;
    const primerPaso = m2.solucion.find((p) => typeof p === "string") as string;
    await j.ejecutar(plantilla(primerPaso, j.actual()?.vars ?? {}));
    const cumplidosAntes = [...(j.actual()?.cumplidos ?? [])];
    j.tomarEventos();

    const guardado = JSON.parse(JSON.stringify(j.guardar()));
    const r = Jornada.restaurar(t1, mundo, 7, guardado);
    expect(r.actual()?.mision.id).toBe(m2.id);
    expect([...(r.actual()?.cumplidos ?? [])]).toEqual(cumplidosAntes);
    expect(r.tomarEventos()).toEqual([]);
    expect(r.minutoDelDia()).toBe(j.minutoDelDia());
    expect(r.guardar()).toEqual(guardado);
    expect(texto(await r.ejecutar("ls"))).toContain("notas");
    expect(r.completadas()).toEqual({ [(t1.misiones[0] as Mision).id]: 3 });

    // Y se puede terminar el turno desde lo restaurado.
    for (const m of t1.misiones.slice(1)) await resolver(r, m);
    expect(r.turnoCompletado()).toBe(true);
  });

  it("los favores terminados no regresan; uno a medias se reinicia", async () => {
    const j = Jornada.iniciar(t1, mundo, 4);
    for (const m of t1.misiones.slice(0, -1)) await resolver(j, m);
    const favor = t1.favores[0] as Mision;
    expect(j.favoresActivos().map((f) => f.mision.id)).toEqual([favor.id]);
    const aMedias = Jornada.restaurar(t1, mundo, 4, JSON.parse(JSON.stringify(j.guardar())));
    expect(aMedias.favoresActivos().map((f) => f.mision.id)).toEqual([favor.id]);

    await resolver(j, favor);
    const r = Jornada.restaurar(t1, mundo, 4, JSON.parse(JSON.stringify(j.guardar())));
    expect(r.favoresActivos()).toEqual([]);
    expect(r.completadas()[favor.id]).toBeGreaterThanOrEqual(1);
  });

  it("con el turno terminado se restaura terminado y el guardado cabe en 64 KB", async () => {
    const j = Jornada.iniciar(t1, mundo, 9);
    for (const m of t1.misiones) await resolver(j, m);
    const g = j.guardar();
    expect(g.mision).toBeNull();
    expect(JSON.stringify(g).length).toBeLessThan(64 * 1024);
    const r = Jornada.restaurar(t1, mundo, 9, JSON.parse(JSON.stringify(g)));
    expect(r.turnoCompletado()).toBe(true);
    expect(r.actual()).toBeNull();
  });

  it("un guardado de una misión que ya no existe es un error claro", () => {
    const j = Jornada.iniciar(t1, mundo, 1);
    const g = j.guardar();
    expect(() =>
      Jornada.restaurar(t1, mundo, 1, {
        ...g,
        mision: { ...(g.mision as object), id: "t1-m99-nada" },
      } as never),
    ).toThrow(/t1-m99-nada/);
  });
});
