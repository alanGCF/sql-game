import { normalizeIP } from "@fastify/rate-limit";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  CrearPartidaCuerpo,
  type ErrorApi,
  GuardarPartidaCuerpo,
  type PartidaCreada,
} from "../../shared/api.js";
import { generarCodigo, normalizarCodigo } from "../../shared/codigo.js";
import {
  CABECERA_CODIGO,
  LIMITE_ALMACEN_PARTIDAS_BYTES,
  LIMITE_CODIGOS_INEXISTENTES_GLOBAL_POR_HORA,
  LIMITE_CODIGOS_INEXISTENTES_POR_HORA,
  LIMITE_CREAR_PARTIDAS_GLOBAL_POR_HORA,
  LIMITE_CREAR_PARTIDAS_POR_HORA,
  LIMITE_CUERPO_BYTES,
  LIMITE_PETICIONES_CON_CODIGO_POR_MINUTO,
} from "../../shared/limites.js";
import { leerPartida, type Partida } from "../../shared/partida.js";
import { codigoDeError, hashCodigo, type RepositorioPartidas } from "./partidas.js";

export interface OpcionesPartidas {
  repo: RepositorioPartidas;
  /** Clave del HMAC del código (32 bytes, PARTIDAS_PEPPER). */
  pepper: Buffer;
  /** Topes globales (pruebas): por omisión los de shared/limites.ts. */
  topeCreacionGlobalPorHora?: number;
  limiteAlmacenBytes?: number;
}

/** IPv4 tal cual; IPv6 agrupado por /64 (una sola conexión doméstica puede usar millones de direcciones). */
export const claveIp = (req: FastifyRequest): string => normalizeIP(req.ip, 64);

// Misma URL para todos los jugadores: nada de caché compartida (ni con un CDN delante).
const enviar = (reply: FastifyReply, status: number, cuerpo: ErrorApi | object) =>
  reply
    .status(status)
    .header("Cache-Control", "private, no-store")
    .header("Vary", CABECERA_CODIGO)
    .send(cuerpo);

const noEncontrado = (reply: FastifyReply) => enviar(reply, 404, { error: "no_encontrado" });
const invalida = (reply: FastifyReply) => enviar(reply, 400, { error: "solicitud_invalida" });
const demasiadas = (reply: FastifyReply) => enviar(reply, 429, { error: "demasiadas_solicitudes" });

/** La base no responde o falla: se registra solo el código de error y el cliente recibe 503 sin detalles. */
function sinServicio(req: FastifyRequest, reply: FastifyReply, e?: unknown) {
  if (e) req.log.error({ codigo: codigoDeError(e) }, "falla del almacén de partidas");
  return enviar(reply, 503, { error: "sin_servicio" });
}

/**
 * Códigos inexistentes por /64 en ventanas de una hora: con el tope, ese origen recibe 429 en toda petición
 * con código hasta que pase la hora (aunque luego atine). Memoria acotada: se olvidan los más viejos.
 */
class ContadorFallos {
  private readonly ventanas = new Map<string, { inicio: number; n: number }>();
  constructor(
    private readonly max: number,
    private readonly ventanaMs: number,
    private readonly capacidad = 10_000,
    private readonly ahora: () => number = Date.now,
  ) {}

  bloqueado(clave: string): boolean {
    const v = this.ventanas.get(clave);
    return v !== undefined && this.ahora() - v.inicio < this.ventanaMs && v.n >= this.max;
  }

  /**
   * Cuenta un fallo (o lo reserva antes de consultar la base, para que peticiones en paralelo no se salten
   * el tope). Devuelve true cuando llega al tope, para dejar constancia en el log una sola vez.
   */
  fallo(clave: string): boolean {
    const t = this.ahora();
    let v = this.ventanas.get(clave);
    if (!v || t - v.inicio >= this.ventanaMs) {
      // Reinsertar mantiene el Map ordenado por inicio de ventana: lo primero es lo más viejo.
      this.ventanas.delete(clave);
      v = { inicio: t, n: 0 };
      this.ventanas.set(clave, v);
      if (this.ventanas.size > this.capacidad) {
        const masVieja = this.ventanas.keys().next().value;
        if (masVieja !== undefined) this.ventanas.delete(masVieja);
      }
    }
    v.n++;
    return v.n === this.max;
  }

  /** Devuelve una reserva: el código sí existía. */
  devolver(clave: string): void {
    const v = this.ventanas.get(clave);
    if (v && v.n > 0) v.n--;
  }
}

