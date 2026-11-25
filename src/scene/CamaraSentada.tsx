import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useAjustes } from "../game/ajustes";
import { type Rect, useEscena, type Vista } from "../game/store";
import { isTestMode } from "../test-hooks";
import { MONITOR } from "./Cubiculo";

const OJOS = new THREE.Vector3(0, 1.18, 0.45);
const GIRO_MAX = THREE.MathUtils.degToRad(65);
/** En reposo se mira un poco hacia abajo para ver el escritorio y algo de oficina sobre la mampara. */
const REPOSO = THREE.MathUtils.degToRad(-8);
const ARRIBA_MAX = THREE.MathUtils.degToRad(22);
const ABAJO_MAX = THREE.MathUtils.degToRad(28);
const ZONA_MUERTA = 0.08;
const DURACION_TRANSICION = 0.6;
/** La escena se dibuja a demanda: tras un rato quieta, el primer `dt` es enorme y se acota. */
const DT_MAX = 1 / 30;
/** Diferencia de ángulo bajo la cual la cámara ya llegó y se deja de pedir cuadros. */
const LLEGO = 1e-4;

type Pose = { pos: THREE.Vector3; mira: THREE.Vector3 };

const POSES: Record<Exclude<Vista, "general">, Pose> = {
  monitor: { pos: new THREE.Vector3(0, 1.06, -0.04), mira: new THREE.Vector3(...MONITOR.centro) },
  telefono: { pos: new THREE.Vector3(-0.38, 1.05, 0.02), mira: new THREE.Vector3(-0.46, 0.76, -0.32) },
  libreta: { pos: new THREE.Vector3(0.28, 1.08, 0.08), mira: new THREE.Vector3(0.3, 0.75, -0.13) },
  pizarron: { pos: new THREE.Vector3(0.3, 1.13, -0.3), mira: new THREE.Vector3(0.87, 1.12, -0.3) },
  calendario: { pos: new THREE.Vector3(-0.38, 1.13, -0.25), mira: new THREE.Vector3(-0.87, 1.12, -0.25) },
};

/** Quita la zona muerta del centro y reescala el resto a -1..1. */
function conZonaMuerta(v: number): number {
  const a = Math.abs(v);
  if (a < ZONA_MUERTA) return 0;
  return Math.sign(v) * Math.min(1, (a - ZONA_MUERTA) / (1 - ZONA_MUERTA));
}

function suavizar(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function quaternionMirando(desde: THREE.Vector3, hacia: THREE.Vector3): THREE.Quaternion {
  const m = new THREE.Matrix4().lookAt(desde, hacia, new THREE.Vector3(0, 1, 0));
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

/**
 * Cámara de jugador sentado: en la vista general gira hacia donde apunta el cursor;
 * al elegir un objeto, se acerca a su pose con una transición suave.
 */
/** Sin deslizamiento de cámara en pruebas o con "reducir movimiento" (F3-08). */
const sinMovimiento = () => isTestMode || useAjustes.getState().reducirMovimiento;

export function CamaraSentada() {
  const { camera, pointer, invalidate } = useThree();
  const vista = useEscena((s) => s.vista);
  const setTransicionando = useEscena((s) => s.setTransicionando);
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const transicion = useRef<{
    t: number;
    desdePos: THREE.Vector3;
    desdeRot: THREE.Quaternion;
    haciaPos: THREE.Vector3;
    haciaRot: THREE.Quaternion;
  } | null>(null);

  // Render a demanda (Escena: frameloop="demand"): se pide cuadro al mover el cursor o cambiar la vista.
  useEffect(() => {
    const pedir = () => invalidate();
    window.addEventListener("pointermove", pedir);
    const quitar = useEscena.subscribe(pedir);
    return () => {
      window.removeEventListener("pointermove", pedir);
      quitar();
    };
  }, [invalidate]);

  // Cada cambio de vista arranca una transición desde la pose actual.
  useEffect(() => {
    const haciaPos = vista === "general" ? OJOS.clone() : POSES[vista].pos.clone();
    const haciaRot =
      vista === "general"
        ? new THREE.Quaternion().setFromEuler(euler.current)
        : quaternionMirando(POSES[vista].pos, POSES[vista].mira);
    transicion.current = {
      t: sinMovimiento() ? DURACION_TRANSICION : 0,
      desdePos: camera.position.clone(),
      desdeRot: camera.quaternion.clone(),
      haciaPos,
      haciaRot,
    };
    setTransicionando(true);
    invalidate();
  }, [vista, camera, setTransicionando, invalidate]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, DT_MAX);
    const tr = transicion.current;
    if (tr) {
      state.invalidate();
      tr.t = Math.min(DURACION_TRANSICION, tr.t + dt);
      const k = suavizar(tr.t / DURACION_TRANSICION);
      camera.position.lerpVectors(tr.desdePos, tr.haciaPos, k);
      camera.quaternion.slerpQuaternions(tr.desdeRot, tr.haciaRot, k);
      if (tr.t >= DURACION_TRANSICION) {
        transicion.current = null;
        setTransicionando(false);
      }
      return;
    }
    if (vista !== "general") return;

    const forzado = useEscena.getState().mirarForzado;
    const px = conZonaMuerta(forzado?.x ?? pointer.x);
    const py = conZonaMuerta(forzado?.y ?? pointer.y);
    const yaw = -px * GIRO_MAX;
    const pitch = REPOSO + (py >= 0 ? py * ARRIBA_MAX : py * ABAJO_MAX);
    const k = sinMovimiento() ? 1 : 1 - Math.exp(-dt * 6);
    euler.current.y += (yaw - euler.current.y) * k;
    euler.current.x += (pitch - euler.current.x) * k;
    camera.position.copy(OJOS);
    camera.quaternion.setFromEuler(euler.current);
    // Mientras la cámara amortiguada no llega a donde apunta el cursor, se siguen pidiendo cuadros.
    if (Math.abs(yaw - euler.current.y) > LLEGO || Math.abs(pitch - euler.current.x) > LLEGO)
      state.invalidate();
  });

  return null;
}

/** Proyecta las esquinas de la pantalla del monitor a píxeles para alinear la terminal DOM. */
export function ProyectorMonitor() {
  const { camera, size } = useThree();
  const setRect = useEscena((s) => s.setRectMonitor);
  const ultimo = useRef("");
  const v = useRef(new THREE.Vector3());

  useFrame(() => {
    const { vista, transicionando } = useEscena.getState();
    if (vista !== "monitor" || transicionando) {
      if (ultimo.current !== "") {
        ultimo.current = "";
        setRect(null);
      }
      return;
    }
    const [cx, cy, cz] = MONITOR.centro;
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [dx, dy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      v.current.set(cx + (dx * MONITOR.ancho) / 2, cy + (dy * MONITOR.alto) / 2, cz).project(camera);
      xs.push(((v.current.x + 1) / 2) * size.width);
      ys.push(((1 - v.current.y) / 2) * size.height);
    }
    const r: Rect = {
      x: Math.round(Math.min(...xs)),
      y: Math.round(Math.min(...ys)),
      w: Math.round(Math.max(...xs) - Math.min(...xs)),
      h: Math.round(Math.max(...ys) - Math.min(...ys)),
    };
    const clave = `${r.x},${r.y},${r.w},${r.h}`;
    if (clave !== ultimo.current) {
      ultimo.current = clave;
      setRect(r);
    }
  });
  return null;
}
