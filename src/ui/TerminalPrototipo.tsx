import { type ClipboardEvent, type DragEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useEscena } from "../game/store";

type Linea = { tipo: "prompt" | "salida" | "glosa"; texto: string };

const PROMPT = "becario@srv-sistemas:~$";
const INICIALES: Linea[] = [
  { tipo: "prompt", texto: "ls" },
  { tipo: "salida", texto: "LEEME.txt  tickets" },
  { tipo: "prompt", texto: "cat leeme.txt" },
  { tipo: "salida", texto: "cat: leeme.txt: No such file or directory" },
  { tipo: "glosa", texto: '↳ No existe "leeme.txt" aquí. Linux distingue mayúsculas: ¿será LEEME.txt?' },
  { tipo: "prompt", texto: "cat LEEME.txt" },
  {
    tipo: "salida",
    texto:
      'Para quien me reemplace:\n\n1. El usuario es "becario". La contraseña está en el post-it.\n2. Los tickets llegan a ~/tickets/. Uno por archivo.\n3. Si la impresora de la Línea 2 falla, casi siempre es el cable.\n\nY una cosa más: no confíes en los números del turno nocturno.\nRevisa todo dos veces.\n— R.',
  },
];

// Spike: el motor real llega en F1. Aquí solo se demuestran el globo de pensamiento y el bloqueo de pegar.
const FUERA_DE_ALCANCE = new Set(["awk", "vim", "nano", "apt", "python3", "sed", "systemctl"]);

export function TerminalPrototipo() {
  const rect = useEscena((s) => s.rectMonitor);
  const pensar = useEscena((s) => s.pensar);
  const [lineas, setLineas] = useState<Linea[]>(INICIALES);
  const [entrada, setEntrada] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rect) inputRef.current?.focus();
  }, [rect]);
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  });

  if (!rect) return null;

  const bloquear = (e: ClipboardEvent | DragEvent) => {
    e.preventDefault();
    pensar("Mejor lo escribo yo, así se me queda.");
  };

  const enviar = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const linea = entrada.trim();
    const comando = linea.split(/\s+/)[0] ?? "";
    if (FUERA_DE_ALCANCE.has(comando) || linea.includes("$(")) {
      pensar("No sé qué haga esto… mejor no le doy Enter.");
      return;
    }
    setLineas((l) => [
      ...l,
      { tipo: "prompt", texto: linea },
      ...(linea
        ? [{ tipo: "salida" as const, texto: `(spike) el motor del shell llega en la fase F1` }]
        : []),
    ]);
    setEntrada("");
  };

  return (
    <div
      className="terminal"
      data-testid="terminal"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      <div className="terminal-barra">srv-sistemas — Terminal</div>
      <div className="terminal-cuerpo">
        {lineas.map((l, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: líneas inmutables, solo se agregan al final.
          <div key={i} className={`terminal-linea ${l.tipo}`}>
            {l.tipo === "prompt" ? (
              <>
                <span className="terminal-prompt">{PROMPT}</span> {l.texto}
              </>
            ) : (
              l.texto
            )}
          </div>
        ))}
        <div className="terminal-entrada" ref={finRef}>
          <span className="terminal-prompt">{PROMPT}</span>
          <input
            ref={inputRef}
            aria-label="Comando"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={enviar}
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
