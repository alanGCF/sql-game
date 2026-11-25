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
  LIMITE_CODIGOS_INEXISTENTES_POR_HORA,
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
}

/** IPv4 tal cual; IPv6 agrupado por /64 (una sola conexión doméstica puede usar millones de direcciones). */
export const claveIp = (req: FastifyRequest): string => normalizeIP(req.ip, 64);

const enviar = (reply: FastifyReply, status: number, cuerpo: ErrorApi | object) =>
  reply.status(status).header("Cache-Control", "no-store").send(cuerpo);

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

  /** Devuelve true cuando esta falla llega al tope (para dejar constancia en el log una sola vez). */
  fallo(clave: string): boolean {
    const t = this.ahora();
    let v = this.ventanas.get(clave);
    if (!v || t - v.inicio >= this.ventanaMs) {
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
}

/**
 * /api/partidas y /api/partida (05-arquitectura.md §Servidor, 08-seguridad.md). Sin cookies ni sesiones: el
 * código es la única llave y viaja en la cabecera x-codigo-partida, nunca en la URL (los logs del borde de
 * Railway registran la ruta). Formato y verificador se revisan antes de tocar la base; inexistente, mal
 * formado o ausente dan el mismo 404. Sin base (`null`) la API contesta 503 y el sitio sigue funcionando.
 */
export function rutasPartidas(app: FastifyInstance, opts: OpcionesPartidas | null): void {
  const fallos = new ContadorFallos(LIMITE_CODIGOS_INEXISTENTES_POR_HORA, 3_600_000);
  // Leer y guardar comparten un solo limitador (un store): un presupuesto de peticiones con código por origen.
  const limiteCodigo = app.rateLimit({
    max: LIMITE_PETICIONES_CON_CODIGO_POR_MINUTO,
    timeWindow: "1 minute",
    keyGenerator: (req: FastifyRequest) => `${claveIp(req)}|codigo`,
  });
  const conCodigo = { config: { rateLimit: false }, onRequest: limiteCodigo } as const;

  /** Código válido de la cabecera, o null tras responder (bloqueado o no encontrado). */
  function codigoDe(req: FastifyRequest, reply: FastifyReply): string | null {
    if (fallos.bloqueado(claveIp(req))) {
      demasiadas(reply);
      return null;
    }
    const valor = req.headers[CABECERA_CODIGO];
    const codigo = typeof valor === "string" ? normalizarCodigo(valor) : null;
    if (!codigo) noEncontradoContado(req, reply);
    return codigo;
  }

  function noEncontradoContado(req: FastifyRequest, reply: FastifyReply) {
    const origen = claveIp(req);
    if (fallos.fallo(origen))
      // Alerta por volumen: alguien prueba códigos al azar. Solo el origen, nunca los códigos.
      req.log.warn({ origen }, "demasiados códigos inexistentes desde un origen");
    return noEncontrado(reply);
  }

  app.post(
    "/api/partidas",
    {
      config: {
        rateLimit: {
          max: LIMITE_CREAR_PARTIDAS_POR_HORA,
          timeWindow: "1 hour",
          keyGenerator: (req: FastifyRequest) => `${claveIp(req)}|crear`,
        },
      },
    },
    async (req, reply) => {
      if (!opts) return sinServicio(req, reply);
      const cuerpo = CrearPartidaCuerpo.safeParse(req.body);
      if (!cuerpo.success) return invalida(reply);
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
        // Una colisión de 55 bits es casi imposible; si pasa, se genera otro código.
        for (let intento = 0; intento < 3; intento++) {
          const codigo = generarCodigo();
          if (await opts.repo.crear(hashCodigo(codigo, opts.pepper), partida)) {
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
    const codigo = codigoDe(req, reply);
    if (!codigo) return reply;
    try {
      const g = await opts.repo.leer(hashCodigo(codigo, opts.pepper));
      return g
        ? enviar(reply, 200, { revision: g.revision, partida: g.datos })
        : noEncontradoContado(req, reply);
    } catch (e) {
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
      const codigo = codigoDe(req, reply);
      if (!codigo) return reply;
      const cuerpo = GuardarPartidaCuerpo.safeParse(req.body);
      if (!cuerpo.success) return invalida(reply);
      const partida = leerPartida(cuerpo.data.partida);
      if (!partida.ok) return invalida(reply);
      try {
        const r = await opts.repo.guardar(
          hashCodigo(codigo, opts.pepper),
          partida.partida,
          cuerpo.data.revision,
        );
        if (r.tipo === "no_existe") return noEncontradoContado(req, reply);
        if (r.tipo === "conflicto")
          return enviar(reply, 409, { error: "revision_vieja", revision: r.revision });
        return enviar(reply, 200, { revision: r.revision });
      } catch (e) {
        return sinServicio(req, reply, e);
      }
    },
  );
}
