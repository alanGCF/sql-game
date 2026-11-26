import { describe, expect, it } from "vitest";
import { cargarLlamadas, cargarPersonajes } from "../../scripts/lib/contenido";
import { elegirLlamada, type GuionLlamadas, revisarLlamadas } from "../../src/engine/llamadas";

const guion: GuionLlamadas = {
  contacto: "don_chuy",
  conversaciones: [
    { id: "general", lineas: ["¿Qué pasó, joven?"] },
    { id: "otra", lineas: ["Ando con la prensa."] },
    { id: "t1", turnos: [1], lineas: ["Ese LEEME lo escribió la ingeniera."] },
    { id: "leyo", requiere: "leyo_leeme", lineas: ["¿Ya leíste lo de la muchacha?"] },
  ],
  ponte_a_trabajar: ["¿No tienes trabajo? Ponte a trabajar.", "Ándale, a trabajar."],
  no_contesta: "Suena y suena; nadie contesta.",
};

const elegir = (n: number, extra: { turno?: number; flags?: string[]; paciencia?: number } = {}) =>
  elegirLlamada(guion, {
    turno: extra.turno ?? 1,
    llamada: n,
    paciencia: extra.paciencia ?? 2,
    flags: new Set(extra.flags ?? []),
    semilla: 7,
  });

describe("llamadas salientes y paciencia (F4-02)", () => {
  it("llamadas 1–2 platican, la 3 'ponte a trabajar', de la 4 en adelante no contesta", () => {
    expect(elegir(1).tipo).toBe("charla");
    expect(elegir(2).tipo).toBe("charla");
    expect(elegir(3).tipo).toBe("ponte_a_trabajar");
    expect(elegir(4)).toEqual({ tipo: "no_contesta", texto: "Suena y suena; nadie contesta." });
    expect(elegir(9).tipo).toBe("no_contesta");
  });

  it("Gerencia gasta paciencia al doble: con paciencia 1, la segunda llamada ya es 'ponte a trabajar'", () => {
    expect(elegir(1, { paciencia: 1 }).tipo).toBe("charla");
    expect(elegir(2, { paciencia: 1 }).tipo).toBe("ponte_a_trabajar");
    expect(elegir(3, { paciencia: 1 }).tipo).toBe("no_contesta");
  });

  it("primero lo del turno y lo que pide una bandera; luego lo general; sin repetir dentro del turno", () => {
    const ids = (r: ReturnType<typeof elegir>) => (r.tipo === "charla" ? r.conversacion.id : r.tipo);
    expect(ids(elegir(1))).toBe("t1");
    expect(ids(elegir(2))).toBe("general");
    expect(ids(elegir(1, { flags: ["leyo_leeme"] }))).toBe("t1");
    expect(ids(elegir(2, { flags: ["leyo_leeme"] }))).toBe("leyo");
    expect(ids(elegir(1, { turno: 2 }))).toBe("general");
    expect(ids(elegir(2, { turno: 2 }))).toBe("otra");
    // Con más paciencia que conversaciones se repite la última general.
    expect(ids(elegir(5, { turno: 2, paciencia: 9 }))).toBe("otra");
  });

  it("'ponte a trabajar' sale de su lista con la semilla y el turno (determinista)", () => {
    const a = elegir(3);
    expect(a).toEqual(elegir(3));
    expect(a.tipo === "ponte_a_trabajar" && guion.ponte_a_trabajar.includes(a.texto)).toBe(true);
  });
});

describe("harness de llamadas (content/llamadas)", () => {
  const personajes = cargarPersonajes().personajes;

  it("el contenido real pasa: un archivo por contacto con extensión y una conversación general", () => {
    const llamadas = cargarLlamadas();
    expect(revisarLlamadas(llamadas, personajes, new Set(["leyo_leeme", "vio_carpeta_r"]))).toEqual([]);
    const conExtension = Object.entries(personajes)
      .filter(([id, p]) => p.extension !== undefined && id !== "jugador")
      .map(([id]) => id)
      .sort();
    expect(Object.keys(llamadas).sort()).toEqual(conExtension);
  });

  it("detecta contacto sin extensión, bandera desconocida, falta de conversación general y variables", () => {
    const malo: GuionLlamadas = {
      contacto: "rsalcido",
      conversaciones: [
        { id: "a", turnos: [1], lineas: ["Hola {{nombre}}"] },
        { id: "a", requiere: "no_existe", lineas: ["x"] },
      ],
      ponte_a_trabajar: ["y"],
      no_contesta: "z",
    };
    const errores = revisarLlamadas({ rsalcido: malo }, personajes, new Set()).join("\n");
    expect(errores).toMatch(/rsalcido.*sin extensión/);
    expect(errores).toMatch(/bandera desconocida: no_existe/);
    expect(errores).toMatch(/conversación general/);
    expect(errores).toMatch(/variables/);
    expect(errores).toMatch(/id repetido: a/);
    expect(errores).toMatch(/falta content\/llamadas\/companero.yaml/);
  });
});
