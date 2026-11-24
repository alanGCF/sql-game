import { useEscena } from "../game/store";
import { Mat, useEstilo, useTexturaCanvas } from "./contexto";
import { Interactivo } from "./Interactivo";
import {
  dibujarCalendario,
  dibujarDirectorio,
  dibujarFoto,
  dibujarGafete,
  dibujarPantalla,
  dibujarPizarron,
  dibujarPostIt,
  dibujarReloj,
  dibujarVentana,
} from "./texturas";

/** Medidas en metros. El jugador está sentado en (0, 1.18, 0.45) mirando hacia -z. */
export const ESCRITORIO_Y = 0.74;
export const MONITOR = { centro: [0, 1.06, -0.415] as const, ancho: 0.52, alto: 0.31 };

const BASE = {
  mampara: "#8f8a7d",
  marcoMampara: "#5d6168",
  escritorio: "#b89b72",
  plasticoOscuro: "#2b2d31",
  teclado: "#d9d6cf",
  piso: "#4b4f55",
  techo: "#d8d5cc",
  pared: "#cfc8b8",
  libreta: "#3d5a80",
  taza: "#e9e4da",
  lonchera: "#b03a2e",
  planta: "#4a7c59",
  maceta: "#a0522d",
  papel: "#f1eee6",
};

function usePaleta() {
  const estilo = useEstilo();
  return { ...BASE, ...estilo.paleta };
}

function Caja({
  pos,
  tam,
  color,
  rot,
  sombra = true,
}: {
  pos: [number, number, number];
  tam: [number, number, number];
  color: string;
  rot?: [number, number, number];
  sombra?: boolean;
}) {
  const estilo = useEstilo();
  return (
    <mesh
      position={pos}
      rotation={rot ?? [0, 0, 0]}
      castShadow={sombra && estilo.sombras}
      receiveShadow={estilo.sombras}
    >
      <boxGeometry args={tam} />
      <Mat color={color} />
    </mesh>
  );
}

function Mamparas() {
  const C = usePaleta();
  return (
    <group>
      {/* frontal */}
      <Caja pos={[0, 0.56, -0.8]} tam={[1.8, 1.12, 0.05]} color={C.mampara} />
      <Caja pos={[0, 1.13, -0.8]} tam={[1.82, 0.03, 0.07]} color={C.marcoMampara} />
      {/* izquierda */}
      <Caja pos={[-0.9, 0.675, 0.05]} tam={[0.05, 1.35, 1.75]} color={C.mampara} />
      <Caja pos={[-0.9, 1.36, 0.05]} tam={[0.07, 0.03, 1.77]} color={C.marcoMampara} />
      {/* derecha (con hueco hacia el pasillo) */}
      <Caja pos={[0.9, 0.675, -0.27]} tam={[0.05, 1.35, 1.1]} color={C.mampara} />
      <Caja pos={[0.9, 1.36, -0.27]} tam={[0.07, 0.03, 1.12]} color={C.marcoMampara} />
    </group>
  );
}

function Escritorio() {
  const C = usePaleta();
  return (
    <group>
      <Caja pos={[0, ESCRITORIO_Y - 0.015, -0.39]} tam={[1.74, 0.03, 0.78]} color={C.escritorio} />
      <Caja pos={[-0.84, 0.36, -0.39]} tam={[0.03, 0.72, 0.74]} color={C.marcoMampara} />
      <Caja pos={[0.84, 0.36, -0.39]} tam={[0.03, 0.72, 0.74]} color={C.marcoMampara} />
      {/* cajonera */}
      <Caja pos={[0.58, 0.36, -0.4]} tam={[0.4, 0.7, 0.6]} color="#6d7178" />
    </group>
  );
}

