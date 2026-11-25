import { create } from "zustand";

export type Vista = "general" | "monitor" | "telefono" | "libreta" | "pizarron" | "calendario";

/** App que se ve en el monitor al acercarse. */
export type AppMonitor = "terminal" | "tickets";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EstadoEscena {
  vista: Vista;
  transicionando: boolean;
  hover: string | null;
  rectMonitor: Rect | null;
  /** Solo pruebas: fija la dirección de la mirada en coordenadas normalizadas (-1..1). */
  mirarForzado: { x: number; y: number } | null;
  pensamiento: string | null;
  app: AppMonitor;
  setApp: (a: AppMonitor) => void;
  setVista: (v: Vista) => void;
  setTransicionando: (t: boolean) => void;
  setHover: (n: string | null) => void;
  setRectMonitor: (r: Rect | null) => void;
  setMirarForzado: (m: { x: number; y: number } | null) => void;
  pensar: (texto: string | null) => void;
}

export const useEscena = create<EstadoEscena>()((set) => ({
  vista: "general",
  transicionando: false,
  hover: null,
  rectMonitor: null,
  mirarForzado: null,
  pensamiento: null,
  app: "terminal",
  setApp: (app) => set({ app }),
  setVista: (vista) => set({ vista, hover: null }),
  setTransicionando: (transicionando) => set({ transicionando }),
  setHover: (hover) => set({ hover }),
  setRectMonitor: (rectMonitor) => set({ rectMonitor }),
  setMirarForzado: (mirarForzado) => set({ mirarForzado }),
  pensar: (pensamiento) => set({ pensamiento }),
}));
