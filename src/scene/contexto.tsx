import { createContext, type ReactNode, useContext, useState } from "react";
import * as THREE from "three";
import type { Estilo } from "./estilos";

const EstiloCtx = createContext<Estilo | null>(null);
const HoverCtx = createContext(false);

export function ProveedorEstilo({ estilo, children }: { estilo: Estilo; children: ReactNode }) {
  return <EstiloCtx.Provider value={estilo}>{children}</EstiloCtx.Provider>;
}

export function ProveedorHover({ activo, children }: { activo: boolean; children: ReactNode }) {
  return <HoverCtx.Provider value={activo}>{children}</HoverCtx.Provider>;
}

export function useEstilo(): Estilo {
  const e = useContext(EstiloCtx);
  if (!e) throw new Error("useEstilo fuera de ProveedorEstilo");
  return e;
}

interface MatProps {
  color: string;
  emisivo?: string;
  intensidadEmisiva?: number;
  mapa?: THREE.Texture | null;
  rugosidad?: number;
  metalico?: number;
}

/** Material común: respeta el estilo (plano/suave) y resalta el objeto cuando está bajo el cursor. */
export function Mat({
  color,
  emisivo,
  intensidadEmisiva = 1,
  mapa = null,
  rugosidad,
  metalico = 0,
}: MatProps) {
  const estilo = useEstilo();
  const hover = useContext(HoverCtx);
  const colorEmisivo = hover ? "#ff9a3d" : (emisivo ?? "#000000");
  const intensidad = hover ? 0.35 : emisivo ? intensidadEmisiva : 0;
  return (
    <meshStandardMaterial
      color={color}
      map={mapa}
      emissive={colorEmisivo}
      emissiveMap={emisivo && !hover ? mapa : null}
      emissiveIntensity={intensidad}
      flatShading={estilo.flat}
      roughness={rugosidad ?? estilo.rugosidad}
      metalness={metalico}
    />
  );
}

/** Textura dibujada con canvas 2D (sin descargas: compatible con la CSP). Se crea una sola vez. */
export function useTexturaCanvas(
  ancho: number,
  alto: number,
  dibujar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const [textura] = useState(() => {
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (ctx) dibujar(ctx, ancho, alto);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  });
  return textura;
}
