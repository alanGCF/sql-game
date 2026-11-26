import { describe, expect, it } from "vitest";
import { archivosYaml, cargarMundo, leerYaml } from "../../scripts/lib/contenido";
import { generarCodigo } from "../../shared/codigo";
import type { Partida } from "../../shared/partida";
import { leerPartida } from "../../shared/partida";
import { compilarContenido, type TurnoCompilado } from "../../src/engine/mision/compilar";
import { type ApiPartidas, crearApiPartidas, type RespuestaApi } from "../../src/game/api";
import { type AlmacenLocal, aPartida, estadoDe, Guardian, leerGuardadoLocal } from "../../src/game/guardado";
import { Jornada } from "../../src/game/jornada";

const mundo = cargarMundo();
const t1 = compilarContenido(
  archivosYaml("content/misiones").map((ruta) => {
    const y = leerYaml(ruta);
    if (!y.ok) throw new Error(y.error);
    return { ruta, datos: y.datos };
  }),
).turnos.get("01") as TurnoCompilado;

/** Un código válido (con verificador) para el servidor falso. */
const CODIGO = generarCodigo((n) => new Uint8Array(n).fill(7));
const OTRO = `${CODIGO.slice(0, 11)}${CODIGO[11] === "0" ? "1" : "0"}`;

const base = { semilla: 5, nombre: "Ale", contenido: "v1", xp: 0, notas: [] as string[], pistas: [] };

function almacenMemoria(): AlmacenLocal & { dato: unknown } {
  return {
    dato: null,
    async leer() {
      return this.dato;
    },
    async escribir(g) {
      this.dato = JSON.parse(JSON.stringify(g));
    },
    async borrar() {
      this.dato = null;
    },
  };
}

/** Servidor falso: guarda por código con revisión, o finge estar caído. */
function servidorFalso() {
  const partidas = new Map<string, { revision: number; partida: Partida }>();
  let caido = false;
  const api: ApiPartidas = {
    async crear(nombre, contenido) {
      if (caido) return { ok: false, motivo: "sin_conexion" };
      const partida: Partida = {
        ...aPartida(Jornada.iniciar(t1, mundo, 77), { ...base, nombre, contenido }),
      };
      partidas.set(CODIGO, { revision: 1, partida });
      return { ok: true, valor: { codigo: CODIGO, revision: 1, partida } };
    },
    async leer(codigo) {
      if (caido) return { ok: false, motivo: "sin_conexion" };
      const p = partidas.get(codigo);
      return p ? { ok: true, valor: p } : { ok: false, motivo: "no_encontrado" };
    },
    async guardar(codigo, revision, partida): Promise<RespuestaApi<{ revision: number }>> {
      if (caido) return { ok: false, motivo: "sin_conexion" };
      const p = partidas.get(codigo);
      if (!p) return { ok: false, motivo: "no_encontrado" };
      if (p.revision !== revision) return { ok: false, motivo: "conflicto", revision: p.revision };
      partidas.set(codigo, { revision: revision + 1, partida });
      return { ok: true, valor: { revision: revision + 1 } };
    },
  };
  return {
    api,
    partidas,
    caer: () => {
      caido = true;
    },
    levantar: () => {
      caido = false;
    },
  };
}

describe("partida ↔ jornada", () => {
  it("aPartida produce una partida válida y estadoDe la devuelve a la jornada", async () => {
    const j = Jornada.iniciar(t1, mundo, 5);
    await j.ejecutar("mkdir notas");
    const p = aPartida(j, base);
    expect(leerPartida(JSON.parse(JSON.stringify(p))).ok).toBe(true);
    expect(p).toMatchObject({ formato: 1, semilla: 5, nombre: "Ale", turno: 1 });
    const r = Jornada.restaurar(t1, mundo, p.semilla, estadoDe(p));
    expect(r.guardar()).toEqual(j.guardar());
  });
});

describe("guardado local", () => {
  it("rechaza lo que no es un guardado válido (almacenamiento manipulado)", () => {
    const p = aPartida(Jornada.iniciar(t1, mundo, 5), base);
    expect(leerGuardadoLocal({ codigo: CODIGO, revision: 1, pendiente: false, partida: p })).not.toBeNull();
    expect(leerGuardadoLocal(null)).toBeNull();
    expect(leerGuardadoLocal({ codigo: 5, revision: 1, pendiente: false, partida: p })).toBeNull();
    expect(
      leerGuardadoLocal({ codigo: null, revision: 1, pendiente: false, partida: { ...p, xp: "x" } }),
    ).toBeNull();
    expect(leerGuardadoLocal({ codigo: OTRO, revision: 1, pendiente: false, partida: p })).toBeNull();
  });
});

