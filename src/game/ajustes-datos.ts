/** Ajustes de accesibilidad (F3-08): tipos y lectura validada, sin APIs del navegador. */
export type Letra = "normal" | "grande" | "muy-grande";
export interface Ajustes {
  reducirMovimiento: boolean;
  letra: Letra;
  contrasteAlto: boolean;
}

const LETRAS: readonly Letra[] = ["normal", "grande", "muy-grande"];

/** Lee lo guardado sin confiar en su forma: solo se toman los campos válidos. */
export function leerAjustes(texto: string | null, reducirPorOmision = false): Ajustes {
  const base: Ajustes = { reducirMovimiento: reducirPorOmision, letra: "normal", contrasteAlto: false };
  if (!texto) return base;
  try {
    const d = JSON.parse(texto) as Record<string, unknown>;
    return {
      reducirMovimiento:
        typeof d.reducirMovimiento === "boolean" ? d.reducirMovimiento : base.reducirMovimiento,
      letra: LETRAS.includes(d.letra as Letra) ? (d.letra as Letra) : base.letra,
      contrasteAlto: typeof d.contrasteAlto === "boolean" ? d.contrasteAlto : base.contrasteAlto,
    };
  } catch {
    return base;
  }
}
