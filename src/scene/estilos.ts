/** Estilos visuales del spike F0-07 (D-08). La escena es la misma; cambian materiales, luz y render. */
export type EstiloId = "a" | "b" | "c";

export interface Estilo {
  id: EstiloId;
  nombre: string;
  /** Sombreado plano (low-poly) o suave. */
  flat: boolean;
  /** Resolución de render relativa; < 1 pixela la imagen (retro). */
  dpr: number;
  pixelado: boolean;
  sombras: boolean;
  /** Reflejos suaves con un entorno de luces locales (sin descargas). */
  entorno: boolean;
  fondo: string;
  niebla: { color: string; cerca: number; lejos: number };
  luz: { cielo: string; suelo: string; hemisferio: number; lampara: number; ventana: number };
  rugosidad: number;
  /** Colores que cambian respecto a la paleta base del cubículo. */
  paleta: Partial<Record<"mampara" | "escritorio" | "pared" | "piso" | "techo" | "lonchera", string>>;
}

export const ESTILOS: Record<EstiloId, Estilo> = {
  a: {
    id: "a",
    nombre: "Low-poly cálido",
    flat: true,
    dpr: 1,
    pixelado: false,
    sombras: true,
    entorno: false,
    fondo: "#2a2622",
    niebla: { color: "#2a2622", cerca: 4, lejos: 12 },
    luz: { cielo: "#ffe9c7", suelo: "#3b3129", hemisferio: 1.1, lampara: 6, ventana: 1.4 },
    rugosidad: 0.95,
    paleta: { mampara: "#9c8f78", escritorio: "#c49a64", pared: "#d9c6a5" },
  },
  b: {
    id: "b",
    nombre: "Retro PS1",
    flat: true,
    dpr: 0.35,
    pixelado: true,
    sombras: false,
    entorno: false,
    fondo: "#14161c",
    niebla: { color: "#14161c", cerca: 2.5, lejos: 8 },
    luz: { cielo: "#d9e2ff", suelo: "#201a16", hemisferio: 0.9, lampara: 7, ventana: 1.2 },
    rugosidad: 1,
    paleta: {
      mampara: "#6f7a73",
      escritorio: "#8a6f52",
      pared: "#9aa39b",
      piso: "#3a3f3b",
      techo: "#4a4f4c",
    },
  },
  c: {
    id: "c",
    nombre: "Estilizado limpio",
    flat: false,
    dpr: 1,
    pixelado: false,
    sombras: true,
    entorno: true,
    fondo: "#1c1d21",
    niebla: { color: "#1c1d21", cerca: 6, lejos: 16 },
    luz: { cielo: "#f2f6ff", suelo: "#55524c", hemisferio: 1.5, lampara: 2.5, ventana: 1.2 },
    rugosidad: 0.55,
    paleta: {
      mampara: "#a7adb3",
      escritorio: "#d9ccb6",
      pared: "#e4e2dc",
      piso: "#6c7077",
      techo: "#b9b8b2",
      lonchera: "#3d6e8f",
    },
  },
};

export function estiloDesdeUrl(): Estilo {
  const id = new URLSearchParams(window.location.search).get("estilo");
  return id === "b" || id === "c" ? ESTILOS[id] : ESTILOS.a;
}
