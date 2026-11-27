import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import { useAjustes } from "../game/ajustes";
import { usePartida } from "../game/partidaStore";
import { PASEANTES, PlanificadorPaseos, RUTAS, SEGUNDOS_PASEO } from "../game/paseos";
import { animarEnPruebas, isTestMode, setTestHook } from "../test-hooks";
import { FiguraBloques } from "./Visitante";

/** Pasos que da al cruzar (para mecer los brazos y el leve rebote). */
const PASOS = 14;

interface Paseo {
  ruta: number;
  quien: number;
  inicio: number;
  /** Avance fijo de 0 a 1 (capturas): se queda ahí, sin caminar. */
  fijo?: number;
}

const estado = { paseando: false };
setTestHook("paseante", () => estado.paseando);

/**
 * Oficina viva (F4-15): de vez en cuando alguien de la oficina cruza a lo lejos por un pasillo. El
 * planificador (src/game/paseos.ts) decide cuándo, quién y por dónde con la semilla; nunca sale durante un
 * diálogo. Pide cuadros solo mientras camina (ADR-018). Con "reducir movimiento" nadie camina.
 */
export function Paseante() {
  const semilla = usePartida((s) => s.semilla);
  const quieto = useAjustes((s) => s.reducirMovimiento) || (isTestMode && !animarEnPruebas);
  const invalidate = useThree((s) => s.invalidate);
  const [paseo, setPaseo] = useState<Paseo | null>(null);
  const grupo = useRef<Group>(null);
  const paso = useRef(0);

  useEffect(() => {
    if (quieto) return;
    const planificador = new PlanificadorPaseos(semilla);
    let segundos = 0;
    const reloj = setInterval(() => {
      segundos += 1;
      const p = planificador.tic(segundos, usePartida.getState().dialogos.length > 0);
      if (p) setPaseo({ ...p, inicio: performance.now() });
    }, 1000);
    return () => clearInterval(reloj);
  }, [quieto, semilla]);

  useEffect(() => {
    setTestHook("paseo", (ruta, quien, avance) =>
      setPaseo({ ruta, quien, inicio: performance.now(), ...(avance === undefined ? {} : { fijo: avance }) }),
    );
  }, []);

  // Un cuadro más al llegar o al irse (montar o desmontar la figura).
  useEffect(() => {
    estado.paseando = paseo !== null && paseo.fijo === undefined;
    invalidate();
  }, [paseo, invalidate]);

  useFrame(() => {
    const g = grupo.current;
    const r = paseo ? RUTAS[paseo.ruta] : undefined;
    if (!g || !paseo || !r) return;
    const k = paseo.fijo ?? Math.min(1, (performance.now() - paseo.inicio) / 1000 / SEGUNDOS_PASEO);
    const dx = r.hasta.x - r.desde.x;
    const dz = r.hasta.z - r.desde.z;
    g.position.set(r.desde.x + dx * k, Math.abs(Math.sin(k * PASOS * Math.PI)) * 0.02, r.desde.z + dz * k);
    g.rotation.y = Math.atan2(dx, dz);
    paso.current = k * PASOS * Math.PI;
    if (paseo.fijo !== undefined) return;
    if (k >= 1) setPaseo(null);
    else invalidate();
  });

  const a = paseo ? PASEANTES[paseo.quien] : undefined;
  if (!paseo || !a) return null;
  return (
    <group ref={grupo}>
      <FiguraBloques a={a} paso={paso} />
    </group>
  );
}
