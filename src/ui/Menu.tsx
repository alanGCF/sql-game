import { type ClipboardEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { enmascararCodigo, formatearCodigo } from "../../shared/codigo";
import type { Motivo } from "../game/api";
import { guardian, usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";
import { ControlesAjustes } from "./Ajustes";

type Paso = "inicio" | "nombre" | "codigo" | "olvidar" | "ajustes" | "creditos";

const MENSAJES: Record<Motivo, string> = {
  invalido: "Ese número no es válido. Revisa que tenga los 12 caracteres, como K7QF-29XM-PL4D.",
  no_encontrado: "No encontramos ese número. Revisa que esté bien escrito.",
  demasiadas: "Demasiados intentos. Espera un rato y vuelve a intentarlo.",
  sin_servicio: "El reloj checador no responde. Intenta de nuevo en unos minutos.",
  sin_conexion: "No hay conexión con la planta. Revisa tu internet e intenta de nuevo.",
  conflicto: "No se pudo checar entrada. Intenta de nuevo.",
};

/** Partida guardada en este navegador (se muestra en el gafete). */
interface Previa {
  nombre: string;
  codigo: string | null;
}

/** Menú de inicio (D-23): tu gafete de empleado sobre la escena desenfocada. */
export function Menu() {
  const enMenu = useEscena((s) => s.enMenu);
  const setEnMenu = useEscena((s) => s.setEnMenu);
  const pensar = useEscena((s) => s.pensar);
  const empezarPartida = usePartida((s) => s.empezar);
  const checarEntrada = usePartida((s) => s.checarEntrada);
  const continuar = usePartida((s) => s.continuar);
  const olvidarPartida = usePartida((s) => s.olvidar);
  const [verNumero, setVerNumero] = useState(false);
  const [paso, setPaso] = useState<Paso>("inicio");
  const [nombre, setNombreLocal] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const codigoRef = useRef<HTMLInputElement>(null);
  const primerBoton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (paso === "nombre") nombreRef.current?.focus();
    if (paso === "codigo") codigoRef.current?.focus();
    if (paso === "inicio") primerBoton.current?.focus();
    setError("");
  }, [paso]);

  // Cuando aparece la partida guardada cambia el botón principal: el foco va a él.
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo al cambiar la partida guardada.
  useEffect(() => {
    if (paso === "inicio") primerBoton.current?.focus();
  }, [previa]);

  // ¿Hay una partida en este navegador? Entonces el gafete ya trae nombre y número.
  useEffect(() => {
    if (!enMenu) return;
    let vigente = true;
    guardian.cargarLocal().then((g) => {
      if (vigente && g) setPrevia({ nombre: g.partida.nombre, codigo: g.codigo });
    });
    return () => {
      vigente = false;
    };
  }, [enMenu]);

  if (!enMenu) return null;

  const bloquear = (e: ClipboardEvent | DragEvent) => {
    e.preventDefault();
    pensar("Mejor lo escribo yo, así se me queda.");
  };
  const empezar = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || ocupado) return;
    setOcupado(true);
    const r = await empezarPartida(nombre);
    setOcupado(false);
    setEnMenu(false);
    if (r.sinServidor) pensar("Sin conexión con la planta: mi avance se guarda solo en esta computadora.");
  };
  const entrarConCodigo = async (e: FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || ocupado) return;
    setOcupado(true);
    setError("");
    const r = await checarEntrada(codigo);
    setOcupado(false);
    if (r.ok) setEnMenu(false);
    else setError(MENSAJES[r.motivo]);
  };
  const seguir = async () => {
    if (ocupado) return;
    setOcupado(true);
    const ok = await continuar();
    setOcupado(false);
    if (ok) setEnMenu(false);
    else setPaso("codigo");
  };
  const olvidar = async () => {
    if (ocupado) return;
    setOcupado(true);
    await olvidarPartida();
    setOcupado(false);
    setPrevia(null);
    setVerNumero(false);
    setPaso("inicio");
  };
  const nombreVisible = paso === "nombre" ? nombre.trim() : (previa?.nombre ?? nombre.trim());
  // D-26: en computadoras compartidas el gafete enseña solo los últimos 4 caracteres, salvo al pedirlo.
  const numeroVisible =
    paso !== "nombre" && previa?.codigo
      ? verNumero
        ? formatearCodigo(previa.codigo)
        : enmascararCodigo(previa.codigo)
      : "——-——-——";

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
              {nombreVisible ? nombreVisible[0]?.toUpperCase() : ""}
            </div>
            <dl>
              <dt>Nombre</dt>
              <dd>{nombreVisible || "— (nuevo ingreso)"}</dd>
              <dt>Puesto</dt>
              <dd>Técnico de sistemas · turno vespertino</dd>
              <dt>No. de empleado</dt>
              <dd className="gafete-numero">
                {numeroVisible}
                {paso !== "nombre" && previa?.codigo && (
                  <button
                    type="button"
                    className="gafete-ver"
                    aria-pressed={verNumero}
                    onClick={() => setVerNumero(!verNumero)}
                  >
                    {verNumero ? "Ocultar mi número" : "Mostrar mi número"}
                  </button>
                )}
              </dd>
            </dl>
          </div>

          {paso === "inicio" && (
            <div className="gafete-acciones">
              {previa ? (
                <>
                  {/* Con partida en este navegador, lo principal es seguirla. */}
                  <button
                    ref={primerBoton}
                    type="button"
                    className="primario"
                    disabled={ocupado}
                    onClick={seguir}
                  >
                    {ocupado ? "Checando…" : `Checar entrada como ${previa.nombre}`}
                  </button>
                  <button type="button" onClick={() => setPaso("codigo")}>
                    Checar entrada con otro número
                  </button>
                  <button type="button" onClick={() => setPaso("nombre")}>
                    Primer día de trabajo
                  </button>
                  <button type="button" onClick={() => setPaso("olvidar")}>
                    No soy yo: olvidar esta partida en esta computadora
                  </button>
                </>
              ) : (
                <>
                  <button
                    ref={primerBoton}
                    type="button"
                    className="primario"
                    onClick={() => setPaso("nombre")}
                  >
                    Primer día de trabajo
                  </button>
                  <button type="button" onClick={() => setPaso("codigo")}>
                    Checar entrada con mi número
                  </button>
                </>
              )}
              <button type="button" onClick={() => setPaso("ajustes")}>
                Ajustes
              </button>
              <button type="button" onClick={() => setPaso("creditos")}>
                Créditos
              </button>
            </div>
          )}

          {paso === "ajustes" && (
            <div className="gafete-acciones">
              <ControlesAjustes />
              <button type="button" onClick={() => setPaso("inicio")}>
                Regresar
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
              {previa?.codigo && (
                <p className="gafete-aviso">
                  Esto empieza una partida nueva. La que tienes sigue guardada con el número{" "}
                  <strong>{numeroVisible}</strong>.
                </p>
              )}
              <button type="submit" className="primario" disabled={!nombre.trim() || ocupado}>
                {ocupado ? "Checando…" : "Empezar mi turno"}
              </button>
              <button type="button" onClick={() => setPaso("inicio")}>
                Regresar
              </button>
            </form>
          )}

          {paso === "codigo" && (
            <form className="gafete-acciones" onSubmit={entrarConCodigo}>
              <label htmlFor="gafete-codigo">Tu número de empleado</label>
              <input
                id="gafete-codigo"
                ref={codigoRef}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="K7QF-29XM-PL4D"
                maxLength={20}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-describedby={error ? "gafete-error" : undefined}
              />
              {error && (
                <p id="gafete-error" className="gafete-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="primario" disabled={!codigo.trim() || ocupado}>
                {ocupado ? "Checando…" : "Checar entrada"}
              </button>
              <button type="button" onClick={() => setPaso("inicio")}>
                Regresar
              </button>
            </form>
          )}

          {paso === "olvidar" && previa && (
            <div className="gafete-acciones">
              <p className="gafete-aviso">
                Esta computadora olvidará la partida de <strong>{previa.nombre}</strong>.{" "}
                {previa.codigo
                  ? "Se puede seguir en cualquier computadora con su número de empleado."
                  : "Esta partida no tiene número: si la olvidas, se pierde."}
              </p>
              <button type="button" className="primario" disabled={ocupado} onClick={olvidar}>
                Sí, olvidarla
              </button>
              <button type="button" onClick={() => setPaso("inicio")}>
                Regresar
              </button>
            </div>
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
              <p>
                Fuentes: Atkinson Hyperlegible (Braille Institute of America), JetBrains Mono (JetBrains) y
                Patrick Hand (Patrick Wagesreiter), con licencia SIL Open Font License 1.1.
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
