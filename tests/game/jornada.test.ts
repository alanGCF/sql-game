import { describe, expect, it } from "vitest";
import { archivosYaml, cargarLlamadas, cargarMundo, leerYaml } from "../../scripts/lib/contenido";
import type { GuionLlamadas } from "../../src/engine/llamadas";
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

describe("jornada: llamadas salientes (F4-02)", () => {
  const guiones = cargarLlamadas();
  const eduardo = guiones.companero as GuionLlamadas;

  it("la paciencia se cuenta por contacto: 2 charlas, 'ponte a trabajar' y luego no contesta", async () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    j.tomarEventos();
    const tipos = [];
    for (let i = 0; i < 4; i++) tipos.push((await j.llamar("companero", eduardo, 2)).llamada.tipo);
    expect(tipos).toEqual(["charla", "charla", "ponte_a_trabajar", "no_contesta"]);
    // Otro contacto tiene su propia paciencia.
    expect((await j.llamar("karla", guiones.karla as GuionLlamadas, 2)).llamada.tipo).toBe("charla");
  });

  it("una llamada contestada deja la bandera llamo_<contacto> y suma 2 minutos; sin contestar, nada", async () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    const antes = j.minutoDelDia();
    await j.llamar("companero", eduardo, 2);
    expect(j.flags.has("llamo_companero")).toBe(true);
    expect(j.minutoDelDia() - antes).toBeCloseTo(2);
    // Con paciencia 0, la primera ya es "ponte a trabajar" (contesta) y la segunda no contesta.
    await j.llamar("karla", guiones.karla as GuionLlamadas, 0);
    expect(j.flags.has("llamo_karla")).toBe(true);
    const r = await j.llamar("karla", guiones.karla as GuionLlamadas, 0);
    expect(r.llamada.tipo).toBe("no_contesta");
    expect(j.minutoDelDia() - antes).toBeCloseTo(4);
  });

  it("decidir (una opción de la llamada) deja su bandera", async () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    await j.decidir("tomo_cafe");
    expect(j.flags.has("tomo_cafe")).toBe(true);
  });

  it("la paciencia gastada se guarda y se restaura con la partida", async () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    await j.llamar("companero", eduardo, 2);
    await j.llamar("companero", eduardo, 2);
    const e = j.guardar();
    expect(e.llamadas).toEqual({ companero: 2 });
    const r = Jornada.restaurar(t1, mundo, 3, e);
    expect((await r.llamar("companero", eduardo, 2)).llamada.tipo).toBe("ponte_a_trabajar");
  });
});

describe("jornada: pistas de Eduardo por teléfono (F4-03)", () => {
  const guiones = cargarLlamadas();
  const eduardo = guiones.companero as GuionLlamadas;

  it("pendientes para pista: los objetivos sin cumplir de la misión en curso (y favores)", () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    const p = j.pendientesParaPista();
    expect(p.length).toBeGreaterThan(0);
    expect(p.every((x) => x.mision === "t1-m01-donde-estoy")).toBe(true);
    expect(p[0]).toHaveProperty("pendiente");
  });

  it("tres niveles, uno por llamada; la cuarta repite el comando exacto sin cambiar estrellas", () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    const [o] = j.pendientesParaPista();
    if (!o) throw new Error("sin pendientes");
    const niveles = [1, 2, 3, 4].map(() => j.pista(o.mision, o.objetivo));
    expect(niveles.map((p) => [p.nivel, p.nueva])).toEqual([
      [1, true],
      [2, true],
      [3, true],
      [3, false],
    ]);
    expect(niveles[3]?.texto).toBe(niveles[2]?.texto);
    expect(niveles[2]?.texto).toMatch(/`[^`]+`/);
    expect(j.actual()?.estrellas()).toBe(1);
  });

  it("pedir pista no gasta la paciencia de Eduardo (D-14)", async () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    const [o] = j.pendientesParaPista();
    if (!o) throw new Error("sin pendientes");
    for (let i = 0; i < 3; i++) j.pista(o.mision, o.objetivo);
    expect(j.guardar().llamadas).toEqual({});
    expect((await j.llamar("companero", eduardo, 2)).llamada.tipo).toBe("charla");
  });

  it("una pista de un objetivo que no está pendiente es un error claro", () => {
    const j = Jornada.iniciar(t1, mundo, 3);
    expect(() => j.pista("t1-m02-el-leeme", "x")).toThrow(/no está activa/);
  });
});

describe("jornada: libreta (F4-05)", () => {
  it("al terminar una misión entran sus apuntes, en orden y con las variables de la partida", async () => {
    const j = Jornada.iniciar(t1, mundo, 7);
    expect(j.libreta()).toEqual([]);
    const m1 = t1.misiones[0] as Mision;
    await resolver(j, m1);
    const l = j.libreta();
    expect(l.map((e) => [e.pestana, e.concepto ?? null])).toEqual([
      ["comandos", "linux.nav.pwd"],
      ["comandos", "linux.nav.ls"],
      ["historia", null],
    ]);
    expect(l.every((e) => e.mision === m1.id)).toBe(true);
    await resolver(j, t1.misiones[1] as Mision);
    await resolver(j, t1.misiones[2] as Mision);
    const historia = j.libreta().filter((e) => e.pestana === "historia");
    expect(historia.at(-1)?.texto).toMatch(/La Línea 3 lleva \d+ paros/);
    expect(historia.every((e) => !e.texto?.includes("{{"))).toBe(true);
  });
});
