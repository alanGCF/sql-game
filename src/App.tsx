import { Canvas } from "@react-three/fiber";
import { setTestHook } from "./test-hooks";

export function App() {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 2.5], fov: 50 }}
      onCreated={({ gl }) => {
        setTestHook("webgl", gl.capabilities.isWebGL2);
        setTestHook("ready", true);
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} />
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.6, 0.05, 0.8]} />
        <meshStandardMaterial color="#b89b72" />
      </mesh>
    </Canvas>
  );
}
