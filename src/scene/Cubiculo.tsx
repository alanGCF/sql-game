import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { DoubleSide, type Group, type MeshStandardMaterial } from "three";
import { enmascararCodigo } from "../../shared/codigo";
import { inicioTurno } from "../engine/calendario";
import { useAjustes } from "../game/ajustes";
import { contenidoComun } from "../game/contenido";
import { iluminacion } from "../game/hora";
import { usePartida } from "../game/partidaStore";
import { favoresPizarron, renglonesPizarron } from "../game/pizarron";
import { useEscena } from "../game/store";
import { directorio } from "../game/telefono";
import { isTestMode } from "../test-hooks";
import { Mat, useTexturaCanvas } from "./contexto";
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
const DIBUJO_DIRECTORIO = dibujarDirectorio(
  directorio(contenidoComun().personajes.personajes).map((c) => [c.corto, c.extension] as const),
);

export const ESCRITORIO_Y = 0.74;
export const MONITOR = { centro: [0, 1.06, -0.415] as const, ancho: 0.52, alto: 0.31 };
/** Ventana del fondo, sobre las mamparas y a la izquierda del reloj de pared. */
export const VENTANA = { centro: [-2.5, 2.05, -5.97] as const, ancho: 4, alto: 1.1 };

/** Paleta del estilo C: gris claro de mampara, madera clara, blanco cálido, acentos naranja. */
const C = {
  mampara: "#a7adb3",
  marcoMampara: "#5d6168",
  escritorio: "#d9ccb6",
  plasticoOscuro: "#2b2d31",
  teclado: "#d9d6cf",
  piso: "#6c7077",
  techo: "#b9b8b2",
  pared: "#e4e2dc",
  libreta: "#3d5a80",
  taza: "#e9e4da",
  lonchera: "#3d6e8f",
  planta: "#4a7c59",
  maceta: "#a0522d",
  papel: "#f1eee6",
};

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
  return (
    <mesh position={pos} rotation={rot ?? [0, 0, 0]} castShadow={sombra} receiveShadow>
      <boxGeometry args={tam} />
      <Mat color={color} />
    </mesh>
  );
}

/** Caja con bordes redondeados para objetos pequeños (estilo C); mismo costo en draw calls. */
function CajaRedonda({
  pos,
  tam,
  color,
  rot,
  radio,
}: {
  pos: [number, number, number];
  tam: [number, number, number];
  color: string;
  rot?: [number, number, number];
  radio?: number;
}) {
  const r = radio ?? Math.min(...tam) * 0.3;
  return (
    <RoundedBox
      args={tam}
      radius={r}
      smoothness={3}
      position={pos}
      rotation={rot ?? [0, 0, 0]}
      castShadow
      receiveShadow
    >
      <Mat color={color} />
    </RoundedBox>
  );
}

function Mamparas() {
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
  const pantalla = useTexturaCanvas(1024, 600, dibujarPantalla);
  const vista = useEscena((s) => s.vista);
  const postIt = useTexturaCanvas(160, 160, dibujarPostIt(["pass:", "duna47"]));
  const postIt2 = useTexturaCanvas(160, 160, dibujarPostIt(["Eduardo", "ext. 214"]));
  const codigo = usePartida((s) => s.codigo);
  const [cx, cy, cz] = MONITOR.centro;
  return (
    <Interactivo nombre="Computadora" vista="monitor">
      <Caja pos={[0, ESCRITORIO_Y + 0.01, -0.45]} tam={[0.24, 0.02, 0.18]} color={C.plasticoOscuro} />
      <Caja pos={[0, ESCRITORIO_Y + 0.12, -0.47]} tam={[0.05, 0.22, 0.04]} color={C.plasticoOscuro} />
      <CajaRedonda
        pos={[cx, cy, cz - 0.025]}
        tam={[MONITOR.ancho + 0.05, MONITOR.alto + 0.05, 0.04]}
        color={C.plasticoOscuro}
        radio={0.012}
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
      {codigo && <PostItNumero codigo={codigo} pos={[cx - 0.3, cy - 0.06, cz]} />}
      {/* teclado y mouse */}
      <CajaRedonda pos={[0, ESCRITORIO_Y + 0.012, -0.2]} tam={[0.44, 0.022, 0.14]} color={C.teclado} />
      <CajaRedonda
        pos={[0.32, ESCRITORIO_Y + 0.012, -0.19]}
        tam={[0.06, 0.024, 0.1]}
        color={C.teclado}
        radio={0.011}
      />
    </Interactivo>
  );
}

/**
 * Teléfono de escritorio. Cuando suena una llamada entrante vibra y parpadea (F4-04; quieto con "reducir
 * movimiento"): pide cuadros solo mientras suena (ADR-018). La luz roja queda prendida si hay buzón.
 */
