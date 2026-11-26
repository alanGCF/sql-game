import type { Personajes } from "../engine/mision/curriculo";

/**
 * Teléfono del escritorio (F4-01, 04-mecanicas.md §Teléfono): el directorio de extensiones y qué pasa al
 * marcar. Las extensiones son de personajes.yaml; la tuya (210) da ocupado.
 */
export const MAX_DIGITOS = 4;
const EXTENSION_PROPIA = "jugador";

export interface Contacto {
  id: string;
  /** Como aparece en el directorio: "Eduardo", "Don Chuy"… */
  corto: string;
  departamento: string;
  extension: string;
}

export type ResultadoMarcar =
  | { tipo: "contesta"; id: string }
  | { tipo: "ocupado" }
  | { tipo: "no_existe" }
  | { tipo: "vacio" };

export function directorio(personajes: Personajes["personajes"]): Contacto[] {
  return Object.entries(personajes).flatMap(([id, p]) =>
    p.extension === undefined || id === EXTENSION_PROPIA
      ? []
      : [
          {
            id,
            corto: p.corto ?? p.nombre,
            departamento: p.departamento ?? "",
            extension: String(p.extension),
          },
        ],
  );
}

export function extensionPropia(personajes: Personajes["personajes"]): string {
  const e = personajes[EXTENSION_PROPIA]?.extension;
  return e === undefined ? "" : String(e);
}

export function marcar(marcado: string, personajes: Personajes["personajes"]): ResultadoMarcar {
  if (marcado === "") return { tipo: "vacio" };
  if (!/^\d+$/.test(marcado) || marcado.length > MAX_DIGITOS) return { tipo: "no_existe" };
  if (marcado === extensionPropia(personajes)) return { tipo: "ocupado" };
  const c = directorio(personajes).find((d) => d.extension === marcado);
  return c ? { tipo: "contesta", id: c.id } : { tipo: "no_existe" };
}

// shortcut: lo que dice cada contacto al contestar vive aquí hasta F4-02 (content/llamadas/ con paciencia).
export const SALUDOS: Record<string, string> = {
  companero: "¿Qué pasó? Ando en piso, pero dime. Si te atoras con algo, márcame y te echo la mano.",
  don_chuy: "Mantenimiento, habla Ortega. Ahorita ando con una prensa, mijo; luego platicamos.",
  karla: "Calidad, Karla. Estoy por entrar a junta; si es de un ticket, déjamelo en la app.",
  trevino: "Treviño. Ando con Corporativo; si no es urgente, mándame un correo.",
  comedor: "Comedor, buenas tardes. Hoy hay discada y frijoles charros; la cena es a las nueve.",
  vigilancia: "Caseta… ¿bueno? Todo tranquilo por acá, joven.",
  conmutador: "Conmutador, buenas tardes. Las extensiones están en el directorio de su mampara.",
};
