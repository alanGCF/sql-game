import { useEffect, useMemo, useRef, useState } from "react";
import { contenidoComun } from "../game/contenido";
import { horaTexto } from "../game/hora";
import { type ResultadoLlamar, usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";
import { directorio, extensionPropia, MAX_DIGITOS } from "../game/telefono";

const personajes = contenidoComun().personajes.personajes;

const TECLAS: ReadonlyArray<readonly [string, string]> = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["*", ""],
  ["0", "OPER"],
  ["#", ""],
];

type Aviso = Exclude<ResultadoLlamar["tipo"], "contesta" | "vacio">;

const AVISOS: Record<Aviso, readonly [string, string]> = {
  ocupado: ["Ocupado", "Es tu extensión"],
  no_existe: ["No existe", "Revisa el directorio"],
  no_contesta: ["Sin respuesta", "No contestan"],
};

/**
 * Teléfono al acercarse (F4-01, 04-mecanicas.md §Teléfono; D-28 opción A): el aparato de plástico oscuro
 * con pantallita y teclado, y a su lado el directorio impreso pegado con cinta; la escena se oscurece un poco. Se marca con las teclas del teclado o con clic; Enter o "Llamar" marca; Esc cuelga.
 */
export function Telefono() {
  const [marcado, setMarcadoEstado] = useState("");
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const llamar = usePartida((s) => s.llamar);
  const colgar = usePartida((s) => s.colgar);
  const mensajes = usePartida((s) => s.buzon.length);
  const escucharBuzon = usePartida((s) => s.escucharBuzon);
  const minuto = usePartida((s) => s.minuto);
  const enLlamada = usePartida((s) => s.dialogos.find((d) => d.saliente)?.quien ?? null);
  const contactos = useMemo(() => directorio(personajes), []);
  const raiz = useRef<HTMLElement>(null);
  const actual = useRef("");
  const contacto = contactos.find((c) => c.id === enLlamada);

  const setMarcado = (m: string) => {
    actual.current = m;
    setMarcadoEstado(m);
  };
  const teclear = (digito: string) => {
    if (enLlamada) return;
    setAviso(null);
    if (actual.current.length < MAX_DIGITOS) setMarcado(actual.current + digito);
  };
  const borrar = () => {
    setAviso(null);
    setMarcado(actual.current.slice(0, -1));
  };
  const marcando = useRef(false);
  const marcar = async () => {
    if (marcando.current) return;
    marcando.current = true;
    try {
      const r = await llamar(actual.current);
      if (r.tipo !== "vacio") setMarcado("");
      if (r.tipo === "ocupado" || r.tipo === "no_existe" || r.tipo === "no_contesta") setAviso(r.tipo);
      // Cuando ya no te contestan, lo piensas (globo de pensamiento).
      if (r.tipo === "no_contesta") useEscena.getState().pensar(r.texto);
    } finally {
      marcando.current = false;
    }
  };

  const tecla = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement)
      return;
    if (e.key === "Escape" && enLlamada) {
      // Antes que "Levantar la vista": el primer Esc cuelga.
      e.preventDefault();
      e.stopPropagation();
      colgar();
      return;
    }
    if (enLlamada) return;
    if (/^[0-9*#]$/.test(e.key)) {
      e.preventDefault();
      teclear(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      borrar();
    } else if (e.key === "Enter" && usePartida.getState().dialogos.length === 0) {
      // Con un diálogo en pantalla, Enter es para avanzarlo (Dialogos).
      e.preventDefault();
      void marcar();
    }
  };
  const manejador = useRef(tecla);
  manejador.current = tecla;

  useEffect(() => {
    raiz.current?.focus();
    const escuchar = (e: KeyboardEvent) => manejador.current(e);
    window.addEventListener("keydown", escuchar, true);
    return () => window.removeEventListener("keydown", escuchar, true);
  }, []);

  const [linea1, linea2] = contacto
    ? ["En llamada", `${contacto.corto} · ${contacto.extension}`]
    : aviso
      ? AVISOS[aviso]
      : marcado
        ? ["Marcar", marcado]
        : [`Ext. ${extensionPropia(personajes)}${mensajes ? ` · Buzón ${mensajes}` : ""}`, horaTexto(minuto)];

  // El clic no se queda con el foco: así Enter sigue marcando y no repite la última tecla.
  const sinFoco = (e: React.MouseEvent) => e.preventDefault();

  return (
    <>
      <div className="telefono-fondo" aria-hidden="true" />
      <section ref={raiz} className="telefono" aria-label="Teléfono" tabIndex={-1} data-testid="telefono">
        <div className="telefono-directorio">
          <h3>Extensiones</h3>
          <table>
            <tbody>
              {contactos.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    {c.corto}
                    {c.departamento && c.departamento !== c.corto && <small> ({c.departamento})</small>}
                  </th>
                  <td>{c.extension}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="telefono-aparato">
          <output className="telefono-pantalla" aria-live="polite" data-testid="telefono-pantalla">
            <span>{linea1}</span>
            <span className="telefono-pantalla-grande">{linea2}</span>
          </output>
          <div className="telefono-teclado">
            {TECLAS.map(([d, letras]) => (
              <button
                key={d}
                type="button"
                aria-label={d}
                onMouseDown={sinFoco}
                onClick={() => teclear(d)}
                disabled={enLlamada !== null}
              >
                <span className="telefono-digito">{d}</span>
                <span className="telefono-letras" aria-hidden="true">
                  {letras}
                </span>
              </button>
            ))}
          </div>
          <div className="telefono-acciones">
            {enLlamada ? (
              <button type="button" className="telefono-colgar" onMouseDown={sinFoco} onClick={colgar}>
                Colgar <kbd>Esc</kbd>
              </button>
            ) : (
              <>
                {mensajes > 0 && (
                  <button
                    type="button"
                    className="telefono-buzon"
                    onMouseDown={sinFoco}
                    onClick={escucharBuzon}
                  >
                    <span className="telefono-luz" aria-hidden="true" /> Buzón ({mensajes})
                  </button>
                )}
                <button
                  type="button"
                  className="telefono-llamar"
                  onMouseDown={sinFoco}
                  onClick={() => void marcar()}
                >
                  Llamar <kbd>Enter</kbd>
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