function Telefono() {
  const sonando = usePartida((s) => s.dialogos[0]?.timbre === true);
  const contestar = usePartida((s) => s.contestar);
  const conBuzon = usePartida((s) => s.buzon.length > 0);
  const quieto = useAjustes((s) => s.reducirMovimiento) || isTestMode;
  const invalidate = useThree((s) => s.invalidate);
  const cuerpo = useRef<Group>(null);
  const luz = useRef<MeshStandardMaterial>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: un cuadro nuevo cuando cambia el estado del teléfono.
  useEffect(() => {
    invalidate();
  }, [sonando, conBuzon, quieto, invalidate]);

  useFrame(({ clock }) => {
    const g = cuerpo.current;
    const m = luz.current;
    if (!g || !m) return;
    const t = clock.elapsedTime;
    if (sonando && !quieto) {
      // Ráfagas de timbre: vibra medio segundo, descansa medio segundo.
      g.rotation.z = Math.sin(t * 2 * Math.PI) > 0 ? Math.sin(t * 70) * 0.025 : 0;
      m.emissiveIntensity = Math.sin(t * 12) > 0 ? 2.2 : 0.15;
      invalidate();
      return;
    }
    g.rotation.z = 0;
    m.emissiveIntensity = sonando || conBuzon ? 1.6 : 0;
  });

  return (
    // Levantar el auricular: el clic acerca la vista y, si suena, contesta.
    <Interactivo nombre={sonando ? "Teléfono (suena)" : "Teléfono"} vista="telefono" alClic={contestar}>
      <group position={[-0.5, ESCRITORIO_Y, -0.45]} rotation={[0, 0.45, 0]}>
        <group ref={cuerpo}>
          <CajaRedonda pos={[0, 0.025, 0]} tam={[0.19, 0.05, 0.17]} color={C.plasticoOscuro} />
          <CajaRedonda pos={[0, 0.062, -0.045]} tam={[0.2, 0.03, 0.05]} color="#1f2124" />
          <Caja pos={[0.02, 0.052, 0.035]} tam={[0.09, 0.004, 0.07]} color="#c9ccc6" />
          <Caja pos={[-0.055, 0.052, 0.04]} tam={[0.04, 0.004, 0.025]} color="#7fa392" />
          <mesh position={[-0.08, 0.065, 0.06]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial ref={luz} color="#7a1f17" emissive="#ff3b30" emissiveIntensity={0} />
          </mesh>
        </group>
      </group>
    </Interactivo>
  );
}

function Libreta() {
  return (
    <Interactivo nombre="Libreta de apuntes" vista="libreta">
      <group position={[0.3, ESCRITORIO_Y + 0.008, -0.12]} rotation={[0, -0.25, 0]}>
        <CajaRedonda pos={[0, 0, 0]} tam={[0.16, 0.016, 0.22]} color={C.libreta} radio={0.005} />
        <Caja pos={[-0.075, 0.009, 0]} tam={[0.012, 0.012, 0.21]} color="#9aa0a6" />
        <Caja pos={[0.02, 0.005, -0.1]} tam={[0.03, 0.01, 0.03]} color="#e0702b" />
      </group>
    </Interactivo>
  );
}

/** Post-it de Recursos Humanos con el número de empleado (F4-13, D-27 opción C). */
function PostItNumero({ codigo, pos }: { codigo: string; pos: [number, number, number] }) {
  const tex = useTexturaCanvas(
    200,
    200,
    dibujarPostIt(["No. empleado", codigo.slice(0, 4), codigo.slice(4, 8), codigo.slice(8), "¡Anótalo!"]),
    codigo,
  );
  return (
    <mesh position={pos} rotation={[0, 0, -0.05]}>
      <planeGeometry args={[0.085, 0.085]} />
      <Mat color="#ffffff" mapa={tex} />
    </mesh>
  );
}

/** Post-it de un favor activo: el título partido en renglones cortos. */
function PostItFavor({ titulo, pos }: { titulo: string; pos: [number, number, number] }) {
  const palabras = titulo.split(" ");
  const renglones = ["Favor:"];
  for (const p of palabras) {
    const ultimo = renglones[renglones.length - 1] ?? "";
    if (renglones.length > 1 && `${ultimo} ${p}`.length <= 11)
      renglones[renglones.length - 1] = `${ultimo} ${p}`;
    else renglones.push(p);
  }
  const tex = useTexturaCanvas(160, 160, dibujarPostIt(renglones.slice(0, 5)));
  return (
    <mesh position={pos} rotation={[0, 0, 0.1]}>
      <planeGeometry args={[0.09, 0.09]} />
      <Mat color="#ffffff" mapa={tex} />
    </mesh>
  );
}

function Pizarron() {
  const pendientes = usePartida((s) => s.pendientes);
  const renglones = renglonesPizarron(pendientes);
  const favores = favoresPizarron(pendientes).slice(0, 3);
  const tex = useTexturaCanvas(640, 480, dibujarPizarron(renglones), JSON.stringify(renglones));
  return (
    <Interactivo nombre="Pizarrón de pendientes" vista="pizarron">
      <group position={[0.87, 1.05, -0.3]} rotation={[0, -Math.PI / 2, 0]}>
        <Caja pos={[0, 0, -0.012]} tam={[0.64, 0.48, 0.02]} color="#9aa0a6" sombra={false} />
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.6, 0.45]} />
          <Mat color="#ffffff" mapa={tex} rugosidad={0.85} emisivo="#ffffff" intensidadEmisiva={0.3} />
        </mesh>
        {favores.map((t, i) => (
          <PostItFavor key={t} titulo={t} pos={[0.24 - i * 0.1, 0.17, 0.004]} />
        ))}
      </group>
    </Interactivo>
  );
}