/** Conjunto acotado (se olvidan los más viejos). */
class Recientes {
  private readonly claves = new Set<string>();
  constructor(private readonly capacidad = 10_000) {}
  has(k: string): boolean {
    return this.claves.has(k);
  }
  add(k: string): void {
    this.claves.delete(k);
    this.claves.add(k);
    if (this.claves.size > this.capacidad) {
      const vieja = this.claves.values().next().value;
      if (vieja !== undefined) this.claves.delete(vieja);
    }
  }
}

/** Contador de ventana fija para topes globales (todos los orígenes juntos). */
class TopeGlobal {
  private inicio = 0;
  private n = 0;
  constructor(
    private readonly max: number,
    private readonly ventanaMs: number,
  ) {}
  /** Suma uno; devuelve "ok", "tope" (justo lo alcanzó: avisar) o "excedido". */
  sumar(): "ok" | "tope" | "excedido" {
    const t = Date.now();
    if (t - this.inicio >= this.ventanaMs) {
      this.inicio = t;
      this.n = 0;
    }
    this.n++;
    return this.n < this.max ? "ok" : this.n === this.max ? "tope" : "excedido";
  }
}

/**
 * /api/partidas y /api/partida (05-arquitectura.md §Servidor, 08-seguridad.md). Sin cookies ni sesiones: el
 * código es la única llave y viaja en la cabecera x-codigo-partida, nunca en la URL (los logs del borde de
 * Railway registran la ruta). Formato y verificador se revisan antes de tocar la base; inexistente, mal
 * formado o ausente dan el mismo 404. Sin base (`null`) la API contesta 503 y el sitio sigue funcionando.
 */
