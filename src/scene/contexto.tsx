import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ESTILO } from "./estilos";

const HoverCtx = createContext(false);

export function ProveedorHover({ activo, children }: { activo: boolean; children: ReactNode }) {
  return <HoverCtx.Provider value={activo}>{children}</HoverCtx.Provider>;
}

interface MatProps {
  color: string;
  emisivo?: string;
  intensidadEmisiva?: number;
  mapa?: THREE.Texture | null;
  rugosidad?: number;
  metalico?: number;
}

/** Material común del estilo C; resalta el objeto cuando está bajo el cursor. */
export function Mat({
  color,
  emisivo,
  intensidadEmisiva = 1,
  mapa = null,
  rugosidad,
  metalico = 0,
}: MatProps) {
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
      roughness={rugosidad ?? ESTILO.rugosidad}
      metalness={metalico}
    />
  );
}

/**
 * Textura dibujada con canvas 2D (sin descargas: compatible con la CSP). Se crea una sola vez y se
 * vuelve a dibujar cuando cambia `clave` (p. ej. los pendientes del pizarrón).
 */
export function useTexturaCanvas(
  ancho: number,
  alto: number,
  dibujar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  clave?: string,
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
  const primera = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo se redibuja cuando cambia la clave.
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const canvas = textura.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ancho, alto);
    dibujar(ctx, ancho, alto);
    textura.needsUpdate = true;
  }, [clave]);
  return textura;
}
