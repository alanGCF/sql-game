import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEscena } from "../game/store";
import { setTestHook } from "../test-hooks";
import { CamaraSentada, ProyectorMonitor } from "./CamaraSentada";
import { Cubiculo, ESCRITORIO_Y } from "./Cubiculo";
import { ProveedorEstilo, useEstilo } from "./contexto";
import type { Estilo } from "./estilos";

function Luces() {
  const e = useEstilo();
  return (
    <>
      <hemisphereLight args={[e.luz.cielo, e.luz.suelo, e.luz.hemisferio]} />
      {/* lámpara de escritorio (cálida) */}
      <pointLight
        position={[-0.4, ESCRITORIO_Y + 0.36, -0.62]}
        color="#ffcf8a"
        intensity={e.luz.lampara}
        distance={2.2}
        decay={2}
      />
      {/* luz de atardecer desde la ventana */}
      <directionalLight
        position={[-4, 2.4, -1]}
        color="#ffb27a"
        intensity={e.luz.ventana}
        castShadow={e.sombras}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
      />
      {/* brillo del monitor */}
      <pointLight position={[0, 0.95, -0.25]} color="#9fd3c0" intensity={0.35} distance={0.8} />
      {e.entorno && (
        <Environment resolution={128}>
          <Lightformer intensity={1.2} position={[0, 2.7, 0]} rotation-x={Math.PI / 2} scale={[4, 4, 1]} />
          <Lightformer
            intensity={2}
            color="#ffb27a"
            position={[-4, 1.5, -1]}
            rotation-y={Math.PI / 2}
            scale={[3, 1.5, 1]}
          />
        </Environment>
      )}
    </>
  );
}

export function Escena({ estilo }: { estilo: Estilo }) {
  const setVista = useEscena((s) => s.setVista);
  return (
    <Canvas
      className={estilo.pixelado ? "canvas-pixelado" : undefined}
      dpr={estilo.dpr}
      shadows={estilo.sombras ? "soft" : false}
      camera={{ position: [0, 1.18, 0.45], fov: 55, near: 0.02, far: 40 }}
      gl={{ antialias: !estilo.pixelado, powerPreference: "high-performance" }}
      onPointerMissed={() => {
        if (useEscena.getState().vista !== "general") setVista("general");
      }}
      onCreated={({ gl }) => {
        setTestHook("webgl", gl.capabilities.isWebGL2);
        setTestHook("info", () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles }));
        setTestHook("ready", true);
      }}
    >
      <color attach="background" args={[estilo.fondo]} />
      <fog attach="fog" args={[estilo.niebla.color, estilo.niebla.cerca, estilo.niebla.lejos]} />
      <ProveedorEstilo estilo={estilo}>
        <Luces />
        <Cubiculo />
      </ProveedorEstilo>
      <CamaraSentada />
      <ProyectorMonitor />
    </Canvas>
  );
}