function Monitor() {
  const C = usePaleta();
  const pantalla = useTexturaCanvas(1024, 600, dibujarPantalla);
  const vista = useEscena((s) => s.vista);
  const postIt = useTexturaCanvas(160, 160, dibujarPostIt(["pass:", "duna47"]));
  const postIt2 = useTexturaCanvas(160, 160, dibujarPostIt(["Lupita", "ext. 214"]));
  const [cx, cy, cz] = MONITOR.centro;
  return (
    <Interactivo nombre="Computadora" vista="monitor">
      <Caja pos={[0, ESCRITORIO_Y + 0.01, -0.45]} tam={[0.24, 0.02, 0.18]} color={C.plasticoOscuro} />
      <Caja pos={[0, ESCRITORIO_Y + 0.12, -0.47]} tam={[0.05, 0.22, 0.04]} color={C.plasticoOscuro} />
      <Caja
        pos={[cx, cy, cz - 0.025]}
        tam={[MONITOR.ancho + 0.05, MONITOR.alto + 0.05, 0.04]}
        color={C.plasticoOscuro}
      />
      {/* Pantalla: cuando el jugador se acerca, la terminal DOM ocupa su lugar. */}
      <mesh position={[cx, cy, cz - 0.004]}>
        <planeGeometry args={[MONITOR.ancho, MONITOR.alto]} />
        {vista === "monitor" ? (
          <meshBasicMaterial color="#0b1110" />
        ) : (
          <meshBasicMaterial map={pantalla} color="#d8d8d8" toneMapped={false} />
        )}
      </mesh>
      <mesh position={[cx - 0.29, cy + 0.12, cz]} rotation={[0, 0, 0.08]}>
        <planeGeometry args={[0.07, 0.07]} />
        <Mat color="#ffffff" mapa={postIt} />
      </mesh>
      <mesh position={[cx + 0.29, cy - 0.1, cz]} rotation={[0, 0, -0.06]}>
        <planeGeometry args={[0.07, 0.07]} />
        <Mat color="#ffffff" mapa={postIt2} />
      </mesh>
      {/* teclado y mouse */}
      <Caja pos={[0, ESCRITORIO_Y + 0.012, -0.2]} tam={[0.44, 0.022, 0.14]} color={C.teclado} />
      <Caja pos={[0.32, ESCRITORIO_Y + 0.012, -0.19]} tam={[0.06, 0.024, 0.1]} color={C.teclado} />
    </Interactivo>
  );
}

function Telefono() {
  const C = usePaleta();
  return (
    <Interactivo nombre="Teléfono" vista="telefono">
      <group position={[-0.5, ESCRITORIO_Y, -0.45]} rotation={[0, 0.45, 0]}>
        <Caja pos={[0, 0.025, 0]} tam={[0.19, 0.05, 0.17]} color={C.plasticoOscuro} />
        <Caja pos={[0, 0.062, -0.045]} tam={[0.2, 0.03, 0.05]} color="#1f2124" />
        <Caja pos={[0.02, 0.052, 0.035]} tam={[0.09, 0.004, 0.07]} color="#c9ccc6" />
        <Caja pos={[-0.055, 0.052, 0.04]} tam={[0.04, 0.004, 0.025]} color="#7fa392" />
        <mesh position={[-0.08, 0.065, 0.06]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <Mat color="#c0392b" emisivo="#ff3b30" intensidadEmisiva={1.2} />
        </mesh>
      </group>
    </Interactivo>
  );
}

function Libreta() {
  const C = usePaleta();
  return (
    <Interactivo nombre="Libreta de apuntes" vista="libreta">
      <group position={[0.3, ESCRITORIO_Y + 0.008, -0.12]} rotation={[0, -0.25, 0]}>
        <Caja pos={[0, 0, 0]} tam={[0.16, 0.016, 0.22]} color={C.libreta} />
        <Caja pos={[-0.075, 0.009, 0]} tam={[0.012, 0.012, 0.21]} color="#9aa0a6" />
        <Caja pos={[0.02, 0.005, -0.1]} tam={[0.03, 0.01, 0.03]} color="#e0702b" />
      </group>
    </Interactivo>
  );
}

function Pizarron() {
  const tex = useTexturaCanvas(640, 480, dibujarPizarron);
  const favor = useTexturaCanvas(160, 160, dibujarPostIt(["Favor:", "menús", "—Comedor"]));
  return (
    <Interactivo nombre="Pizarrón de pendientes" vista="pizarron">
      <group position={[0.87, 1.05, -0.3]} rotation={[0, -Math.PI / 2, 0]}>
        <Caja pos={[0, 0, -0.012]} tam={[0.64, 0.48, 0.02]} color="#9aa0a6" sombra={false} />
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.6, 0.45]} />
          <Mat color="#ffffff" mapa={tex} rugosidad={0.3} />
        </mesh>
        <mesh position={[0.22, 0.14, 0.004]} rotation={[0, 0, 0.1]}>
          <planeGeometry args={[0.09, 0.09]} />
          <Mat color="#ffffff" mapa={favor} />
        </mesh>
      </group>
    </Interactivo>
  );
}