function Calendario() {
  const turno = usePartida((s) => s.jornada.turno.turno);
  const hoy = inicioTurno(turno).slice(0, 10);
  const tex = useTexturaCanvas(512, 520, dibujarCalendario(hoy), hoy);
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
  const nombre = usePartida((s) => s.nombre);
  const codigo = usePartida((s) => s.codigo);
  const numero = codigo ? enmascararCodigo(codigo) : "••••-••••-••••";
  const gafete = useTexturaCanvas(
    320,
    160,
    dibujarGafete(nombre || "Becario", numero),
    `${nombre}|${numero}`,
  );
  const foto = useTexturaCanvas(200, 160, dibujarFoto);
  const hojaDirectorio = useTexturaCanvas(320, 260, DIBUJO_DIRECTORIO);
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
        <mesh position={[0.62, ESCRITORIO_Y + 0.05, -0.28]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.1, 24]} />
          <Mat color={C.taza} />
        </mesh>
      </Interactivo>
      {/* Lonchera */}
      <Interactivo nombre="Lonchera">
        <group position={[-0.7, ESCRITORIO_Y + 0.07, -0.66]} rotation={[0, 0.2, 0]}>
          <CajaRedonda pos={[0, 0, 0]} tam={[0.22, 0.14, 0.15]} color={C.lonchera} radio={0.025} />
          <CajaRedonda pos={[0, 0.08, 0]} tam={[0.12, 0.02, 0.02]} color="#222" />
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
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.035, 0.09, 20]} />
            <Mat color={C.maceta} />
          </mesh>
          <mesh position={[0, 0.13, 0]} castShadow>
            <icosahedronGeometry args={[0.07, 2]} />
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
        <Mat color="#ffffff" mapa={hojaDirectorio} />
      </mesh>
      {/* Lámpara de escritorio */}
      <group position={[-0.42, ESCRITORIO_Y, -0.7]}>
        <Caja pos={[0, 0.01, 0]} tam={[0.12, 0.02, 0.12]} color="#2f3238" />
        <Caja pos={[0, 0.2, -0.04]} tam={[0.015, 0.38, 0.015]} color="#2f3238" rot={[0.2, 0, 0]} />
        <mesh position={[0.03, 0.39, -0.08]} rotation={[0.9, 0, -0.3]}>
          <coneGeometry args={[0.045, 0.07, 20, 1, true]} />
          <meshStandardMaterial color="#e0702b" roughness={0.45} side={DoubleSide} />
        </mesh>
        {/* foco encendido dentro de la pantalla de la lámpara */}
        <mesh position={[0.03, 0.375, -0.065]}>
          <sphereGeometry args={[0.018, 12, 8]} />
          <meshBasicMaterial color="#fff2cf" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Ventana del fondo: se redibuja cada 5 minutos de juego (de la tarde a la noche). */
function Ventana() {
  const minuto = usePartida((s) => s.minuto);
  const cada5 = Math.floor(minuto / 5) * 5;
  const tex = useTexturaCanvas(1024, 282, dibujarVentana(iluminacion(cada5)), String(cada5));
  const [x, y, z] = VENTANA.centro;
  return (
    <mesh position={[x, y, z]}>
      <planeGeometry args={[VENTANA.ancho, VENTANA.alto]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function RelojPared() {
  const minuto = usePartida((s) => s.minuto);
  const reloj = useTexturaCanvas(256, 256, dibujarReloj(minuto), String(minuto));
  return (
    <mesh position={[0.6, 2.25, -5.98]}>
      <circleGeometry args={[0.28, 40]} />
      <Mat color="#ffffff" mapa={reloj} />
    </mesh>
  );
}

function Oficina() {
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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
      <Ventana />
      {/* lámparas del techo */}
      {[-2, 0.5, 3].map((z) =>
        [-1.6, 1.6].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 2.79, z - 2]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.3]} />
            <meshBasicMaterial color="#fff6e5" toneMapped={false} />
          </mesh>
        )),
      )}
      <RelojPared />
      {/* otros cubículos */}
      {mamparasLejanas.map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, 0, z]}>
          <Caja pos={[0, 0.73, -0.8]} tam={[1.8, 1.46, 0.05]} color={C.mampara} />
          <Caja pos={[-0.9, 0.73, 0]} tam={[0.05, 1.46, 1.6]} color={C.mampara} />
          <Caja pos={[0, ESCRITORIO_Y, -0.4]} tam={[1.7, 0.03, 0.7]} color={C.escritorio} />
        </group>
      ))}
      {/* alguien a lo lejos (silueta) */}
      <group position={[1.6, 0, -3.4]}>
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.18, 0.9, 4, 16]} />
          <Mat color="#3d5a80" />
        </mesh>
        <mesh position={[0, 1.52, 0]}>
          <sphereGeometry args={[0.12, 16, 12]} />
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