describe("Guardian: local siempre, servidor en cada checkpoint", () => {
  it("empieza en el servidor y sube los checkpoints con la revisión", async () => {
    const s = servidorFalso();
    const local = almacenMemoria();
    const g = new Guardian(local, s.api);
    const inicio = await g.empezar("Ale", "v1", () => 9);
    expect(inicio.codigo).toBe(CODIGO);
    const p = { ...inicio.partida, xp: 30 };
    await g.checkpoint(p);
    expect(g.estado?.revision).toBe(2);
    expect(g.estado?.pendiente).toBe(false);
    expect(s.partidas.get(CODIGO)?.partida.xp).toBe(30);
    expect(leerGuardadoLocal(local.dato)?.partida.xp).toBe(30);
  });

  it("sin servidor al empezar: partida solo local con semilla local", async () => {
    const s = servidorFalso();
    s.caer();
    const g = new Guardian(almacenMemoria(), s.api);
    const inicio = await g.empezar("Ale", "v1", () => 1234);
    expect(inicio.codigo).toBeNull();
    expect(inicio.partida.semilla).toBe(1234);
    expect(inicio.sinServidor).toBe(true);
  });

  it("sin conexión el checkpoint queda pendiente y se sube al volver", async () => {
    const s = servidorFalso();
    const g = new Guardian(almacenMemoria(), s.api);
    const inicio = await g.empezar("Ale", "v1", () => 9);
    s.caer();
    await g.checkpoint({ ...inicio.partida, xp: 50 });
    expect(g.estado?.pendiente).toBe(true);
    s.levantar();
    await g.subir();
    expect(g.estado?.pendiente).toBe(false);
    expect(s.partidas.get(CODIGO)?.partida.xp).toBe(50);
  });

  it("con una revisión vieja (otra computadora guardó antes) gana este checkpoint", async () => {
    const s = servidorFalso();
    const g = new Guardian(almacenMemoria(), s.api);
    const inicio = await g.empezar("Ale", "v1", () => 9);
    const otro = s.partidas.get(CODIGO);
    if (otro) s.partidas.set(CODIGO, { revision: 4, partida: otro.partida });
    await g.checkpoint({ ...inicio.partida, xp: 70 });
    expect(g.estado?.revision).toBe(5);
    expect(s.partidas.get(CODIGO)?.partida.xp).toBe(70);
  });

  it("checar entrada trae la partida del servidor y la deja en local", async () => {
    const s = servidorFalso();
    await new Guardian(almacenMemoria(), s.api).empezar("Ale", "v1", () => 9);
    const local = almacenMemoria();
    const g = new Guardian(local, s.api);
    expect(
      await g.checarEntrada(`${CODIGO.slice(0, 4)}-${CODIGO.slice(4, 8)}-${CODIGO.slice(8)}`.toLowerCase()),
    ).toMatchObject({ ok: true });
    expect(leerGuardadoLocal(local.dato)?.codigo).toBe(CODIGO);
    expect(await g.checarEntrada("0000-0000-0000")).toEqual({ ok: false, motivo: "no_encontrado" });
    expect(await g.checarEntrada(OTRO)).toEqual({ ok: false, motivo: "invalido" });
  });

  it("olvidar borra la partida de este navegador; en el servidor sigue con su número (D-26)", async () => {
    const s = servidorFalso();
    const local = almacenMemoria();
    const g = new Guardian(local, s.api);
    await g.empezar("Ale", "v1", () => 9);
    await g.olvidar();
    expect(g.estado).toBeNull();
    expect(local.dato).toBeNull();
    expect(await new Guardian(local, s.api).cargarLocal()).toBeNull();
    expect(await new Guardian(almacenMemoria(), s.api).checarEntrada(CODIGO)).toMatchObject({ ok: true });
  });

  it("continuar usa lo local aunque el servidor esté caído", async () => {
    const s = servidorFalso();
    const local = almacenMemoria();
    await new Guardian(local, s.api).empezar("Ale", "v1", () => 9);
    s.caer();
    const g = new Guardian(local, s.api);
    const previo = await g.cargarLocal();
    expect(previo?.partida.nombre).toBe("Ale");
  });
});

describe("cliente HTTP de la API", () => {
  const respuesta = (status: number, cuerpo: unknown) =>
    ({ status, ok: status < 300, json: async () => cuerpo }) as Response;

  it("manda el código en la cabecera, nunca en la URL, y valida lo que llega", async () => {
    const llamadas: { url: string; init: RequestInit | undefined }[] = [];
    const p = aPartida(Jornada.iniciar(t1, mundo, 5), base);
    const api = crearApiPartidas(async (url, init) => {
      llamadas.push({ url: String(url), init });
      return respuesta(200, { revision: 3, partida: p });
    });
    const r = await api.leer(CODIGO);
    expect(r).toMatchObject({ ok: true, valor: { revision: 3 } });
    expect(llamadas[0]?.url).toBe("/api/partida");
    expect(new Headers(llamadas[0]?.init?.headers).get("x-codigo-partida")).toBe(CODIGO);

    const mala = crearApiPartidas(async () =>
      respuesta(200, { revision: 3, partida: { ...p, admin: true } }),
    );
    expect(await mala.leer(CODIGO)).toEqual({ ok: false, motivo: "invalido" });
  });

  it("traduce los estados del servidor y la falta de red", async () => {
    const con = (status: number, cuerpo: unknown = {}) =>
      crearApiPartidas(async () => respuesta(status, cuerpo));
    expect(await con(404).leer(CODIGO)).toEqual({ ok: false, motivo: "no_encontrado" });
    expect(await con(429).leer(CODIGO)).toEqual({ ok: false, motivo: "demasiadas" });
    expect(await con(503).leer(CODIGO)).toEqual({ ok: false, motivo: "sin_servicio" });
    const p = aPartida(Jornada.iniciar(t1, mundo, 5), base);
    expect(await con(409, { error: "revision_vieja", revision: 7 }).guardar(CODIGO, 1, p)).toEqual({
      ok: false,
      motivo: "conflicto",
      revision: 7,
    });
    const sinRed = crearApiPartidas(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await sinRed.leer(CODIGO)).toEqual({ ok: false, motivo: "sin_conexion" });
  });
});