function Calendario() {
  const tex = useTexturaCanvas(512, 520, dibujarCalendario);
  return (
    <Interactivo nombre="Calendario" vista="calendario">
      <mesh position={[-0.87, 1.05, -0.25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.36, 0.37]} />
        <Mat color="#ffffff" mapa={tex} />
      </mesh>
    </Interactivo>
  );
}

function ObjetosEscritorio() {
  const C = usePaleta();
  const gafete = useTexturaCanvas(320, 160, dibujarGafete);
  const foto = useTexturaCanvas(200, 160, dibujarFoto);
  const directorio = useTexturaCanvas(320, 260, dibujarDirectorio);
  const estilo = useEstilo();
  return (
    <group>
      {/* Gafete */}
      <Interactivo nombre="Gafete">
        <mesh position={[-0.2, ESCRITORIO_Y + 0.002, -0.07]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <planeGeometry args={[0.09, 0.055]} />
          <Mat color="#ffffff" mapa={gafete} />
        </mesh>
      </Interactivo>
      {/* Taza */}
      <Interactivo nombre="Taza de café">
        <mesh position={[0.62, ESCRITORIO_Y + 0.05, -0.28]} castShadow={estilo.sombras}>
          <cylinderGeometry args={[0.04, 0.035, 0.1, estilo.flat ? 10 : 24]} />
          <Mat color={C.taza} />
        </mesh>
      </Interactivo>
      {/* Lonchera */}
      <Interactivo nombre="Lonchera">
        <group position={[-0.7, ESCRITORIO_Y + 0.07, -0.66]} rotation={[0, 0.2, 0]}>
          <Caja pos={[0, 0, 0]} tam={[0.22, 0.14, 0.15]} color={C.lonchera} />
          <Caja pos={[0, 0.085, 0]} tam={[0.12, 0.02, 0.02]} color="#222" />
        </group>
      </Interactivo>
      {/* Foto y planta */}
      <Interactivo nombre="Foto">
        <group position={[-0.25, ESCRITORIO_Y + 0.07, -0.68]} rotation={[-0.15, 0.2, 0]}>
          <Caja pos={[0, 0, -0.006]} tam={[0.13, 0.11, 0.01]} color="#4a3b2c" />
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.11, 0.09]} />
            <Mat color="#ffffff" mapa={foto} />
          </mesh>
        </group>
      </Interactivo>
      <Interactivo nombre="Planta">
        <group position={[0.42, ESCRITORIO_Y, -0.66]}>
          <mesh position={[0, 0.045, 0]} castShadow={estilo.sombras}>
            <cylinderGeometry args={[0.045, 0.035, 0.09, estilo.flat ? 8 : 20]} />
            <Mat color={C.maceta} />
          </mesh>
          <mesh position={[0, 0.13, 0]} castShadow={estilo.sombras}>
            <icosahedronGeometry args={[0.07, estilo.flat ? 0 : 2]} />
            <Mat color={C.planta} />
          </mesh>
        </group>
      </Interactivo>
      {/* Desorden: papeles, envoltura, plumas */}
      <Caja
        pos={[0.12, ESCRITORIO_Y + 0.002, -0.62]}
        tam={[0.21, 0.004, 0.28]}
        color={C.papel}
        rot={[0, 0.3, 0]}
        sombra={false}
      />
      <Caja
        pos={[0.16, ESCRITORIO_Y + 0.006, -0.58]}
        tam={[0.21, 0.004, 0.28]}
        color="#e9e4d4"
        rot={[0, -0.15, 0]}
        sombra={false}
      />
      <Caja
        pos={[-0.55, ESCRITORIO_Y + 0.006, -0.08]}
        tam={[0.13, 0.008, 0.012]}
        color="#1f3b73"
        rot={[0, 0.7, 0]}
      />
      <Caja
        pos={[0.68, ESCRITORIO_Y + 0.004, -0.12]}
        tam={[0.06, 0.008, 0.04]}
        color="#d64545"
        rot={[0, 0.4, 0]}
      />
      {/* Directorio pegado en la mampara izquierda */}
      <mesh position={[-0.87, 0.95, -0.62]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.2, 0.16]} />
        <Mat color="#ffffff" mapa={directorio} />
      </mesh>
      {/* Lámpara de escritorio */}
      <group position={[-0.42, ESCRITORIO_Y, -0.7]}>
        <Caja pos={[0, 0.01, 0]} tam={[0.12, 0.02, 0.12]} color="#2f3238" />
        <Caja pos={[0, 0.2, -0.04]} tam={[0.015, 0.38, 0.015]} color="#2f3238" rot={[0.2, 0, 0]} />
        <mesh position={[0.03, 0.39, -0.08]} rotation={[0.9, 0, -0.3]}>
          <coneGeometry args={[0.045, 0.07, estilo.flat ? 8 : 20, 1, true]} />
          <Mat color="#e0702b" />
        </mesh>
      </group>
    </group>
  );
}

