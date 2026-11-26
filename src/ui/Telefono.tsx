import { useEffect, useMemo, useRef, useState } from "react";
import { contenidoComun } from "../game/contenido";
import { horaTexto } from "../game/hora";
import { usePartida } from "../game/partidaStore";
import { directorio, extensionPropia, MAX_DIGITOS, type ResultadoMarcar } from "../game/telefono";

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

type Aviso = Exclude<ResultadoMarcar["tipo"], "contesta" | "vacio">;

const AVISOS: Record<Aviso, readonly [string, string]> = {
  ocupado: ["Ocupado", "Es tu extensión"],
  no_existe: ["No existe", "Revisa el directorio"],
};

/** Variante de la consulta F4-01 (?tel=a|b|c); se queda solo la que elija el usuario. */
const VARIANTE = new URLSearchParams(window.location.search).get("tel") ?? "a";

/**
 * Teléfono al acercarse (F4-01, 04-mecanicas.md §Teléfono): pantallita, teclado numérico y directorio de
 * extensiones. Se marca con las teclas del teclado o con clic; Enter o "Llamar" marca; Esc cuelga.
 */
export function Telefono() {
  const [marcado, setMarcadoEstado] = useState("");
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const llamar = usePartida((s) => s.llamar);
  const colgar = usePartida((s) => s.colgar);
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
  const marcar = () => {
    const r = llamar(actual.current);
    if (r.tipo === "ocupado" || r.tipo === "no_existe") setAviso(r.tipo);
    if (r.tipo !== "vacio") setMarcado("");
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
      marcar();
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
        : [`Ext. ${extensionPropia(personajes)}`, horaTexto(minuto)];

  // El clic no se queda con el foco: así Enter sigue marcando y no repite la última tecla.
  const sinFoco = (e: React.MouseEvent) => e.preventDefault();

  return (
    <>
      {VARIANTE !== "c" && <div className="telefono-fondo" aria-hidden="true" />}
      <section
        ref={raiz}
        className={`telefono telefono-${VARIANTE}`}
        aria-label="Teléfono"
        tabIndex={-1}
        data-testid="telefono"
      >
        {VARIANTE !== "c" && (
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
        )}
        <div className="telefono-aparato">
          {VARIANTE === "b" && (
            <header className="telefono-franja">Teléfono · ext. {extensionPropia(personajes)}</header>
          )}
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
              <button type="button" className="telefono-llamar" onMouseDown={sinFoco} onClick={marcar}>
                Llamar <kbd>Enter</kbd>
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