export function rutasPartidas(app: FastifyInstance, opts: OpcionesPartidas | null): void {
  const HORA = 3_600_000;
  const fallos = new ContadorFallos(LIMITE_CODIGOS_INEXISTENTES_POR_HORA, HORA);
  // Códigos que un origen ya abrió con éxito: siguen funcionando aunque alguien más detrás del mismo NAT
  // haya agotado los fallos de ese origen (solo se bloquean códigos nuevos).
  const conocidos = new Recientes();
  const fallosGlobales = new TopeGlobal(LIMITE_CODIGOS_INEXISTENTES_GLOBAL_POR_HORA, HORA);
  const creacionGlobal = new TopeGlobal(
    opts?.topeCreacionGlobalPorHora ?? LIMITE_CREAR_PARTIDAS_GLOBAL_POR_HORA,
    HORA,
  );
  const limiteAlmacen = opts?.limiteAlmacenBytes ?? LIMITE_ALMACEN_PARTIDAS_BYTES;
  let almacen = { revisado: 0, lleno: false };

  /** ¿Se llenó el espacio de partidas? Se consulta a lo más una vez por minuto. */
  async function almacenLleno(req: FastifyRequest, repo: RepositorioPartidas): Promise<boolean> {
    if (Date.now() - almacen.revisado < 60_000) return almacen.lleno;
    const bytes = await repo.tamanoBytes();
    almacen = { revisado: Date.now(), lleno: bytes > limiteAlmacen };
    if (almacen.lleno) req.log.error({ bytes }, "almacén de partidas lleno: no se crean ni guardan partidas");
    return almacen.lleno;
  }
  // Leer y guardar comparten un solo limitador (un store): un presupuesto de peticiones con código por origen.
  const limiteCodigo = app.rateLimit({
    max: LIMITE_PETICIONES_CON_CODIGO_POR_MINUTO,
    timeWindow: "1 minute",
    keyGenerator: (req: FastifyRequest) => `${claveIp(req)}|codigo`,
  });
  const conCodigo = { config: { rateLimit: false }, onRequest: limiteCodigo } as const;

  interface Acceso {
    hash: Buffer;
    marca: string;
    origen: string;
    reservado: boolean;
  }

  function contarFallo(req: FastifyRequest, origen: string) {
    if (fallos.fallo(origen))
      // Alerta por volumen: alguien prueba códigos al azar. Solo el origen, nunca los códigos.
      req.log.warn({ origen }, "demasiados códigos inexistentes desde un origen");
    if (fallosGlobales.sumar() === "tope")
      req.log.warn("demasiados códigos inexistentes en total en la última hora");
  }

  /**
   * Código válido de la cabecera y su hash, o null tras responder (429 o 404). El fallo se reserva antes de
   * consultar la base y se devuelve si el código existe (`exito`).
   */
  function acceso(req: FastifyRequest, reply: FastifyReply, pepper: Buffer): Acceso | null {
    const origen = claveIp(req);
    const valor = req.headers[CABECERA_CODIGO];
    const codigo = typeof valor === "string" ? normalizarCodigo(valor) : null;
    const hash = codigo ? hashCodigo(codigo, pepper) : null;
    const marca = hash ? `${origen}|${hash.subarray(0, 8).toString("hex")}` : "";
    const conocido = hash !== null && conocidos.has(marca);
    if (!conocido && fallos.bloqueado(origen)) {
      demasiadas(reply);
      return null;
    }
    if (!hash) {
      contarFallo(req, origen);
      noEncontrado(reply);
      return null;
    }
    if (!conocido) contarFallo(req, origen);
    return { hash, marca, origen, reservado: !conocido };
  }

  function exito(a: Acceso) {
    conocidos.add(a.marca);
    if (a.reservado) fallos.devolver(a.origen);
  }

  app.post(
    "/api/partidas",
    {
      config: {
        rateLimit: {
          max: LIMITE_CREAR_PARTIDAS_POR_HORA,
          timeWindow: "1 hour",
          // Crear agrupa IPv6 por /56: es la acción que más espacio cuesta.
          keyGenerator: (req: FastifyRequest) => `${normalizeIP(req.ip, 56)}|crear`,
        },
      },
    },
    async (req, reply) => {
      if (!opts) return sinServicio(req, reply);
      const cuerpo = CrearPartidaCuerpo.safeParse(req.body);
      if (!cuerpo.success) return invalida(reply);
      const global = creacionGlobal.sumar();
      if (global === "tope") req.log.warn("tope global de partidas nuevas por hora alcanzado");
      if (global !== "ok" && global !== "tope") return demasiadas(reply);
      const semilla = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
      const partida: Partida = {
        formato: 1,
        semilla,
        nombre: cuerpo.data.nombre,
        contenido: cuerpo.data.contenido,
        turno: 0,
        completadas: {},
        favores: [],
        flags: [],
        xp: 0,
        notas: [],
        mision: null,
      };
      try {
        if (await almacenLleno(req, opts.repo)) return sinServicio(req, reply);
        // Una colisión de 55 bits es casi imposible; si pasa, se genera otro código.
        for (let intento = 0; intento < 3; intento++) {
          const codigo = generarCodigo();
          const hash = hashCodigo(codigo, opts.pepper);
          if (await opts.repo.crear(hash, partida)) {
            conocidos.add(`${claveIp(req)}|${hash.subarray(0, 8).toString("hex")}`);
            const creada: PartidaCreada = { codigo, revision: 1, partida };
            return enviar(reply, 201, creada);
          }
        }
        return sinServicio(req, reply, { code: "COLISION" });
      } catch (e) {
        return sinServicio(req, reply, e);
      }
    },
  );

  app.get("/api/partida", { exposeHeadRoute: false, ...conCodigo }, async (req, reply) => {
    if (!opts) return sinServicio(req, reply);
    const a = acceso(req, reply, opts.pepper);
    if (!a) return reply;
    try {
      const g = await opts.repo.leer(a.hash);
      if (!g) return noEncontrado(reply);
      exito(a);
      return enviar(reply, 200, { revision: g.revision, partida: g.datos });
    } catch (e) {
      if (a.reservado) fallos.devolver(a.origen);
      return sinServicio(req, reply, e);
    }
  });

  app.put(
    "/api/partida",
    {
      ...conCodigo,
      // La partida puede medir hasta el límite; el sobre (revisión) cabe en el margen.
      bodyLimit: LIMITE_CUERPO_BYTES + 1024,
    },
    async (req, reply) => {
      if (!opts) return sinServicio(req, reply);
      // El cuerpo se valida antes del código: un cuerpo roto no gasta intentos de código.
      const cuerpo = GuardarPartidaCuerpo.safeParse(req.body);
      if (!cuerpo.success) return invalida(reply);
      const partida = leerPartida(cuerpo.data.partida);
      if (!partida.ok) return invalida(reply);
      const a = acceso(req, reply, opts.pepper);
      if (!a) return reply;
      try {
        if (await almacenLleno(req, opts.repo)) {
          if (a.reservado) fallos.devolver(a.origen);
          return sinServicio(req, reply);
        }
        const r = await opts.repo.guardar(a.hash, partida.partida, cuerpo.data.revision);
        if (r.tipo === "no_existe") return noEncontrado(reply);
        exito(a);
        if (r.tipo === "conflicto")
          return enviar(reply, 409, { error: "revision_vieja", revision: r.revision });
        return enviar(reply, 200, { revision: r.revision });
      } catch (e) {
        if (a.reservado) fallos.devolver(a.origen);
        return sinServicio(req, reply, e);
      }
    },
  );
}