function Oficina() {
  const C = usePaleta();
  const ventana = useTexturaCanvas(512, 256, dibujarVentana);
  const reloj = useTexturaCanvas(256, 256, dibujarReloj);
  const estilo = useEstilo();
  const mamparasLejanas: [number, number][] = [
    [-2.2, -2.2],
    [0, -2.6],
    [2.1, -2.2],
    [-2.4, 0.4],
    [2.5, 0.6],
    [1.2, -4.2],
    [-1.4, -4.4],
  ];
  return (
    <group>
      {/* piso, techo y paredes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={estilo.sombras}>
        <planeGeometry args={[14, 14]} />
        <Mat color={C.piso} />
      </mesh>
      <mesh position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial color={C.techo} />
      </mesh>
      <mesh position={[0, 1.4, -6]}>
        <planeGeometry args={[14, 2.8]} />
        <Mat color={C.pared} />
      </mesh>
      <mesh position={[-5, 1.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 2.8]} />
        <Mat color={C.pared} />
      </mesh>
      {/* ventana hacia la planta */}
      <mesh position={[-4.98, 1.55, -1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.2, 1.3]} />
        <meshBasicMaterial map={ventana} toneMapped={false} />
      </mesh>
      {/* lámparas del techo */}
      {[-2, 0.5, 3].map((z) =>
        [-1.6, 1.6].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 2.79, z - 2]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.3]} />
            <meshBasicMaterial color="#fff6e5" toneMapped={false} />
          </mesh>
        )),
      )}
      {/* reloj de pared */}
      <mesh position={[0.6, 2.25, -5.98]}>
        <circleGeometry args={[0.28, estilo.flat ? 16 : 40]} />
        <Mat color="#ffffff" mapa={reloj} />
      </mesh>
      {/* otros cubículos */}
      {mamparasLejanas.map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, 0, z]}>
          <Caja pos={[0, 0.73, -0.8]} tam={[1.8, 1.46, 0.05]} color={C.mampara} />
          <Caja pos={[-0.9, 0.73, 0]} tam={[0.05, 1.46, 1.6]} color={C.mampara} />
          <Caja pos={[0, ESCRITORIO_Y, -0.4]} tam={[1.7, 0.03, 0.7]} color={C.escritorio} />
        </group>
      ))}
      {/* una compañera a lo lejos (silueta) */}
      <group position={[1.6, 0, -3.4]}>
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.18, 0.9, 4, estilo.flat ? 8 : 16]} />
          <Mat color="#3d5a80" />
        </mesh>
        <mesh position={[0, 1.52, 0]}>
          <sphereGeometry args={[0.12, estilo.flat ? 8 : 16, estilo.flat ? 6 : 12]} />
          <Mat color="#8d5b3f" />
        </mesh>
      </group>
    </group>
  );
}

export function Cubiculo() {
  return (
    <group>
      <Oficina />
      <Mamparas />
      <Escritorio />
      <Monitor />
      <Telefono />
      <Libreta />
      <Pizarron />
      <Calendario />
      <ObjetosEscritorio />
    </group>
  );
}
