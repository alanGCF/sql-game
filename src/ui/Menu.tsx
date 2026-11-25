import { type ClipboardEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";

type Paso = "inicio" | "nombre" | "creditos";

/** Menú de inicio (D-23): tu gafete de empleado sobre la escena desenfocada. */
export function Menu() {
  const enMenu = useEscena((s) => s.enMenu);
  const setEnMenu = useEscena((s) => s.setEnMenu);
  const pensar = useEscena((s) => s.pensar);
  const setNombre = usePartida((s) => s.setNombre);
  const [paso, setPaso] = useState<Paso>("inicio");
  const [nombre, setNombreLocal] = useState("");
  const nombreRef = useRef<HTMLInputElement>(null);
  const primerBoton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (paso === "nombre") nombreRef.current?.focus();
    if (paso === "inicio") primerBoton.current?.focus();
  }, [paso]);

  if (!enMenu) return null;

  const bloquear = (e: ClipboardEvent | DragEvent) => {
    e.preventDefault();
    pensar("Mejor lo escribo yo, así se me queda.");
  };
  const empezar = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setNombre(nombre);
    setEnMenu(false);
  };

  return (
    <div className="menu" data-testid="menu">
      <section className="gafete" aria-label="Tu gafete de empleado">
        <header className="gafete-franja">
          <h1>Rastro en el Log</h1>
          <p>INDUSTRIAS OCOTILLO · PLANTA 7</p>
        </header>
        <div className="gafete-cuerpo">
          <div className="gafete-datos">
            <div className="gafete-foto" aria-hidden="true">
              {nombre.trim() ? nombre.trim()[0]?.toUpperCase() : ""}
            </div>
            <dl>
              <dt>Nombre</dt>
              <dd>{nombre.trim() || "— (nuevo ingreso)"}</dd>
              <dt>Puesto</dt>
              <dd>Técnico de sistemas · turno vespertino</dd>
              <dt>No. de empleado</dt>
              <dd className="gafete-numero">——-——-——</dd>
            </dl>
          </div>

          {paso === "inicio" && (
            <div className="gafete-acciones">
              <button ref={primerBoton} type="button" className="primario" onClick={() => setPaso("nombre")}>
                Primer día de trabajo
              </button>
              <button
                type="button"
                disabled
                title="Tu número de empleado llega cuando puedas guardar la partida"
              >
                Checar entrada con mi número
              </button>
              <button type="button" onClick={() => setPaso("creditos")}>
                Créditos
              </button>
            </div>
          )}

          {paso === "nombre" && (
            <form className="gafete-acciones" onSubmit={empezar}>
              <label htmlFor="gafete-nombre">¿Cómo te llamas? (o un apodo)</label>
              <input
                id="gafete-nombre"
                ref={nombreRef}
                value={nombre}
                onChange={(e) => setNombreLocal(e.target.value)}
                onPaste={bloquear}
                onDrop={bloquear}
                maxLength={40}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="primario" disabled={!nombre.trim()}>
                Empezar mi turno
              </button>
              <button type="button" onClick={() => setPaso("inicio")}>
                Regresar
              </button>
            </form>
          )}

          {paso === "creditos" && (
            <div className="gafete-acciones gafete-creditos">
              <p>
                Un juego para aprender Linux, SQL y redes. Código con licencia MIT; historia, misiones y
                textos con licencia CC BY-NC 4.0.
              </p>
              <p>
                La planta, sus personas, IPs y dominios son ficticios. No pedimos correo ni cuenta: solo el
                nombre o apodo que escribas.
              </p>
              <button type="button" onClick={() => setPaso("inicio")}>
                Regresar
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
