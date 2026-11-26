/**
 * Fuentes empaquetadas (D-25, OFL): Atkinson Hyperlegible para la interfaz y las texturas, JetBrains Mono
 * para la terminal y Patrick Hand para lo que la libreta escribe a mano (F4-05). Vite las sirve desde /assets (mismo origen, CSP font-src 'self'); así el juego se ve
 * igual en cualquier sistema.
 */
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/patrick-hand/400.css";

export const FUENTE_UI = '"Atkinson Hyperlegible", system-ui, sans-serif';
export const FUENTE_MONO = '"JetBrains Mono", ui-monospace, monospace';
/** Letra manuscrita de los apuntes automáticos de la libreta (F4-05, OFL). */
export const FUENTE_MANO = '"Patrick Hand", "Comic Sans MS", cursive';

/** Se resuelve cuando las fuentes de las texturas están cargadas (o fallaron: se usa la de respaldo). */
export const fuentesListas: Promise<void> =
  typeof document === "undefined"
    ? Promise.resolve()
    : Promise.all(
        [
          '400 16px "Atkinson Hyperlegible"',
          '700 16px "Atkinson Hyperlegible"',
          '400 16px "JetBrains Mono"',
        ].map((f) => document.fonts.load(f)),
      ).then(
        () => undefined,
        () => undefined,
      );
