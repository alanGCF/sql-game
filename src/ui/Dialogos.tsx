import { useEffect } from "react";
import { usePartida } from "../game/partidaStore";

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
 * departamento de quien habla. Se avanza con Enter (si no estás escribiendo) o con el botón.
 */
export function Dialogos() {
  const actual = usePartida((s) => s.dialogos[0]);
  const ultimo = usePartida((s) => s.dialogos.length === 1);
  const avanzar = usePartida((s) => s.avanzarDialogo);

  useEffect(() => {
    if (!actual) return;
    const tecla = (e: KeyboardEvent) => {
      const foco = document.activeElement?.tagName;
      if (e.key !== "Enter" || foco === "INPUT" || foco === "TEXTAREA" || foco === "BUTTON") return;
      e.preventDefault();
      avanzar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [actual, avanzar]);

  if (!actual) return null;
  const boton = (
    <button type="button" className="dialogo-siguiente" onClick={avanzar}>
      {ultimo ? "Cerrar" : "Siguiente"} <kbd>Enter</kbd>
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
