import { z } from "zod";
import { type Partida, textoSeguro } from "./partida.js";

/**
 * Cuerpos y respuestas de /api/partidas (ADR-010, ADR-013): los valida el servidor y los usa el cliente.
 * La partida dentro de PUT se valida aparte con `leerPartida` (tamaño, migraciones y esquema estricto).
 */
export const CrearPartidaCuerpo = z.strictObject({
  nombre: z.string().trim().min(1).max(40).refine(textoSeguro),
  contenido: z.string().max(64).refine(textoSeguro),
});

export const GuardarPartidaCuerpo = z.strictObject({
  revision: z.number().int().min(1).max(2_147_483_647),
  partida: z.unknown(),
});

export interface PartidaCreada {
  codigo: string;
  revision: number;
  partida: Partida;
}

export interface PartidaLeida {
  revision: number;
  partida: unknown;
}

export type ErrorApi =
  | { error: "no_encontrado" | "solicitud_invalida" | "demasiadas_solicitudes" | "sin_servicio" }
  | { error: "revision_vieja"; revision: number };
