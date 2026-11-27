import { useEffect, useRef, useState } from "react";
import { AMBIENTALES, type Ambiental, PlanificadorAmbiental } from "../game/ambientales";
import { usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";
import { setTestHook } from "../test-hooks";
import { sonido } from "./audio";

const SEGUNDOS_SUBTITULO = 4;

/**
 * Lo que suena a lo lejos (F4-10, D-19): el planificador decide cuándo (uno cada 2 a 4 minutos, nunca
 * durante un diálogo) y aquí suena y sale su subtítulo arriba al centro. Corre solo con la partida en juego.
 */
export function SonidoAmbiente() {
  const semilla = usePartida((s) => s.semilla);
  const enMenu = useEscena((s) => s.enMenu);
  const [subtitulo, setSubtitulo] = useState<string | null>(null);
  const quitar = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sonar = (tipo: Ambiental) => {
    sonido.ambiental(tipo);
    setSubtitulo(AMBIENTALES[tipo].subtitulo);
    if (quitar.current) clearTimeout(quitar.current);
    quitar.current = setTimeout(() => setSubtitulo(null), SEGUNDOS_SUBTITULO * 1000);
  };
  const sonarActual = useRef(sonar);
  sonarActual.current = sonar;

  useEffect(() => {
    setTestHook("ambiental", (tipo) => sonarActual.current(tipo as Ambiental));
  }, []);

  useEffect(() => {
    if (enMenu) return;
    const planificador = new PlanificadorAmbiental(semilla);
    let segundos = 0;
    const reloj = setInterval(() => {
      segundos += 1;
      const tipo = planificador.tic(segundos, usePartida.getState().dialogos.length > 0);
      if (tipo) sonarActual.current(tipo);
    }, 1000);
    return () => clearInterval(reloj);
  }, [enMenu, semilla]);

  useEffect(
    () => () => {
      if (quitar.current) clearTimeout(quitar.current);
    },
    [],
  );

  if (!subtitulo) return null;
  return (
    <p className="subtitulo-ambiente" role="status" data-testid="subtitulo-ambiente">
      [{subtitulo}]
    </p>
  );
}
