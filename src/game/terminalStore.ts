import { create } from "zustand";
import type { Shell } from "../engine";
import { LIMPIAR_PANTALLA } from "../ui/ansi";
import { crearShellDemo } from "./mundoDemo";

export type TipoLinea = "prompt" | "stdout" | "stderr" | "glosa";
export interface LineaTerminal {
  id: number;
  tipo: TipoLinea;
  texto: string;
  prompt?: string;
}

interface EstadoTerminal {
  shell: Shell;
  lineas: LineaTerminal[];
  ocupada: boolean;
  /** Ejecuta una línea; devuelve el pensamiento si no se ejecutó (la UI conserva el input). */
  enviar: (linea: string) => Promise<{ ejecutada: boolean; pensamiento?: string }>;
  interrumpir: (linea: string) => void;
  /** Segundo Tab con varias opciones: bash repite la línea y lista los candidatos. */
  listarCandidatos: (linea: string, candidatos: string[]) => void;
}

let siguienteId = 1;
const MAX_LINEAS = 2000;

export const useTerminal = create<EstadoTerminal>()((set, get) => ({
  shell: crearShellDemo(),
  lineas: [],
  ocupada: false,
  async enviar(linea) {
    const { shell } = get();
    const prompt = shell.prompt();
    set({ ocupada: true });
    const r = await shell.ejecutar(linea);
    if (!r.ejecutada) {
      set({ ocupada: false });
      return { ejecutada: false, ...(r.pensamiento ? { pensamiento: r.pensamiento } : {}) };
    }
    let lineas = [...get().lineas, { id: siguienteId++, tipo: "prompt" as const, texto: linea, prompt }];
    for (const f of r.fragmentos) {
      if (f.tipo === "pensamiento") continue;
      let texto = f.texto;
      const idx = texto.lastIndexOf(LIMPIAR_PANTALLA);
      if (idx !== -1) {
        lineas = [];
        texto = texto.slice(idx + LIMPIAR_PANTALLA.length).replace("\x1b[3J", "");
        if (!texto) continue;
      }
      lineas.push({
        id: siguienteId++,
        tipo: f.tipo,
        texto: f.tipo === "glosa" ? `↳ ${texto}` : texto.replace(/\n$/, ""),
      });
    }
    set({ lineas: lineas.slice(-MAX_LINEAS), ocupada: false });
    return { ejecutada: true, ...(r.pensamiento ? { pensamiento: r.pensamiento } : {}) };
  },
  listarCandidatos(linea, candidatos) {
    const { shell, lineas } = get();
    set({
      lineas: [
        ...lineas,
        { id: siguienteId++, tipo: "prompt", texto: linea, prompt: shell.prompt() },
        { id: siguienteId++, tipo: "stdout", texto: candidatos.join("  ") },
      ],
    });
  },
  interrumpir(linea) {
    const { shell, lineas } = get();
    set({
      lineas: [...lineas, { id: siguienteId++, tipo: "prompt", texto: `${linea}^C`, prompt: shell.prompt() }],
    });
  },
}));
