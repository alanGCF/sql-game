import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import { useAjustes } from "../game/ajustes";
import { usePartida } from "../game/partidaStore";
import type { Aspecto } from "../game/paseos";
import { animarEnPruebas, isTestMode, setTestHook } from "../test-hooks";
import { Mat } from "./contexto";

/**
 * Visitas por el pasillo (F4-09, 02-trama.md §Visitas al cubículo; D-30 B, figura de bloques con la ropa de
 * su departamento): quien viene a platicar llega caminando
 * por el pasillo detrás de la mampara derecha, se para frente a ti (se le ve de los hombros para arriba sobre
 * la mampara) y se va al terminar. Pide cuadros solo mientras camina (ADR-018).
 */

/** Ropa y pelo de cada personaje (la silueta es la misma; cambian los colores y un detalle). */
const ASPECTO: Record<string, Aspecto> = {
  don_chuy: { ropa: "#2f5d8a", piel: "#8d5b3f", pelo: "#d9d6cf", detalle: "gorra", detalleColor: "#e0702b" },
  companero: { ropa: "#2e7d6b", piel: "#a0694a", pelo: "#1d1a17" },
  karla: { ropa: "#f2f2ee", piel: "#c68b62", pelo: "#3b2418", detalle: "chongo" },
  trevino: { ropa: "#4a4f57", piel: "#d2a07a", pelo: "#8a8a8a", detalle: "corbata", detalleColor: "#b3261e" },
  comedor: { ropa: "#f6b5c6", piel: "#b97a55", pelo: "#2b1d16", detalle: "chongo" },
  vigilancia: {
    ropa: "#1f2f4a",
    piel: "#7a4b32",
    pelo: "#151515",
    detalle: "gorra",
    detalleColor: "#1f2f4a",
  },
};
const ASPECTO_OTRO: Aspecto = { ropa: "#6d7178", piel: "#a8735a", pelo: "#2a221c" };

/** Del fondo del pasillo (detrás de ti, a la derecha) hasta frente al cubículo, detrás de la mampara. */
const DESDE = { x: 1.3, z: 3.2 };
const HASTA = { x: 1.14, z: -0.04 };
const SEGUNDOS_CAMINANDO = 2.4;
/** Al llegar voltea a verte (tus ojos están en x = 0, z = 0.45). */
const TE_VE = Math.atan2(0 - HASTA.x, 0.45 - HASTA.z);

type Fase = "llegando" | "aqui" | "yendose";

const estado = { quien: null as string | null, fase: null as Fase | null };
setTestHook("visitante", () => ({ quien: estado.quien, fase: estado.fase }));

