/** Ajustes de accesibilidad (F3-08): tipos y lectura validada, sin APIs del navegador. */
export type Letra = "normal" | "grande" | "muy-grande";
export interface Ajustes {
  reducirMovimiento: boolean;
  letra: Letra;
  contrasteAlto: boolean;
  /** Sonido (F4-10, D-19): nada suena con el modo silencio; los subtítulos salen igual. */
  silencio: boolean;
  /** Que suene el teclado de la terminal (D-19: apagado por omisión). */
  teclear: boolean;
  /** Volúmenes de 0 a 100. */
  general: number;
  efectos: number;
  voces: number;
  ambiente: number;
}

export const VOLUMENES_POR_OMISION = { general: 80, efectos: 70, voces: 60, ambiente: 50 } as const;
const volumen = (v: unknown, omision: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100 ? v : omision;

const LETRAS: readonly Letra[] = ["normal", "grande", "muy-grande"];

/** Lee lo guardado sin confiar en su forma: solo se toman los campos válidos. */
export function leerAjustes(texto: string | null, reducirPorOmision = false): Ajustes {
  const base: Ajustes = {
    reducirMovimiento: reducirPorOmision,
    letra: "normal",
    contrasteAlto: false,
    silencio: false,
    teclear: false,
    ...VOLUMENES_POR_OMISION,
  };
  if (!texto) return base;
  try {
    const d = JSON.parse(texto) as Record<string, unknown>;
    return {
      reducirMovimiento:
        typeof d.reducirMovimiento === "boolean" ? d.reducirMovimiento : base.reducirMovimiento,
      letra: LETRAS.includes(d.letra as Letra) ? (d.letra as Letra) : base.letra,
      contrasteAlto: typeof d.contrasteAlto === "boolean" ? d.contrasteAlto : base.contrasteAlto,
      silencio: typeof d.silencio === "boolean" ? d.silencio : base.silencio,
      teclear: typeof d.teclear === "boolean" ? d.teclear : base.teclear,
      general: volumen(d.general, base.general),
      efectos: volumen(d.efectos, base.efectos),
      voces: volumen(d.voces, base.voces),
      ambiente: volumen(d.ambiente, base.ambiente),
    };
  } catch {
    return base;
  }
}
