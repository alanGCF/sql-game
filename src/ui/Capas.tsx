import { useEffect, useState } from "react";
import { useEscena } from "../game/store";
import { ControlesAjustes } from "./Ajustes";
import { Dialogos } from "./Dialogos";
import { Menu } from "./Menu";
import { Monitor } from "./Monitor";

function EtiquetaHover() {
  const hover = useEscena((s) => s.hover);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const mover = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", mover);
    return () => window.removeEventListener("pointermove", mover);
  }, []);
  if (!hover) return null;
  return (
    <div className="etiqueta" style={{ left: pos.x + 16, top: pos.y + 16 }}>
      {hover}
    </div>
  );
}

function Pensamiento() {
  const texto = useEscena((s) => s.pensamiento);
  const pensar = useEscena((s) => s.pensar);
  useEffect(() => {
    if (!texto) return;
    const t = window.setTimeout(() => pensar(null), 3500);
    return () => window.clearTimeout(t);
  }, [texto, pensar]);
  if (!texto) return null;
  return (
    <div className="pensamiento" role="status" data-testid="pensamiento">
      {texto}
    </div>
  );
}

const NOMBRES: Record<string, string> = {
  telefono: "Teléfono (llega en F4)",
  libreta: "Libreta de apuntes (llega en F4)",
  pizarron: "Pizarrón de pendientes",
  calendario: "Calendario",
};

/** Capas DOM sobre la escena: etiqueta, terminal, pensamiento y botón para alejarse. */
export function Capas() {
  const vista = useEscena((s) => s.vista);
  const transicionando = useEscena((s) => s.transicionando);
  const setVista = useEscena((s) => s.setVista);
  const enMenu = useEscena((s) => s.enMenu);
  const [ajustes, setAjustes] = useState(false);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVista("general");
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [setVista]);

  return (
    <>
      <EtiquetaHover />
      {!enMenu && (
        <button
          type="button"
          className="boton-ajustes"
          aria-expanded={ajustes}
          onClick={() => setAjustes((v) => !v)}
        >
          Ajustes
        </button>
      )}
      {!enMenu && ajustes && (
        <section className="panel-ajustes" aria-label="Ajustes">
          <ControlesAjustes />
          <button type="button" onClick={() => setAjustes(false)}>
            Cerrar
          </button>
        </section>
      )}
      {vista === "monitor" && <Monitor />}
      {vista !== "general" && vista !== "monitor" && !transicionando && NOMBRES[vista] && (
        <div className="aviso-vista">{NOMBRES[vista]}</div>
      )}
      {vista !== "general" && !transicionando && (
        <button type="button" className="boton-alejar" onClick={() => setVista("general")}>
          Levantar la vista <kbd>Esc</kbd>
        </button>
      )}
      <Dialogos />
      <Menu />
      <Pensamiento />
    </>
  );
}
