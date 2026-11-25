/**
 * Código de partida (D-15, 05-arquitectura.md §Servidor): 11 símbolos aleatorios (55 bits, CSPRNG) y un
 * verificador Luhn mod 32 que detecta errores de tecleo antes de llamar al servidor. Alfabeto base32 de
 * Crockford: sin I, L, O ni U, y al leer se aceptan O como 0 e I/L como 1. Se muestra como K7QF-29XM-PL4D.
 */
export const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const BASE = ALFABETO.length;
const ALEATORIOS = 11;
export const LARGO_CODIGO = ALEATORIOS + 1;

function sumaLuhn(simbolos: string, dobleEnPar: boolean): number {
  let suma = 0;
  for (let i = simbolos.length - 1, k = 0; i >= 0; i--, k++) {
    let v = ALFABETO.indexOf(simbolos[i] as string);
    if ((k % 2 === 0) === dobleEnPar) v *= 2;
    suma += Math.floor(v / BASE) + (v % BASE);
  }
  return suma;
}

function verificador(simbolos: string): string {
  return ALFABETO[(BASE - (sumaLuhn(simbolos, true) % BASE)) % BASE] as string;
}

const bytesSeguros = (n: number) => crypto.getRandomValues(new Uint8Array(n));

/** 256 es múltiplo de 32: tomar cada byte módulo 32 no introduce sesgo. */
export function generarCodigo(aleatorio: (n: number) => Uint8Array = bytesSeguros): string {
  const bytes = aleatorio(ALEATORIOS);
  let s = "";
  for (let i = 0; i < ALEATORIOS; i++) s += ALFABETO[(bytes[i] ?? 0) % BASE];
  return s + verificador(s);
}

/** Forma canónica (12 símbolos) o null si no es un código válido. Barato: corre antes de la base. */
export function normalizarCodigo(entrada: string): string | null {
  if (entrada.length > 40) return null;
  const s = entrada.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  if (s.length !== LARGO_CODIGO || ![...s].every((c) => ALFABETO.includes(c))) return null;
  return sumaLuhn(s, false) % BASE === 0 ? s : null;
}

export function formatearCodigo(codigo: string): string {
  return `${codigo.slice(0, 4)}-${codigo.slice(4, 8)}-${codigo.slice(8, 12)}`;
}
