import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import { iluminacion } from "../game/hora";
import { usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";
import { setTestHook } from "../test-hooks";
import { CamaraSentada, ProyectorMonitor } from "./CamaraSentada";
import { Cubiculo, ESCRITORIO_Y, VENTANA } from "./Cubiculo";
import { ESTILO } from "./estilos";

/** Lámpara de escritorio: un foco que apunta al escritorio (no al pizarrón ni a las mamparas). */
function Lampara() {
  const [objetivo] = useState(() => new THREE.Object3D());
  return (
    <>
      <primitive object={objetivo} position={[-0.32, ESCRITORIO_Y, -0.42]} />
      <spotLight
        position={[-0.39, ESCRITORIO_Y + 0.37, -0.78]}
        target={objetivo}
        color="#ffcf8a"
        intensity={ESTILO.luz.lampara}
        angle={0.75}
        penumbra={0.8}
        distance={1.6}
        decay={2}
      />
    </>
  );
}

function Luces() {
  const minuto = usePartida((s) => s.minuto);
  const l = iluminacion(minuto);
  const [vx, vy, vz] = VENTANA.centro;
  return (
    <>
      <hemisphereLight args={[ESTILO.luz.cielo, ESTILO.luz.suelo, ESTILO.luz.hemisferio * l.ambiente]} />
      <Lampara />
      {/* luz que entra por la ventana del fondo: tarde → atardecer → noche */}
      <directionalLight
        position={[vx + 0.6, vy + 2.2, vz + 2.5]}
        color={l.sol}
        intensity={l.intensidadSol}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
      />
      {/* brillo del monitor */}
      <pointLight position={[0, 0.95, -0.25]} color="#9fd3c0" intensity={0.35} distance={0.8} />
      {/* Reflejos: se rehacen solo al cambiar de etapa (tres veces por turno). */}
      <Environment key={l.etapa} resolution={128}>
        <Lightformer intensity={1.2} position={[0, 2.7, 0]} rotation-x={Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer
          intensity={0.4 + l.intensidadSol}
          color={l.sol}
          position={[vx, vy, vz]}
          scale={[VENTANA.ancho, VENTANA.alto, 1]}
        />
      </Environment>
    </>
  );
}

export function Escena() {
  const setVista = useEscena((s) => s.setVista);
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="soft"
      camera={{ position: [0, 1.18, 0.45], fov: 55, near: 0.02, far: 40 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => {
        if (useEscena.getState().vista !== "general") setVista("general");
      }}
      onCreated={({ gl }) => {
        setTestHook("webgl", gl.capabilities.isWebGL2);
        setTestHook("info", () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles }));
        setTestHook("ready", true);
      }}
    >
      <color attach="background" args={[ESTILO.fondo]} />
      <fog attach="fog" args={[ESTILO.niebla.color, ESTILO.niebla.cerca, ESTILO.niebla.lejos]} />
      <Luces />
      <Cubiculo />
      <CamaraSentada />
      <ProyectorMonitor />
    </Canvas>
  );
}
