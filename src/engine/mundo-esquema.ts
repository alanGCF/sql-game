import { z } from "zod";
import { GeneradorEsquema } from "./mision/esquema";

/**
 * Mundo base de la partida (content/mundo/): variables de partida y, por host, usuarios y archivos.
 * Lo que cambia después llega con los parches de cada misión y las diferencias guardadas.
 */

const Ruta = z.string().startsWith("/", "ruta absoluta");

const HostEsquema = z.strictObject({
  host: z.string().regex(/^[a-z0-9-]+$/),
  usuarios: z.record(
    z.string().regex(/^[a-z_][a-z0-9_-]*$/),
    z.strictObject({ grupos: z.array(z.string()).min(1), home: Ruta }),
  ),
  fs: z.array(
    z.strictObject({
      ruta: Ruta,
      contenido: z.string().optional(),
      modo: z
        .string()
        .regex(/^[0-7]{3}$/, "modo octal de 3 dígitos")
        .optional(),
      dueno: z.string().optional(),
      grupo: z.string().optional(),
      mtime: z.iso.datetime().optional(),
    }),
  ),
});

export const MundoEsquema = z.strictObject({
  variables: z.record(z.string().regex(/^[a-z0-9_]+$/), GeneradorEsquema),
  hosts: z.array(HostEsquema).min(1),
});
export type MundoBase = z.infer<typeof MundoEsquema>;
