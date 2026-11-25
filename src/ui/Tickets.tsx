import { type ClipboardEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";
import type { Ticket } from "../game/tickets";

const clave = (t: Ticket) => `${t.mision}/${t.objetivo}`;
const capitalizar = (s: string) =>
  s.replace(/^(¿?)(\p{L})/u, (_m, a: string, b: string) => a + b.toUpperCase());

/** App Tickets (D-21: mesa de ayuda corporativa). Las respuestas se teclean; pegar está bloqueado. */
export function Tickets() {
  const tickets = usePartida((s) => s.tickets);
  const responder = usePartida((s) => s.responder);
  const pensar = useEscena((s) => s.pensar);
  const [sel, setSel] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const actual = tickets.find((t) => clave(t) === sel) ?? tickets.find((t) => !t.resuelto) ?? tickets[0];
  // biome-ignore lint/correctness/useExhaustiveDependencies: enfocar al cambiar de ticket.
  useEffect(() => {
    inputRef.current?.focus();
  }, [actual?.mision, actual?.objetivo]);

  const bloquear = (e: ClipboardEvent | DragEvent) => {
    e.preventDefault();
    pensar("Mejor lo escribo yo, así se me queda.");
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!actual || actual.resuelto || !valor.trim()) return;
    const r = await responder(actual.mision, actual.objetivo, valor);
    if (r.correcta) {
      setAviso({ ok: true, texto: "Respuesta enviada. Ticket resuelto." });
      setValor("");
      setSel(null);
    } else {
      setAviso({
        ok: false,
        texto: `No es correcto.${r.comentario ? ` ${r.comentario}` : " Revisa y vuelve a intentar."}`,
      });
    }
  };

  return (
    <div className="tickets" data-testid="tickets">
      <div className="tickets-titulo">Mesa de ayuda · Industrias Ocotillo, Planta 7</div>
      {tickets.length === 0 ? (
        <p className="tickets-vacio">No tienes tickets por ahora.</p>
      ) : (
        <div className="tickets-cuerpo">
          <ul className="tickets-lista" aria-label="Tickets">
            {tickets.map((t) => (
              <li key={clave(t)}>
                <button
                  type="button"
                  className="ticket"
                  aria-current={actual && clave(t) === clave(actual) ? "true" : undefined}
                  onClick={() => {
                    setSel(clave(t));
                    setAviso(null);
                    setValor("");
                  }}
                >
                  <span className="ticket-de">
                    {t.de}
                    {t.departamento ? ` · ${t.departamento}` : ""}
                  </span>
                  <span className="ticket-pregunta">
                    {capitalizar(t.pregunta)}
                    <span className={t.resuelto ? "chip chip-ok" : "chip chip-pend"}>
                      {t.resuelto ? "Resuelto" : "Pendiente"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {actual && (
            <section className="ticket-detalle" aria-label="Detalle del ticket">
              <h2>{capitalizar(actual.pregunta)}</h2>
              <p className="ticket-meta">
                Solicita: {actual.de}
                {actual.departamento ? ` (${actual.departamento})` : ""}
              </p>
              {actual.detalle.split("\n\n").map((p) => (
                <p key={p}>{p}</p>
              ))}
              {aviso && (
                <p className={aviso.ok ? "ticket-aviso ok" : "ticket-aviso"} role="status">
                  {aviso.texto}
                </p>
              )}
              {actual.resuelto ? (
                <p className="ticket-resuelto">Resuelto ✓</p>
              ) : (
                <form className="ticket-respuesta" onSubmit={enviar}>
                  <input
                    ref={inputRef}
                    aria-label="Respuesta"
                    placeholder="Escribe tu respuesta"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    onPaste={bloquear}
                    onDrop={bloquear}
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={200}
                  />
                  <button type="submit">Responder</button>
                </form>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
