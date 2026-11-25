import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  CrearPartidaCuerpo,
  type ErrorApi,
  GuardarPartidaCuerpo,
  type PartidaCreada,
} from "../../shared/api.js";
import { generarCodigo, normalizarCodigo } from "../../shared/codigo.js";
import {
  LIMITE_CREAR_PARTIDAS_POR_HORA,
  LIMITE_CUERPO_BYTES,
  LIMITE_GUARDAR_PARTIDA_POR_MINUTO,
  LIMITE_LEER_PARTIDA_POR_MINUTO,
} from "../../shared/limites.js";
import { leerPartida, type Partida } from "../../shared/partida.js";
import { hashCodigo, type RepositorioPartidas } from "./partidas.js";

const enviar = (reply: FastifyReply, status: number, cuerpo: ErrorApi | object) =>
  reply.status(status).header("Cache-Control", "no-store").send(cuerpo);

const noEncontrado = (reply: FastifyReply) => enviar(reply, 404, { error: "no_encontrado" });
const invalida = (reply: FastifyReply) => enviar(reply, 400, { error: "solicitud_invalida" });

/** La base no responde o falla: se registra el error y el cliente recibe 503 sin detalles. */
function sinServicio(req: FastifyRequest, reply: FastifyReply, e?: unknown) {
  if (e) req.log.error({ err: e instanceof Error ? { tipo: e.name } : {} }, "falla del almacén de partidas");
  return enviar(reply, 503, { error: "sin_servicio" });
}

function limite(max: number, timeWindow: string, nombre: string) {
  return { rateLimit: { max, timeWindow, keyGenerator: (req: FastifyRequest) => `${req.ip}|${nombre}` } };
}

/**
 * /api/partidas (05-arquitectura.md §Servidor, 08-seguridad.md). Sin cookies ni sesiones: el código es la
 * única llave. Formato y verificador se revisan antes de tocar la base; inexistente y mal formado dan la
 * misma respuesta. Sin base (`repo` null) la API contesta 503 y el sitio sigue funcionando.
 */
export function rutasPartidas(app: FastifyInstance, repo: RepositorioPartidas | null): void {
  app.post(
    "/api/partidas",
    { config: limite(LIMITE_CREAR_PARTIDAS_POR_HORA, "1 hour", "crear") },
    async (req, reply) => {
      if (!repo) return sinServicio(req, reply);
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
          if (await repo.crear(hashCodigo(codigo), partida)) {
            const creada: PartidaCreada = { codigo, revision: 1, partida };
            return enviar(reply, 201, creada);
          }
        }
        return sinServicio(req, reply, new Error("colisiones de código"));
      } catch (e) {
        return sinServicio(req, reply, e);
      }
    },
  );

  app.get<{ Params: { codigo: string } }>(
    "/api/partidas/:codigo",
    { config: limite(LIMITE_LEER_PARTIDA_POR_MINUTO, "1 minute", "leer") },
    async (req, reply) => {
      if (!repo) return sinServicio(req, reply);
      const codigo = normalizarCodigo(req.params.codigo);
      if (!codigo) return noEncontrado(reply);
      try {
        const g = await repo.leer(hashCodigo(codigo));
        return g ? enviar(reply, 200, { revision: g.revision, partida: g.datos }) : noEncontrado(reply);
      } catch (e) {
        return sinServicio(req, reply, e);
      }
    },
  );

  app.put<{ Params: { codigo: string } }>(
    "/api/partidas/:codigo",
    {
      config: limite(LIMITE_GUARDAR_PARTIDA_POR_MINUTO, "1 minute", "guardar"),
      // La partida puede medir hasta el límite; el sobre (revisión) cabe en el margen.
      bodyLimit: LIMITE_CUERPO_BYTES + 1024,
    },
    async (req, reply) => {
      if (!repo) return sinServicio(req, reply);
      const codigo = normalizarCodigo(req.params.codigo);
      if (!codigo) return noEncontrado(reply);
      const cuerpo = GuardarPartidaCuerpo.safeParse(req.body);
      if (!cuerpo.success) return invalida(reply);
      const partida = leerPartida(cuerpo.data.partida);
      if (!partida.ok) return invalida(reply);
      try {
        const r = await repo.guardar(hashCodigo(codigo), partida.partida, cuerpo.data.revision);
        if (r.tipo === "no_existe") return noEncontrado(reply);
        if (r.tipo === "conflicto")
          return enviar(reply, 409, { error: "revision_vieja", revision: r.revision });
        return enviar(reply, 200, { revision: r.revision });
      } catch (e) {
        return sinServicio(req, reply, e);
      }
    },
  );
}
