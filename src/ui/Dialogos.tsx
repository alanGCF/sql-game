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

/** Cuánto suena una llamada entrante antes de irse al buzón. */
const SUENA_MS = 20_000;

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
  const elegir = usePartida((s) => s.elegirOpcion);
  const contestar = usePartida((s) => s.contestar);
  const perder = usePartida((s) => s.perderLlamada);
  const enMenu = useEscena((s) => s.enMenu);

  // Una llamada entrante suena un rato; si nadie contesta, se va al buzón (F4-04).
  useEffect(() => {
    if (!actual?.timbre || enMenu) return;
    const t = window.setTimeout(perder, SUENA_MS);
    return () => window.clearTimeout(t);
  }, [actual, enMenu, perder]);

  useEffect(() => {
    if (!actual || enMenu) return;
    const opciones = actual.opciones?.length ?? 0;
    // En captura, antes que la terminal o Tickets: Enter cierra el diálogo si no estás escribiendo
    // (campo vacío; en bash, Enter con la línea vacía no hace nada). Con opciones, 1–3 eligen.
    const tecla = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const opcion = opciones > 0 && Number.isInteger(n) && n >= 1 && n <= opciones;
      if (e.key !== "Enter" && !opcion) return;
      const foco = document.activeElement;
      if (e.key === "Enter" && foco instanceof HTMLButtonElement) return;
      if ((foco instanceof HTMLInputElement || foco instanceof HTMLTextAreaElement) && foco.value !== "")
        return;
      e.preventDefault();
      e.stopPropagation();
      if (actual.timbre) contestar();
      else if (opcion) void elegir(n - 1);
      else if (opciones === 0) avanzar();
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, [actual, avanzar, elegir, contestar, enMenu]);

  if (!actual || enMenu) return null;
  if (actual.timbre) {
    const ext = actual.detalle.replace(/^Llamada/, "Llamada entrante");
    return (
      <section
        className="llamada llamada-sonando"
        data-testid="dialogo"
        aria-live="assertive"
        aria-label={`Llamada entrante de ${actual.nombre}`}
      >
        <div className="llamada-cabeza">
          <span className="llamada-avatar" aria-hidden="true">
            {iniciales(actual.nombre)}
          </span>
          <span>
            <span className="llamada-nombre">{actual.nombre}</span>
            <span className="llamada-detalle">{ext}</span>
          </span>
        </div>
        <p className="llamada-texto">[Suena tu teléfono]</p>
        <div className="llamada-pie">
          <button type="button" className="dialogo-contestar" onClick={contestar}>
            Contestar <kbd>Enter</kbd>
          </button>
        </div>
      </section>
    );
  }
  const boton = actual.opciones?.length ? (
    <ol className="dialogo-opciones" aria-label="Responder">
      {actual.opciones.map((o, i) => (
        <li key={o.texto}>
          <button type="button" className="dialogo-opcion" onClick={() => void elegir(i)}>
            <kbd>{i + 1}</kbd> {o.texto}
          </button>
        </li>
      ))}
    </ol>
  ) : (
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
        <div className={actual.opciones?.length ? "llamada-pie con-opciones" : "llamada-pie"}>{boton}</div>
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
