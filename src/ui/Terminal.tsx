import { type ClipboardEvent, type DragEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useEscena } from "../game/store";
import { type LineaTerminal, useTerminal } from "../game/terminalStore";
import { parsearAnsi } from "./ansi";

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
  const rect = useEscena((s) => s.rectMonitor);
  const pensar = useEscena((s) => s.pensar);
  const { shell, lineas, ocupada, enviar, interrumpir, listarCandidatos } = useTerminal();
  const tabPrevio = useRef(false);
  const [entrada, setEntrada] = useState("");
  const [indiceHistorial, setIndiceHistorial] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rect) inputRef.current?.focus();
  }, [rect]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: desplazar al final cuando cambian las líneas.
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [lineas]);

  if (!rect) return null;

  const bloquear = (e: ClipboardEvent | DragEvent) => {
    e.preventDefault();
    pensar("Mejor lo escribo yo, así se me queda.");
  };

  const tecla = async (e: KeyboardEvent<HTMLInputElement>) => {
    const historial = shell.sesion.historial;
    if (e.key === "Tab") {
      e.preventDefault();
      const cursor = inputRef.current?.selectionStart ?? entrada.length;
      const r = shell.completar(entrada, cursor);
      if (r.candidatos.length) {
        if (tabPrevio.current) listarCandidatos(entrada, r.candidatos);
        tabPrevio.current = true;
        return;
      }
      setEntrada(r.linea);
      requestAnimationFrame(() => inputRef.current?.setSelectionRange(r.cursor, r.cursor));
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
    <div
      className="terminal"
      data-testid="terminal"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      <div className="terminal-barra">srv-sistemas — Terminal</div>
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
            onChange={(e) => setEntrada(e.target.value)}
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
