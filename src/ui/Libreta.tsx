import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { inicioTurno } from "../engine/calendario";
import { usuarioDe } from "../engine/usuario";
import { contenidoComun, turnoInicial } from "../game/contenido";
import { type Bloque, type Inline, leerMarkdown } from "../game/markdown";
import { LARGO_NOTA, MAX_NOTAS, usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";
import { sonido } from "./audio";

type Pestana = "historia" | "comandos" | "pistas" | "notas";

const PESTANAS: ReadonlyArray<readonly [Pestana, string]> = [
  ["historia", "Historia"],
  ["comandos", "Comandos"],
  ["pistas", "Pistas"],
  ["notas", "Mis notas"],
];

const NO_PEGAR = "Mejor lo escribo yo, así se me queda.";

const { paginas, conceptos } = contenidoComun().libreta;

/** Cuántos apuntes de cada pestaña ya viste: los nuevos se escriben con animación (una vez por sesión). */
const vistos: Record<Pestana, number> = {
  historia: 0,
  comandos: 0,
  pistas: 0,
  notas: Number.POSITIVE_INFINITY,
};

function InlineMd({ inline }: { inline: Inline[] }) {
  return (
    <>
      {inline.map((x, i) => {
        const k = `${i}-${x.texto}`;
        if (x.tipo === "codigo") return <code key={k}>{x.texto}</code>;
        if (x.tipo === "cursiva") return <em key={k}>{x.texto}</em>;
        if (x.tipo === "negrita") return <strong key={k}>{x.texto}</strong>;
        return <Fragment key={k}>{x.texto}</Fragment>;
      })}
    </>
  );
}

function PaginaMd({ bloques }: { bloques: Bloque[] }) {
  return (
    <>
      {bloques.map((b, i) => {
        const k = `${i}-${b.tipo}`;
        if (b.tipo === "titulo")
          return b.nivel === 1 ? (
            <h3 key={k}>
              <InlineMd inline={b.inline} />
            </h3>
          ) : (
            <h4 key={k}>
              <InlineMd inline={b.inline} />
            </h4>
          );
        if (b.tipo === "codigo") return <pre key={k}>{b.texto}</pre>;
        if (b.tipo === "lista")
          return (
            <ul key={k}>
              {b.items.map((it, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: renglones fijos de una página.
                <li key={j}>
                  <InlineMd inline={it} />
                </li>
              ))}
            </ul>
          );
        return (
          <p key={k}>
            <InlineMd inline={b.inline} />
          </p>
        );
      })}
    </>
  );
}

/** Un apunte escrito a mano; si es nuevo, aparece trazándose (salvo con "reducir movimiento"). */
function Apunte({ nuevo, retraso, children }: { nuevo: boolean; retraso: number; children: ReactNode }) {
  return (
    <li className={nuevo ? "apunte apunte-nuevo" : "apunte"} style={{ animationDelay: `${retraso}ms` }}>
      {children}
    </li>
  );
}

/**
 * Libreta de apuntes (F4-05, 04-mecanicas.md §Libreta; D-29: abierta a dos páginas, con Patrick Hand).
 * Pestañas Historia, Comandos, Pistas y Mis notas. Lo
 * que escribe el juego va a mano; tus notas, en letra normal. Nada se puede seleccionar ni copiar, y en tus
 * notas no se puede pegar: todo se teclea.
 */
export function Libreta() {
  const [pestana, setPestana] = useState<Pestana>("historia");
  const apuntes = usePartida((s) => s.apuntes);
  const pistas = usePartida((s) => s.pistas);
  const notas = usePartida((s) => s.notas);
  const agregarNota = usePartida((s) => s.agregarNota);
  const borrarNota = usePartida((s) => s.borrarNota);
  const turno = usePartida((s) => s.jornada.turno.turno);
  const usuario = usuarioDe(usePartida((s) => s.nombre));
  const [borrador, setBorrador] = useState("");
  const [pagina, setPagina] = useState<string | null>(null);
  const raiz = useRef<HTMLElement>(null);

  const historia = apuntes.filter((a) => a.pestana === "historia");
  const comandos = useMemo(() => {
    const vistas = new Set<string>();
    for (const a of apuntes) {
      const p = a.pestana === "comandos" && a.concepto ? conceptos[a.concepto] : undefined;
      if (p) vistas.add(p);
    }
    return [...vistas];
  }, [apuntes]);
  const abierta = pagina && comandos.includes(pagina) ? pagina : comandos.at(-1);
  const titulos = useMemo(
    () => new Map([...turnoInicial().misiones, ...turnoInicial().favores].map((m) => [m.id, m.titulo])),
    [],
  );
  const cuantos = { historia: historia.length, comandos: comandos.length, pistas: pistas.length };

  // Lo que estaba antes de abrir no se anima; al salir, todo queda visto.
  const [antes] = useState(() => ({ ...vistos }));
  const ultimos = useRef(cuantos);
  ultimos.current = cuantos;
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo al abrir; `antes` no cambia.
  useEffect(() => {
    raiz.current?.focus();
    // Lápiz sobre el papel si hay algo nuevo por escribir (F4-10).
    const c = ultimos.current;
    if (c.historia > antes.historia || c.comandos > antes.comandos || c.pistas > antes.pistas) sonido.trazo();
    return () => {
      vistos.historia = Math.max(vistos.historia, ultimos.current.historia);
      vistos.comandos = Math.max(vistos.comandos, ultimos.current.comandos);
      vistos.pistas = Math.max(vistos.pistas, ultimos.current.pistas);
    };
  }, []);

  const fecha = new Date(inicioTurno(turno)).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  const guardarNota = () => {
    if (agregarNota(borrador)) setBorrador("");
  };
  const noPegar = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    useEscena.getState().pensar(NO_PEGAR);
  };

  let contenido: ReactNode;
  if (pestana === "historia")
    contenido = historia.length ? (
      <>
        <p className="libreta-fecha">
          Turno {turno} · {fecha}
        </p>
        <ul className="libreta-apuntes">
          {historia.map((a, i) => (
            <Apunte
              key={`${a.mision}-${a.texto}`}
              nuevo={i >= antes.historia}
              retraso={(i - antes.historia) * 900}
            >
              {a.texto}
            </Apunte>
          ))}
        </ul>
      </>
    ) : (
      <p className="libreta-vacia">Todavía no hay nada. Lo importante de cada misión se anota aquí solo.</p>
    );
  else if (pestana === "comandos")
    contenido = comandos.length ? (
      <div className="libreta-comandos">
        <ul className="libreta-indice" aria-label="Comandos aprendidos">
          {comandos.map((c, i) => (
            <li key={c} className={i >= antes.comandos ? "apunte-nuevo" : undefined}>
              <button
                type="button"
                className="libreta-indice-boton"
                aria-pressed={c === abierta}
                onClick={() => setPagina(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
        {abierta && (
          <article className="libreta-pagina">
            <PaginaMd bloques={leerMarkdown((paginas[abierta] ?? "").replaceAll("{{usuario}}", usuario))} />
          </article>
        )}
      </div>
    ) : (
      <p className="libreta-vacia">Cada comando que aprendas queda explicado aquí, con un ejemplo.</p>
    );
  else if (pestana === "pistas")
    contenido = pistas.length ? (
      <ul className="libreta-apuntes">
        {pistas.map((p, i) => (
          <Apunte key={`${p.mision}-${p.objetivo}-${p.nivel}`} nuevo={i >= antes.pistas} retraso={0}>
            <span className="libreta-etiqueta">
              {titulos.get(p.mision) ?? p.mision} · pista {p.nivel} de 3
            </span>
            {p.texto}
          </Apunte>
        ))}
      </ul>
    ) : (
      <p className="libreta-vacia">Las pistas que te dé Eduardo por teléfono quedan aquí.</p>
    );
  else
    contenido = (
      <div className="libreta-notas">
        <label className="libreta-notas-titulo" htmlFor="nota-nueva">
          Nota nueva
        </label>
        <textarea
          id="nota-nueva"
          className="libreta-nota-nueva"
          value={borrador}
          maxLength={LARGO_NOTA}
          rows={3}
          spellCheck={false}
          onChange={(e) => setBorrador(e.target.value)}
          onPaste={noPegar}
          onDrop={noPegar}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              guardarNota();
            }
          }}
        />
        <div className="libreta-notas-pie">
          <span>
            {borrador.length}/{LARGO_NOTA} · {notas.length}/{MAX_NOTAS} notas
          </span>
          <button
            type="button"
            className="libreta-anotar"
            onClick={guardarNota}
            disabled={!borrador.trim() || notas.length >= MAX_NOTAS}
          >
            Anotar <kbd>Ctrl+Enter</kbd>
          </button>
        </div>
        <ul className="libreta-mis-notas">
          {notas.map((n, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: las notas no tienen id; se borran por posición.
            <li key={i}>
              <span>{n}</span>
              <button
                type="button"
                className="libreta-borrar"
                aria-label={`Borrar la nota ${i + 1}`}
                onClick={() => borrarNota(i)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <>
      <div className="libreta-fondo" aria-hidden="true" />
      <section
        ref={raiz}
        className="libreta libreta-abierta"
        aria-label="Libreta de apuntes"
        tabIndex={-1}
        data-testid="libreta"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
      >
        <div className="libreta-pestanas" role="tablist" aria-label="Pestañas de la libreta">
          {PESTANAS.map(([id, nombre]) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`libreta-pestana libreta-pestana-${id}`}
              aria-selected={pestana === id}
              onClick={() => setPestana(id)}
            >
              {nombre}
            </button>
          ))}
        </div>
        <div className={`libreta-hoja libreta-hoja-${pestana}`} role="tabpanel">
          {contenido}
        </div>
      </section>
    </>
  );
}