/** Figura de bloques (D-30): mira hacia +z; los brazos se mecen con `paso`. */
export function FiguraBloques({ a, paso }: { a: Aspecto; paso: React.RefObject<number> }) {
  const brazoI = useRef<Group>(null);
  const brazoD = useRef<Group>(null);
  useFrame(() => {
    const p = paso.current ?? 0;
    if (brazoI.current) brazoI.current.rotation.x = Math.sin(p) * 0.5;
    if (brazoD.current) brazoD.current.rotation.x = -Math.sin(p) * 0.5;
  });
  return (
    <group>
      {/* piernas (casi siempre detrás de la mampara) */}
      <mesh position={[-0.08, 0.45, 0]}>
        <capsuleGeometry args={[0.07, 0.7, 4, 8]} />
        <Mat color="#3a3f47" />
      </mesh>
      <mesh position={[0.08, 0.45, 0]}>
        <capsuleGeometry args={[0.07, 0.7, 4, 8]} />
        <Mat color="#3a3f47" />
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.18, 0]}>
        <capsuleGeometry args={[0.17, 0.42, 4, 16]} />
        <Mat color={a.ropa} />
      </mesh>
      {a.detalle === "corbata" && (
        <mesh position={[0, 1.27, 0.165]}>
          <boxGeometry args={[0.05, 0.22, 0.01]} />
          <Mat color={a.detalleColor ?? "#b3261e"} />
        </mesh>
      )}
      <group ref={brazoI} position={[-0.22, 1.36, 0]}>
        <mesh position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.055, 0.4, 4, 8]} />
          <Mat color={a.ropa} />
        </mesh>
      </group>
      <group ref={brazoD} position={[0.22, 1.36, 0]}>
        <mesh position={[0, -0.24, 0]}>
          <capsuleGeometry args={[0.055, 0.4, 4, 8]} />
          <Mat color={a.ropa} />
        </mesh>
      </group>
      {/* cuello y cabeza */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.08, 10]} />
        <Mat color={a.piel} />
      </mesh>
      <mesh position={[0, 1.63, 0]}>
        <sphereGeometry args={[0.11, 18, 14]} />
        <Mat color={a.piel} />
      </mesh>
      <mesh position={[0, 1.67, -0.015]} scale={[1, 0.75, 1]}>
        <sphereGeometry args={[0.115, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={a.pelo} />
      </mesh>
      {a.detalle === "gorra" && (
        <group position={[0, 1.71, 0]}>
          <mesh>
            <cylinderGeometry args={[0.115, 0.118, 0.07, 18]} />
            <Mat color={a.detalleColor ?? "#2f5d8a"} />
          </mesh>
          <mesh position={[0, -0.03, 0.1]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.16, 0.01, 0.09]} />
            <Mat color={a.detalleColor ?? "#2f5d8a"} />
          </mesh>
        </group>
      )}
      {a.detalle === "chongo" && (
        <mesh position={[0, 1.73, -0.08]}>
          <sphereGeometry args={[0.055, 12, 10]} />
          <Mat color={a.pelo} />
        </mesh>
      )}
    </group>
  );
}

/** Quien llega, camina y se va. Las líneas de la visita salen en subtítulo (Dialogos). */
export function Visitante() {
  const visita = usePartida((s) => {
    const d = s.dialogos[0];
    return d?.visita ? d.quien : null;
  });
  const quieto = useAjustes((s) => s.reducirMovimiento) || (isTestMode && !animarEnPruebas);
  const invalidate = useThree((s) => s.invalidate);
  const [actual, setActual] = useState<{ quien: string; fase: Fase; inicio: number } | null>(null);
  const grupo = useRef<Group>(null);
  const paso = useRef(0);

  useEffect(() => {
    setActual((a) => {
      if (visita && a?.quien === visita && a.fase !== "yendose") return a;
      if (visita) return { quien: visita, fase: quieto ? "aqui" : "llegando", inicio: performance.now() };
      if (a && a.fase !== "yendose")
        return quieto ? null : { ...a, fase: "yendose", inicio: performance.now() };
      return a;
    });
    invalidate();
  }, [visita, quieto, invalidate]);

  estado.quien = actual?.quien ?? null;
  estado.fase = actual?.fase ?? null;

  useFrame(() => {
    const g = grupo.current;
    if (!g || !actual) return;
    if (actual.fase === "aqui") {
      g.position.set(HASTA.x, 0, HASTA.z);
      g.rotation.y = TE_VE;
      return;
    }
    const k = Math.min(1, (performance.now() - actual.inicio) / 1000 / SEGUNDOS_CAMINANDO);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    const [a, b] = actual.fase === "llegando" ? [DESDE, HASTA] : [HASTA, DESDE];
    g.position.set(a.x + (b.x - a.x) * e, Math.abs(Math.sin(k * 18)) * 0.02, a.z + (b.z - a.z) * e);
    g.rotation.y = actual.fase === "llegando" ? (k > 0.92 ? TE_VE : Math.PI) : 0;
    paso.current = k * 18;
    if (k >= 1) setActual(actual.fase === "llegando" ? { ...actual, fase: "aqui" } : null);
    invalidate();
  });

  if (!actual) return null;
  const a = ASPECTO[actual.quien] ?? ASPECTO_OTRO;
  return (
    <group ref={grupo} position={[DESDE.x, 0, DESDE.z]}>
      <FiguraBloques a={a} paso={paso} />
    </group>
  );
}
