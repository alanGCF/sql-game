import {
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useEscena } from "../game/store";
import { type LineaTerminal, useTerminal } from "../game/terminalStore";
import { parsearAnsi } from "./ansi";
import { sonido } from "./audio";

function Linea({ linea }: { linea: LineaTerminal }) {
  if (linea.tipo === "prompt") {
    return (
      <div className="terminal-linea">
        <span className="terminal-prompt">{linea.prompt}</span> {linea.texto}
      </div>
    );
  }
  if (linea.tipo === "glosa") return <div className="terminal-linea glosa">{linea.texto}</div>;
  return (
    <div className="terminal-linea">
      {parsearAnsi(linea.texto).map((s, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: segmentos inmutables de una línea.
        <span key={i} className={s.clases || undefined}>
          {s.texto}
        </span>
      ))}
    </div>
  );
}

/** Terminal sobre el monitor: todo se teclea (pegar y soltar bloqueados, ADR-012). */
export function Terminal() {
  const pensar = useEscena((s) => s.pensar);
  const { shell, lineas, ocupada, enviar, interrumpir, listarCandidatos } = useTerminal();
  const tabPrevio = useRef(false);
  const [entrada, setEntrada] = useState("");
  const [indiceHistorial, setIndiceHistorial] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const finRef = useRef<HTMLDivElement>(null);
  /** Cursor a colocar en cuanto React pinte la línea completada (no en un rAF que puede llegar tarde). */
  const cursorPendiente = useRef<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: se coloca el cursor cuando cambia la entrada.
  useLayoutEffect(() => {
    const c = cursorPendiente.current;
    if (c === null) return;
    cursorPendiente.current = null;
    inputRef.current?.setSelectionRange(c, c);
  }, [entrada]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: desplazar al final cuando cambian las líneas.
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [lineas]);

  const bloquear = (e: ClipboardEvent | DragEvent) => {
    e.preventDefault();
    pensar("Mejor lo escribo yo, así se me queda.");
  };

  const tecla = async (e: KeyboardEvent<HTMLInputElement>) => {
    // Teclear suena (F4-10): solo las teclas que escriben algo y Enter.
    if (e.key.length === 1 || e.key === "Enter") sonido.tecla();
    const historial = shell.sesion.historial;
    if (e.key === "Tab") {
      e.preventDefault();
      // Lo que hay en el campo ahora mismo (no el estado de React, que puede ir un render atrás).
      const valor = e.currentTarget.value;
      const cursor = e.currentTarget.selectionStart ?? valor.length;
      const r = shell.completar(valor, cursor);
      if (r.candidatos.length) {
        if (tabPrevio.current) listarCandidatos(valor, r.candidatos);
        tabPrevio.current = true;
        return;
      }
      cursorPendiente.current = r.cursor;
      setEntrada(r.linea);
      tabPrevio.current = false;
      return;
    }
    tabPrevio.current = false;
    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      interrumpir(entrada);
      setEntrada("");
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      if (!historial.length) return;
      let i = indiceHistorial ?? historial.length;
      i = e.key === "ArrowUp" ? Math.max(0, i - 1) : i + 1;
      if (i >= historial.length) {
        setIndiceHistorial(null);
        setEntrada("");
      } else {
        setIndiceHistorial(i);
        setEntrada(historial[i] ?? "");
      }
      return;
    }
    if (e.key !== "Enter" || ocupada) return;
    const r = await enviar(entrada);
    if (r.pensamiento) pensar(r.pensamiento);
    if (r.ejecutada) {
      setEntrada("");
      setIndiceHistorial(null);
    }
  };

  return (
    <div className="terminal" data-testid="terminal">
      <div className="terminal-cuerpo" aria-live="polite">
        {lineas.map((l) => (
          <Linea key={l.id} linea={l} />
        ))}
        <div className="terminal-entrada" ref={finRef}>
          <span className="terminal-prompt">{shell.prompt()}</span>
          <input
            ref={inputRef}
            aria-label="Comando"
            value={entrada}
            onChange={(e) => {
              // Escribir (o pegar el valor de una prueba) rompe la secuencia de doble Tab.
              tabPrevio.current = false;
              cursorPendiente.current = null;
              setEntrada(e.target.value);
            }}
            onKeyDown={tecla}
            onPaste={bloquear}
            onDrop={bloquear}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={500}
          />
        </div>
      </div>
    </div>
  );
}
