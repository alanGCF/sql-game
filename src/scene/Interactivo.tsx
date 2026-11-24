import type { ThreeEvent } from "@react-three/fiber";
import { type ReactNode, useState } from "react";
import { useEscena, type Vista } from "../game/store";
import { ProveedorHover } from "./contexto";

interface Props {
  nombre: string;
  /** Vista acercada que abre; si falta, el clic solo hace `alClic`. */
  vista?: Vista;
  alClic?: () => void;
  children: ReactNode;
}

/** Objeto del escritorio con el que se puede interactuar: se resalta y muestra su nombre bajo el cursor. */
export function Interactivo({ nombre, vista, alClic, children }: Props) {
  const [hover, setHover] = useState(false);
  const vistaActual = useEscena((s) => s.vista);
  const transicionando = useEscena((s) => s.transicionando);
  const setHoverNombre = useEscena((s) => s.setHover);
  const setVista = useEscena((s) => s.setVista);
  const activo = vistaActual === "general" && !transicionando;

  const entrar = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!activo) return;
    setHover(true);
    setHoverNombre(nombre);
    document.body.style.cursor = "pointer";
  };
  const salir = () => {
    setHover(false);
    setHoverNombre(null);
    document.body.style.cursor = "";
  };
  const clic = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!activo) return;
    salir();
    if (vista) setVista(vista);
    alClic?.();
  };

  return (
    <ProveedorHover activo={hover && activo}>
      <group onPointerOver={entrar} onPointerOut={salir} onClick={clic}>
        {children}
      </group>
    </ProveedorHover>
  );
}
