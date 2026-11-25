/**
 * Estilo C · Estilizado limpio (D-08, direccion-arte.md): sombreado y sombras suaves, reflejos sutiles,
 * paleta de oficina neutra con acentos cálidos. Los estilos A y B del spike F0-07 se retiraron en F3-06.
 * La luz de la ventana cambia con la hora del juego (src/game/hora.ts).
 */
export const ESTILO = {
  fondo: "#1c1d21",
  niebla: { color: "#1c1d21", cerca: 7, lejos: 17 },
  /** Luz de oficina del techo (neutra) y lámpara de escritorio (cálida). */
  luz: { cielo: "#f2f6ff", suelo: "#55524c", hemisferio: 1.4, lampara: 3 },
  rugosidad: 0.55,
} as const;
