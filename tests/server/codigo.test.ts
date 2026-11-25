import { describe, expect, it } from "vitest";
import {
  ALFABETO,
  enmascararCodigo,
  formatearCodigo,
  generarCodigo,
  normalizarCodigo,
} from "../../shared/codigo.js";

describe("código de partida (D-15)", () => {
  it("genera 12 símbolos del alfabeto sin I, L, O ni U, con verificador válido", () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const c = generarCodigo();
      expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{12}$/);
      expect(normalizarCodigo(c)).toBe(c);
      vistos.add(c);
    }
    expect(vistos.size).toBe(2000);
    expect(ALFABETO).toHaveLength(32);
    expect(ALFABETO).not.toMatch(/[ILOU]/);
  });

  it("usa los bytes aleatorios sin sesgo (un byte por símbolo, módulo 32)", () => {
    const ceros = () => new Uint8Array(11);
    const c = generarCodigo(ceros);
    expect(c.slice(0, 11)).toBe("00000000000");
    const altos = () => new Uint8Array(11).fill(255);
    expect(generarCodigo(altos).slice(0, 11)).toBe("ZZZZZZZZZZZ");
  });

  it("acepta minúsculas, guiones, espacios y las confusiones O→0, I/L→1", () => {
    const c = generarCodigo();
    const bonito = formatearCodigo(c);
    expect(bonito).toMatch(/^.{4}-.{4}-.{4}$/);
    expect(normalizarCodigo(bonito)).toBe(c);
    expect(normalizarCodigo(` ${bonito.toLowerCase()} `)).toBe(c);
    const conCero = generarCodigo(() => new Uint8Array(11));
    expect(normalizarCodigo(conCero.replaceAll("0", "O"))).toBe(conCero);
  });

  it("detecta un símbolo mal tecleado o dos vecinos intercambiados", () => {
    let cambios = 0;
    let detectados = 0;
    for (let n = 0; n < 200; n++) {
      const c = generarCodigo();
      for (let i = 0; i < 12; i++) {
        for (const s of ALFABETO) {
          if (s === c[i]) continue;
          cambios++;
          if (normalizarCodigo(c.slice(0, i) + s + c.slice(i + 1)) === null) detectados++;
        }
        if (i < 11 && c[i] !== c[i + 1]) {
          const t = c.slice(0, i) + c[i + 1] + c[i] + c.slice(i + 2);
          cambios++;
          if (normalizarCodigo(t) === null) detectados++;
        }
      }
    }
    // Luhn mod 32: todos los cambios de un símbolo; casi todas las transposiciones.
    expect(detectados / cambios).toBeGreaterThan(0.99);
  });

  it("solo acepta ASCII (toUpperCase de Unicode convertiría ı en I)", () => {
    const c = generarCodigo((n) => new Uint8Array(n).fill(1)); // "11111111111" + verificador
    expect(normalizarCodigo(c)).toBe(c);
    expect(normalizarCodigo(c.replace("1", "ı"))).toBeNull();
    expect(normalizarCodigo(`${c}\u200b`)).toBeNull();
  });

  it("en el gafete se muestran solo los últimos 4 caracteres (D-26)", () => {
    const c = generarCodigo();
    expect(enmascararCodigo(c)).toBe(`••••-••••-${c.slice(8)}`);
  });

  it("rechaza lo que no es un código antes de tocar la base", () => {
    for (const malo of [
      "",
      "abc",
      "K7QF-29XM-PL4",
      "K7QF-29XM-PL4DD",
      "K7QF_29XM_PL4D",
      "ÑÑÑÑ-ÑÑÑÑ-ÑÑÑÑ",
      "x".repeat(500),
    ])
      expect(normalizarCodigo(malo)).toBeNull();
  });
});
