import { useEffect } from "react";
import { usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";

/** Iniciales para la tarjeta de llamada: sin títulos (Ing., Lic.) ni apodos entre comillas. */
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((p) => !/^(Ing|Lic)\.$/.test(p) && !/^["“«]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Diálogos (D-22): las llamadas en una tarjeta a un lado; lo demás, como subtítulo abajo con el
 * departamento de quien habla. Se avanza con Enter (con el campo vacío) o con el botón.
 */
export function Dialogos() {
  const actual = usePartida((s) => s.dialogos[0]);
  const ultimo = usePartida((s) => s.dialogos.length === 1);
  // La última línea de una llamada que hiciste termina la llamada (F4-01).
  const cuelga = usePartida((s) => s.dialogos[0]?.saliente === true && s.dialogos[1]?.saliente !== true);
  const avanzar = usePartida((s) => s.avanzarDialogo);
  const enMenu = useEscena((s) => s.enMenu);

  useEffect(() => {
    if (!actual || enMenu) return;
    // En captura, antes que la terminal o Tickets: Enter cierra el diálogo si no estás escribiendo
    // (campo vacío; en bash, Enter con la línea vacía no hace nada).
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const foco = document.activeElement;
      if (foco instanceof HTMLButtonElement) return;
      if ((foco instanceof HTMLInputElement || foco instanceof HTMLTextAreaElement) && foco.value !== "")
        return;
      e.preventDefault();
      e.stopPropagation();
      avanzar();
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, [actual, avanzar, enMenu]);

  if (!actual || enMenu) return null;
  const boton = (
    <button type="button" className="dialogo-siguiente" onClick={avanzar}>
      {cuelga ? "Colgar" : ultimo ? "Cerrar" : "Siguiente"} <kbd>Enter</kbd>
    </button>
  );
  if (actual.forma === "llamada") {
    return (
      <section
        className="llamada"
        data-testid="dialogo"
        aria-live="polite"
        aria-label={`Llamada de ${actual.nombre}`}
      >
        <div className="llamada-cabeza">
          <span className="llamada-avatar" aria-hidden="true">
            {iniciales(actual.nombre)}
          </span>
          <span>
            <span className="llamada-nombre">{actual.nombre}</span>
            <span className="llamada-detalle">{actual.detalle}</span>
          </span>
        </div>
        <p className="llamada-texto">{actual.texto}</p>
        <div className="llamada-pie">{boton}</div>
      </section>
    );
  }
  return (
    <section className="subtitulo" data-testid="dialogo" aria-live="polite">
      <p className="subtitulo-quien">
        {actual.nombre}
        {actual.detalle ? ` · ${actual.detalle}` : ""}
      </p>
      <p className="subtitulo-texto">{actual.texto}</p>
      {boton}
    </section>
  );
}
