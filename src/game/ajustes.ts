import { create } from "zustand";
import { type Ajustes, leerAjustes } from "./ajustes-datos";

export type { Ajustes, Letra } from "./ajustes-datos";

/** Ajustes de accesibilidad (F3-08). Se guardan en este navegador; si no se puede, se usan los de omisión. */
const CLAVE = "rastro-en-el-log.ajustes";
const reducirDelSistema = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function cargar(): Ajustes {
  try {
    return leerAjustes(window.localStorage.getItem(CLAVE), reducirDelSistema());
  } catch {
    return leerAjustes(null, reducirDelSistema());
  }
}

export const useAjustes = create<Ajustes & { cambiar: (p: Partial<Ajustes>) => void }>()((set, get) => ({
  ...cargar(),
  cambiar(p) {
    set(p);
    const { reducirMovimiento, letra, contrasteAlto, silencio, teclear, general, efectos, voces, ambiente } =
      get();
    try {
      window.localStorage.setItem(
        CLAVE,
        JSON.stringify({
          reducirMovimiento,
          letra,
          contrasteAlto,
          silencio,
          teclear,
          general,
          efectos,
          voces,
          ambiente,
        }),
      );
    } catch {
      // sin almacenamiento (ventana privada): el ajuste dura esta sesión
    }
  },
}));

function aplicar(a: Ajustes): void {
  const raiz = document.documentElement;
  raiz.dataset.letra = a.letra;
  raiz.dataset.contraste = a.contrasteAlto ? "alto" : "normal";
  // Las animaciones de CSS (p. ej. el teléfono que suena) se apagan con "reducir movimiento".
  raiz.dataset.movimiento = a.reducirMovimiento ? "reducido" : "normal";
}
aplicar(useAjustes.getState());
useAjustes.subscribe(aplicar);
