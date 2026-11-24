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
