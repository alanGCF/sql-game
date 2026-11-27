import { resumenDelDia } from "../game/calendario";
import { usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";

const fechaLarga = (fecha: string) =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

const fechaCorta = (fecha: string) =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

function Estrellas({ n }: { n: number | null }) {
  if (n === null) return <span className="cal-pendiente">pendiente</span>;
  return (
    <span className="cal-estrellas" role="img" aria-label={`${n} de 3 estrellas`}>
      {"★".repeat(n)}
      <span className="cal-estrellas-vacias">{"★".repeat(3 - n)}</span>
    </span>
  );
}

/**
 * Calendario de pared al acercarse (F4-08): los días trabajados con sus estrellas y, al elegir uno (aquí o
 * con clic en la hoja), su resumen: misiones con estrellas, favores hechos y lo que quedó en la libreta.
 */
// shortcut: solo el turno en curso; los turnos anteriores llegan cuando haya más de un turno jugable (F5).
export function Calendario() {
  const jornada = usePartida((s) => s.jornada);
  const apuntes = usePartida((s) => s.apuntes);
  usePartida((s) => s.eventos); // se vuelve a dibujar cuando avanza el turno
  const diaElegido = useEscena((s) => s.diaElegido);
  const elegirDia = useEscena((s) => s.elegirDia);
  const dia = resumenDelDia(jornada.turno, jornada.completadas(), jornada.turnoCompletado(), apuntes);
  const elegido = diaElegido === dia.fecha ? dia : null;

  return (
    <>
      <nav className="cal-dias" aria-label="Días trabajados">
        <h3>Días trabajados</h3>
        <button
          type="button"
          className="cal-dia"
          aria-pressed={elegido !== null}
          onClick={() => elegirDia(elegido ? null : dia.fecha)}
        >
          <span className="cal-dia-fecha">{fechaCorta(dia.fecha)}</span>
          {dia.terminado ? <Estrellas n={dia.estrellas} /> : <span className="cal-pendiente">hoy</span>}
          {dia.favores.length > 0 && (
            <span className="cal-favores">
              {dia.favores.length} {dia.favores.length === 1 ? "favor" : "favores"}
            </span>
          )}
        </button>
        <p className="cal-ayuda">También puedes darle clic al día en la hoja.</p>
      </nav>
      {elegido && (
        <section
          className="cal-resumen"
          aria-label={`Resumen del ${fechaLarga(elegido.fecha)}`}
          data-testid="resumen-dia"
        >
          <header>
            <h3>
              Turno {elegido.turno} · {fechaLarga(elegido.fecha)}
            </h3>
            {elegido.terminado ? (
              <Estrellas n={elegido.estrellas} />
            ) : (
              <span className="cal-pendiente">en curso</span>
            )}
          </header>
          <h4>Misiones</h4>
          <ul>
            {elegido.misiones.map((m) => (
              <li key={m.id}>
                <span>{m.titulo}</span> <Estrellas n={m.estrellas} />
              </li>
            ))}
          </ul>
          {elegido.favores.length > 0 && (
            <>
              <h4>Favores</h4>
              <ul>
                {elegido.favores.map((f) => (
                  <li key={f.id}>
                    <span>{f.titulo}</span> <Estrellas n={f.estrellas} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {elegido.hallazgos.length > 0 && (
            <>
              <h4>Hallazgos</h4>
              <ul className="cal-hallazgos">
                {elegido.hallazgos.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </>
          )}
          <button type="button" className="cal-cerrar" onClick={() => elegirDia(null)}>
            Cerrar
          </button>
        </section>
      )}
    </>
  );
}
