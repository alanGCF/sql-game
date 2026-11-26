import { useEffect, useRef } from "react";
import { formatearCodigo } from "../../shared/codigo";
import { usePartida } from "../game/partidaStore";

/**
 * Tarjeta de Recursos Humanos con el número de empleado recién creado (F4-13, D-27 opción A). Aparece al
 * empezar el primer día, antes de los diálogos; el número también queda en un post-it del monitor (C).
 */
export function NumeroEmpleado() {
  const codigo = usePartida((s) => s.numeroPorAnotar);
  const nombre = usePartida((s) => s.nombre);
  const anotado = usePartida((s) => s.anotado);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (codigo) boton.current?.focus();
  }, [codigo]);

  if (!codigo) return null;
  return (
    <div className="numero-fondo">
      <section
        className="numero-tarjeta"
        role="dialog"
        aria-modal="true"
        aria-labelledby="numero-titulo"
        aria-describedby="numero-explica"
      >
        <header className="numero-franja">
          <h2 id="numero-titulo">Tu número de empleado</h2>
          <p>Recursos Humanos · Planta 7 · Bienvenida, {nombre}</p>
        </header>
        <div className="numero-cuerpo">
          <p id="numero-explica">
            Este es tu <strong>número de empleado</strong>. Con él checas entrada en cualquier computadora.
          </p>
          <p className="numero-grande">{formatearCodigo(codigo)}</p>
          <p>
            <strong>Anótalo en un papel</strong> (o tómale foto). Si lo pierdes, no podemos recuperarlo.
          </p>
          <p className="numero-nota">También te lo dejamos en un post-it, en tu monitor.</p>
          <button ref={boton} type="button" className="primario" onClick={anotado}>
            Ya lo anoté
          </button>
        </div>
      </section>
    </div>
  );
}
